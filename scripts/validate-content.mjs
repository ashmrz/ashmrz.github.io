/*
 * Validates content/papers.json and content/experience.json before every build:
 * required fields, asset paths, link protocols, and ordering. Also checks that media/
 * holds only files the site serves.
 */
import fs from "node:fs";
import path from "node:path";
import { PROFILE_ASSETS, SOURCE_MEDIA_DIRECTORIES, collectProductionMedia, getPosterPath, isVideo, loadContent, repositoryRoot } from "./site-content.mjs";

const publicRoot = path.join(repositoryRoot, "public");
const problems = [];

function requireNonEmptyString(record, field, location) {
    if (typeof record[field] !== "string" || record[field].trim() === "") {
        problems.push(`${location}: ${field} must be a non-empty string`);
    }
}

function validateOptionalString(record, field, location) {
    if (record[field] !== undefined && (typeof record[field] !== "string" || record[field].trim() === "")) {
        problems.push(`${location}: ${field} must be a non-empty string when present`);
    }
}

function validateHttpsUrl(value, location) {
    if (value === undefined) return;

    try {
        if (new URL(value).protocol !== "https:") problems.push(`${location}: URL must use HTTPS`);
    } catch {
        problems.push(`${location}: URL is invalid`);
    }
}

function validateAsset(value, location) {
    if (value === undefined || value === null) return;

    if (typeof value !== "string" || value.includes("\\") || value.split("/").includes("..") || !/^\/(media|icons)\//.test(value)) {
        problems.push(`${location}: asset path must be root-relative under /media/ or /icons/`);
        return;
    }

    // /media/ files live at the repository root; /icons/ files are served from public/.
    const assetRoot = value.startsWith("/media/") ? repositoryRoot : publicRoot;
    if (!fs.existsSync(path.join(assetRoot, value.slice(1)))) {
        problems.push(`${location}: referenced asset does not exist (${value})`);
    }
}

function validatePapers(papers) {
    const titles = new Set();
    let previousYear = Number.POSITIVE_INFINITY;

    papers.forEach((paper, index) => {
        const location = `content/papers.json paper ${index + 1}`;
        ["title", "authors", "venue"].forEach((field) => requireNonEmptyString(paper, field, location));
        ["abstract", "authors_note", "media", "poster", "url", "paper"].forEach((field) => validateOptionalString(paper, field, location));

        if (typeof paper.title === "string") {
            if (titles.has(paper.title)) problems.push(`${location}: duplicate title (${paper.title})`);
            titles.add(paper.title);
        }

        validateAsset(paper.media, `${location} media`);
        validateAsset(getPosterPath(paper), `${location} poster`);
        validateHttpsUrl(paper.url, `${location} url`);
        validateHttpsUrl(paper.paper, `${location} paper`);

        if (isVideo(paper.media) && !paper.media.startsWith("/media/paper_videos/web_optimized/")) {
            problems.push(`${location}: video previews must use /media/paper_videos/web_optimized/`);
        }

        if (paper.media_labels !== undefined) {
            const labels = paper.media_labels;
            const isValid = Array.isArray(labels) && labels.length === 4 && labels.every((label) => typeof label === "string" && label.trim() !== "");
            if (!isValid) problems.push(`${location}: media_labels must be four non-empty strings (one per quadrant)`);
        }

        const yearMatch = typeof paper.venue === "string" ? paper.venue.match(/20\d{2}/) : null;
        if (yearMatch) {
            const year = Number(yearMatch[0]);
            if (year > previousYear) problems.push(`${location}: papers must remain newest first`);
            previousYear = year;
        }
    });
}

function validateExperience(experience) {
    let previousStartYear = Number.NEGATIVE_INFINITY;

    experience.forEach((item, index) => {
        const location = `content/experience.json item ${index + 1}`;
        ["title", "company", "time", "logo"].forEach((field) => requireNonEmptyString(item, field, location));
        validateOptionalString(item, "logo_bg", location);
        validateAsset(item.logo, `${location} logo`);

        if (item.logo_theme !== undefined && item.logo_theme !== "monochrome") {
            problems.push(`${location}: logo_theme must be "monochrome" when present`);
        }

        const yearMatch = typeof item.time === "string" ? item.time.match(/20\d{2}/) : null;
        if (yearMatch) {
            const startYear = Number(yearMatch[0]);
            if (startYear < previousStartYear) problems.push(`${location}: experience must remain oldest first`);
            previousStartYear = startYear;
        }
    });
}

/**
 * Keeps the repository lean: every file under media/ must be served by the site.
 * Masters and other source files belong in the git-ignored source-media folders.
 */
function validateMediaDirectory(servedAssets) {
    const served = new Set(servedAssets.map((asset) => asset.slice(1)));
    const pending = ["media"];

    while (pending.length > 0) {
        const directory = pending.pop();

        for (const entry of fs.readdirSync(path.join(repositoryRoot, directory), { withFileTypes: true })) {
            const relativePath = `${directory}/${entry.name}`;
            if (entry.name.startsWith(".") || SOURCE_MEDIA_DIRECTORIES.includes(relativePath)) continue;

            if (entry.isDirectory()) {
                pending.push(relativePath);
            } else if (!served.has(relativePath)) {
                problems.push(`${relativePath}: not referenced by the site; remove it or move it to source-media/`);
            }
        }
    }
}

const { papers, experience } = await loadContent();

if (Array.isArray(papers)) {
    validatePapers(papers);
} else {
    problems.push("content/papers.json: papers must be an array");
}

if (Array.isArray(experience)) {
    validateExperience(experience);
} else {
    problems.push("content/experience.json: experience must be an array");
}

PROFILE_ASSETS.forEach((asset) => validateAsset(asset, "profile asset"));

if (Array.isArray(papers) && Array.isArray(experience)) {
    validateMediaDirectory(collectProductionMedia({ papers, experience }));
}

if (problems.length > 0) {
    problems.forEach((problem) => console.error(`- ${problem}`));
    process.exitCode = 1;
} else {
    console.log(`Content validation passed: ${papers.length} papers and ${experience.length} experience entries.`);
}
