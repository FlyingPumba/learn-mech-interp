---
phase: 04-content-authoring-pilot-articles
plan: 03
subsystem: content
tags: [activation-patching, causal-interventions, pilot-article, editorial-conversion]
depends_on:
  requires: ["04-01"]
  provides: ["activation-patching-article", "cross-article-linking-validation"]
  affects: ["05-navigation", "06-full-conversion"]
tech-stack:
  added: []
  patterns: ["cross-article-concept-linking", "multi-citation-article", "advanced-methodology-article"]
key-files:
  created:
    - src/topics/activation-patching/index.md
    - src/topics/activation-patching/images/act_patch_setup.png
    - src/topics/activation-patching/images/act_patch_layers.png
    - src/topics/activation-patching/images/act_patch_heads.png
  modified: []
decisions:
  - id: "04-03-01"
    decision: "Added superposition cross-link in Attribution Patching section discussing polysemanticity"
    rationale: "Natural context for linking: neurons are polysemantic due to superposition, motivating need for attribution patching"
  - id: "04-03-02"
    decision: "Two pause-and-think prompts instead of one"
    rationale: "Added second prompt about designing patching experiments, adapted from source material's final exercise"
  - id: "04-03-03"
    decision: "Expanded bullet list formatting for layer results and clean/corrupted criteria"
    rationale: "Breaking dense paragraphs into structured lists improved readability and met min_lines requirement"
metrics:
  duration: "4min 39s"
  completed: "2026-02-04"
---

# Phase 4 Plan 3: Activation Patching and Causal Interventions Summary

**One-liner:** Advanced pilot article converting Week 6 Typst slides into ~2750 words of editorial prose covering activation patching, noising/denoising, attribution patching, and path patching, with 3 diagrams, 4 cited papers, and cross-article links to both other pilot articles.

## What Was Done

### Task 1: Copy diagrams and write the Activation Patching article
**Commit:** `91e3608`

Converted 800 lines of Week 6 Typst presentation slides into a complete long-form article at `src/topics/activation-patching/index.md`. Copied 3 PNG diagrams from course materials to `src/topics/activation-patching/images/`.

**Article structure (7 h2 sections):**
1. From Observation to Causation -- motivation for causal tools
2. The Clean/Corrupted Framework -- setup, IOI example, definition, choosing metrics
3. Noising vs. Denoising -- sufficiency/necessity, AND/OR gate analogy, backup Name Movers
4. A Worked Example: IOI in GPT-2 Small -- baseline, layer patching, head patching, interpretation
5. Attribution Patching -- gradient approximation, efficiency, when it works/breaks
6. Path Patching -- nodes to edges, ACDC algorithm
7. The Causal Toolkit -- summary of three levels

**Content types exercised:**
- Math: logit difference formula, gradient approximation, patching definition
- Figures: 3 with descriptive alt text and figure captions
- Citations: 7 instances across 4 papers (heimersheim2024patching, nanda2023attribution, wang2022ioi, conmy2023ioi)
- Sidenotes: 2 (Pearl's causal framework, historical development of patching)
- Pause-and-think: 2 collapsible prompts (redundant components, experiment design)
- Definition: blockquote definition of activation patching

**Cross-article linking validated:**
- 3 links to `/topics/attention-mechanism/` (residual stream, multi-head attention)
- 1 link to `/topics/superposition/` (polysemanticity context)

## Deviations from Plan

None -- plan executed as written. Minor formatting adjustments (breaking dense paragraphs into bullet lists) were made to meet the `min_lines: 180` artifact requirement while maintaining the target word count of ~2500 words.

## Decisions Made

| ID | Decision | Rationale |
|----|----------|-----------|
| 04-03-01 | Superposition cross-link placed in Attribution Patching section | Natural context: polysemantic neurons motivate attribution patching |
| 04-03-02 | Two pause-and-think prompts | Second prompt adapted from source material's final exercise |
| 04-03-03 | Expanded bullet formatting for layer results | Improved readability and met min_lines requirement |

## Verification Results

| Check | Result |
|-------|--------|
| `npx @11ty/eleventy` builds with zero errors | PASS |
| Article renders at /topics/activation-patching/ | PASS |
| ~2500 words of readable prose | PASS (2756 words) |
| 3 PNG images display with alt text and captions | PASS |
| KaTeX renders all math without errors | PASS (0 errors) |
| 4 citations work with tooltips | PASS (7 instances, 4 papers) |
| Cross-article links to /topics/attention-mechanism/ | PASS (3 links) |
| Cross-article links to /topics/superposition/ | PASS (1 link) |
| 2+ sidenotes render correctly | PASS (2 sidenotes) |
| Prerequisites link appears in header | PASS |
| Pause-and-think sections collapsible | PASS (2 sections) |
| Definition blockquote renders | PASS |

## Next Phase Readiness

Phase 4 (Content Authoring & Pilot Articles) is now complete. All three pilot articles are written:
- The Attention Mechanism (foundational, math-heavy, no images)
- The Superposition Hypothesis (intermediate, 6 diagrams)
- Activation Patching and Causal Interventions (advanced, 3 diagrams, multi-citation, cross-linked)

Together the three pilots validate:
- All 6 content types (math, figures, citations, sidenotes, pause-and-think, definitions)
- Cross-article concept linking between pilot articles
- Multi-citation usage with different papers
- Prerequisites rendering
- Difficulty spectrum (foundational, intermediate, advanced)

No blockers for Phase 5 (Navigation & Discovery).
