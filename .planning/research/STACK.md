# Stack Research

**Domain:** Static educational website (Mechanistic Interpretability)
**Researched:** 2026-02-02
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Eleventy (11ty) | 3.1.2 | Static site generator | Outputs exactly the HTML you write -- no injected markup, no client-side framework. Supports Nunjucks/Liquid/Markdown templating with layouts, includes, macros, and shortcodes for DRY code. First-class GitHub Pages support. The standard choice for vanilla HTML static sites. |
| Nunjucks | (bundled with 11ty) | Templating language | Jinja2-style syntax with template inheritance (extends/blocks), includes, macros with parameters, and filters. More powerful than Liquid for component-like patterns. Works seamlessly as Eleventy's template engine. |
| markdown-it | 14.1.0 | Markdown processing | Eleventy's default Markdown engine. Pluggable architecture for KaTeX, anchors, TOC, and syntax highlighting. CommonMark-compliant with extensions. |
| KaTeX | 0.16.28 | Math typesetting | Fastest math rendering library for the web. Supports build-time pre-rendering via `renderToString()` so zero client-side JS is needed for math. Print-quality TeX output. Self-contained with no dependencies. |
| Pagefind | 1.4.0 | Client-side search | Purpose-built for static sites. Runs post-build to generate a chunked search index. Loads only relevant index chunks on demand (<100KB for most sites). Ships a prebuilt search UI. Zero configuration needed -- just point it at your build output. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @mdit/plugin-katex | 0.23.1 | KaTeX integration for markdown-it | For build-time rendering of `$...$` and `$$...$$` math delimiters in Markdown content. Outputs pre-rendered HTML so no client-side KaTeX JS is needed. |
| markdown-it-anchor | 9.2.0 | Heading anchor links | Adds `id` attributes and optional permalink anchors to all headings. Required for TOC and deep-linking to sections. |
| markdown-it-toc-done-right | 4.2.0 | Table of contents generation | Generates semantic TOC from headings. Works in tandem with markdown-it-anchor. Note: last published 2020 but stable and widely used (69 dependents). |
| highlight.js | 11.11.1 | Syntax highlighting | For code blocks in articles. Lightweight, zero dependencies, 192 languages supported. Use via markdown-it's built-in `highlight` option at build time -- no client-side JS needed. |
| markdown-it-attrs | 4.3.1 | Custom HTML attributes in Markdown | Add classes, IDs, and attributes to Markdown elements with `{.class #id attr=value}` syntax. Useful for styling specific elements in academic content. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| npm scripts | Build orchestration | `eleventy --build` then `pagefind --site _site`. No Gulp/Webpack/Vite needed. Keep it simple. |
| GitHub Actions | CI/CD deployment | Use `actions/upload-pages-artifact` + `actions/deploy-pages` for native GitHub Pages deployment. No `gh-pages` branch needed. |
| Eleventy Dev Server | Local development | Built into Eleventy. Hot reload, live preview. Run with `npx @11ty/eleventy --serve`. |
| .nojekyll file | GitHub Pages config | Empty file in output root. Tells GitHub Pages to skip Jekyll processing and serve raw HTML. |

## Installation

```bash
# Core
npm install -D @11ty/eleventy

# Markdown plugins
npm install -D markdown-it-anchor markdown-it-toc-done-right markdown-it-attrs

# Math rendering
npm install -D @mdit/plugin-katex katex

# Syntax highlighting
npm install -D highlight.js

# Search (run post-build, not imported in code)
npm install -D pagefind
```

## Build Commands

```bash
# Development
npx @11ty/eleventy --serve

# Production build
npx @11ty/eleventy && npx pagefind --site _site

# The order matters: Eleventy builds HTML first, then Pagefind indexes it
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Eleventy | Hugo | If you need sub-second builds for 10,000+ pages. Hugo is faster but uses Go templates (less familiar, harder to extend). Eleventy is fast enough for hundreds of articles and the JS ecosystem makes plugin integration trivial. |
| Eleventy | Astro | If you later want islands of interactivity (e.g., interactive neural network visualizations). Astro ships zero JS by default but injects its own markup and has more opinionated output. Eleventy gives you exact control over HTML output. |
| Eleventy | Jekyll | If GitHub Pages' built-in Jekyll support matters (no GitHub Actions needed). But Jekyll is slower, Ruby-based, and has a declining ecosystem. Not recommended for new projects. |
| Nunjucks | Liquid | If you want simpler syntax with fewer features. Liquid lacks macros and some advanced features that make DRY component patterns easier. Nunjucks is strictly more powerful. |
| Pagefind | Lunr.js | If you need real-time search-as-you-type with sub-millisecond response on small sites (<50 pages). Lunr loads the full index into memory -- fine for small sites, problematic at scale. |
| Pagefind | Fuse.js | If you need fuzzy/approximate matching for typo tolerance. Fuse.js is a fuzzy search library, not a full-text search engine. Loads entire dataset client-side. Poor scaling. |
| @mdit/plugin-katex | KaTeX auto-render (CDN) | If you want zero build complexity and accept a flash of unrendered LaTeX on page load. CDN approach is simpler but build-time rendering is better UX. |
| highlight.js | Shiki | If you want VS Code-quality syntax highlighting and accept a heavier build step (~280KB + WASM). Shiki produces better output but highlight.js is sufficient for an educational site. |
| highlight.js | Prism.js | Never. Prism.js development has stalled since 2022. The v2 rewrite appears abandoned. Stick with highlight.js (actively maintained) or Shiki (best quality). |
| Custom CSS | Tailwind CSS | If you have many developers and want utility-class consistency. For a solo academic site, custom CSS with CSS custom properties gives you full control without a build step or class soup. Tailwind adds unnecessary complexity here. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| React/Vue/Svelte | Massive overkill for static content. Adds client-side JS bundle, hydration complexity, and build tooling for zero benefit on a content site. | Eleventy + vanilla JS |
| MathJax | 3-10x slower than KaTeX for rendering. Larger bundle. The quality difference is negligible for standard math notation. | KaTeX (build-time via @mdit/plugin-katex) |
| Prism.js | Development stalled since 2022. v2 rewrite appears abandoned. Will accumulate security/compatibility debt. | highlight.js or Shiki |
| Webpack/Vite/Parcel | Unnecessary bundler complexity. Eleventy handles the build. CSS and JS are small enough to serve directly. No bundling needed. | npm scripts for build orchestration |
| Tailwind CSS | Adds a build step, utility classes obscure semantic meaning, and fights against the clean academic aesthetic you want. Academic CSS benefits from readable, semantic class names. | Custom CSS with CSS custom properties |
| Fuse.js for full-text search | Loads entire dataset into browser memory. Slow on large datasets. Designed for fuzzy matching, not full-text search. | Pagefind (chunked index, WASM-powered) |
| Jekyll | Ruby dependency, slow builds, declining plugin ecosystem. GitHub Pages' built-in Jekyll support is not worth the tradeoffs. | Eleventy with GitHub Actions |
| markdown-it-katex (old) | Outdated, requires manual KaTeX version override to work. Last meaningful update was years ago. | @mdit/plugin-katex (actively maintained, supports MathML output) |

## Stack Patterns by Variant

**If the site grows beyond 500 articles:**
- Consider switching highlight.js to Shiki for better highlighting quality (build-time cost is acceptable)
- Pagefind will handle scale gracefully due to chunked index loading
- Eleventy build times may reach 5-10 seconds; still acceptable

**If interactive visualizations are needed later:**
- Add vanilla JS `<script>` tags to specific pages
- Use D3.js or Observable Plot for data visualizations
- Consider migrating to Astro only if you need many interactive islands across many pages
- Do NOT reach for React/Vue for a few interactive diagrams

**If math rendering performance becomes an issue:**
- Switch from `@mdit/plugin-katex` client-side rendering to pure build-time `renderToString()` via a custom Eleventy filter
- This eliminates all client-side KaTeX CSS/font loading for pages where math is pre-rendered
- Trade-off: build times increase slightly, but page load is faster

**If you want the Distill.pub aesthetic:**
- Use custom CSS inspired by Distill's design principles: wide content column, sidenotes, clean serif/sans-serif typography
- Consider Tufte CSS (stable, feature-complete, no JS) as a starting point, then customize
- Implement sidenotes with pure CSS (Tufte CSS approach) -- no JavaScript needed
- Use CSS custom properties for consistent spacing, colors, and typography scales

## CSS Strategy

The CSS approach deserves special attention since it defines the academic aesthetic.

**Recommended: Custom CSS from scratch, inspired by Distill.pub and Tufte CSS.**

Rationale:
- Distill.pub's actual CSS framework (`distill-template`) uses custom web components (`<dt-cite>`, etc.) that are tightly coupled to their platform. Not reusable as-is.
- Tufte CSS is a solid foundation for academic typography (sidenotes, margin notes, clean serif fonts) but is feature-complete and unmaintained. Fork and customize rather than depend on it.
- PubCSS targets print-style academic formatting (ACM/IEEE styles), not web-first reading experiences.
- Modern CSS features (custom properties, `clamp()`, container queries) make it straightforward to build a responsive academic layout without a framework.

Key CSS design tokens:
- Content column width: ~700-760px (optimal reading width)
- Sidenote/margin note column: 200-300px on wide screens
- Typography: system fonts or a small set like Inter (body) + a serif for headings
- Code: monospace with subtle background, matching highlight.js theme
- Math: KaTeX's own CSS handles math typography
- Responsive: content column fills screen on mobile, sidenotes collapse to footnotes

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| @11ty/eleventy@3.1.2 | Node.js >= 18 | Eleventy 3.x requires Node 18+. Check your GitHub Actions runner. |
| @mdit/plugin-katex@0.23.1 | katex@0.16.x | Plugin depends on KaTeX. Install both. |
| @mdit/plugin-katex@0.23.1 | markdown-it@14.x | Compatible with current markdown-it. |
| markdown-it-anchor@9.2.0 | markdown-it@14.x | Latest anchor plugin works with latest markdown-it. |
| markdown-it-toc-done-right@4.2.0 | markdown-it-anchor@9.x | Designed to work together. TOC plugin uses anchor IDs. |
| pagefind@1.4.0 | Any SSG output | Pagefind is SSG-agnostic. It indexes any HTML in a directory. |
| highlight.js@11.11.1 | markdown-it@14.x | Used via markdown-it's `highlight` config option, not as a plugin. |

## KaTeX Integration: Two Approaches

### Approach A: Build-time via markdown-it plugin (Recommended)

Math is rendered to HTML during the Eleventy build. No client-side KaTeX JS is shipped.

```js
// eleventy.config.js
import markdownIt from "markdown-it";
import { katex } from "@mdit/plugin-katex";

export default function(eleventyConfig) {
  const md = markdownIt({ html: true })
    .use(katex, { output: "htmlAndMathml" });
  eleventyConfig.setLibrary("md", md);
};
```

You still need to include the KaTeX CSS in your HTML `<head>` for proper styling:
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.28/dist/katex.min.css">
```

**Pros:** No client-side JS, no flash of unrendered LaTeX, fastest page load.
**Cons:** Slightly longer build times, KaTeX errors surface at build time (actually a pro -- catches mistakes early).

### Approach B: Client-side auto-render (Simpler setup, worse UX)

Math is rendered in the browser after page load.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.28/dist/katex.min.css">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.28/dist/katex.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.28/dist/contrib/auto-render.min.js"
    onload="renderMathInElement(document.body);"></script>
```

**Pros:** Zero build configuration for math.
**Cons:** Flash of unrendered LaTeX, loads ~100KB of JS on every page, slower perceived performance.

**Recommendation:** Use Approach A (build-time). The build complexity is minimal and the UX improvement is significant for a math-heavy site.

## GitHub Pages Deployment

### Recommended: GitHub Actions with native Pages deployment

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx @11ty/eleventy
      - run: npx pagefind --site _site
      - uses: actions/upload-pages-artifact@v3
        with:
          path: _site

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

Key notes:
- Add a `.nojekyll` file to the Eleventy input directory so it copies to `_site`
- If deploying to a subdirectory (e.g., `username.github.io/learn-mech-interp`), configure Eleventy's `pathPrefix`
- Pagefind runs after Eleventy in the build step -- order matters

## Sources

- [Eleventy official docs](https://www.11ty.dev/docs/) -- version 3.1.2, release history, deployment guide (HIGH confidence)
- [Eleventy release history](https://www.11ty.dev/docs/versions/) -- confirmed v3.1.2 as latest stable (HIGH confidence)
- [KaTeX releases on GitHub](https://github.com/KaTeX/KaTeX/releases) -- confirmed v0.16.28 released 2026-01-25 (HIGH confidence)
- [KaTeX auto-render docs](https://katex.org/docs/autorender.html) -- CDN URLs and delimiter configuration (HIGH confidence)
- [Pagefind official docs](https://pagefind.app/docs/) -- confirmed v1.4.0, setup guide (HIGH confidence)
- [Pagefind npm](https://www.npmjs.com/package/pagefind) -- version verification (HIGH confidence)
- [markdown-it npm](https://www.npmjs.com/package/markdown-it) -- confirmed v14.1.0 (HIGH confidence)
- [markdown-it-anchor npm](https://www.npmjs.com/package/markdown-it-anchor) -- confirmed v9.2.0 (HIGH confidence)
- [@mdit/plugin-katex npm](https://www.npmjs.com/package/@mdit/plugin-katex) -- confirmed v0.23.1 (HIGH confidence)
- [highlight.js npm](https://www.npmjs.com/package/highlight.js) -- confirmed v11.11.1 (HIGH confidence)
- [CloudCannon: Eleventy vs Astro](https://cloudcannon.com/blog/eleventy-11ty-vs-astro/) -- comparison analysis (MEDIUM confidence)
- [CloudCannon: Top five SSGs 2025](https://cloudcannon.com/blog/the-top-five-static-site-generators-for-2025-and-when-to-use-them/) -- ecosystem overview (MEDIUM confidence)
- [Pagefind vs Lunr.js vs Fuse.js comparison](https://photogabble.co.uk/thoughts/static-site-search-providers/) -- search library comparison (MEDIUM confidence)
- [Tufte CSS](https://edwardtufte.github.io/tufte-css/) -- academic CSS framework (HIGH confidence)
- [Gwern.net sidenotes analysis](https://gwern.net/sidenote) -- sidenote implementation survey (MEDIUM confidence)
- [Distill.pub guide](https://distill.pub/guide/) -- Distill template documentation (HIGH confidence)
- [PubCSS on GitHub](https://github.com/thomaspark/pubcss) -- academic CSS alternative (MEDIUM confidence)
- [Eleventy + KaTeX integration](https://underlap.org/katex/) -- build-time math rendering pattern (MEDIUM confidence)
- [Prism.js vs highlight.js vs Shiki comparison](https://chsm.dev/blog/2025/01/08/shiki-code-highlighting) -- syntax highlighting comparison (MEDIUM confidence)
- [Eleventy GitHub Pages deployment](https://www.11ty.dev/docs/deployment/) -- official deployment docs (HIGH confidence)
- [Nunjucks macros for Eleventy components](https://www.webstoemp.com/blog/modular-code-nunjucks-eleventy/) -- templating patterns (MEDIUM confidence)

---
*Stack research for: Static educational website (Mechanistic Interpretability)*
*Researched: 2026-02-02*
