# Phase 7 Plan 02: Toggle + Template Wiring Summary

Dark mode toggle button in header, FOUC prevention inline script, skip-to-content accessibility link, reading time Eleventy filter displayed on every article page.

## Tasks Completed

| Task | Name | Commit | Duration |
|------|------|--------|----------|
| 1 | Create theme toggle JS, FOUC script, skip-link, toggle button | bf29ec7 | ~2min |
| 2 | Add reading time Eleventy filter and display in article template | 614a92f | ~1min |
| 3 | Human visual verification | -- | Approved by user |

## Changes Made

### Task 1: Theme toggle, FOUC, skip-link

**Created `src/js/theme-toggle.js`:**
- Two-state toggle (light/dark) respecting system preference before first interaction
- Reads/writes localStorage for persistence
- Updates `data-theme` attribute on `<html>` and swaps sun/moon icon

**Modified `src/_includes/layouts/base.njk`:**
- Inline FOUC prevention script in `<head>` before stylesheets (reads localStorage, sets `data-theme` immediately)
- Skip-to-content link as first child of `<body>`
- `<main id="main-content">` for skip-link target
- `theme-toggle.js` script tag before closing `</body>`

**Modified `src/_includes/partials/header.njk`:**
- Dark mode toggle button with sun/moon SVG icons between nav links and hamburger

**Modified `src/css/components.css`:**
- `.theme-toggle` styles: flex button with border, hover state, transition

### Task 2: Reading time filter

**Modified `eleventy.config.js`:**
- `readingTime` filter: strips HTML, counts words at 230 WPM (technical content rate), returns "N min read"

**Modified `src/_includes/layouts/article.njk`:**
- Reading time display in article header between description and prerequisites

## Deviations from Plan

None -- plan executed exactly as written.

## Decisions Made

- 230 WPM rate for technical/mathematical content (slightly below 238 general prose standard)
- Sun icon shown in dark mode (indicates clicking switches to light), moon in light mode
- Initial HTML default: sun visible (matches most common light mode visitors)

## Verification Results

- User visual approval: dark mode toggle, FOUC prevention, skip-link, reading time, code blocks, math, badges all verified
- Full Eleventy build: zero errors

## Key Files

### Created
- `src/js/theme-toggle.js` -- Dark mode toggle logic with localStorage persistence

### Modified
- `src/_includes/layouts/base.njk` -- FOUC script, skip-link, main-content ID, theme-toggle script
- `src/_includes/layouts/article.njk` -- Reading time display
- `src/_includes/partials/header.njk` -- Toggle button with SVG icons
- `src/css/components.css` -- Theme toggle button styles
- `eleventy.config.js` -- readingTime filter

## Metrics

- **Completed:** 2026-02-04
- **Tasks:** 2/2 (+ human verification)
- **Files created:** 1
- **Files modified:** 5
