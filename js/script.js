"use strict";

document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    loadAndDisplayExperience();
    loadAndDisplayPublications();
    initSectionNav();
});

/**
 * Theme Management
 */
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const html = document.documentElement;
    const icon = themeToggle.querySelector('i');
    const systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');

    function getSavedTheme() {
        try {
            const savedTheme = localStorage.getItem('theme');
            return savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : null;
        } catch (error) {
            return null;
        }
    }

    function saveTheme(theme) {
        try {
            localStorage.setItem('theme', theme);
        } catch (error) {
            // The selected theme still applies for this page when storage is unavailable.
        }
    }

    function setTheme(theme, persist = false) {
        html.setAttribute('data-theme', theme);
        if (persist) saveTheme(theme);

        const profileImage = document.querySelector('.profile-image');
        if (profileImage) {
            const profileSource = theme === 'dark' ? 'media/profile_dark.webp' : 'media/profile.webp';
            if (profileImage.getAttribute('src') !== profileSource) profileImage.src = profileSource;
        }

        const isDark = theme === 'dark';
        const toggleLabel = isDark ? 'Switch to light mode' : 'Switch to dark mode';
        icon.classList.toggle('fa-sun', isDark);
        icon.classList.toggle('fa-moon', !isDark);
        themeToggle.setAttribute('aria-label', toggleLabel);
        themeToggle.setAttribute('title', toggleLabel);
    }

    const savedTheme = getSavedTheme();
    const initialTheme = savedTheme || (systemThemeQuery.matches ? 'dark' : 'light');
    setTheme(initialTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme, true);
    });

    function handleSystemThemeChange(event) {
        if (!getSavedTheme()) setTheme(event.matches ? 'dark' : 'light');
    }

    if (typeof systemThemeQuery.addEventListener === 'function') {
        systemThemeQuery.addEventListener('change', handleSystemThemeChange);
    } else {
        systemThemeQuery.addListener(handleSystemThemeChange);
    }

    window.addEventListener('storage', (event) => {
        if (event.key !== 'theme') return;
        const storedTheme = getSavedTheme();
        setTheme(storedTheme || (systemThemeQuery.matches ? 'dark' : 'light'));
    });
}

/**
 * Publications Logic
 */
let publications = [];
let debounceTimer;

function loadAndDisplayPublications() {
    fetch("content/papers.json?" + new Date().getTime())
        .then((response) => response.json())
        .then((data) => {
            publications = data.papers;
            displayPublications(publications);
        })
        .catch((error) => console.error("Error loading publications:", error));
}

function toggleAbstract(index) {
    const card = document.getElementById(`publication-${index}`);
    const abstractContent = document.getElementById(`abstract-${index}`);
    
    if (!card || !abstractContent) return;

    const isExpanded = card.classList.contains("expanded");
    card.classList.toggle("expanded");
    
    // Animate height
    abstractContent.style.maxHeight = isExpanded ? "0" : `${abstractContent.scrollHeight}px`;
    
    const chevronIcon = card.querySelector(".fa-chevron-down");
    if (chevronIcon) chevronIcon.classList.toggle("rotate-180");
}

function getVideoPoster(source) {
    const match = source.match(/^media\/paper_videos\/web_optimized\/(.+)\.mp4$/i);
    return match ? `media/paper_posters/${match[1]}.webp` : "";
}

function createMediaTag(source, paperTitle) {
    if (source && source.trim() !== "") {
        const isVideo = source.match(/\.(mp4|webm|mov|avi|mkv)$/);

        if (isVideo) {
            const posterSource = getVideoPoster(source);
            const posterAttr = posterSource ? `data-poster="${posterSource}"` : '';
            return `<video class="video-media lazy-video" data-src="${source}" ${posterAttr} muted playsinline loop preload="none" aria-label="${paperTitle} preview" onerror="this.style.display='none'"></video>`;
        }

        return `<img class="image-media lazy-image" data-src="${source}" alt="${paperTitle} Preview" loading="lazy" decoding="async" fetchpriority="low" onerror="this.style.display='none'">`;
    }

    return "";
}

function createMediaElement(paper) {
    if (typeof paper.media === "string" && paper.media.trim() !== "") {
        const mediaTag = createMediaTag(paper.media, paper.title);

        if (Array.isArray(paper.media_labels) && paper.media_labels.length === 4) {
            const labels = paper.media_labels.map((label) => `
                <div class="media-composite-label-cell">
                    <span>${label}</span>
                </div>
            `).join("");

            return `
                <div class="media-composite">
                    ${mediaTag}
                    <div class="media-composite-label-grid" aria-hidden="true">${labels}</div>
                </div>
            `;
        }

        return mediaTag;
    }

    return `
        <div class="media-placeholder">
            <div class="media-placeholder-icon-container">
                <i class="fas fa-image media-icon" aria-hidden="true"></i>
            </div>
        </div>
    `;
}

function isPaperUrl(url) {
    return /^https?:\/\/(www\.)?arxiv\.org\//i.test(url) || /\.pdf(?:[?#].*)?$/i.test(url);
}

function createPublicationLinks(publication) {
    const links = [];
    const paperUrl = publication.paper;

    if (publication.url) {
        const isPaper = isPaperUrl(publication.url);
        links.push({
            href: publication.url,
            icon: isPaper ? "fas fa-file-alt" : "fas fa-external-link-alt",
            label: isPaper ? "Paper" : "Project Page"
        });
    }

    if (paperUrl && paperUrl !== publication.url) {
        links.push({
            href: paperUrl,
            icon: "fas fa-file-alt",
            label: "Paper"
        });
    }

    if (links.length === 0) return "";

    const linksHtml = links.map((link) => `
        <a href="${link.href}" target="_blank" rel="noopener noreferrer" class="project-link" aria-label="${link.label} (opens in a new tab)" onclick="event.stopPropagation()">
            <i class="${link.icon}" aria-hidden="true"></i>${link.label}
        </a>
    `).join("");

    return `<div class="mt-2 publication-links">${linksHtml}</div>`;
}

function displayPublications(papers) {
    const container = document.getElementById("publications-container");
    container.innerHTML = "";
    const fragment = document.createDocumentFragment();
    
    papers.forEach((paper, index) => {
        const mediaContent = createMediaElement(paper);
        const authorsHtml = paper.authors.replace("Ashkan Mirzaei", "<strong>Ashkan Mirzaei</strong>");
        
        const colDiv = document.createElement('div');
        colDiv.className = 'w-full';
        
        // Use separate logic for onclick to avoid inline event handler string mess
        // But for simplicity with existing pattern, we'll keep the structure but clean it up.
        // Better yet, we attach the event listener after creation if possible, 
        // but here we are building string HTML.
        
        const cardClass = `publication-card publication-card-custom ${paper.abstract ? "pointer" : ""}`;
        const onClickAttr = paper.abstract ? `onclick="toggleAbstract(${index})"` : "";
        const publicationLinks = createPublicationLinks(paper);
            
        const abstractSection = paper.abstract
            ? `<div class="abstract-content" id="abstract-${index}">
                 <p class="mt-2 text-sm">${paper.abstract}</p>
               </div>
               <div class="text-center mt-2 abstract-toggle">
                 <i class="fas fa-chevron-down text-gray-400 transition-transform duration-300"></i>
               </div>`
            : "";

        colDiv.innerHTML = `
        <div class="${cardClass}" id="publication-${index}" ${onClickAttr}>
            <div class="publication-layout">
                <div class="publication-media-column">
                    <div class="media-container-custom">
                        ${mediaContent}
                    </div>
                </div>
                <div class="publication-content-column">
                    <div class="publication-body-custom">
                        <span class="venue-badge">${paper.venue}</span>
                        <h5 class="mb-1">${paper.title}</h5>
                        <p class="mb-0 text-sm">${authorsHtml}</p>
                        ${publicationLinks}
                        ${abstractSection}
                    </div>
                </div>
            </div>
        </div>`;
        
        fragment.appendChild(colDiv);
    });
    
    container.appendChild(fragment);
    initLazyLoading();
}

function filterPublications() {
    const searchInput = document.getElementById("publicationSearch");
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const filteredPapers = publications.filter((paper) =>
        paper.title.toLowerCase().includes(searchTerm) ||
        paper.authors.toLowerCase().includes(searchTerm) ||
        paper.venue.toLowerCase().includes(searchTerm) ||
        (paper.paper && paper.paper.toLowerCase().includes(searchTerm)) ||
        (paper.abstract && paper.abstract.toLowerCase().includes(searchTerm))
    );
    displayPublications(filteredPapers);
}

// Make accessible globally for the input oninput
window.debouncedFilterPublications = function() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(filterPublications, 300);
};

// Make accessible globally for onclick
window.toggleAbstract = toggleAbstract;

/**
 * Lazy Loading
 */
function initLazyLoading() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const playbackObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            const video = entry.target;

            if (entry.intersectionRatio >= 0.15 && !prefersReducedMotion) {
                video.play().catch(() => {});
            } else {
                video.pause();
            }
        });
    }, {
        threshold: 0.15
    });

    const posterObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const video = entry.target;
                video.poster = video.dataset.poster;
                observer.unobserve(video);
            }
        });
    }, {
        rootMargin: '500px 0px',
        threshold: 0.01
    });

    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                if (element.tagName === 'IMG') {
                    element.src = element.dataset.src;
                    element.classList.remove('lazy-image');
                } else if (element.tagName === 'VIDEO') {
                    element.src = element.dataset.src;
                    element.controls = prefersReducedMotion;
                    element.load();
                    playbackObserver.observe(element);
                    element.classList.remove('lazy-video');
                }
                observer.unobserve(element);
            }
        });
    }, {
        rootMargin: '50px 0px',
        threshold: 0.01
    });

    document.querySelectorAll('.lazy-image, .lazy-video').forEach(element => {
        imageObserver.observe(element);
    });

    document.querySelectorAll('.lazy-video[data-poster]').forEach(video => {
        posterObserver.observe(video);
    });
}

/**
 * Experience Section Logic
 */
function loadAndDisplayExperience() {
    fetch("content/experience.json?" + new Date().getTime())
        .then((response) => response.json())
        .then((data) => displayExperience(data.experience))
        .catch((error) => console.error("Error loading experience data:", error));
}

function displayExperience(experience) {
    const timeline = document.getElementById("timeline");
    timeline.innerHTML = "";
    const fragment = document.createDocumentFragment();
    
    for (let i = experience.length - 1; i >= 0; i--) {
        const item = experience[i];
        const div = document.createElement('div');
        div.className = 'timeline-item';

        const isMonochromeLogo = item.logo_theme === 'monochrome';
        const logoThemeClass = isMonochromeLogo ? ' experience-logo-container--monochrome' : '';
        const bgStyle = item.logo_bg ? `style="background-color: ${item.logo_bg}"` : '';
        const onloadAttr = item.logo_bg || isMonochromeLogo ? '' : 'onload="adjustLogoBackground(this)"';

        div.innerHTML = `
            <div class="experience-item-layout">
                <div class="experience-logo-container${logoThemeClass}" ${bgStyle}>
                    <img src="${item.logo}" alt="${item.company}" class="experience-logo" width="90" height="90" loading="lazy" decoding="async" fetchpriority="low" crossorigin="anonymous" ${onloadAttr}>
                </div>
                <div>
                    <h4 class="mb-1">${item.company}</h4>
                    <p class="mb-1">${item.title}</p>
                    <p class="time-range mb-0">${item.time}</p>
                </div>
            </div>
        `;
        fragment.insertBefore(div, fragment.firstChild);
    }
    timeline.appendChild(fragment);

    initTimelineNavigation();
}

function initTimelineNavigation() {
    const shell = document.getElementById('timeline-shell');
    const container = shell?.querySelector('.timeline-container');
    const timeline = document.getElementById('timeline');

    if (!shell || !container || !timeline) return;

    const edgeThreshold = 2;

    function updateTimelineNavigation() {
        const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth);
        const canScrollLeft = container.scrollLeft > edgeThreshold;
        const canScrollRight = container.scrollLeft < maxScrollLeft - edgeThreshold;

        shell.classList.toggle('can-scroll-left', canScrollLeft);
        shell.classList.toggle('can-scroll-right', canScrollRight);
    }

    function alignToNewestRole() {
        const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth);
        container.scrollLeft = maxScrollLeft;
        updateTimelineNavigation();
    }

    container.addEventListener('scroll', updateTimelineNavigation, { passive: true });

    if ('ResizeObserver' in window) {
        const resizeObserver = new ResizeObserver(updateTimelineNavigation);
        resizeObserver.observe(container);
        resizeObserver.observe(timeline);
    } else {
        window.addEventListener('resize', updateTimelineNavigation);
    }

    shell.classList.add('is-positioning');
    alignToNewestRole();

    const pageReady = document.readyState === 'complete'
        ? Promise.resolve()
        : new Promise((resolve) => window.addEventListener('load', resolve, { once: true }));
    const fontsReady = document.fonts?.ready || Promise.resolve();

    Promise.all([pageReady, fontsReady]).then(() => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                alignToNewestRole();
                shell.classList.remove('is-positioning');
                shell.classList.remove('is-loading');
                container.setAttribute('aria-busy', 'false');
            });
        });
    });
}

// Global exposure for onload attribute
window.adjustLogoBackground = function(img) {
    if (!img.complete || img.naturalWidth === 0) return;

    try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        let totalLuminance = 0;
        let pixelCount = 0;

        // Sample every 40th pixel to save performance
        for (let i = 0; i < data.length; i += 40) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            // Consider only pixels that are opaque enough
            if (a > 20) {
                // Perceived luminance: 0.299R + 0.587G + 0.114B
                const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
                totalLuminance += luminance;
                pixelCount++;
            }
        }

        if (pixelCount > 0) {
            const avgLuminance = totalLuminance / pixelCount;
            // Threshold: if average luminance > 200 (mostly white/light), switch to dark bg
            if (avgLuminance > 200) {
                img.parentElement.style.backgroundColor = '#1d1d1f';
            }
        }
    } catch (e) {
        console.warn('Could not analyze image for background adjustment:', e);
    }
};

/**
 * Section Navigation Logic
 */
function initSectionNav() {
    const navCurrent = document.getElementById('nav-current');
    const navList = document.getElementById('nav-list');
    const currentSectionName = document.getElementById('current-section-name');
    const sections = document.querySelectorAll('section');
    
    if (!navCurrent || !navList || !currentSectionName || sections.length === 0) return;

    // Populate list
    sections.forEach(section => {
        const id = section.id;
        // Use h1 for Home section if no h2, or default to ID
        let name = '';
        const h2 = section.querySelector('h2');
        if (h2) {
            name = h2.innerText;
        } else if (id === 'home') {
            name = 'Home';
        } else {
            name = id.charAt(0).toUpperCase() + id.slice(1);
        }
        
        const li = document.createElement('li');
        li.className = 'nav-item';
        li.innerText = name;
        li.dataset.target = id;
        
        li.addEventListener('click', () => {
            const target = document.getElementById(id);
            if (target) {
                // Offset for fixed header if any (minimal here)
                const offset = 20; 
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - offset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
            navList.classList.remove('show');
            navCurrent.classList.remove('active');
        });
        
        navList.appendChild(li);
    });
    
    // Toggle menu
    navCurrent.addEventListener('click', (e) => {
        e.stopPropagation();
        navList.classList.toggle('show');
        navCurrent.classList.toggle('active');
    });
    
    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!navCurrent.contains(e.target) && !navList.contains(e.target)) {
            navList.classList.remove('show');
            navCurrent.classList.remove('active');
        }
    });
    
    // Scroll spy
    const observerOptions = {
        root: null,
        // Trigger when section touches the top part of the screen (15% from top)
        rootMargin: '-15% 0px -85% 0px',
        threshold: 0
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                // Update text
                let name = '';
                const h2 = entry.target.querySelector('h2');
                if (h2) {
                    name = h2.innerText;
                } else if (id === 'home') {
                    name = 'Home';
                } else {
                    name = id.charAt(0).toUpperCase() + id.slice(1);
                }
                
                currentSectionName.innerText = name;
                
                // Update list active state
                document.querySelectorAll('.nav-item').forEach(item => {
                    if (item.dataset.target === id) {
                        item.classList.add('active');
                    } else {
                        item.classList.remove('active');
                    }
                });
            }
        });
    }, observerOptions);
    
    sections.forEach(section => observer.observe(section));
}
