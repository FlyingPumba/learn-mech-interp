---
phase: 01-foundation-deployment
plan: 01
subsystem: infra
tags: [eleventy, nunjucks, static-site, github-pages]

# Dependency graph
requires: []
provides:
  - Eleventy 3.x build infrastructure with ESM configuration
  - Base Nunjucks layout for all pages
  - Thematic folder structure at /topics/ with directory data file
  - npm build/start scripts
affects: [02-deployment, 03-rendering, 04-content, 05-navigation, 06-search]

# Tech tracking
tech-stack:
  added: ["@11ty/eleventy@3.1.2", "EleventyHtmlBasePlugin"]
  patterns: ["directory data files for layout/permalink inheritance", "EleventyHtmlBasePlugin for pathPrefix handling"]

key-files:
  created:
    - eleventy.config.js
    - src/_includes/layouts/base.njk
    - src/index.njk
    - src/topics/topics.11tydata.js
    - src/topics/test/index.md
    - .gitignore
    - package.json
  modified: []

key-decisions:
  - "Use EleventyHtmlBasePlugin with plain absolute URLs instead of url filter to avoid double pathPrefix"
  - "Minimal inline styles in base layout (to be replaced in Phase 2)"

patterns-established:
  - "Directory data files: Use topics.11tydata.js to apply layout and permalink patterns to all content in a folder"
  - "PathPrefix handling: Use plain absolute URLs like /topics/test/ and let EleventyHtmlBasePlugin add the pathPrefix"
  - "ESM syntax: Use export default function(eleventyConfig) for Eleventy 3.x configuration"

# Metrics
duration: 2min 28s
completed: 2026-02-03
---

# Phase 1 Plan 1: Initialize Eleventy Project Summary

**Eleventy 3.x static site with ESM config, Nunjucks base layout, and thematic /topics/ folder structure using directory data files**

## Performance

- **Duration:** 2 min 28 sec
- **Started:** 2026-02-03T13:32:19Z
- **Completed:** 2026-02-03T13:34:47Z
- **Tasks:** 2
- **Files modified:** 7 created

## Accomplishments

- Eleventy 3.x project initialized with ESM syntax configuration
- Base Nunjucks layout with minimal inline styles for readable output
- Thematic folder structure at /topics/ with directory data file controlling permalinks
- Test article builds to /topics/test/ verifying the URL structure
- npm build and start scripts configured

## Task Commits

Each task was committed atomically:

1. **Task 1: Initialize Eleventy project with base configuration** - `bd3f8ee` (feat)
2. **Task 2: Create thematic folder structure with test article** - `41488f2` (feat)

## Files Created/Modified

- `package.json` - Node.js project with Eleventy dependency and build scripts
- `eleventy.config.js` - Eleventy configuration with ESM syntax, EleventyHtmlBasePlugin, and pathPrefix
- `src/_includes/layouts/base.njk` - Base HTML template with minimal inline styles
- `src/index.njk` - Homepage with link to test article
- `src/topics/topics.11tydata.js` - Directory data file for thematic URL structure
- `src/topics/test/index.md` - Test article content
- `.gitignore` - Excludes node_modules/, _site/, .DS_Store

## Decisions Made

1. **Use plain absolute URLs with EleventyHtmlBasePlugin** - The `url` filter combined with the plugin was doubling the pathPrefix. Using plain URLs like `/topics/test/` and letting the plugin handle pathPrefix transformation is the correct pattern.

2. **Minimal inline styles** - Kept styles inline in base.njk for Phase 1 simplicity. These will be extracted to CSS files in Phase 2 when proper styling is implemented.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed double pathPrefix in homepage link**
- **Found during:** Task 2 (thematic folder structure)
- **Issue:** Using `{{ '/topics/test/' | url }}` with EleventyHtmlBasePlugin caused double pathPrefix (`/learn-mech-interp/learn-mech-interp/topics/test/`)
- **Fix:** Changed to plain absolute URL `/topics/test/` and let the plugin handle pathPrefix transformation
- **Files modified:** src/index.njk
- **Verification:** Build output shows correct `/learn-mech-interp/topics/test/` URL
- **Committed in:** 41488f2 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Bug fix required for correct URL generation. No scope creep.

## Issues Encountered

None beyond the auto-fixed deviation.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Build infrastructure complete and verified
- Ready for Plan 01-02 (GitHub Actions deployment workflow)
- No blockers for subsequent plans

---
*Phase: 01-foundation-deployment*
*Completed: 2026-02-03*
