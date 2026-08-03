import { copyFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

const repositoryRoot = path.dirname(fileURLToPath(import.meta.url));

async function collectProductionMedia() {
    const readContent = async (filename) => JSON.parse(await readFile(path.join(repositoryRoot, "public/content", filename), "utf8"));
    const papers = (await readContent("papers.json")).papers;
    const experience = (await readContent("experience.json")).experience;
    const assets = new Set([
        "/media/profile.webp",
        "/media/profile_280.png",
        "/media/profile_dark.webp",
        "/media/profile_dark_280.png"
    ]);

    papers.forEach((paper) => {
        [paper.media, paper.poster, paper.media_webp].filter(Boolean).forEach((asset) => assets.add(asset));

        if (typeof paper.media === "string" && /\.(mp4|webm|mov)$/i.test(paper.media) && !paper.poster) {
            const posterName = `${path.basename(paper.media, path.extname(paper.media))}.webp`;
            assets.add(`/media/paper_posters/${posterName}`);
        }
    });

    experience.forEach((item) => {
        [item.logo, item.logo_webp].filter(Boolean).forEach((asset) => assets.add(asset));
    });

    return [...assets];
}

function copyProductionMedia() {
    return {
        name: "copy-production-media",
        apply: "build",
        async closeBundle() {
            const assets = await collectProductionMedia();

            await Promise.all(assets.map(async (asset) => {
                const relativePath = asset.replace(/^\//, "");
                const sourcePath = path.join(repositoryRoot, relativePath);
                const destinationPath = path.join(repositoryRoot, "dist", relativePath);
                await mkdir(path.dirname(destinationPath), { recursive: true });
                await copyFile(sourcePath, destinationPath);
            }));
        }
    };
}

export default defineConfig({
    base: "/",
    plugins: [tailwindcss(), copyProductionMedia()],
    build: {
        outDir: "dist",
        sourcemap: false
    }
});
