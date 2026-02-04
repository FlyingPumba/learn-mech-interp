# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-02)

**Core value:** People can learn Mechanistic Interpretability through well-structured, readable articles that build from foundations to frontier research, with easy navigation between topics and direct links to source papers.
**Current focus:** Phase 3 in progress - Content Rendering Engine

## Current Position

Phase: 3 of 7 (Content Rendering Engine)
Plan: 1 of 2 in current phase
Status: In progress
Last activity: 2026-02-03 - Completed 03-01-PLAN.md (Math, Code, Figures)

Progress: [=====.....] ~43%

## Performance Metrics

**Velocity:**
- Total plans completed: 6
- Average duration: 4min
- Total execution time: 0.38 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-deployment | 2 | 3min 28s | 1min 44s |
| 02-template-system-and-design | 3 | 23min | ~8min |
| 03-content-rendering-engine | 1 | 2min 38s | 2min 38s |

**Recent Trend:**
- Last 5 plans: 02-01 (3min), 02-02 (~5min), 02-03 (~15min), 03-01 (2min 38s)
- Trend: Plugin installation plans are fast; design/polish plans take longer

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

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 4 is highest risk: Typst-to-article conversion is editorial work that may take 2-4x expected time per research findings
- Requirements doc claims 41 requirements but actual count is 46; traceability table corrected during roadmap creation

## Session Continuity

Last session: 2026-02-03
Stopped at: Completed 03-01-PLAN.md - Math, Code, Figures
Resume file: None

## Phase 3 Progress

Content Rendering Engine phase in progress:
- [x] 03-01: Math, Code, Figures (KaTeX + PrismJS + figure plugin)
- [ ] 03-02: Citations, Margin Notes, Collapsible Prompts

Key artifacts created so far:
- eleventy.config.js - Updated with markdown-it plugins and syntax highlight plugin
- src/css/katex-overrides.css - Mobile overflow fixes for math
- src/css/prism-theme.css - Academic-light code theme
- src/_includes/layouts/base.njk - Updated with KaTeX CDN + custom CSS links
- src/topics/test/index.md - Content rendering demo article
