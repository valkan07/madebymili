// ============================================
// Made by Mili - Website JavaScript
// ============================================

const VIDEOS_JSON = 'videos.json';
const MAX_VIDEOS = 9;

// ============================================
// Мова (UK/EN)
// ============================================

const translations = {
    uk: { flag: '\u{1F1FA}\u{1F1E6}', code: 'UK' },
    en: { flag: '\u{1F1EC}\u{1F1E7}', code: 'EN' },
};

let currentLang = localStorage.getItem('mili-lang') || 'uk';

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('mili-lang', lang);
    document.documentElement.lang = lang === 'uk' ? 'uk' : 'en';

    // Оновити перемикач - показуємо наступну мову
    const flag = document.getElementById('langFlag');
    const code = document.getElementById('langCode');
    const nextLang = lang === 'uk' ? 'en' : 'uk';
    flag.textContent = translations[nextLang].flag;
    code.textContent = translations[nextLang].code;

    // Оновити всі елементи з data-uk / data-en
    document.querySelectorAll('[data-uk][data-en]').forEach(el => {
        const icon = el.querySelector('.title-icon');
        el.textContent = el.getAttribute(`data-${lang}`);
        if (icon) {
            el.prepend(document.createTextNode(' '));
            el.prepend(icon);
        }
    });
}

// ============================================
// Завантаження відео
// ============================================

function formatDate(dateStr, lang) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (lang === 'uk') {
        if (diffDays === 0) return 'Сьогодні';
        if (diffDays === 1) return 'Вчора';
        if (diffDays < 7) return `${diffDays} дн. тому`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} тиж. тому`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} міс. тому`;
        return `${Math.floor(diffDays / 365)} р. тому`;
    } else {
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
        const weeks = Math.floor(diffDays / 7);
        if (diffDays < 30) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
        const months = Math.floor(diffDays / 30);
        if (diffDays < 365) return `${months} month${months === 1 ? '' : 's'} ago`;
        const years = Math.floor(diffDays / 365);
        return `${years} year${years === 1 ? '' : 's'} ago`;
    }
}

function createPlayIconSVG() {
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 68 48');

    const bgPath = document.createElementNS(svgNS, 'path');
    bgPath.setAttribute('d', 'M66.5 7.7c-.8-2.9-3-5.2-5.9-6C55.3.2 34 .2 34 .2S12.7.2 7.4 1.7c-2.9.8-5.2 3-5.9 6C0 13 0 24 0 24s0 11 1.5 16.3c.8 2.9 3 5.2 5.9 6C12.7 47.8 34 47.8 34 47.8s21.3 0 26.6-1.5c2.9-.8 5.2-3 5.9-6C68 35 68 24 68 24s0-11-1.5-16.3z');
    bgPath.setAttribute('fill', 'red');

    const playPath = document.createElementNS(svgNS, 'path');
    playPath.setAttribute('d', 'M27 34l18-10-18-10z');
    playPath.setAttribute('fill', '#fff');

    svg.appendChild(bgPath);
    svg.appendChild(playPath);
    return svg;
}

function createVideoCard(video) {
    const videoId = video.videoId || '';
    const isShort = video.type === 'short';
    const thumbnail = video.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    const link = isShort
        ? `https://www.youtube.com/shorts/${videoId}`
        : `https://www.youtube.com/watch?v=${videoId}`;

    const card = document.createElement('a');
    card.className = 'video-card';
    card.href = link;
    card.target = '_blank';
    card.rel = 'noopener';

    // Thumbnail
    const thumbDiv = document.createElement('div');
    thumbDiv.className = 'video-thumb';

    const img = document.createElement('img');
    img.src = thumbnail;
    img.alt = video.title;
    img.loading = 'lazy';
    thumbDiv.appendChild(img);

    const playOverlay = document.createElement('div');
    playOverlay.className = 'video-play-icon';
    playOverlay.appendChild(createPlayIconSVG());
    thumbDiv.appendChild(playOverlay);

    card.appendChild(thumbDiv);

    // Info
    const infoDiv = document.createElement('div');
    infoDiv.className = 'video-info';

    const titleDiv = document.createElement('div');
    titleDiv.className = 'video-title';
    titleDiv.textContent = video.title;
    infoDiv.appendChild(titleDiv);

    const dateDiv = document.createElement('div');
    dateDiv.className = 'video-date';
    dateDiv.setAttribute('data-date', video.pubDate);
    dateDiv.textContent = formatDate(video.pubDate, currentLang);
    infoDiv.appendChild(dateDiv);

    card.appendChild(infoDiv);

    return card;
}

function showVideoError(grid) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'video-error';

    const errorText = document.createElement('p');
    errorText.setAttribute('data-uk', 'Не вдалося завантажити відео. Дивіться на');
    errorText.setAttribute('data-en', 'Failed to load videos. Watch on');
    errorText.textContent = currentLang === 'uk'
        ? 'Не вдалося завантажити відео. Дивіться на'
        : 'Failed to load videos. Watch on';
    errorDiv.appendChild(errorText);

    const errorLink = document.createElement('a');
    errorLink.href = 'https://www.youtube.com/@MadeByMili';
    errorLink.target = '_blank';
    errorLink.rel = 'noopener';
    errorLink.textContent = 'YouTube \u2192';
    errorDiv.appendChild(errorLink);

    grid.appendChild(errorDiv);
}

async function loadVideos() {
    const grid = document.getElementById('videoGrid');
    const loading = document.getElementById('videoLoading');

    try {
        const response = await fetch(VIDEOS_JSON);
        if (!response.ok) throw new Error('Failed to load videos.json');

        const allVideos = await response.json();
        if (!Array.isArray(allVideos) || allVideos.length === 0) {
            throw new Error('No videos found');
        }

        if (loading) loading.remove();

        // Сортуємо за датою (найновіші першими)
        allVideos.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

        allVideos.slice(0, MAX_VIDEOS).forEach(video => {
            grid.appendChild(createVideoCard(video));
        });
    } catch (err) {
        console.error('Failed to load videos:', err);
        if (loading) loading.remove();
        showVideoError(grid);
    }
}

// ============================================
// Навігація
// ============================================

function initNavbar() {
    const navbar = document.querySelector('.navbar');
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.querySelector('.nav-links');

    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 20);
    });

    mobileBtn.addEventListener('click', () => {
        mobileBtn.classList.toggle('active');
        navLinks.classList.toggle('open');
    });

    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            mobileBtn.classList.remove('active');
            navLinks.classList.remove('open');
        });
    });
}

function initLangToggle() {
    const toggle = document.getElementById('langToggle');
    toggle.addEventListener('click', () => {
        const nextLang = currentLang === 'uk' ? 'en' : 'uk';
        setLanguage(nextLang);

        // Оновити дати відео
        document.querySelectorAll('.video-date[data-date]').forEach(el => {
            el.textContent = formatDate(el.getAttribute('data-date'), currentLang);
        });
    });
}

// ============================================
// Ініціалізація
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    setLanguage(currentLang);
    initNavbar();
    initLangToggle();
    loadVideos();
});
