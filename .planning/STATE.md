# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-02)

**Core value:** People can learn Mechanistic Interpretability through well-structured, readable articles that build from foundations to frontier research, with easy navigation between topics and direct links to source papers.
**Current focus:** Phase 5.1 - Bulk Content Migration (shared data files complete, article authoring next)

## Current Position

Phase: 5.1 of 7 (Bulk Content Migration)
Plan: 7 of 12 in current phase
Status: In progress
Last activity: 2026-02-04 - Completed 05.1-07-PLAN.md (Block 4 Part 2: Scaling and SAE Variants)

Progress: [=========.] ~95%

## Performance Metrics

**Velocity:**
- Total plans completed: 18
- Average duration: ~3min 22s
- Total execution time: ~1.01 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-deployment | 2 | 3min 28s | 1min 44s |
| 02-template-system-and-design | 3 | 23min | ~8min |
| 03-content-rendering-engine | 2 | 5min 48s | ~3min |
| 04-content-authoring-pilot-articles | 3 | 11min 44s | ~3min 55s |
| 05-navigation-information-architecture | 4 | 9min 20s | 2min 20s |
| 05.1-bulk-content-migration | 4 | 15min 32s | 3min 53s |

**Recent Trend:**
- Last 5 plans: 05.1-01 (2min 43s), 05.1-04 (4min 30s), 05.1-06 (3min 50s), 05.1-07 (4min 29s)
- Trend: Article authoring plans average ~3-4 minutes

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
- [05-03]: TOC hidden on mobile, sticky at 1400px+
- [05-03]: Difficulty badge colors: green/orange/red
- [05-04]: learningPath.blocks[0].topics[0] used to dynamically resolve first article for hero "Start Learning" button
- [05.1-01]: references.json expanded to 44 entries (11 existing + 33 new) for all 35 articles
- [05.1-01]: learningPath.json expanded to 8 blocks, 35 topics in reading order
- [05.1-06]: Superposition pilot confirmed complete -- only added forward cross-link to sparse-autoencoders
- [05.1-06]: SAE article structured as problem-solution arc: dictionary learning framing, architecture, training, results
- [05.1-06]: sae-interpretability separated from sparse-autoencoders for narrative focus
- [05.1-02]: attention-mechanism pilot confirmed complete against Week 1 Typst (no expansion needed)
- [05.1-02]: Em dashes replaced with colons/commas/parentheses throughout pilot article
- [05.1-04]: DLA article structured as: key insight -> decomposition -> per-token attribution -> attention patterns -> limitation
- [05.1-04]: Attention pattern figures placed in logit-lens article (pairs with observational tools discussion and real GPT-2 data)
- [05.1-04]: Both articles end with explicit forward-links to activation-patching establishing observation-to-causation transition

### Pending Todos

None yet.

### Roadmap Evolution

- Phase 5.1 inserted after Phase 5: Bulk Content Migration -- convert all remaining Typst course content into thematic articles (INSERTED)
  - Reason: Roadmap overview mentioned "migrates all course content" but no corresponding phase existed. Phase 4 only validated the workflow with 3 simplified pilot articles; all 16 weeks need complete conversion.
  - Source: /Users/ivan/latex/mech-interp-course (16 weeks, 6 blocks, 27+ diagrams, 60+ papers)
  - Research to leverage: /Users/ivan/latex/mech-interp-course/.planning/phases/*/*-RESEARCH.md (domain content only)

### Blockers/Concerns

- Phase 5 complete: Full navigation in place (sidebar, homepage learning path, breadcrumbs, TOC, prev/next, difficulty badges, prerequisites)
- Requirements doc claims 41 requirements but actual count is 46; traceability table corrected during roadmap creation

## Session Continuity

Last session: 2026-02-04
Stopped at: Completed 05.1-04-PLAN.md - Block 2 Part 2: DLA and Probing
Resume file: None

## Phase 5 Progress

Navigation & Information Architecture phase COMPLETE:
- [x] 05-01: Foundation: plugins, data, collection (1min 37s)
- [x] 05-02: Sidebar navigation, mobile hamburger toggle, page layout restructuring (1min 52s)
- [x] 05-03: Article navigation: breadcrumbs, TOC, prev/next, difficulty badge, prerequisites (4min 22s)
- [x] 05-04: Homepage: learning path visualization, fix "start here" link (1min 29s)

## Phase 5.1 Progress

Bulk Content Migration - IN PROGRESS:
- [x] 05.1-01: Shared data files: references.json (44 entries) + learningPath.json (8 blocks, 35 topics) (2min 43s)
- [x] 05.1-02: Block 1 Transformer Foundations: review pilot + qk-ov-circuits + composition-and-virtual-heads (4min 35s)
- [ ] 05.1-03 through 05.1-05: Article authoring (blocks 2-3)
- [x] 05.1-06: Block 4 Part 1: Superposition review + sparse-autoencoders + sae-interpretability (3min 50s)
- [ ] 05.1-07 through 05.1-12: Article authoring (remaining 6 plans)

Key artifacts so far:
- src/_data/references.json - 44 citation entries covering all papers across 35 articles
- src/_data/learningPath.json - 8 blocks, 35 topics in correct reading order
- src/topics/qk-ov-circuits/index.md - QK/OV circuit decomposition with worked example
- src/topics/composition-and-virtual-heads/index.md - V/K/Q-composition, virtual heads, TransformerLens
- src/topics/sparse-autoencoders/index.md - SAE architecture, dictionary learning, Towards Monosemanticity
- src/topics/sae-interpretability/index.md - Feature dashboards and automated interpretability
