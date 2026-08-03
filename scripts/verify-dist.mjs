import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const distRoot = path.join(repositoryRoot, "dist");
const problems = [];

function requireFile(relativePath) {
    const absolutePath = path.join(distRoot, relativePath.replace(/^\//, ""));
    if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
        problems.push(`Missing production file: ${relativePath}`);
    }
}

function readJson(relativePath) {
    return JSON.parse(fs.readFileSync(path.join(distRoot, relativePath), "utf8"));
}

[
    "index.html",
    "content/papers.json",
    "content/experience.json",
    "icons/laptop.png",
    "media/profile.webp",
    "media/profile_dark.webp"
].forEach(requireFile);

if (problems.length === 0) {
    const papers = readJson("content/papers.json").papers;
    const experience = readJson("content/experience.json").experience;

    papers.forEach((paper) => {
        [paper.media, paper.poster, paper.media_webp].filter(Boolean).forEach(requireFile);

        if (typeof paper.media === "string" && /\.mp4$/i.test(paper.media) && !paper.poster) {
            const posterName = `${path.basename(paper.media, ".mp4")}.webp`;
            requireFile(`/media/paper_posters/${posterName}`);
        }
    });

    experience.forEach((item) => {
        [item.logo, item.logo_webp].filter(Boolean).forEach(requireFile);
    });
}

[
    "media/paper_videos/original_quality",
    "media/paper_videos/reduced_quality",
    "source-media"
].forEach((relativePath) => {
    if (fs.existsSync(path.join(distRoot, relativePath))) {
        problems.push(`Source-only media leaked into production: ${relativePath}`);
    }
});

const builtHtmlPath = path.join(distRoot, "index.html");
if (fs.existsSync(builtHtmlPath)) {
    const builtHtml = fs.readFileSync(builtHtmlPath, "utf8");
    [
        "cdn.tailwindcss.com",
        "cdnjs.cloudflare.com/ajax/libs/font-awesome",
        "fonts.googleapis.com",
        "fonts.gstatic.com"
    ].forEach((host) => {
        if (builtHtml.includes(host)) problems.push(`Runtime build dependency remains in HTML: ${host}`);
    });
}

if (problems.length > 0) {
    problems.forEach((problem) => console.error(`- ${problem}`));
    process.exitCode = 1;
} else {
    console.log("Production artifact verification passed.");
}
