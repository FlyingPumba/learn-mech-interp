# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-02)

**Core value:** People can learn Mechanistic Interpretability through well-structured, readable articles that build from foundations to frontier research, with easy navigation between topics and direct links to source papers.
**Current focus:** Phase 4 complete - Content Authoring & Pilot Articles

## Current Position

Phase: 4 of 7 (Content Authoring & Pilot Articles)
Plan: 3 of 3 in current phase
Status: Phase complete
Last activity: 2026-02-04 - Completed 04-03-PLAN.md (Activation Patching and Causal Interventions)

Progress: [=========.] ~90%

## Performance Metrics

**Velocity:**
- Total plans completed: 10
- Average duration: ~4min
- Total execution time: ~0.65 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-deployment | 2 | 3min 28s | 1min 44s |
| 02-template-system-and-design | 3 | 23min | ~8min |
| 03-content-rendering-engine | 2 | 5min 48s | ~3min |
| 04-content-authoring-pilot-articles | 3 | 11min 44s | ~3min 55s |

**Recent Trend:**
- Last 5 plans: 03-02 (3min 10s), 04-01 (3min 45s), 04-02 (3min 20s), 04-03 (4min 39s)
- Trend: Multi-citation advanced article with 3 diagrams and cross-links completed in ~4min 39s

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

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 4 complete: All 3 pilot articles validated. Cross-article linking works end-to-end. All 6 content types confirmed working across articles.
- Requirements doc claims 41 requirements but actual count is 46; traceability table corrected during roadmap creation

## Session Continuity

Last session: 2026-02-04
Stopped at: Completed 04-03-PLAN.md - Activation Patching and Causal Interventions (Phase 4 complete)
Resume file: None

## Phase 4 Progress

Content Authoring & Pilot Articles phase COMPLETE:
- [x] 04-01: Infrastructure Prep and Attention Mechanism Article
- [x] 04-02: The Superposition Hypothesis (intermediate, 6 diagrams)
- [x] 04-03: Activation Patching and Causal Interventions (advanced, 3 diagrams)

Key artifacts:
- eleventy.config.js - Image passthrough added for topic images
- src/_includes/layouts/article.njk - Prerequisites rendering added
- src/_data/references.json - 11 entries covering all 3 pilot articles
- src/css/components.css - Prerequisites styling added
- src/topics/attention-mechanism/index.md - Complete pilot article (~2400 words, all 6 content types)
- src/topics/superposition/index.md - Complete pilot article (~3000 words, 6 diagrams, all 6 content types)
- src/topics/superposition/images/ - 6 PNG diagrams (phase diagram, geometry series)
- src/topics/activation-patching/index.md - Complete pilot article (~2750 words, 3 diagrams, 4 papers cited)
- src/topics/activation-patching/images/ - 3 PNG diagrams (setup, layers, heads)
