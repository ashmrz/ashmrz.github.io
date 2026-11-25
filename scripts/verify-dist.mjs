/*
 * Verifies the production build in dist/: every referenced asset is present, the content
 * was rendered into the page, and nothing source-only or CDN-hosted slipped in.
 */
import fs from "node:fs";
import path from "node:path";
import { SOURCE_MEDIA_DIRECTORIES, collectProductionMedia, loadContent, repositoryRoot } from "./site-content.mjs";

const distRoot = path.join(repositoryRoot, "dist");
const problems = [];

function requireFile(relativePath) {
    const absolutePath = path.join(distRoot, relativePath.replace(/^\//, ""));
    if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
        problems.push(`Missing production file: ${relativePath}`);
    }
}

function countOccurrences(text, pattern) {
    return (text.match(pattern) ?? []).length;
}

const content = await loadContent();

["index.html", "icons/laptop.png"].forEach(requireFile);
collectProductionMedia(content).forEach(requireFile);

["content", ...SOURCE_MEDIA_DIRECTORIES].forEach((relativePath) => {
    if (fs.existsSync(path.join(distRoot, relativePath))) {
        problems.push(`Source-only files leaked into production: ${relativePath}`);
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

    if (builtHtml.includes("<!--@")) problems.push("An unrendered build slot remains in index.html");

    const publicationCount = countOccurrences(builtHtml, /class="publication-card publication-card-custom/g);
    if (publicationCount !== content.papers.length) {
        problems.push(`Rendered ${publicationCount} publication cards for ${content.papers.length} papers`);
    }

    const experienceCount = countOccurrences(builtHtml, /class="timeline-item"/g);
    if (experienceCount !== content.experience.length) {
        problems.push(`Rendered ${experienceCount} timeline items for ${content.experience.length} experience entries`);
    }

    const stylesheetPaths = [...builtHtml.matchAll(/<link[^>]+href="([^"]+\.css)"/g)]
        .map((match) => match[1].replace(/^\//, ""));

    stylesheetPaths.forEach((stylesheetPath) => {
        const absolutePath = path.join(distRoot, stylesheetPath);
        if (!fs.existsSync(absolutePath)) return;

        // Minifiers have dropped one of the two backdrop-filter declarations before; keep both.
        const builtCss = fs.readFileSync(absolutePath, "utf8");
        const navGlassRule = [...builtCss.matchAll(/\.nav-list\s*\{([^}]*)\}/g)]
            .map((match) => match[1])
            .find((rule) => rule.includes("--nav-menu-bg"));

        if (!navGlassRule) {
            problems.push("Production navigation glass rule is missing");
            return;
        }

        if (!/(?:^|;)\s*backdrop-filter\s*:\s*blur/.test(navGlassRule)) {
            problems.push("Production navigation glass is missing the standard backdrop-filter");
        }

        if (!/(?:^|;)\s*-webkit-backdrop-filter\s*:\s*blur/.test(navGlassRule)) {
            problems.push("Production navigation glass is missing the WebKit backdrop-filter");
        }
    });
}

if (problems.length > 0) {
    problems.forEach((problem) => console.error(`- ${problem}`));
    process.exitCode = 1;
} else {
    console.log("Production artifact verification passed.");
}
