# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-02)

**Core value:** People can learn Mechanistic Interpretability through well-structured, readable articles that build from foundations to frontier research, with easy navigation between topics and direct links to source papers.
**Current focus:** Phase 5.1 - Bulk Content Migration (shared data files complete, article authoring next)

## Current Position

Phase: 5.1 of 7 (Bulk Content Migration)
Plan: 10 of 12 in current phase
Status: In progress
Last activity: 2026-02-04 - Completed 05.1-10-PLAN.md (Block 7 MI for Safety)

Progress: [=========.] ~95%

## Performance Metrics

**Velocity:**
- Total plans completed: 24
- Average duration: ~3min 43s
- Total execution time: ~1.49 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-deployment | 2 | 3min 28s | 1min 44s |
| 02-template-system-and-design | 3 | 23min | ~8min |
| 03-content-rendering-engine | 2 | 5min 48s | ~3min |
| 04-content-authoring-pilot-articles | 3 | 11min 44s | ~3min 55s |
| 05-navigation-information-architecture | 4 | 9min 20s | 2min 20s |
| 05.1-bulk-content-migration | 10 | 44min 55s | 4min 30s |

**Recent Trend:**
- Last 5 plans: 05.1-06 (3min 50s), 05.1-07 (4min 29s), 05.1-08 (5min 17s), 05.1-09 (7min 1s), 05.1-10 (6min)
- Trend: Article authoring plans average ~4-5 minutes

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
- [05.1-07]: Golden Gate Claude story given full section with feature clamping mechanism (not just a mention)
- [05.1-07]: SAE variants as evolution narrative (L1 -> Gated -> TopK -> JumpReLU), not a catalog
- [05.1-07]: Five SAE limitations covered: absorption, splitting, dead features, non-uniqueness, interpretability illusions
- [05.1-07]: Safety-relevant features framed as "promising directions, not accomplished facts"
- [05.1-05]: Kept attribution/path patching content in activation-patching pilot and added cross-links to new deep-dive article
- [05.1-05]: IOI circuit diagram placed in ioi-circuit/images/ but referenced from circuit-evaluation article (cross-article asset sharing)
- [05.1-05]: ioi-circuit scoped to core 4 head classes, circuit-evaluation covers remaining heads + evaluation framework
- [05.1-08]: Narrative arc: steering methods (ActAdd/CAA) -> framework (RepE) -> case study (refusal) -> erasure (LEACE) -> natural directions (function vectors)
- [05.1-08]: Dual-use framing throughout: every steering capability paired with its vulnerability implications
- [05.1-08]: Concept-erasure and function-vectors kept to 1,000-1,500 words as narrower topics
- [05.1-09]: Block narrative arc: tools (transcoders) -> methodology (tracing) -> comparison (crosscoders, universality) -> extension (multimodal)
- [05.1-09]: CKA/SVCCA integrated into universality article rather than a separate article
- [05.1-09]: Multimodal MI uses CLIP as deep example (closest parallel to text SAE work)
- [05.1-10]: Promise-then-limitation pairing: each safety application article pairs positive results with explicit caveats in the same article
- [05.1-10]: mi-safety-limitations organized as 6 numbered limitations for directness and clarity
- [05.1-10]: SAE failure for deception detection covered in deception-detection article (evidence), then referenced as general limitation in mi-safety-limitations (pattern)
- [05.1-03]: what-is-mech-interp prerequisite set to attention-mechanism (foundational entry into MI block)
- [05.1-03]: induction-heads prerequisite set to composition-and-virtual-heads (requires K-composition knowledge)
- [05.1-03]: AI safety motivation kept brief in what-is-mech-interp, deferring deeper treatment to Block 7

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
Stopped at: Completed 05.1-10-PLAN.md - Block 7 MI for Safety
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
- [x] 05.1-03: Block 2 Part 1: what-is-mech-interp + linear-representation-hypothesis + induction-heads (4min 46s)
- [x] 05.1-04: Block 2 Part 2: direct-logit-attribution + logit-lens-and-probing with 3 diagrams (4min 30s)
- [x] 05.1-05: Block 3 Observation to Causation: activation-patching review + attribution-patching + ioi-circuit + circuit-evaluation (6min 5s)
- [x] 05.1-06: Block 4 Part 1: Superposition review + sparse-autoencoders + sae-interpretability (3min 50s)
- [x] 05.1-07: Block 4 Part 2: scaling-monosemanticity + sae-variants-and-evaluation (4min 29s)
- [x] 05.1-08: Block 5 Representation Engineering: activation-engineering + representation-engineering + refusal-direction + concept-erasure + function-vectors (5min 17s)
- [x] 05.1-09: Block 6 Circuit Tracing & Comparative MI: transcoders + circuit-tracing + crosscoders-and-model-diffing + universality + multimodal-mi (7min 1s)
- [x] 05.1-10: Block 7 MI for Safety: sleeper-agent-detection + deception-detection + safety-mechanisms-and-monitoring + mi-safety-limitations (6min)
- [ ] 05.1-11 through 05.1-12: Article authoring (remaining 2 plans)

Key artifacts so far:
- src/_data/references.json - 44 citation entries covering all papers across 35 articles
- src/_data/learningPath.json - 8 blocks, 35 topics in correct reading order
- src/topics/qk-ov-circuits/index.md - QK/OV circuit decomposition with worked example
- src/topics/composition-and-virtual-heads/index.md - V/K/Q-composition, virtual heads, TransformerLens
- src/topics/what-is-mech-interp/index.md - Interpretability landscape, three claims, safety motivation
- src/topics/linear-representation-hypothesis/index.md - LRH, why linear, polysemanticity
- src/topics/induction-heads/index.md - Induction head discovery, two-step mechanism, phase change
- src/topics/direct-logit-attribution/index.md - DLA decomposition, per-token attribution, attention patterns
- src/topics/logit-lens-and-probing/index.md - Logit lens, tuned lens, probing, correlation-vs-causation
- src/topics/logit-lens-and-probing/images/ - 3 GPT-2 diagrams (attn patterns + logit lens)
- src/topics/sparse-autoencoders/index.md - SAE architecture, dictionary learning, Towards Monosemanticity
- src/topics/sae-interpretability/index.md - Feature dashboards and automated interpretability
- src/topics/attribution-patching/index.md - Attribution patching, path patching, ACDC
- src/topics/ioi-circuit/index.md - IOI task, discovery methodology, head classes, algorithm
- src/topics/ioi-circuit/images/ioi_circuit_diagram.png - IOI circuit diagram
- src/topics/circuit-evaluation/index.md - Evaluation criteria, causal scrubbing, limitations
- src/topics/scaling-monosemanticity/index.md - Golden Gate Claude, safety features, scaling laws
- src/topics/sae-variants-and-evaluation/index.md - Gated/TopK/JumpReLU SAEs, SAEBench, limitations
- src/topics/activation-engineering/index.md - ActAdd, CAA, steering methods with diagram
- src/topics/representation-engineering/index.md - RepE paradigm, LAT, representation control
- src/topics/refusal-direction/index.md - Refusal direction case study with 2 diagrams
- src/topics/concept-erasure/index.md - LEACE concept erasure
- src/topics/function-vectors/index.md - Function vectors, natural task directions
- src/topics/sleeper-agent-detection/index.md - Sleeper agent threat model, defection probes, trained-vs-natural caveat
- src/topics/deception-detection/index.md - Alignment faking, behavioral eval failure, SAE failure for deception
- src/topics/safety-mechanisms-and-monitoring/index.md - Refusal recap, model organisms, sabotage evals, monitoring
- src/topics/mi-safety-limitations/index.md - 6 honest limitations, the gap, Swiss cheese model
- src/topics/transcoders/index.md - Transcoder architecture, SAE comparison, clean factorization
- src/topics/circuit-tracing/index.md - Sparse feature circuits, attribution graphs, Biology paper case studies
- src/topics/crosscoders-and-model-diffing/index.md - Crosscoder model diffing, shared/exclusive features
- src/topics/universality/index.md - CKA, SVCCA, three dimensions of universality
- src/topics/multimodal-mi/index.md - CLIP, VLMs, diffusion model interpretability
