/*
 * Build-time HTML rendering for the content-driven sections of index.html.
 * The browser script only adds behavior (search, abstract toggles, lazy media) on top of this markup.
 */
import { renderIcon } from "./icons.mjs";
import { getPosterPath, isVideo } from "./site-content.mjs";

const HIGHLIGHTED_AUTHOR = "Ashkan Mirzaei";
const PAPER_URL_PATTERNS = [/^https?:\/\/(www\.)?arxiv\.org\//i, /\.pdf(?:[?#].*)?$/i];

const HTML_ESCAPES = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
};

/** Escapes a value for use in HTML text or a double-quoted attribute. */
export function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => HTML_ESCAPES[character]);
}

function isPaperUrl(url) {
    return PAPER_URL_PATTERNS.some((pattern) => pattern.test(url));
}

function renderAuthors(authors) {
    const highlighted = escapeHtml(HIGHLIGHTED_AUTHOR);
    return escapeHtml(authors).replace(highlighted, `<strong>${highlighted}</strong>`);
}

function renderMedia(paper) {
    const hasMedia = typeof paper.media === "string" && paper.media.trim() !== "";

    if (!hasMedia) {
        return `<div class="media-placeholder"><div class="media-placeholder-icon-container">${renderIcon("image", "media-icon")}</div></div>`;
    }

    const source = escapeHtml(paper.media);
    const title = escapeHtml(paper.title);
    let media;

    if (isVideo(paper.media)) {
        // The browser script assigns the poster and source as the video approaches the viewport.
        const poster = getPosterPath(paper);
        const posterAttribute = poster ? ` data-poster="${escapeHtml(poster)}"` : "";
        media = `<video class="video-media lazy-video" data-src="${source}"${posterAttribute} muted playsinline loop preload="none" aria-label="${title} preview"></video>`;
    } else {
        media = `<img class="image-media" src="${source}" alt="${title} Preview" loading="lazy" decoding="async">`;
    }

    if (Array.isArray(paper.media_labels) && paper.media_labels.length === 4) {
        const labels = paper.media_labels
            .map((label) => `<div class="media-composite-label-cell"><span>${escapeHtml(label)}</span></div>`)
            .join("");

        return `<div class="media-composite">${media}<div class="media-composite-label-grid" aria-hidden="true">${labels}</div></div>`;
    }

    return media;
}

function renderLinks(paper) {
    const links = [];

    if (paper.url) {
        const isPaper = isPaperUrl(paper.url);
        links.push({
            href: paper.url,
            icon: isPaper ? "file-lines" : "up-right-from-square",
            label: isPaper ? "Paper" : "Project Page"
        });
    }

    if (paper.paper && paper.paper !== paper.url) {
        links.push({ href: paper.paper, icon: "file-lines", label: "Paper" });
    }

    if (links.length === 0) return "";

    const items = links.map((link) => {
        // Publication search also matches the paper URL, so mark the link that carries it.
        const paperAttribute = link.href === paper.paper ? " data-paper-link" : "";
        return `<a href="${escapeHtml(link.href)}" target="_blank" rel="noopener noreferrer" class="project-link" aria-label="${link.label} (opens in a new tab)"${paperAttribute}>${renderIcon(link.icon)}${link.label}</a>`;
    });

    return `<div class="mt-2 publication-links">${items.join("")}</div>`;
}

function renderAbstract(paper, index) {
    if (!paper.abstract) return "";

    const abstractId = `abstract-${index}`;
    return `<div class="abstract-content" id="${abstractId}"><div class="abstract-inner"><p class="mt-2 text-sm">${escapeHtml(paper.abstract)}</p></div></div>
                        <button type="button" class="abstract-toggle" aria-expanded="false" aria-controls="${abstractId}" aria-label="Abstract: ${escapeHtml(paper.title)}">${renderIcon("chevron-down", "abstract-chevron")}</button>`;
}

function renderPublication(paper, index) {
    const cardClass = ["publication-card", "publication-card-custom", paper.abstract ? "pointer" : ""].filter(Boolean).join(" ");

    return `<div class="w-full">
        <div class="${cardClass}" id="publication-${index}">
            <div class="publication-layout">
                <div class="publication-media-column">
                    <div class="media-container-custom">${renderMedia(paper)}</div>
                </div>
                <div class="publication-content-column">
                    <div class="publication-body-custom">
                        <span class="venue-badge">${escapeHtml(paper.venue)}</span>
                        <h3 class="publication-title mb-1">${escapeHtml(paper.title)}</h3>
                        <p class="publication-authors mb-0 text-sm">${renderAuthors(paper.authors)}</p>
                        ${renderLinks(paper)}
                        ${renderAbstract(paper, index)}
                    </div>
                </div>
            </div>
        </div>
    </div>`;
}

/** Renders the publication cards in file order (newest first). */
export function renderPublications(papers) {
    return papers.map(renderPublication).join("\n");
}

function renderExperienceItem(item) {
    const isMonochrome = item.logo_theme === "monochrome";
    const containerClass = `experience-logo-container${isMonochrome ? " experience-logo-container--monochrome" : ""}`;
    const backgroundStyle = item.logo_bg ? ` style="background-color: ${escapeHtml(item.logo_bg)}"` : "";
    // Logos without an explicit background get one picked in the browser from their brightness.
    const autoBackground = item.logo_bg || isMonochrome ? "" : " data-auto-background";

    return `<div class="timeline-item">
        <div class="experience-item-layout">
            <div class="${containerClass}"${backgroundStyle}>
                <img src="${escapeHtml(item.logo)}" alt="${escapeHtml(item.company)}" class="experience-logo" width="90" height="90" loading="lazy" decoding="async"${autoBackground}>
            </div>
            <div>
                <h3 class="mb-1">${escapeHtml(item.company)}</h3>
                <p class="mb-1">${escapeHtml(item.title)}</p>
                <p class="time-range mb-0">${escapeHtml(item.time)}</p>
            </div>
        </div>
    </div>`;
}

/** Renders the experience timeline in file order (oldest first, newest at the right edge). */
export function renderExperience(experience) {
    return experience.map(renderExperienceItem).join("\n");
}
