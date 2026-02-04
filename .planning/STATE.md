# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-02)

**Core value:** People can learn Mechanistic Interpretability through well-structured, readable articles that build from foundations to frontier research, with easy navigation between topics and direct links to source papers.
**Current focus:** Phase 5 in progress - Navigation & Information Architecture

## Current Position

Phase: 5 of 7 (Navigation & Information Architecture)
Plan: 3 of 4 in current phase
Status: In progress
Last activity: 2026-02-04 - Completed 05-03-PLAN.md (Article navigation: breadcrumbs, TOC, prev/next, difficulty badge, prerequisites)

Progress: [=========.] ~95%

## Performance Metrics

**Velocity:**
- Total plans completed: 13
- Average duration: ~3min 27s
- Total execution time: ~0.75 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-deployment | 2 | 3min 28s | 1min 44s |
| 02-template-system-and-design | 3 | 23min | ~8min |
| 03-content-rendering-engine | 2 | 5min 48s | ~3min |
| 04-content-authoring-pilot-articles | 3 | 11min 44s | ~3min 55s |
| 05-navigation-information-architecture | 3 | 7min 51s | 2min 37s |

**Recent Trend:**
- Last 5 plans: 04-03 (4min 39s), 05-01 (1min 37s), 05-02 (1min 52s), 05-03 (4min 22s)
- Trend: 05-03 took longer due to TOC heading ID compatibility issue (markdown-it-anchor fix)

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: 7 phases derived from 46 v1 requirements, foundation-first approach per research recommendations
- [Roadmap]: Content authoring phase (Phase 4) deliberately placed after rendering engine (Phase 3) so pilot articles can validate all content types
- [01-01]: Use EleventyHtmlBasePlugin with plain absolute URLs instead of url filter to avoid double pathPrefix
- [01-01]: Directory data files (topics.11tydata.js) for layout/permalink inheritance pattern established
- [01-02]: Use official GitHub Pages actions at v4+ (older versions deprecated)
- [01-02]: Node.js 20 with npm caching for faster CI builds
- [02-01]: 42 CSS custom properties for complete theming control (dark mode, accessibility ready)
- [02-01]: System font stacks for zero web font cost
- [02-01]: 65ch content width based on 60-75 char optimal reading research
- [02-02]: Partials directory for shared components (header.njk, footer.njk)
- [02-02]: Layout chaining: article.njk extends base.njk for DRY structure
- [02-02]: Article title rendered by layout, not content files
- [02-03]: Cool blue accent (#004276) from Distill.pub
- [02-03]: Sans-serif typography throughout (modern direction)
- [02-03]: Light theme only, compact header/footer heights
- [02-03]: Hero section pattern for landing pages
- [03-01]: KaTeX CSS from CDN (jsdelivr v0.16.28), not bundled locally
- [03-01]: Custom Prism theme using site CSS variables for academic aesthetic
- [03-01]: htmlAndMathml KaTeX output for visual rendering + screen reader accessibility
- [03-01]: markdown-it plugin chain via setLibrary, Eleventy plugins via addPlugin
- [03-02]: Per-page citation numbering (restart at [1] per article) matching academic convention
- [03-02]: Float+negative-margin for sidenotes within existing grid (simpler than grid-column: 3)
- [03-02]: CSS-only tooltips with focus-within for mobile accessibility (no JavaScript)
- [03-02]: Module-scope counters reset via eleventy.before event for --serve mode
- [04-01]: Blockquote format for definitions (no custom shortcode needed)
- [04-01]: 11 entries in references.json (conmy2023ioi pre-existed from Phase 3)
- [04-01]: Sidenotes for supplementary context in articles (low-rank bottleneck, causal masking, etc.)
- [04-02]: Manual "Figure N:" prefix in captions (consistent pattern across articles)
- [04-02]: Olah et al. (2020) citation for polysemanticity evidence in superposition article
- [04-03]: Superposition cross-link placed in Attribution Patching section (polysemanticity context)
- [04-03]: Two pause-and-think prompts per article (adapted second from source exercise)
- [05-01]: page.fileSlug as eleventyNavigation key (stable, avoids special character issues)
- [05-01]: learningPath collection filters by learningPath.json slugs (test article excluded)
- [05-01]: IdAttributePlugin registered before TOC plugin (TOC reads heading IDs)
- [05-02]: learningPath.json as sidebar data source (blocks are not pages, avoids navigation plugin parent key issue)
- [05-02]: Page-level grid at 1200px+, article-level grid remains at 1400px+ (independent grids)
- [05-02]: Progressive enhancement for hamburger (hidden by default, JS removes hidden on load)
- [05-03]: markdown-it-anchor with @sindresorhus/slugify for heading IDs at render time (TOC filter compatibility)
- [05-03]: TOC hidden on mobile, sticky sidebar at 1400px+ using CSS grid within article-content-wrapper
- [05-03]: Difficulty badge colors: green (foundational), orange (intermediate), red (advanced)

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 4 complete: All 3 pilot articles validated. Cross-article linking works end-to-end. All 6 content types confirmed working across articles.
- Requirements doc claims 41 requirements but actual count is 46; traceability table corrected during roadmap creation

## Session Continuity

Last session: 2026-02-04
Stopped at: Completed 05-03-PLAN.md - Article navigation: breadcrumbs, TOC, prev/next, difficulty badge, prerequisites
Resume file: None

## Phase 5 Progress

Navigation & Information Architecture phase IN PROGRESS:
- [x] 05-01: Foundation: plugins, data, collection (1min 37s)
- [x] 05-02: Sidebar navigation, mobile hamburger toggle, page layout restructuring (1min 52s)
- [x] 05-03: Article navigation: breadcrumbs, TOC, prev/next, difficulty badge, prerequisites (4min 22s)
- [ ] 05-04: Homepage: learning path visualization, fix "start here" link

Key artifacts:
- package.json - @11ty/eleventy-navigation, eleventy-plugin-toc, markdown-it-anchor added
- eleventy.config.js - IdAttributePlugin, eleventyNavigationPlugin, pluginTOC, markdown-it-anchor registered; learningPath collection; src/js passthrough
- src/_data/learningPath.json - 3 blocks, 3 topics (canonical ordering)
- src/topics/topics.11tydata.js - eleventyComputed with eleventyNavigation metadata
- src/_includes/partials/sidebar.njk - Topic hierarchy sidebar from learningPath data
- src/_includes/layouts/base.njk - Page-level grid layout with sidebar + main
- src/_includes/layouts/article.njk - Breadcrumbs, difficulty badge, prerequisites, TOC, prev/next navigation
- src/css/components.css - Breadcrumbs, difficulty badges, TOC, prev/next CSS
- src/js/sidebar-toggle.js - Accessible hamburger toggle with ARIA management
