#!/usr/bin/env python3
"""Parse yt-dlp NDJSON output and update videos.json."""

import json
import os
import sys
from datetime import datetime

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
VIDEOS_JSON = os.path.join(PROJECT_DIR, "videos.json")

VIDEOS_RAW = "/tmp/videos_raw.jsonl"
SHORTS_RAW = "/tmp/shorts_raw.jsonl"


def parse_jsonl(filepath, video_type):
    """Parse NDJSON file and return list of video dicts."""
    entries = []
    if not os.path.exists(filepath):
        print(f"Warning: {filepath} not found, skipping")
        return entries

    with open(filepath, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                data = json.loads(line)
            except json.JSONDecodeError:
                continue

            video_id = data.get("id") or data.get("url", "")
            if not video_id:
                continue

            title = data.get("title", "")
            upload_date = data.get("upload_date", "")

            pub_date = None
            if upload_date and len(upload_date) == 8:
                try:
                    dt = datetime.strptime(upload_date, "%Y%m%d")
                    pub_date = dt.strftime("%Y-%m-%dT00:00:00Z")
                except ValueError:
                    pass

            entries.append({
                "videoId": video_id,
                "title": title,
                "pubDate": pub_date,
                "type": video_type,
            })

    return entries


def load_existing():
    """Load existing videos.json as a dict keyed by videoId."""
    if not os.path.exists(VIDEOS_JSON):
        return {}
    with open(VIDEOS_JSON, "r", encoding="utf-8") as f:
        try:
            videos = json.load(f)
        except json.JSONDecodeError:
            return {}
    return {v["videoId"]: v for v in videos}


def main():
    existing = load_existing()

    new_videos = parse_jsonl(VIDEOS_RAW, "video")
    new_shorts = parse_jsonl(SHORTS_RAW, "short")
    all_new = new_videos + new_shorts

    if not all_new:
        print("No new data from yt-dlp, keeping existing videos.json")
        sys.exit(0)

    # Merge: new data wins, but preserve pubDate from existing if yt-dlp didn't return one
    merged = {}
    for video in all_new:
        vid = video["videoId"]
        if video["pubDate"] is None and vid in existing:
            video["pubDate"] = existing[vid].get("pubDate")
        merged[vid] = video

    # Sort by pubDate descending (videos without date go to the end)
    result = sorted(
        merged.values(),
        key=lambda v: v.get("pubDate") or "0000-00-00",
        reverse=True,
    )

    with open(VIDEOS_JSON, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"Updated {VIDEOS_JSON} with {len(result)} videos")


if __name__ == "__main__":
    main()
