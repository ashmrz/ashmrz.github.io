/*
 * Shared access to the site content data. Used by the Vite build, the content validator,
 * and the production artifact verifier so they agree on what the site references.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const contentDirectory = path.join(repositoryRoot, "content");

/** The portrait referenced by index.html and page metadata, plus its stable PNG fallback. */
export const PROFILE_ASSETS = [
    "/media/profile.webp",
    "/media/profile_280.png"
];

/**
 * Folders for source-quality and intermediate media. They are git-ignored: the files stay
 * on disk for re-encoding but are never tracked, referenced by content, or deployed.
 */
export const SOURCE_MEDIA_DIRECTORIES = [
    "media/paper_videos/original_quality",
    "media/paper_videos/reduced_quality",
    "source-media"
];

const VIDEO_EXTENSION = /\.(mp4|webm|mov)$/i;

async function readContentFile(filename) {
    return JSON.parse(await readFile(path.join(contentDirectory, filename), "utf8"));
}

/** Loads the publication and experience records in file order. */
export async function loadContent() {
    const [papersDocument, experienceDocument] = await Promise.all([
        readContentFile("papers.json"),
        readContentFile("experience.json")
    ]);

    return { papers: papersDocument.papers, experience: experienceDocument.experience };
}

export function isVideo(source) {
    return typeof source === "string" && VIDEO_EXTENSION.test(source);
}

/**
 * Returns the poster frame for a publication preview video: the explicit `poster` field,
 * or `/media/paper_posters/<video name>.webp` by convention. Image previews have no poster.
 */
export function getPosterPath(paper) {
    if (paper.poster) return paper.poster;
    if (!isVideo(paper.media)) return null;

    const videoName = path.posix.basename(paper.media, path.posix.extname(paper.media));
    return `/media/paper_posters/${videoName}.webp`;
}

/** Lists every root-relative media file the production site needs, without duplicates. */
export function collectProductionMedia({ papers, experience }) {
    const assets = new Set(PROFILE_ASSETS);

    for (const paper of papers) {
        if (paper.media) assets.add(paper.media);
        const poster = getPosterPath(paper);
        if (poster) assets.add(poster);
    }

    for (const item of experience) {
        if (item.logo) assets.add(item.logo);
    }

    return [...assets];
}
