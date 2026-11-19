# Repository guide

## Project overview

- This repository contains Ashkan Mirzaei's static academic and personal website.
- The production website is deployed with GitHub Pages at <https://ashmrz.github.io/>.
- The tracked site is a single static page with no client-side application framework or server runtime. Publications and the experience timeline are rendered into the HTML at build time; the browser script only adds behavior.
- npm manages the build dependencies. Vite builds the static site, Tailwind CSS is compiled locally, Poppins is self-hosted, and icons are inline SVG.

## Repository map

- `index.html`: page structure and static profile, research, education, and footer content, plus the build slots described below.
- `src/styles.css`: build entry for Tailwind CSS, the local fonts, and the custom stylesheet. It lists the files Tailwind scans for class names.
- `css/style.css`: the light theme tokens, responsive layout, glass-style components, and styles for the build-rendered content.
- `js/script.js`: section navigation, publication search and abstract expansion, lazy media loading, and timeline positioning.
- `content/papers.json`: publication records rendered in file order.
- `content/experience.json`: experience timeline records.
- `scripts/render-content.mjs`: build-time HTML for publication cards and timeline items.
- `scripts/icons.mjs`: the inline SVG icon registry.
- `scripts/site-content.mjs`: shared content loading and the list of media the production site needs.
- `scripts/validate-content.mjs` and `scripts/verify-dist.mjs`: content validation and production artifact checks.
- `media/`: profile images, organization logos, poster frames, optimized publication previews, and source-quality media.
- `public/icons/`: the favicon.
- `package.json` and `vite.config.js`: local development, validation, and production build configuration.
- `.github/workflows/pages.yml`: GitHub Pages build and deployment configuration.

## Build-time rendering

- `vite.config.js` replaces comment slots in `index.html`, both in `npm run dev` and in the production build: `<!--@publications-->`, `<!--@experience-->`, `<!--@year-->`, and `<!--@icon:name extra-classes -->`.
- Add an icon by registering its outline in `scripts/icons.mjs`, then reference it with an icon slot in `index.html` or with `renderIcon()` in `scripts/render-content.mjs`.
- Keep a space before the closing `-->` of an icon slot that carries classes, so Tailwind sees each class name. A slot cannot be placed inside another HTML comment.
- All content values are HTML-escaped when rendered, so the JSON holds plain text rather than markup.

## Content conventions

- Keep `content/papers.json` ordered newest first. Every paper should provide `title`, `authors`, and `venue`; `abstract`, `media`, `url` (project page), and `paper` are optional. `media_labels` (four strings) captions the quadrants of a 2x2 preview, and `poster` overrides the poster frame derived from the video name.
- Keep `content/experience.json` chronological from oldest to newest. Entries use `title`, `company`, `time`, and `logo`. `logo_bg` sets the logo tile color, `logo_theme: "monochrome"` marks a white single-color logo that is drawn dark on a transparent tile, and a logo with neither gets a dark tile automatically when it is mostly white.
- Use root-relative public asset URLs. Put organization logos in `media/logos/`, publication videos in `media/paper_videos/web_optimized/`, and matching WebP poster frames in `media/paper_posters/` to limit page weight.
- Keep original and intermediate publication videos under `media/paper_videos/original_quality/` and `media/paper_videos/reduced_quality/`; never reference them from site content.
- Edit biography, education, profile links, and section structure directly in `index.html`.
- Section navigation is generated from each `<section>` element's `id` and heading. Keep section IDs unique and stable.

## Implementation conventions

- Preserve the browser-native JavaScript approach unless a requested change clearly requires new tooling. Render content at build time and keep `js/script.js` for behavior only.
- Follow the existing formatting: four-space indentation in HTML, CSS, and JavaScript; two-space indentation in JSON; camelCase JavaScript names; and semicolons.
- The site has a single light theme. Reuse the CSS custom properties in `:root`, and check changes at the existing mobile breakpoint and with reduced-motion preferences.
- Preserve publication-media lazy loading and root-relative compatibility with the GitHub Pages user-site URL.
- Attach event listeners in `js/script.js` rather than using inline `on...` attributes, and escape every content value that `scripts/render-content.mjs` writes into markup.

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

For user-facing changes, manually check desktop and mobile layouts, publication search, abstract expansion, media loading, external links, and the browser console/network panel for fetch or asset errors.

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
