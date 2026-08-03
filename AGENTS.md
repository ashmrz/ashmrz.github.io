# Repository guide

## Project overview

- This repository contains Ashkan Mirzaei's static academic and personal website.
- The production website is deployed with GitHub Pages at <https://ashmrz.github.io/>.
- The tracked site is a single browser-rendered page with no client-side application framework or server runtime.
- npm manages the build dependencies. Vite builds the static site, Tailwind CSS is compiled locally, and Poppins and Font Awesome are self-hosted.

## Repository map

- `index.html`: page structure and static profile, research, education, and footer content.
- `src/styles.css`: build entry for Tailwind CSS, local fonts/icons, and the custom stylesheet.
- `css/style.css`: light and dark themes, responsive layout, glass-style components, and styles for dynamically rendered content.
- `js/script.js`: theme persistence, section navigation, publication search and expansion, lazy media loading, and JSON-driven rendering.
- `public/content/papers.json`: publication records rendered in file order.
- `public/content/experience.json`: experience timeline records.
- `media/`: profile images, organization logos, poster frames, optimized publication previews, and source-quality media.
- `public/icons/`: favicon and social assets.
- `package.json`, `vite.config.js`, and `scripts/`: local development, validation, and production build configuration.
- `.github/workflows/pages.yml`: GitHub Pages build and deployment configuration.

## Content conventions

- Keep `public/content/papers.json` ordered newest first. Every paper should provide `title`, `authors`, and `venue`; `abstract`, `media`, `url` (project page), and `paper` are optional.
- Keep `public/content/experience.json` chronological from oldest to newest. Entries use `title`, `company`, `time`, and `logo`; `logo_bg` is optional.
- Use root-relative public asset URLs. Put organization logos in `media/logos/`, publication videos in `media/paper_videos/web_optimized/`, and matching WebP poster frames in `media/paper_posters/` to limit page weight.
- Keep original and intermediate publication videos under `media/paper_videos/original_quality/` and `media/paper_videos/reduced_quality/`; never reference them from site content.
- Edit biography, education, profile links, and section structure directly in `index.html`.
- Section navigation is generated from each `<section>` element's `id` and heading. Keep section IDs unique and stable.

## Implementation conventions

- Preserve the browser-native JavaScript approach unless a requested change clearly requires new tooling.
- Follow the existing formatting: four-space indentation in HTML, CSS, and JavaScript; two-space indentation in JSON; camelCase JavaScript names; and semicolons.
- Reuse the CSS custom properties in `:root` and `[data-theme="dark"]`. Check changes in both themes, at the existing mobile breakpoint, and with reduced-motion preferences.
- Preserve publication-media lazy loading and root-relative compatibility with the GitHub Pages user-site URL.
- Treat content inserted through template strings carefully: publication and experience JSON is rendered with `innerHTML` and is expected to contain trusted repository content.

## Local development and validation

Install the locked dependencies and start Vite from the repository root:

```sh
npm ci
npm run dev
```

Use the local URL printed by Vite. Do not rely on opening `index.html` with a `file://` URL.

Before finishing a change, run the complete local check:

```sh
npm run check
```

For user-facing changes, manually check desktop and mobile layouts, light and dark themes, publication search, abstract expansion, media loading, external links, and the browser console/network panel for fetch or asset errors.

## Required review and release workflow

- After every change to the website, serve it locally with `npm run dev` or serve the production build with `npm run preview`.
- Ask Ashkan to test the locally deployed website and confirm that it looks and behaves correctly.
- Do not commit or push the website change until Ashkan has provided that confirmation. After confirmation, commit and push the approved change.
- Keep the website a static HTML site that remains deployable through GitHub Pages. Do not introduce a server-side runtime or a build requirement that is incompatible with GitHub Pages.

## GitHub Pages deployment

- This website is deployed on GitHub Pages. Pushes to `main` and manual workflow dispatches run `.github/workflows/pages.yml`.
- The workflow installs the locked npm dependencies, runs the validation and Vite build, uploads `dist/`, and deploys it to the `github-pages` environment.
- Vite copies only media referenced by the content data plus required profile assets into `dist/`. Original and reduced-quality videos are excluded by construction and checked by the production artifact verifier.
- Prefer a fast-start H.264 asset in `media/paper_videos/web_optimized/` with a matching WebP poster.
- Changes merged or pushed to `main` can affect the live site, so treat `package-lock.json`, `vite.config.js`, and `.github/workflows/pages.yml` as production configuration.
