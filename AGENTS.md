# Repository guide

## Project overview

- This repository contains Ashkan Mirzaei's static academic and personal website.
- The production website is deployed with GitHub Pages at <https://ashmrz.github.io/>.
- The tracked site is a single browser-rendered page. There is no package manager, application framework, bundler, or local dependency-install step.
- Bootstrap, Tailwind CSS, Font Awesome, and Poppins are loaded from CDNs in `index.html`; custom behavior and styling live in the repository.

## Repository map

- `index.html`: page structure and static profile, research, education, and footer content.
- `css/style.css`: light and dark themes, responsive layout, glass-style components, and styles for dynamically rendered content.
- `js/script.js`: theme persistence, section navigation, publication search and expansion, lazy media loading, and JSON-driven rendering.
- `content/papers.json`: publication records rendered in file order.
- `content/experience.json`: experience timeline records.
- `media/`: profile images, organization logos, and publication previews.
- `icons/`: favicon and social assets.
- `_config.yml` and `.github/workflows/pages.yml`: GitHub Pages build and deployment configuration.

## Content conventions

- Keep `content/papers.json` ordered newest first. Every paper should provide `title`, `authors`, and `venue`; `abstract`, `media`, `url` (project page), and `paper` are optional.
- Keep `content/experience.json` chronological from oldest to newest. Entries use `title`, `company`, `time`, and `logo`; `logo_bg` is optional.
- Use repository-relative asset paths. Put organization logos in `media/logos/` and prefer publication previews in `media/paper_videos/reduced_quality/` to limit page weight.
- Edit biography, education, profile links, and section structure directly in `index.html`.
- Section navigation is generated from each `<section>` element's `id` and heading. Keep section IDs unique and stable.

## Implementation conventions

- Preserve the browser-native JavaScript approach unless a requested change clearly requires new tooling.
- Follow the existing formatting: four-space indentation in HTML, CSS, and JavaScript; two-space indentation in JSON; camelCase JavaScript names; and semicolons.
- Reuse the CSS custom properties in `:root` and `[data-theme="dark"]`. Check changes in both themes, at the existing mobile breakpoint, and with reduced-motion preferences.
- Preserve publication-media lazy loading and relative-path compatibility for static hosting.
- Treat content inserted through template strings carefully: publication and experience JSON is rendered with `innerHTML` and is expected to contain trusted repository content.

## Local development and validation

Run the site from the repository root so the JSON `fetch` calls work:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Do not rely on opening `index.html` with a `file://` URL.

There is no automated test or lint suite. Before finishing a change, run the relevant lightweight checks:

```sh
python3 -m json.tool content/papers.json >/dev/null
python3 -m json.tool content/experience.json >/dev/null
node --check js/script.js
```

For user-facing changes, manually check desktop and mobile layouts, light and dark themes, publication search, abstract expansion, media loading, external links, and the browser console/network panel for fetch or asset errors. A network connection is needed to load the CDN dependencies.

## Required review and release workflow

- After every change to the website, serve the repository locally with `python -m http.server <port_number>` from the repository root.
- Ask Ashkan to test the locally deployed website and confirm that it looks and behaves correctly.
- Do not commit or push the website change until Ashkan has provided that confirmation. After confirmation, commit and push the approved change.
- Keep the website a static HTML site that remains deployable through GitHub Pages. Do not introduce a server-side runtime or a build requirement that is incompatible with GitHub Pages.

## GitHub Pages deployment

- This website is deployed on GitHub Pages. Pushes to `main` and manual workflow dispatches run `.github/workflows/pages.yml`.
- The workflow builds the repository root with Jekyll into `_site`, uploads the Pages artifact, and deploys it to the `github-pages` environment.
- `_config.yml` excludes all of `media/paper_videos/original_quality/` from the normal Pages build. The workflow explicitly restores only `DenseDPO.mp4`, which is currently referenced by `content/papers.json`.
- Do not reference another file under `original_quality/` without deliberately updating the Pages build/deployment handling. Prefer a reduced-quality asset instead.
- Changes merged or pushed to `main` can affect the live site, so treat `_config.yml` and `.github/workflows/pages.yml` as production configuration.
