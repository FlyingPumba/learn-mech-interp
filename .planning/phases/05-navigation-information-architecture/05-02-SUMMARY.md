---
phase: 05-navigation-information-architecture
plan: 02
subsystem: navigation
tags: [sidebar, hamburger-toggle, page-grid, aria, mobile-navigation, progressive-enhancement]
dependency_graph:
  requires: [05-01]
  provides: [sidebar-navigation, mobile-hamburger-toggle, page-level-grid]
  affects: [05-03, 05-04]
tech_stack:
  added: []
  patterns: [progressive-enhancement, sticky-positioning, css-grid-page-layout, aria-expanded-toggle]
file_tracking:
  key_files:
    created:
      - src/_includes/partials/sidebar.njk
      - src/js/sidebar-toggle.js
    modified:
      - src/_includes/partials/header.njk
      - src/_includes/layouts/base.njk
      - src/css/layout.css
      - src/css/components.css
      - eleventy.config.js
decisions:
  - id: sidebar-data-source
    decision: "Use learningPath.json directly instead of eleventyNavigation filter for sidebar hierarchy"
    reason: "Blocks are not pages, so navigation plugin tree would require parent key pages; learningPath.json provides the hierarchy without that overhead"
  - id: page-grid-breakpoint
    decision: "Page-level grid at 1200px+, article-level grid remains at 1400px+"
    reason: "Independent grids -- page grid (sidebar + main) wraps article grid (content + sidenotes) without conflict"
  - id: progressive-enhancement
    decision: "Hamburger button hidden by default, JS removes hidden attribute on load"
    reason: "Users without JS see no broken toggle button; sidebar content is accessible in HTML regardless"
metrics:
  duration: "1min 52s"
  completed: "2026-02-04"
---

# Phase 5 Plan 2: Sidebar Navigation, Mobile Hamburger Toggle, Page Layout Summary

Sidebar navigation showing topic hierarchy grouped by block, hamburger toggle for mobile with ARIA state management, and page-level CSS Grid restructuring for sidebar + main content layout.

## What Was Done

### Task 1: Sidebar partial, hamburger toggle, base layout restructuring (1910970)

Created `src/_includes/partials/sidebar.njk` that renders the full topic hierarchy from `learningPath.json` global data. Each block (Transformer Foundations, Superposition & Feature Extraction, Observation to Causation) gets a section heading with its topics listed as links. The current page is highlighted via `aria-current="page"` using `page.fileSlug` matching.

Updated `src/_includes/partials/header.njk` to add a hamburger toggle button with `aria-expanded="false"`, `aria-controls="sidebar"`, and `hidden` attribute for progressive enhancement.

Restructured `src/_includes/layouts/base.njk` to wrap sidebar and main content in a `.page-layout` div for CSS Grid on desktop. Added `<script src="/js/sidebar-toggle.js">` before closing body tag.

Created `src/js/sidebar-toggle.js` (~15 lines) with accessible toggle logic: removes `hidden` on load, toggles `aria-expanded` and `sidebar-open` class on click, and closes sidebar when clicking outside on mobile.

Added `src/js` passthrough copy to `eleventy.config.js`.

### Task 2: CSS for sidebar layout, mobile hamburger, and page grid (5c8f4c3)

Added page-level grid (`grid-template-columns: 240px 1fr`) at 1200px+ to `layout.css`, independent of the existing 1400px+ article grid for sidenotes.

Added sidebar styles to `components.css`: sticky inner container, uppercase "Topics" heading, block groupings with titles, topic links with hover and active states. Active page gets blue background highlight via `.sidebar-active` and `[aria-current="page"]`.

Added hamburger icon styles using CSS pseudo-elements (three horizontal lines). Button hidden on desktop via `display: none`, shown below 1200px.

Added mobile sidebar: fixed positioning, full-height, slides in from left with `transform: translateX(-100%)` and transitions to `translateX(0)` when `.sidebar-open` class is applied.

## Decisions Made

1. **learningPath.json as sidebar data source** -- Used `learningPath` global data directly instead of `eleventyNavigation` filter. Blocks are not pages, so the navigation plugin would require parent key pages for them. The navigation plugin is still available for breadcrumbs in Plan 03.

2. **Page-level grid at 1200px+** -- The page grid (sidebar + main) and article grid (content + sidenotes at 1400px+) are independent. The article grid operates within the `main` column of the page grid without conflict.

3. **Progressive enhancement for hamburger** -- Button has `hidden` attribute in HTML, removed by JS on load. Users without JavaScript see the sidebar content in the HTML flow without a broken toggle button.

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

- Eleventy builds without errors (5 pages, 16 files copied)
- 3 sidebar blocks with 3 topics rendered in built HTML
- `aria-current="page"` present on correct topic page
- Hamburger button with `aria-expanded="false"` and `hidden` in header
- `sidebar-toggle.js` present in `_site/js/`
- Page-level grid at 1200px+ with `240px 1fr` columns
- Mobile sidebar off-screen by default (`translateX(-100%)`)
- 1400px+ article sidenote grid unchanged

## Next Phase Readiness

Plan 05-03 (Article navigation) can proceed. The sidebar and page layout are in place. Breadcrumbs will use the `eleventyNavigation` plugin (registered in 05-01). TOC will use the `pluginTOC` filter (also from 05-01). Prev/next links will use the `learningPath` collection.
