# Phase 6 Plan 01: Pagefind Search Integration Summary

Pagefind 1.4.0 integrated as Eleventy post-build step, generating a full-text search index across 36 article pages with scoped indexing via data-pagefind-body.

## Execution Details

| Field | Value |
|-------|-------|
| Phase | 06-search-and-glossary |
| Plan | 01 |
| Duration | 2min 2s |
| Completed | 2026-02-04 |

## Tasks Completed

| # | Task | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Install Pagefind and integrate into Eleventy build | 099c6df | package.json, eleventy.config.js, article.njk |
| 2 | Create search page, theme Pagefind UI, update header nav | fefa4e2 | src/search/index.njk, components.css, header.njk |

## What Was Built

### Pagefind Build Integration
- Installed `pagefind@1.4.0` as devDependency (7 new packages)
- Added `execSync` import and `eleventy.after` event handler to `eleventy.config.js`
- Pagefind CLI runs automatically after every Eleventy build
- Produces `_site/pagefind/` directory with UI assets, search index, and WASM module

### Scoped Indexing
- Added `data-pagefind-body` attribute to the `article-body` div in `article.njk`
- Only article body content is indexed (36 pages), excluding homepage, search page, header, footer, sidebar, and breadcrumbs
- Index covers 4,596 words across all articles

### Search Page
- Created `src/search/index.njk` with PagefindUI widget
- Uses `base.njk` layout (no article chrome/sidebar)
- `showSubResults: true` for sub-heading navigation within results
- `showImages: false` since article images are diagrams
- `baseUrl` hardcoded to `/learn-mech-interp/` (not transformed by EleventyHtmlBasePlugin)
- Asset paths (`/pagefind/pagefind-ui.js`, `/pagefind/pagefind-ui.css`) are plain absolute paths, auto-transformed by EleventyHtmlBasePlugin in built HTML

### Pagefind UI Theming
- 9 CSS custom properties mapping Pagefind variables to site design tokens
- `.search-page` container styled with consistent spacing and max-width
- Subtitle styled with secondary text color

### Header Navigation
- Added Glossary and Search links to `header.njk` nav
- Navigation now shows: Topics | Glossary | Search
- Glossary link intentionally added early (will 404 until Plan 02 completes)

## Verification Results

| Check | Result |
|-------|--------|
| Build completes without errors | Pass |
| `_site/pagefind/` contains pagefind-ui.js, pagefind-ui.css, index files | Pass |
| `_site/search/index.html` exists with PagefindUI constructor | Pass |
| Built HTML has transformed paths (e.g., `/learn-mech-interp/pagefind/pagefind-ui.js`) | Pass |
| `data-pagefind-body` present in built article HTML | Pass |
| Header navigation contains /search/ and /glossary/ links in built output | Pass |
| Pagefind CSS variables reference site design tokens | Pass |
| No regressions in KaTeX, citations, sidenotes | Pass |

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Pagefind as devDependency (not dependency) | Only needed at build time, not runtime |
| `execSync` with `stdio: "inherit"` | Prints Pagefind indexing stats to build output for debugging |
| `showSubResults: true` | Shows sub-headings within search results for easier navigation |
| Hardcoded `baseUrl` in JS | EleventyHtmlBasePlugin only transforms HTML attributes, not JS string literals |
| Glossary nav link added before glossary page exists | Avoids touching header.njk twice; temporary 404 acceptable |

## Deviations from Plan

None. Plan executed exactly as written.

## Files Created

- `src/search/index.njk` - Dedicated search page with Pagefind UI

## Files Modified

- `package.json` - Added pagefind devDependency
- `package-lock.json` - Updated lockfile
- `eleventy.config.js` - Added execSync import and eleventy.after Pagefind hook
- `src/_includes/layouts/article.njk` - Added data-pagefind-body attribute
- `src/css/components.css` - Added Pagefind UI theming CSS
- `src/_includes/partials/header.njk` - Added Glossary and Search nav links
