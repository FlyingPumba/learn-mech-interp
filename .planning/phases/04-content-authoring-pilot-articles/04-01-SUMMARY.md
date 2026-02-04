# Phase 4 Plan 1: Infrastructure Prep and Attention Mechanism Article Summary

**One-liner:** Image passthrough, prerequisite rendering, 11-entry citation database, and complete ~2400-word Attention Mechanism article exercising all 6 content types.

## What Was Done

### Task 1: Infrastructure prep and references.json expansion
- Added `addPassthroughCopy("src/topics/*/images")` to eleventy.config.js for article-local images
- Added prerequisite rendering to article.njk: conditional `<p class="article-prerequisites">` with linked title/url pairs
- Added `.article-prerequisites` CSS class in components.css (small font, muted color)
- Expanded references.json from 5 to 11 entries, covering all 3 pilot articles:
  - Existing: elhage2022toy, olsson2022context, elhage2021mathematical, bricken2023monosemanticity, conmy2023ioi
  - Added: vaswani2017attention, alammar2018illustrated, heimersheim2024patching, nanda2023attribution, wang2022ioi, olah2020zoom

### Task 2: Write "The Attention Mechanism" pilot article
- Converted Week 1 Typst source (658 lines of slides) into 207 lines / ~2400 words of flowing prose
- 8 sections: Why Attention, Queries/Keys/Values, Attention Equation, Self-Attention and Causal Masking, Multi-Head Attention, The Residual Stream, Other Components, The Full Transformer
- Notation reference table at end
- Content types exercised: inline math (49 expressions), display math (14 blocks), 3 blockquote definitions, 2 pause-and-think collapsible prompts, 3 citations, 4 sidenotes
- Zero KaTeX errors, zero citation errors
- Forward references to future articles as plain text (no dead links)

## Decisions Made

- [04-01]: Blockquote format for definitions (`> **Term:** description`) rather than a custom shortcode, matching the simplicity-first approach
- [04-01]: conmy2023ioi already existed in references.json from Phase 3, so only 6 new entries were needed (11 total, not 12 as originally planned)
- [04-01]: Empty prerequisites array for foundational article (no prerequisites needed)
- [04-01]: Sidenotes used for supplementary context (low-rank bottleneck, causal masking insight, layer norm coupling, key-value memory interpretation)

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

| Check | Result |
|-------|--------|
| Build with zero errors | PASS |
| Article renders at /topics/attention-mechanism/ | PASS |
| KaTeX math renders without errors | PASS (0 errors across 63 expressions) |
| Citations have tooltips | PASS (3 citations: vaswani2017attention x2, alammar2018illustrated x1) |
| references.json valid with 11 entries | PASS |
| PassthroughCopy for images present | PASS |
| article.njk renders prerequisites | PASS |
| Article is prose, not bullets | PASS (~2400 words of flowing text) |
| All 6 content types exercised | PASS |

## Commits

| Commit | Type | Description |
|--------|------|-------------|
| b3917df | feat | Infrastructure: image passthrough, prerequisites rendering, expanded citations |
| 5bd6b21 | feat | The Attention Mechanism pilot article |

## Key Files

### Created
- `src/topics/attention-mechanism/index.md` -- Complete pilot article (207 lines)

### Modified
- `eleventy.config.js` -- Added PassthroughCopy for topic images
- `src/_includes/layouts/article.njk` -- Added prerequisites rendering
- `src/_data/references.json` -- Expanded from 5 to 11 entries
- `src/css/components.css` -- Added .article-prerequisites styling

## Performance

- Duration: 3min 45s
- Completed: 2026-02-04
- Tasks: 2/2
