---
phase: 03-content-rendering-engine
plan: 02
subsystem: content-rendering
tags: [citations, sidenotes, margin-notes, tufte-css, tooltips, details-summary, shortcodes]

# Dependency graph
requires:
  - phase: 03-content-rendering-engine-01
    provides: "markdown-it instance with KaTeX/figure plugins, syntax highlight plugin, base layout with CSS links"
provides:
  - "Numbered inline citations with hover tooltips from JSON reference data"
  - "Tufte-style sidenotes/margin notes with CSS-only responsive collapse"
  - "Collapsible pause-and-think prompts via native details/summary"
  - "Per-page shortcode counters with build-reset via eleventy.before event"
  - "references.json with 5 MI paper citations"
affects:
  - 04-content-authoring (pilot articles will use citations, sidenotes, and collapsible prompts)
  - 05-navigation (articles now have all content types for TOC and navigation testing)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Eleventy shortcodes (addShortcode) for cite, sidenote, marginnote"
    - "CSS-only checkbox hack for responsive sidenote collapse (Tufte CSS pattern)"
    - "CSS hover/focus tooltips for citation details"
    - "eleventy.before event for counter reset between builds"
    - "this.ctx.references for accessing _data/references.json in shortcodes"

key-files:
  created:
    - "src/_data/references.json"
  modified:
    - "eleventy.config.js"
    - "src/css/components.css"
    - "src/css/layout.css"
    - "src/topics/test/index.md"

key-decisions:
  - "Per-page citation numbering (restart at [1] per article) matching academic convention"
  - "Float+negative-margin approach for sidenotes within existing grid (simpler than grid-column: 3)"
  - "CSS-only tooltips with focus-within for mobile accessibility (no JavaScript)"
  - "Module-scope counters reset via eleventy.before event to prevent stale values in --serve mode"

patterns-established:
  - "Shortcode pattern: addShortcode with this.page.url for per-page state"
  - "Data access pattern: this.ctx.references for _data/*.json in shortcodes"
  - "Responsive collapse pattern: checkbox hack with display:none/block toggle"
  - "Collapsible content: native details/summary with .pause-and-think class"

# Metrics
duration: 3min
completed: 2026-02-03
---

# Phase 3 Plan 2: Citations, Margin Notes, and Collapsible Prompts Summary

**Numbered inline citations with hover tooltips, Tufte-style CSS-only sidenotes/margin notes, and native details/summary collapsible prompts -- all zero client-side JavaScript**

## Performance

- **Duration:** 3min 10s
- **Started:** 2026-02-04T02:24:10Z
- **Completed:** 2026-02-04T02:27:20Z
- **Tasks:** 3/3
- **Files modified:** 5

## Accomplishments

- Three new Eleventy shortcodes (cite, sidenote, marginnote) produce semantic HTML with proper ARIA roles
- Citations render as numbered [N] links with dark tooltip showing paper title, authors, venue, and year on hover; mobile falls back to tap-to-expand via focus-within
- Sidenotes float into right margin at 1400px+ using negative margins; collapse to checkbox-toggle expandable blocks below 1400px
- Collapsible "pause and think" blocks use native details/summary with styled appearance
- Test article now demonstrates all six content types (math, code, figures, citations, sidenotes, collapsibles) in a single page

## Task Commits

Each task was committed atomically:

1. **Task 1: Create citation data and add cite shortcode** - `7d2a3bf` (feat)
2. **Task 2: Add sidenote/marginnote shortcodes and all CSS** - `91421a0` (feat)
3. **Task 3: Update test article with citations, sidenotes, and collapsible prompts** - `e8683a9` (feat)

## Files Created/Modified

- `src/_data/references.json` - 5 MI paper citations (elhage2022toy, olsson2022context, elhage2021mathematical, bricken2023monosemanticity, conmy2023ioi)
- `eleventy.config.js` - Added cite, sidenote, marginnote shortcodes with per-page counters and eleventy.before reset
- `src/css/components.css` - Citation tooltip styles, sidenote/marginnote Tufte CSS, details/summary collapsible styles
- `src/css/layout.css` - Updated 1400px+ breakpoint with sidenote margin positioning and article-body overflow:visible
- `src/topics/test/index.md` - Extended with 3 citations, 2 sidenotes, 1 margin note, 2 pause-and-think prompts

## Decisions Made

- **Per-page citation numbering:** Citations restart at [1] for each article, matching academic paper convention and avoiding cross-article coupling.
- **Float+negative-margin for sidenotes:** Used the float-based approach rather than CSS grid-column: 3 for sidenotes. Since sidenotes are inline elements within article-body (grid-column: 2), the negative margin pulls them into the right margin space. This is simpler and works within the existing grid.
- **CSS-only tooltips:** No JavaScript needed for citation hover/focus behavior. Used `focus-within` for keyboard and mobile accessibility.
- **Module-scope counters with build reset:** Counter variables declared at module scope and reset via `eleventy.before` event to prevent stale values during `--serve` incremental builds.

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered

None -- all shortcodes registered and CSS rendered without issues.

## User Setup Required

None -- no external service configuration required.

## Next Phase Readiness

- Content rendering engine is complete: all six content types (math, code, figures, citations, sidenotes, collapsibles) work together
- Test article validates all content types in a single page
- Phase 4 (Content Authoring) can now convert Typst slides using the full content type palette
- references.json can be extended with additional papers as pilot articles are written
- All rendering is build-time with zero client-side JavaScript

---
*Phase: 03-content-rendering-engine*
*Completed: 2026-02-03*
