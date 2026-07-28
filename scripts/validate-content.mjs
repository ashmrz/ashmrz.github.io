import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const problems = [];

function readJson(relativePath) {
    const absolutePath = path.join(repositoryRoot, relativePath);
    return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
}

function requireNonEmptyString(record, field, location) {
    if (typeof record[field] !== "string" || record[field].trim() === "") {
        problems.push(`${location}: ${field} must be a non-empty string`);
        return false;
    }
    return true;
}

function validateOptionalString(record, field, location) {
    if (record[field] !== undefined && (typeof record[field] !== "string" || record[field].trim() === "")) {
        problems.push(`${location}: ${field} must be a non-empty string when present`);
    }
}

function validateHttpsUrl(value, location) {
    if (value === undefined) return;
    try {
        const url = new URL(value);
        if (url.protocol !== "https:") problems.push(`${location}: URL must use HTTPS`);
    } catch (error) {
        problems.push(`${location}: URL is invalid`);
    }
}

function validateAsset(value, location) {
    if (value === undefined) return;
    if (typeof value !== "string" || value.includes("\\") || value.split("/").includes("..") || !/^(media|icons)\//.test(value)) {
        problems.push(`${location}: asset path must be repository-relative under media/ or icons/`);
        return;
    }

    if (!fs.existsSync(path.join(repositoryRoot, value))) {
        problems.push(`${location}: referenced asset does not exist (${value})`);
    }
}

const papersDocument = readJson("content/papers.json");
const experienceDocument = readJson("content/experience.json");
const papers = papersDocument.papers;
const experience = experienceDocument.experience;

if (!Array.isArray(papers)) problems.push("content/papers.json: papers must be an array");
if (!Array.isArray(experience)) problems.push("content/experience.json: experience must be an array");

if (Array.isArray(papers)) {
    const titles = new Set();
    let previousYear = Number.POSITIVE_INFINITY;

    papers.forEach((paper, index) => {
        const location = `content/papers.json paper ${index + 1}`;
        ["title", "authors", "venue"].forEach((field) => requireNonEmptyString(paper, field, location));
        ["abstract", "media", "poster", "media_webp", "url", "paper"].forEach((field) => validateOptionalString(paper, field, location));

        if (typeof paper.title === "string") {
            if (titles.has(paper.title)) problems.push(`${location}: duplicate title (${paper.title})`);
            titles.add(paper.title);
        }

        validateAsset(paper.media, `${location} media`);
        validateAsset(paper.poster, `${location} poster`);
        validateAsset(paper.media_webp, `${location} media_webp`);
        validateHttpsUrl(paper.url, `${location} url`);
        validateHttpsUrl(paper.paper, `${location} paper`);

        if (typeof paper.media === "string" && /\.(mp4|webm|mov)$/i.test(paper.media) && !paper.poster) {
            problems.push(`${location}: video media requires a poster`);
        }

        if (typeof paper.media === "string" && /\.mp4$/i.test(paper.media) && !paper.media.startsWith("media/paper_videos/web_optimized/")) {
            problems.push(`${location}: MP4 previews must use media/paper_videos/web_optimized/`);
        }

        const yearMatch = typeof paper.venue === "string" ? paper.venue.match(/20\d{2}/) : null;
        if (yearMatch) {
            const year = Number(yearMatch[0]);
            if (year > previousYear) problems.push(`${location}: papers must remain newest first`);
            previousYear = year;
        }
    });
}

if (Array.isArray(experience)) {
    let previousStartYear = Number.NEGATIVE_INFINITY;

    experience.forEach((item, index) => {
        const location = `content/experience.json item ${index + 1}`;
        ["title", "company", "time", "logo"].forEach((field) => requireNonEmptyString(item, field, location));
        ["logo_bg", "logo_webp"].forEach((field) => validateOptionalString(item, field, location));
        validateAsset(item.logo, `${location} logo`);
        validateAsset(item.logo_webp, `${location} logo_webp`);

        const yearMatch = typeof item.time === "string" ? item.time.match(/20\d{2}/) : null;
        if (yearMatch) {
            const startYear = Number(yearMatch[0]);
            if (startYear < previousStartYear) problems.push(`${location}: experience must remain oldest first`);
            previousStartYear = startYear;
        }
    });
}

[
    "media/profile.webp",
    "media/profile_280.png",
    "media/profile_dark.webp",
    "media/profile_dark_280.png"
].forEach((asset) => validateAsset(asset, "index.html profile asset"));

if (problems.length > 0) {
    problems.forEach((problem) => console.error(`- ${problem}`));
    process.exitCode = 1;
} else {
    console.log(`Content validation passed: ${papers.length} papers and ${experience.length} experience entries.`);
}
