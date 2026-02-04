---
phase: 05-navigation-information-architecture
plan: 03
subsystem: article-navigation
tags: [breadcrumbs, toc, prev-next, difficulty-badges, prerequisites, markdown-it-anchor]
depends_on:
  requires: ["05-01", "05-02"]
  provides: ["article-breadcrumbs", "article-toc", "article-prev-next", "difficulty-badges", "prerequisite-indicators"]
  affects: ["05-04"]
tech_stack:
  added: ["markdown-it-anchor"]
  patterns: ["markdown-it-anchor for heading IDs at render time", "TOC from content filter", "learningPath collection for prev/next ordering"]
key_files:
  created: []
  modified: ["src/_includes/layouts/article.njk", "src/css/components.css", "eleventy.config.js", "package.json"]
decisions:
  - id: "05-03-01"
    description: "markdown-it-anchor with @sindresorhus/slugify for heading IDs at render time (required for TOC filter compatibility)"
  - id: "05-03-02"
    description: "TOC hidden on mobile, sticky sidebar at 1400px+ using CSS grid within article-content-wrapper"
  - id: "05-03-03"
    description: "Difficulty badge colors: green (#2e7d32 on #e8f5e9), orange (#e65100 on #fff3e0), red (#c62828 on #fce4ec)"
metrics:
  duration: "4min 22s"
  completed: "2026-02-04"
---

# Phase 5 Plan 3: Article Navigation Summary

Breadcrumbs, TOC, difficulty badges, enhanced prerequisites, and prev/next links added to article layout using learningPath data, eleventy-plugin-toc, and collection-based ordering.

## What Was Done

### Task 1: Article Layout with All Navigation Elements
- Rewrote `src/_includes/layouts/article.njk` to include:
  - **Breadcrumbs:** Home > Block Title > Current Article using `eleventyNavigation.parent` to look up block title from `learningPath.json`
  - **Difficulty badge:** Color-coded `foundational`/`intermediate`/`advanced` from front matter
  - **Enhanced prerequisites:** "Read first:" label with linked article titles (replaces old "Prerequisites:" text)
  - **Table of contents:** Auto-generated from h2/h3 headings via `eleventy-plugin-toc` filter
  - **Prev/next navigation:** Uses `getPreviousCollectionItem`/`getNextCollectionItem` filters on `learningPath` collection

### Task 2: CSS for All Navigation Components
- Added CSS sections to `src/css/components.css`:
  - Breadcrumbs with `>` separator, muted colors, current page emphasis
  - Difficulty badges with Material Design-inspired color palette
  - Prerequisites label styling (bold, secondary color)
  - TOC: hidden on mobile, sticky sidebar at 1400px+ via 2-column CSS grid
  - Prev/next navigation cards with border hover effect, stacked on mobile
  - Responsive adjustments for breadcrumbs and nav at 768px+

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added markdown-it-anchor for heading IDs at render time**
- **Found during:** Task 1 verification
- **Issue:** The `toc` filter from eleventy-plugin-toc runs during template rendering, but `IdAttributePlugin` adds heading IDs as a post-processing HTML transform. This meant `content | toc` received headings without `id` attributes, producing an empty TOC.
- **Fix:** Installed `markdown-it-anchor` and added it to the markdown-it plugin chain with `@sindresorhus/slugify` to match Eleventy's native slug format. Heading IDs are now present in `content` at template render time, making the TOC filter work correctly.
- **Files modified:** `eleventy.config.js`, `package.json`, `package-lock.json`
- **Commit:** `87d5cc1`

**2. [Rule 1 - Bug] Reordered article-body and article-toc in template**
- **Found during:** Task 1 implementation
- **Issue:** Plan specified TOC before article-body in the content wrapper, but at 1400px+ the CSS grid places them side-by-side with the article-body as the main column and TOC as the sidebar. Placing article-body first ensures correct source order for accessibility and mobile (where TOC is hidden).
- **Fix:** Put `article-body` first, `article-toc` second in the HTML. The CSS grid at 1400px+ handles visual positioning.
- **Files modified:** `src/_includes/layouts/article.njk`
- **Commit:** `87d5cc1`

## Verification Results

| Check | Result |
|-------|--------|
| Build succeeds | Pass |
| Attention mechanism breadcrumbs: "Home > Transformer Foundations" | Pass |
| Superposition breadcrumbs: "Home > Superposition & Feature Extraction" | Pass |
| Activation patching breadcrumbs: "Home > Observation to Causation" | Pass |
| Attention mechanism difficulty: "Foundational" (green) | Pass |
| Superposition difficulty: "Intermediate" (orange) | Pass |
| Activation patching difficulty: "Advanced" (red) | Pass |
| Superposition "Read first:" with attention-mechanism link | Pass |
| Activation patching "Read first:" with attention-mechanism link | Pass |
| Attention mechanism: no prerequisites section (empty array) | Pass |
| TOC contains h2/h3 headings with correct anchor links | Pass |
| Prev/next order: Attention -> Superposition -> Activation Patching | Pass |
| Attention has only "Next" (Superposition) | Pass |
| Superposition has "Previous" (Attention) + "Next" (Activation Patching) | Pass |
| Activation patching has only "Previous" (Superposition) | Pass |
| No regressions: KaTeX (65 refs), citations (3), sidenotes (4) | Pass |

## Commits

| Hash | Message |
|------|---------|
| `87d5cc1` | feat(05-03): add breadcrumbs, TOC, difficulty badge, prerequisites, and prev/next to article layout |
| `c22b75c` | feat(05-03): add CSS for breadcrumbs, TOC, difficulty badges, prev/next navigation |

## Next Phase Readiness

Plan 05-04 (Homepage) can proceed. All article navigation elements are in place. The `learningPath` collection and data are fully functional for any homepage visualization that needs to reference the learning path structure.
