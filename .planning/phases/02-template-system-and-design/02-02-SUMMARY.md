---
phase: 02-template-system-and-design
plan: 02
subsystem: ui
tags: [nunjucks, eleventy, templates, partials, layout-chaining, semantic-html]

# Dependency graph
requires:
  - phase: 02-template-system-and-design
    provides: CSS design system with 42 custom properties and component styles
provides:
  - Three-layer template system (base -> article -> content)
  - Shared header/footer partials for DRY updates
  - Article layout with semantic HTML structure
  - Directory data file pattern for automatic layout assignment
affects: [03-rendering-engine, 04-content-authoring]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Nunjucks include for partials (header.njk, footer.njk)
    - Eleventy layout chaining (article.njk extends base.njk)
    - Directory data files for layout inheritance (topics.11tydata.js)
    - Semantic HTML5 structure (header > nav, main, footer, article > header)

key-files:
  created:
    - src/_includes/partials/header.njk
    - src/_includes/partials/footer.njk
    - src/_includes/layouts/article.njk
  modified:
    - src/_includes/layouts/base.njk
    - src/topics/topics.11tydata.js
    - src/topics/test/index.md
    - src/index.njk

key-decisions:
  - "Partials directory for shared components (header.njk, footer.njk)"
  - "Layout chaining: article.njk extends base.njk for DRY structure"
  - "Article title rendered by layout, not content files"

patterns-established:
  - "Partials via {% include \"partials/name.njk\" %}"
  - "Layout chaining via frontmatter layout: layouts/parent.njk"
  - "Content files only need front matter (title, description)"

# Metrics
duration: ~5min
completed: 2026-02-03
---

# Phase 2 Plan 2: Template Hierarchy Summary

**Three-layer Nunjucks template system with header/footer partials, article layout chaining to base, and semantic HTML structure for academic content**

## Performance

- **Duration:** ~5 min (includes human verification checkpoint)
- **Started:** 2026-02-03T21:00:00Z
- **Completed:** 2026-02-03T21:05:00Z
- **Tasks:** 3 (2 auto + 1 checkpoint)
- **Files modified:** 7

## Accomplishments
- Created header partial with site navigation (Learn MI logo, Topics link)
- Created footer partial with site branding
- Updated base.njk to include partials and link all 4 CSS files
- Built article layout extending base with semantic article structure
- Simplified content files to use layout-rendered titles
- Verified responsive design at 320px mobile and 1200px desktop

## Task Commits

Each task was committed atomically:

1. **Task 1: Create partials and update base layout** - `ad9dc32` (feat)
2. **Task 2: Create article layout and update content files** - `d66c0dc` (feat)
3. **Task 3: Human verification checkpoint** - approved

## Files Created/Modified
- `src/_includes/partials/header.njk` - Site header with nav, logo link, Topics link
- `src/_includes/partials/footer.njk` - Site footer with branding
- `src/_includes/layouts/base.njk` - HTML5 document with CSS links and partial includes
- `src/_includes/layouts/article.njk` - Article-specific layout extending base with semantic structure
- `src/topics/topics.11tydata.js` - Directory data assigning article layout to all topics
- `src/topics/test/index.md` - Simplified to front matter only (title rendered by layout)
- `src/index.njk` - Updated with container class and semantic structure

## Decisions Made
- **Partials in separate directory:** `src/_includes/partials/` for organization and clear separation from layouts
- **Layout chaining pattern:** article.njk declares `layout: layouts/base.njk` in frontmatter
- **Title rendering in layout:** Article titles rendered by article.njk, content files only provide front matter data
- **Semantic HTML structure:** article > header > h1, article > div.article-body for proper document outline

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Template system complete with partials and layout chaining
- Adding new articles requires only a Markdown file in /topics/ with title and description front matter
- Header/footer changes propagate to all pages automatically
- Ready for visual polish in 02-03-PLAN.md (navigation styling, typography refinement)
- Ready for Phase 3 rendering engine (math, code blocks, citations)

---
*Phase: 02-template-system-and-design*
*Completed: 2026-02-03*
