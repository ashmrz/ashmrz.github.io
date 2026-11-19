# Ashkan Mirzaei's website

Static academic and personal website, built with Vite and Tailwind CSS and deployed to GitHub Pages.

Publications and the experience timeline live in `content/papers.json` and `content/experience.json`. They are rendered into `index.html` at build time, so the deployed page is plain static HTML.

## Local development

```sh
npm ci
npm run dev
```

Use the local URL printed by Vite. The page reloads when the content files change. To test the exact production output:

```sh
npm run build
npm run preview
```

## Validation

```sh
npm run check
```

This validates publication and experience content, lints the JavaScript, builds the site, and verifies that the GitHub Pages artifact contains all referenced production assets without source-quality videos.

## Deployment

Pushes to `main` run `.github/workflows/pages.yml`, which builds the site with Node.js and deploys the generated `dist/` directory to GitHub Pages.
