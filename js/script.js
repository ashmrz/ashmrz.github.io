/*
 * Browser behavior for the site. The page content is rendered into index.html at build time
 * (see vite.config.js and scripts/render-content.mjs); this module only adds interactivity.
 */
const SEARCH_DEBOUNCE_MS = 300;

initSectionNav();
initTimeline();
initPublications();
initFooterYear();

/**
 * Section navigation: a disclosure menu generated from each <section>'s id and heading,
 * with a scroll spy that keeps the current section name up to date.
 */
function initSectionNav() {
    const toggle = document.getElementById("nav-current");
    const list = document.getElementById("nav-list");
    const currentSectionName = document.getElementById("current-section-name");
    const sections = Array.from(document.querySelectorAll("section[id]"));

    if (!toggle || !list || !currentSectionName || sections.length === 0) return;

    function getSectionName(section) {
        const heading = section.querySelector("h2");
        if (heading) return heading.textContent.trim();
        return section.id.charAt(0).toUpperCase() + section.id.slice(1);
    }

    function setMenuOpen(isOpen) {
        list.classList.toggle("show", isOpen);
        toggle.classList.toggle("active", isOpen);
        toggle.setAttribute("aria-expanded", String(isOpen));
    }

    const navButtons = new Map();

    for (const section of sections) {
        const item = document.createElement("li");
        const button = document.createElement("button");
        button.type = "button";
        button.className = "nav-item";
        button.textContent = getSectionName(section);
        button.addEventListener("click", () => {
            // The scroll offset comes from `scroll-margin-top`, the easing from `scroll-behavior`.
            section.scrollIntoView();
            setMenuOpen(false);
        });

        item.append(button);
        list.append(item);
        navButtons.set(section, button);
    }

    toggle.addEventListener("click", () => {
        setMenuOpen(!list.classList.contains("show"));
    });

    document.addEventListener("click", (event) => {
        if (!toggle.contains(event.target) && !list.contains(event.target)) setMenuOpen(false);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape" || !list.classList.contains("show")) return;
        setMenuOpen(false);
        toggle.focus();
    });

    // A section becomes current when it crosses a line 15% below the top of the viewport.
    const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (!entry.isIntersecting) continue;

            currentSectionName.textContent = getSectionName(entry.target);
            for (const [section, button] of navButtons) {
                const isCurrent = section === entry.target;
                button.classList.toggle("active", isCurrent);
                if (isCurrent) {
                    button.setAttribute("aria-current", "location");
                } else {
                    button.removeAttribute("aria-current");
                }
            }
        }
    }, {
        rootMargin: "-15% 0px -85% 0px",
        threshold: 0
    });

    sections.forEach((section) => observer.observe(section));
}

/**
 * Experience timeline: starts scrolled to the newest role and shows edge fades while it can scroll.
 */
function initTimeline() {
    const shell = document.getElementById("timeline-shell");
    const container = shell?.querySelector(".timeline-container");
    const timeline = document.getElementById("timeline");

    if (!shell || !container || !timeline) return;

    const controls = document.getElementById("timeline-controls");
    const previousButton = controls?.querySelector('[data-scroll="-1"]');
    const nextButton = controls?.querySelector('[data-scroll="1"]');
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const edgeThreshold = 2;

    // Keeps the edge fades and the previous/next buttons in step with the scroll position.
    function updateScrollState() {
        const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth);
        const canScrollLeft = container.scrollLeft > edgeThreshold;
        const canScrollRight = container.scrollLeft < maxScrollLeft - edgeThreshold;

        shell.classList.toggle("can-scroll-left", canScrollLeft);
        shell.classList.toggle("can-scroll-right", canScrollRight);

        if (!previousButton || !nextButton) return;

        // The buttons replace the scrollbar only while there is something to scroll.
        const overflows = maxScrollLeft > edgeThreshold;
        controls.hidden = !overflows;
        shell.classList.toggle("has-controls", overflows);

        // aria-disabled keeps a button focusable when it reaches the end of the timeline.
        previousButton.setAttribute("aria-disabled", String(!canScrollLeft));
        nextButton.setAttribute("aria-disabled", String(!canScrollRight));
    }

    function alignToNewestRole() {
        container.scrollLeft = Math.max(0, container.scrollWidth - container.clientWidth);
        updateScrollState();
    }

    container.addEventListener("scroll", updateScrollState, { passive: true });

    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(container);
    resizeObserver.observe(timeline);

    controls?.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-scroll]");
        if (!button || button.getAttribute("aria-disabled") === "true") return;

        // Move by most of the visible width, and never by less than one card.
        const firstItem = timeline.firstElementChild;
        const cardStep = firstItem ? firstItem.getBoundingClientRect().width + parseFloat(getComputedStyle(timeline).columnGap || "0") : 0;
        const step = Math.max(container.clientWidth * 0.8, cardStep);

        container.scrollBy({
            left: Number(button.dataset.scroll) * step,
            behavior: reducedMotionQuery.matches ? "auto" : "smooth"
        });
    });

    timeline.querySelectorAll("img[data-auto-background]").forEach((logo) => {
        if (logo.complete) {
            adjustLogoBackground(logo);
        } else {
            logo.addEventListener("load", () => adjustLogoBackground(logo), { once: true });
        }
    });

    // Scroll snapping is paused while positioning; the final alignment waits for fonts and layout.
    shell.classList.add("is-positioning");
    alignToNewestRole();

    const pageReady = document.readyState === "complete"
        ? Promise.resolve()
        : new Promise((resolve) => window.addEventListener("load", resolve, { once: true }));
    const fontsReady = document.fonts?.ready ?? Promise.resolve();

    Promise.all([pageReady, fontsReady]).then(() => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                alignToNewestRole();
                shell.classList.remove("is-positioning", "is-loading");
            });
        });
    });
}

/**
 * Gives a mostly white logo a dark backing so it stays visible on the default white tile.
 * Only used for experience entries that set neither `logo_bg` nor `logo_theme`.
 */
function adjustLogoBackground(logo) {
    if (logo.naturalWidth === 0) return;

    const sampleStride = 10;
    const minimumAlpha = 20;
    const lightLogoLuminance = 200;

    try {
        const canvas = document.createElement("canvas");
        canvas.width = logo.naturalWidth;
        canvas.height = logo.naturalHeight;

        const context = canvas.getContext("2d");
        context.drawImage(logo, 0, 0);

        const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
        let totalLuminance = 0;
        let sampleCount = 0;

        // Sample every tenth pixel (four bytes each) and skip the transparent ones.
        for (let offset = 0; offset < data.length; offset += sampleStride * 4) {
            if (data[offset + 3] <= minimumAlpha) continue;

            totalLuminance += 0.299 * data[offset] + 0.587 * data[offset + 1] + 0.114 * data[offset + 2];
            sampleCount++;
        }

        if (sampleCount > 0 && totalLuminance / sampleCount > lightLogoLuminance) {
            logo.parentElement.style.backgroundColor = "#1d1d1f";
        }
    } catch (error) {
        console.warn("Could not analyze logo for background adjustment:", error);
    }
}

/**
 * Publications: abstract toggles, lazy preview media, and search over the prerendered cards.
 */
function initPublications() {
    const container = document.getElementById("publications-container");
    if (!container) return;

    initAbstractToggles(container);
    initLazyMedia(container);
    initPublicationSearch(container);
}

function initAbstractToggles(container) {
    // The whole card toggles its abstract, except for links and native video controls.
    container.addEventListener("click", (event) => {
        if (event.target.closest("a, video[controls]")) return;

        const card = event.target.closest(".publication-card-custom.pointer");
        if (!card) return;

        const isExpanded = card.classList.toggle("expanded");
        card.querySelector(".abstract-toggle")?.setAttribute("aria-expanded", String(isExpanded));
    });
}

function initLazyMedia(container) {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const videos = container.querySelectorAll("video.lazy-video");

    // Play previews only while they are on screen; reduced-motion visitors get controls instead.
    const playbackObserver = new IntersectionObserver((entries) => {
        for (const { target: video, intersectionRatio } of entries) {
            if (intersectionRatio >= 0.15 && !prefersReducedMotion) {
                video.play().catch(() => {});
            } else {
                video.pause();
            }
        }
    }, {
        threshold: 0.15
    });

    // Posters load well ahead of the viewport so a frame is ready before the video is.
    const posterObserver = new IntersectionObserver((entries, observer) => {
        for (const { target: video, isIntersecting } of entries) {
            if (!isIntersecting) continue;

            video.poster = video.dataset.poster;
            observer.unobserve(video);
        }
    }, {
        rootMargin: "500px 0px",
        threshold: 0.01
    });

    const sourceObserver = new IntersectionObserver((entries, observer) => {
        for (const { target: video, isIntersecting } of entries) {
            if (!isIntersecting) continue;

            video.src = video.dataset.src;
            video.controls = prefersReducedMotion;
            video.load();
            video.classList.remove("lazy-video");
            playbackObserver.observe(video);
            observer.unobserve(video);
        }
    }, {
        rootMargin: "50px 0px",
        threshold: 0.01
    });

    for (const video of videos) {
        sourceObserver.observe(video);
        if (video.dataset.poster) posterObserver.observe(video);
    }

    // Media errors do not bubble, so listen during capture and hide previews that fail to load.
    container.addEventListener("error", (event) => {
        if (event.target.matches("img, video")) event.target.hidden = true;
    }, true);
}

function initPublicationSearch(container) {
    const input = document.getElementById("publicationSearch");
    const status = document.getElementById("publication-search-status");

    if (!input) return;

    // Searchable text per card: venue, title, authors, abstract, and the paper URL.
    const entries = Array.from(container.children, (item) => {
        const fields = Array.from(
            item.querySelectorAll(".venue-badge, .publication-title, .publication-authors, .abstract-content"),
            (element) => element.textContent
        );
        const paperLink = item.querySelector("a[data-paper-link]");
        if (paperLink) fields.push(paperLink.getAttribute("href"));

        return { item, text: fields.join("\n").toLowerCase() };
    });

    function filterPublications() {
        const searchTerm = input.value.toLowerCase();
        let matchCount = 0;

        for (const { item, text } of entries) {
            const isMatch = text.includes(searchTerm);
            item.hidden = !isMatch;
            if (isMatch) matchCount++;
        }

        if (status) {
            status.textContent = searchTerm ? `${matchCount} of ${entries.length} publications shown` : "";
        }
    }

    let debounceTimer;
    input.addEventListener("input", () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(filterPublications, SEARCH_DEBOUNCE_MS);
    });

    // Browsers can restore the field's text on reload or back navigation.
    if (input.value) filterPublications();
}

function initFooterYear() {
    const year = document.getElementById("current-year");
    if (year) year.textContent = String(new Date().getFullYear());
}
