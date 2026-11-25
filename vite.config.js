import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { renderIcon } from "./scripts/icons.mjs";
import { renderExperience, renderPublicationLegend, renderPublications } from "./scripts/render-content.mjs";
import { collectProductionMedia, contentDirectory, loadContent, repositoryRoot } from "./scripts/site-content.mjs";

/*
 * index.html marks build-time content with comment slots:
 *   <!--@publications-->   publication cards from content/papers.json
 *   <!--@legend-->         the note explaining the asterisk in author lists, when one is needed
 *   <!--@experience-->     timeline items from content/experience.json
 *   <!--@year-->           the build year (the browser script keeps it current)
 *   <!--@icon:name extra classes-->   an inline SVG icon from scripts/icons.mjs
 */
const SLOT_PATTERN = /<!--@([a-z]+)(?::([a-z0-9-]+))?((?:\s+[\w-]+)*)\s*-->/g;

async function renderSlots(html) {
    const { papers, experience } = await loadContent();
    const slots = {
        publications: () => renderPublications(papers),
        legend: () => renderPublicationLegend(papers),
        experience: () => renderExperience(experience),
        year: () => String(new Date().getFullYear()),
        icon: (name, className) => renderIcon(name, className)
    };

    return html.replace(SLOT_PATTERN, (slot, name, argument, classes) => {
        if (!Object.hasOwn(slots, name)) throw new Error(`Unknown build slot in index.html: ${slot}`);
        return slots[name](argument, classes.trim());
    });
}

/** Renders the content slots into index.html, in development and in the production build. */
function renderSiteContent() {
    return {
        name: "render-site-content",
        configureServer(server) {
            // Content lives outside the module graph, so reload the page when it changes.
            server.watcher.add(contentDirectory);
            server.watcher.on("change", (file) => {
                if (file.startsWith(contentDirectory)) server.ws.send({ type: "full-reload" });
            });
        },
        // Runs after Vite's own HTML handling, so the root-relative /media URLs are left untouched.
        transformIndexHtml(html) {
            return renderSlots(html);
        }
    };
}

/** Copies only the media referenced by the content data (plus profile images) into dist/. */
function copyProductionMedia() {
    return {
        name: "copy-production-media",
        apply: "build",
        async closeBundle() {
            const assets = collectProductionMedia(await loadContent());

            await Promise.all(assets.map(async (asset) => {
                const relativePath = asset.replace(/^\//, "");
                const destinationPath = path.join(repositoryRoot, "dist", relativePath);
                await mkdir(path.dirname(destinationPath), { recursive: true });
                await copyFile(path.join(repositoryRoot, relativePath), destinationPath);
            }));
        }
    };
}

export default defineConfig({
    base: "/",
    plugins: [tailwindcss(), renderSiteContent(), copyProductionMedia()],
    build: {
        outDir: "dist",
        sourcemap: false
    }
});
