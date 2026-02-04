---
phase: 05-navigation-information-architecture
plan: 04
subsystem: homepage-learning-path
tags: [homepage, learning-path, hero-link, learningPath-data]
depends_on:
  requires: ["05-03"]
  provides: ["homepage-learning-path", "corrected-hero-link"]
  affects: []
tech_stack:
  added: []
  patterns: ["learningPath.json global data iterated in Nunjucks template for homepage visualization"]
key_files:
  created: []
  modified: ["src/index.njk", "src/css/components.css"]
decisions:
  - id: "05-04-01"
    description: "learningPath.blocks[0].topics[0] used to dynamically resolve first article for 'Start Learning' button"
metrics:
  duration: "1min 29s"
  completed: "2026-02-04"
---

# Phase 5 Plan 4: Homepage Learning Path Summary

Homepage updated with corrected "Start Learning" hero link (attention-mechanism instead of test article) and a learning path visualization showing all 3 blocks with their topics in reading order from learningPath.json.

## What Was Done

### Task 1: Homepage with Learning Path and Corrected Hero Link
- Rewrote `src/index.njk` to:
  - **Fix hero link:** "Start Learning" button now dynamically resolves to the first topic in `learningPath.blocks[0].topics[0]` (attention-mechanism) instead of the hardcoded `/topics/test/`
  - **Add learning path section:** Between hero and feature cards, shows numbered blocks with linked topic titles
  - **Preserve feature cards:** Existing "Structured Learning", "Research-Based", and "Build Intuition" cards unchanged

### Task 2: Learning Path CSS
- Added learning path styles to `src/css/components.css`:
  - Numbered block cards with blue circular indicators (uses `--color-link`)
  - Indented topic links within each block
  - Connecting line between blocks suggesting reading progression
  - Hover effect on block cards (border-color transition)
  - Responsive padding adjustment at 768px+
  - All styles use existing design tokens (`--color-link`, `--radius-lg`, `--spacing-*`, etc.)

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

| Check | Result |
|-------|--------|
| Build succeeds | Pass |
| Hero "Start Learning" links to /topics/attention-mechanism/ | Pass |
| No /topics/test/ link on homepage | Pass |
| "Learning Path" heading present | Pass |
| 3 numbered blocks rendered | Pass |
| attention-mechanism topic linked | Pass |
| superposition topic linked | Pass |
| activation-patching topic linked | Pass |
| Feature cards section preserved | Pass |
| CSS contains .learning-path-block, .learning-path-topic, .learning-path-block-number | Pass |

## Commits

| Hash | Message |
|------|---------|
| `2582f60` | feat(05-04): update homepage with learning path and corrected hero link |
| `58b7c8c` | style(05-04): add learning path visualization CSS |

## Next Phase Readiness

Phase 5 is now complete. All 4 plans executed:
- 05-01: Foundation (plugins, data, collection)
- 05-02: Sidebar navigation and mobile hamburger
- 05-03: Article navigation (breadcrumbs, TOC, prev/next, badges)
- 05-04: Homepage learning path and corrected hero link

Phase 6 (Search & Glossary) can proceed. The site now has full navigation: sidebar, homepage learning path, breadcrumbs, TOC, prev/next links, and difficulty indicators.
