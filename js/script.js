document.addEventListener("DOMContentLoaded", function () {
    // Initialize Bootstrap tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.forEach(function (tooltipTriggerEl) {
        new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Theme Toggle Logic
    const themeToggle = document.getElementById('theme-toggle');
    const html = document.documentElement;
    const icon = themeToggle.querySelector('i');

    function setTheme(theme) {
        html.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        if (theme === 'dark') {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    }

    // Check for saved theme or system preference
    const savedTheme = localStorage.getItem('theme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    setTheme(savedTheme || systemTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    });

    loadAndDisplayExperience();
    loadAndDisplayPublications();
});

let publications = [], debounceTimer;

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
    const isExpanded = card.classList.contains("expanded");
    card.classList.toggle("expanded");
    abstractContent.style.maxHeight = isExpanded ? "0" : `${abstractContent.scrollHeight}px`;
    const chevronIcon = card.querySelector(".fa-chevron-down");
    if (chevronIcon) chevronIcon.classList.toggle("rotate-180");
}

function displayPublications(papers) {
    const container = document.getElementById("publications-container");
    container.innerHTML = "";
    const fragment = document.createDocumentFragment();
    
    papers.forEach((paper, index) => {
        const mediaBorderRadius = `border-radius: 1.5rem 0 0 1.5rem;`;
        const mediaBorderRadiusMobile = `
            @media (max-width: 768px) {
                #publication-${index} .publication-media,
                #publication-${index} .media-container {
                    border-radius: 1.5rem 1.5rem 0 0 !important;
                }
            }
        `;
        let mediaContent = "";
        if (paper.media && paper.media.trim() !== "") {
            mediaContent = paper.media.match(/\.(mp4|webm|mov|avi|mkv)$/)
                ? `<video class="publication-media lazy-video" data-src="${paper.media}" muted playsinline loop preload="none" style="width:100%;height:100%;object-fit:cover;object-position:center center;aspect-ratio:16/9;display:block;border-radius:inherit;" onerror="this.style.display='none'"></video>`
                : `<img data-src="${paper.media}" alt="${paper.title} Preview" class="publication-media lazy-image" style="width:100%;height:100%;object-fit:cover;object-position:center center;aspect-ratio:16/9;display:block;border-radius:inherit;" onerror="this.style.display='none'">`;
        } else {
            mediaContent = `
                <div class="publication-media d-flex align-items-center justify-content-center" style="width:100%;height:100%;background:linear-gradient(135deg,var(--bg-gradient-start) 60%,var(--bg-gradient-end) 100%);display:flex;flex-direction:column;gap:0.5rem;border-radius:inherit;">
                    <div style="width:48px;height:48px;border-radius:12px;background:var(--input-bg);display:flex;align-items:center;justify-content:center;">
                        <i class="fas fa-image" style="color:var(--text-tertiary);font-size:24px;" aria-hidden="true"></i>
                    </div>
                </div>
            `;
        }

        const colDiv = document.createElement('div');
        colDiv.className = 'col-md-12';
        colDiv.innerHTML = `
        <style>${mediaBorderRadiusMobile}</style>
        <div class="card publication-card" id="publication-${index}"
            onclick="event.preventDefault(); ${paper.abstract ? `toggleAbstract(${index})` : ""}"
            style="cursor: ${paper.abstract ? "pointer" : "default"}; padding:0; border-radius:1.5rem;">
            <div class="row g-0 align-items-stretch" style="min-height:0;">
                <div class="col-md-3 d-flex align-items-stretch justify-content-center" style="padding:0;">
                    <div class="media-container" style="width:100%; aspect-ratio:16/9; display:flex; align-items:center; justify-content:center; overflow:hidden; ${mediaBorderRadius} background:var(--bg-gradient-end); min-height:100%; border-radius:1.5rem 0 0 1.5rem;">
                    ${mediaContent}
                    </div>
                </div>
                <div class="col-md-9 d-flex align-items-center" style="padding:0;">
                    <div class="publication-body p-4 w-100" style="border-radius:0 1.5rem 1.5rem 0;">
                        <span class="venue-badge">${paper.venue}</span>
                        <h5 class="mb-1">${paper.title}</h5>
                        <p class="mb-0 small">${paper.authors.replace("Ashkan Mirzaei", "<strong>Ashkan Mirzaei</strong>")}</p>
                        ${paper.url
                            ? `<div class="mt-3"><a href="${paper.url}" target="_blank" class="project-link" onclick="event.stopPropagation()"><i class="fas fa-external-link-alt"></i>Project Page</a></div>`
                            : ""
                        }
                        ${paper.abstract
                            ? `<div class="abstract-content" id="abstract-${index}"><p class="mt-2 small">${paper.abstract}</p></div>
                               <div class="text-center mt-2 abstract-toggle"><i class="fas fa-chevron-down text-gray-400 transition-transform duration-300"></i></div>`
                            : ""
                        }
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
    const searchTerm = document.getElementById("publicationSearch").value.toLowerCase();
    const filteredPapers = publications.filter((paper) =>
        paper.title.toLowerCase().includes(searchTerm) ||
        paper.authors.toLowerCase().includes(searchTerm) ||
        paper.venue.toLowerCase().includes(searchTerm) ||
        (paper.abstract && paper.abstract.toLowerCase().includes(searchTerm))
    );
    displayPublications(filteredPapers);
}

function debouncedFilterPublications() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(filterPublications, 300);
}

// Lazy loading implementation using Intersection Observer
function initLazyLoading() {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                if (element.tagName === 'IMG') {
                    element.src = element.dataset.src;
                    element.classList.remove('lazy-image');
                } else if (element.tagName === 'VIDEO') {
                    element.src = element.dataset.src;
                    element.load();
                    // Only autoplay videos that are in viewport
                    element.play().catch(() => {});
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
}

function adjustLogoBackground(img) {
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

        // Sample every 10th pixel to save performance
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
}

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
        
        const bgStyle = item.logo_bg ? `style="background-color: ${item.logo_bg}"` : '';
        const onloadAttr = item.logo_bg ? '' : 'onload="adjustLogoBackground(this)"';

        div.innerHTML = `
            <div class="d-flex align-items-center w-100">
                <div class="experience-logo-container me-3" ${bgStyle}>
                    <img src="${item.logo}" alt="${item.company}" class="experience-logo" crossorigin="anonymous" ${onloadAttr}>
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
    
    requestAnimationFrame(() => {
        const container = document.querySelector(".timeline-container");
        if (container) {
            container.scrollLeft = container.scrollWidth;
        }
    });
}
