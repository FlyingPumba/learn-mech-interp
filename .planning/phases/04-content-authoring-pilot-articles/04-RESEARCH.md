# Phase 4: Content Authoring & Pilot Articles - Research

**Researched:** 2026-02-03
**Domain:** Typst-to-Markdown editorial conversion, content reorganization, front matter schema, cross-article linking, academic references, diagram placement
**Confidence:** HIGH (based on direct source material analysis, no external libraries needed)

## Summary

This phase is fundamentally editorial, not technical. The rendering infrastructure (Phase 3) is complete. The work is converting 14,744 lines of Typst presentation slides across 16 weeks into readable long-form Markdown articles, reorganizing by theme rather than by week, and ensuring all content types (math, citations, sidenotes, figures, code, collapsible prompts) are exercised.

The source material lives at `/Users/ivan/latex/mech-interp-course` and consists of 16 `.typ` files (one per week), a comprehensive `SOURCES.md` with 50+ paper references, a `SYLLABUS.md` with detailed learning objectives, and 27 PNG diagrams across 10 week directories. The Typst files use Touying presentation framework syntax (slides, pauses, focus-slides, two-column layouts) that has no automated conversion path -- the content must be manually rewritten as prose.

The pilot scope is 2-3 articles at different difficulty levels, validating the full workflow before scaling to all ~20+ thematic articles. This phase is identified as highest risk because the conversion is editorial work (slide bullets to readable prose), not mechanical transformation.

**Primary recommendation:** Do not attempt automated Typst-to-Markdown conversion. The slide format (bullet points, pauses, focus slides, two-column layouts) is fundamentally different from long-form prose. Manual, AI-assisted editorial conversion is the correct approach. Select 2-3 pilot articles that collectively exercise all 6 content types and span different difficulty levels.

## Standard Stack

This phase requires no new libraries. All technical infrastructure was established in Phases 1-3.

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Eleventy | 3.x (installed) | Static site generator | Already configured |
| markdown-it | (installed) | Markdown processing with KaTeX + figure plugins | Already configured |
| KaTeX | 0.16.28 (CDN) | Math rendering | Already configured |
| PrismJS | (installed) | Code syntax highlighting | Already configured |

### Supporting
| Tool | Purpose | When to Use |
|------|---------|-------------|
| references.json | Citation data store | Expand from 5 to ~30+ entries as articles reference papers |
| Nunjucks shortcodes | cite, sidenote, marginnote | Already implemented in eleventy.config.js |
| `<details>` elements | Pause-and-think prompts | Already styled in components.css |

### No New Dependencies Needed
This phase is pure content authoring. The build system, rendering pipeline, shortcodes, and CSS are all in place from Phase 3. The only additions are:
- More entries in `references.json`
- New article `.md` files in `src/topics/`
- PNG images copied to appropriate locations
- Front matter schema fields (consumed by existing article.njk layout)

## Architecture Patterns

### Recommended Content Structure
```
src/
├── _data/
│   └── references.json           # Expand with all paper citations
├── topics/
│   ├── topics.11tydata.js        # Existing: layout + permalink inheritance
│   ├── test/index.md             # Existing: rendering test article
│   ├── attention-mechanism/      # NEW: pilot article (foundational)
│   │   ├── index.md
│   │   └── images/               # Article-specific diagrams
│   ├── superposition/            # NEW: pilot article (intermediate)
│   │   ├── index.md
│   │   └── images/
│   └── activation-patching/      # NEW: pilot article (advanced)
│       ├── index.md
│       └── images/
└── css/                          # No changes needed
```

### Pattern 1: Article Front Matter Schema
**What:** Every article has structured front matter consumed by the layout and build system.
**When to use:** Every article file.
**Example:**
```yaml
---
title: "The Superposition Hypothesis"
description: "How neural networks represent more features than dimensions by encoding them as nearly-orthogonal directions, why this makes interpretability hard, and what sparse autoencoders do about it."
prerequisites:
  - title: "The Residual Stream"
    url: "/topics/residual-stream/"
  - title: "Features and Circuits"
    url: "/topics/features-and-circuits/"
difficulty: "intermediate"
block: "superposition-and-feature-extraction"
category: "core-concepts"
---
```

Fields explained:
- `title`: Rendered by article.njk layout (not repeated in content)
- `description`: Used in meta tags, article header, and future listing pages
- `prerequisites`: Array of {title, url} pairs for prerequisite articles
- `difficulty`: One of "foundational", "intermediate", "advanced"
- `block`: Which course block this belongs to (maps to the 6 pedagogical blocks)
- `category`: Broad content category for future filtering/grouping

### Pattern 2: Typst-to-Prose Conversion (Manual Editorial)
**What:** Converting slide-format Typst content into readable long-form Markdown.
**When to use:** Every source file conversion.

The Typst source uses presentation patterns that must be editorially transformed:

| Typst Pattern | Markdown Equivalent |
|---------------|---------------------|
| `= Section Title` | `## Section Title` (h2, since h1 is rendered by layout) |
| `== Slide Title` | Usually becomes a paragraph or subsection, not a heading |
| `#pause` + bullet | Merged into flowing prose or consolidated bullet lists |
| `#focus-slide[...]` | Key insight callout or emphasized paragraph |
| `#definition(title: "X")[...]` | Bold definition with clear formatting |
| `#slide(composer: (1fr, 1fr))[...][...]` | Prose narrative (two-column layout does not exist in articles) |
| `#pause-and-think[...]` | `<details class="pause-and-think">` collapsible prompt |
| `#image("assets/X.png", width: ...)` | `![Alt text](/topics/slug/images/X.png "Figure N: Caption")` |
| `#table(...)` | Markdown table |
| `$ math $` | `$math$` (inline) or `$$math$$` (display) |
| `*bold text*` | `**bold text**` (Typst uses single asterisks for bold) |
| `_italic text_` | `*italic text*` (standard Markdown) |

### Pattern 3: Typst Math Notation to KaTeX
**What:** Converting Typst math syntax to KaTeX-compatible LaTeX.
**When to use:** Every math expression.

Key conversions:
| Typst Math | KaTeX LaTeX |
|------------|-------------|
| `$vx$` (via `#let vx = math.bold("x")`) | `$\mathbf{x}$` |
| `$vW$` | `$\mathbf{W}$` |
| `$residual$` | `$\mathbf{r}$` |
| `$attn(Q, K, V)$` | `$\text{Attn}(Q, K, V)$` |
| `$RR^n$` | `$\mathbb{R}^n$` |
| `$d_"model"$` | `$d_{\text{model}}$` |
| `$arrow.r$` | `$\rightarrow$` |
| `$approx$` | `$\approx$` |
| `$sum_(i=0)^(L-1)$` | `$\sum_{i=0}^{L-1}$` |
| `$cal(L)$` | `$\mathcal{L}$` |
| `$bold("b")$` | `$\mathbf{b}$` |
| `$eq.not$` | `$\neq$` |
| `$prop$` | `$\propto$` |
| `$EE$` | `$\mathbb{E}$` |
| `$hat(vx)$` | `$\hat{\mathbf{x}}$` |
| `$dots.v$` | `$\vdots$` |

The globals.typ file defines all custom math shortcuts used across weeks. These must be expanded to their KaTeX equivalents during conversion.

### Pattern 4: Cross-Article Concept Linking
**What:** Inline links to other articles when concepts from those articles are mentioned.
**When to use:** Whenever an article mentions a concept that has its own dedicated article.

**Example:**
```markdown
This is *superposition* at the neuron level: features are packed into a space too small
to give each one its own dedicated neuron. We explore this in depth in
[The Superposition Hypothesis](/topics/superposition/).
```

A concept link map should be maintained during pilot article creation to track which concepts link where. This becomes a reference for the full conversion.

### Pattern 5: Citation Integration
**What:** Expanding references.json with papers referenced in the pilot articles and using the `{% cite "key" %}` shortcode.
**When to use:** Every paper reference in the source material.

The source SOURCES.md contains 50+ fully structured citations with ArXiv IDs, URLs, descriptions, and week mappings. Each pilot article's paper references should be added to references.json using a consistent key format.

**Key format convention:** `authorYYYYkeyword` -- e.g., `elhage2022toy`, `wang2022ioi`, `arditi2024refusal`

### Pattern 6: Image Organization
**What:** PNG diagrams placed in article-local `images/` directories with descriptive alt text.
**When to use:** Every diagram from the source course.

The source has 27 PNGs across weeks 5, 6, 8, 9, 10, 12, 13, 14, 15, 16. Each diagram needs:
1. Copy to the relevant article's `images/` directory
2. Descriptive alt text (not just the filename)
3. Figure caption using the markdown-it figure plugin syntax
4. PassthroughCopy configuration for the images

**PassthroughCopy addition needed:**
```javascript
eleventyConfig.addPassthroughCopy("src/topics/*/images");
```

### Anti-Patterns to Avoid
- **Automated Typst-to-Markdown conversion:** Pandoc has a Typst reader but it cannot handle Touying presentation framework syntax (#slide, #pause, #focus-slide, etc.). Even if it could parse the syntax, the output would be bullet fragments, not readable prose. The value of this phase is the editorial transformation.
- **One article per week:** The entire point of AUTH-02 is reorganizing by theme, not by lecture week. A "Week 9" article violates the requirement.
- **Preserving slide structure:** Slides are designed for oral delivery with reveals (#pause). Articles are designed for self-paced reading. The structure must change fundamentally.
- **Skipping recap sections:** Each week starts with a recap of the previous week. In thematic articles, these recaps become cross-article links, not duplicated content.
- **Putting all images in a single `/images/` directory:** Article-local image directories are cleaner and scale better.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Citation rendering | Custom HTML | `{% cite "key" %}` shortcode | Already built in Phase 3, handles numbering and tooltips |
| Sidenotes | Custom div structures | `{% sidenote "text" %}` shortcode | Already built, handles numbering, mobile fallback |
| Collapsible prompts | Custom JS accordion | `<details class="pause-and-think">` | Already styled in components.css, native HTML |
| Figure captions | Manual `<figure>` HTML | `![alt](src "caption")` markdown-it-figure syntax | Already configured |
| Math rendering | MathJax or manual SVGs | KaTeX via markdown-it plugin | Already configured, build-time rendering |
| Per-page citation numbering | Manual numbering | Automatic via shortcode counter | Already handles resets in --serve mode |

**Key insight:** Phase 3 built all the rendering infrastructure. Phase 4 is purely about producing content that exercises it. No new shortcodes, plugins, or CSS should be needed for pilot articles.

## Common Pitfalls

### Pitfall 1: Scope Creep from "Readable Prose"
**What goes wrong:** Converting slides to prose takes 3-5x longer than expected because each slide's 3-4 bullet points need to become 2-3 paragraphs of flowing text with proper transitions.
**Why it happens:** Slides are compressed knowledge; prose is expanded knowledge. The expansion ratio is non-obvious.
**How to avoid:** Set a clear word count target per article (1500-3000 words for pilot articles). Time-box the first pilot article and use the actual time to calibrate estimates for the full conversion.
**Warning signs:** Spending more than 2 hours on a single article section; rewriting the same paragraph multiple times for "flow."

### Pitfall 2: Converting Everything at Once
**What goes wrong:** Trying to convert all 16 weeks before validating the workflow with pilot articles.
**Why it happens:** The conversion seems mechanical so people underestimate the editorial judgment needed.
**How to avoid:** This phase deliberately scopes to 2-3 pilot articles. The pilot must be validated (builds, renders, looks good, cross-links work) before proceeding to full conversion.
**Warning signs:** Starting conversion of weeks 4-16 before the first pilot article is reviewed and accepted.

### Pitfall 3: Wrong Thematic Boundaries
**What goes wrong:** Article boundaries are drawn too broadly (one giant "Superposition" article covering weeks 9-11) or too narrowly (separate articles for each subsection).
**Why it happens:** The mapping from weekly lectures to thematic articles requires editorial judgment about what constitutes a self-contained learning unit.
**How to avoid:** Each article should cover one primary concept with a clear beginning (motivation/prerequisites) and end (key takeaways/what comes next). Target 1500-3000 words. If an article exceeds 4000 words, consider splitting.
**Warning signs:** An article that requires 5+ prerequisite articles to understand; an article under 500 words.

### Pitfall 4: Losing Math Accuracy During Conversion
**What goes wrong:** Typst math notation is subtly different from LaTeX/KaTeX. Conversions introduce errors (wrong subscripts, missing bold, broken display equations).
**Why it happens:** Typst uses `$d_"model"$` where KaTeX needs `$d_{\text{model}}$`. Typst uses `RR` where KaTeX needs `\mathbb{R}`. The globals.typ shortcuts (`vx`, `vW`, `residual`) need manual expansion.
**How to avoid:** Create a reference table of Typst-to-KaTeX conversions (provided above in Architecture Patterns). Verify every math expression renders correctly in the browser.
**Warning signs:** Broken red KaTeX error boxes in the rendered page; missing symbols.

### Pitfall 5: Orphaned Cross-References
**What goes wrong:** Articles reference concepts from articles that do not exist yet, creating broken links.
**Why it happens:** During pilot phase, only 2-3 articles exist but they may reference 10+ other topics.
**How to avoid:** For pilot articles, use cross-article links only to other pilot articles. For references to future articles, use plain text mentions without links, or link to a placeholder (the test article). Document intended cross-links for the full conversion phase.
**Warning signs:** 404 errors in the site; links to `/topics/X/` where X does not exist.

### Pitfall 6: Incomplete references.json Expansion
**What goes wrong:** Articles use `{% cite "key" %}` but the key does not exist in references.json, producing `[??]` in the rendered output.
**Why it happens:** Each pilot article references 5-15 papers. All must be added to references.json before the article renders correctly.
**How to avoid:** Before starting an article's conversion, identify all paper references from the source Typst file and add them to references.json first. The SOURCES.md file has complete citation data for all papers.
**Warning signs:** `[??]` appearing in rendered articles; citation tooltips showing error text.

## Code Examples

### Example 1: Complete Article Front Matter
```yaml
---
title: "The Superposition Hypothesis"
description: "How neural networks represent more features than dimensions using nearly-orthogonal directions, and why this makes mechanistic interpretability fundamentally harder."
prerequisites:
  - title: "The Residual Stream"
    url: "/topics/residual-stream/"
  - title: "Features and Circuits"
    url: "/topics/features-and-circuits/"
difficulty: "intermediate"
block: "superposition-and-feature-extraction"
category: "core-concepts"
---
```

### Example 2: Typst Slide to Markdown Prose Conversion

**Typst source (week-09, slide format):**
```typst
== More Features Than Dimensions

This is the fundamental tension:

#pause

$ "Features the model wants" >> "Dimensions available" $

#pause

A 512-dimensional residual stream has 512 orthogonal directions.
But the model might need to represent 10,000 or 100,000 distinct features.

#pause

What does the model do?
```

**Markdown article (prose format):**
```markdown
## The Fundamental Tension

The core insight behind superposition is a counting problem. Consider a language model
with a residual stream of dimension $d = 512$. If each feature receives its own
orthogonal direction, the model can represent at most 512 features. But language
understanding requires far more than 512 features -- the model needs to track syntax,
semantics, entities, relationships, sentiment, factual knowledge, and more. There are
plausibly millions of features that a model would benefit from representing.

This creates a fundamental tension:

$$
\text{Features the model wants} \gg \text{Dimensions available}
$$

A 512-dimensional residual stream has 512 orthogonal directions, but the model might
need to represent 10,000 or 100,000 distinct features. What does the model do?
```

### Example 3: Citation Integration

**Source reference from SOURCES.md:**
```
### Elhage et al. (2022). "Toy Models of Superposition."
**ArXiv:** arXiv:2209.10652 -- https://arxiv.org/abs/2209.10652
```

**references.json entry:**
```json
{
  "elhage2022toy": {
    "title": "Toy Models of Superposition",
    "authors": "Elhage, N., Hume, T., Olsson, C., et al.",
    "year": 2022,
    "venue": "Anthropic",
    "url": "https://arxiv.org/abs/2209.10652"
  }
}
```

**Usage in article Markdown:**
```markdown
To study superposition systematically, Elhage et al. built a toy model that isolates
the core question {% cite "elhage2022toy" %}.
```

### Example 4: Figure with Alt Text

**Typst source:**
```typst
#image("assets/phase_diagram.png", width: 70%)
```

**Markdown article:**
```markdown
![Phase diagram showing superposition regions as a function of feature importance (y-axis) and sparsity (x-axis). Blue region (top-left) indicates no superposition with orthogonal features. Red region (bottom-right) indicates strong superposition with packed features. The transition is sharp, like a phase transition in physics.](/topics/superposition/images/phase_diagram.png "Figure 1: Phase diagram for superposition. Features transition sharply from orthogonal representation (blue) to superposed representation (red) as sparsity increases and importance decreases.")
```

### Example 5: Pause-and-Think Conversion

**Typst source:**
```typst
#pause-and-think[
  If the transformer is just a series of additive updates to a vector,
  what would it mean to "understand" what each update does?
]
```

**Markdown article:**
```html
<details class="pause-and-think">
<summary>Pause and think: Understanding additive updates</summary>

If the transformer is just a series of additive updates to a vector, what would it mean
to "understand" what each update does? This question motivates the entire field of
mechanistic interpretability -- we want to decompose the model's computation into
understandable pieces and explain the role of each component.

</details>
```

### Example 6: Definition Box Conversion

**Typst source:**
```typst
#definition(title: "Superposition")[
  A neural network exhibits *superposition* when it represents more features
  than it has dimensions by encoding features as non-orthogonal directions
  in activation space.
]
```

**Markdown article (using bold + blockquote pattern):**
```markdown
> **Superposition:** A neural network exhibits superposition when it represents more
> features than it has dimensions by encoding features as non-orthogonal directions
> in activation space. Features share dimensions, causing interference: activating
> one feature partially activates others.
```

## State of the Art

This phase does not involve evolving technology. The "state of the art" considerations are:

| Concern | Current Approach | Impact |
|---------|------------------|--------|
| Pandoc Typst reader | Exists but cannot handle Touying presentation syntax | Confirms manual conversion is correct |
| Typst math syntax | Different from LaTeX/KaTeX | Requires systematic conversion table |
| Content organization | Thematic articles, not by lecture week | Editorial judgment required |
| AI-assisted writing | Claude can help expand bullets to prose | Significant time savings on editorial work |

## Pilot Article Selection

### Recommended Pilots (3 articles, spanning difficulty levels)

Based on analysis of all 16 weeks, the following pilot articles are recommended:

**Pilot 1: "The Attention Mechanism" (Foundational)**
- Source: Week 1 (658 lines)
- Why: Foundational content, heavy math (attention equations), no diagrams, tests KaTeX rendering extensively
- Content types exercised: inline math, display math, definitions, pause-and-think prompts
- Estimated word count: ~2000 words
- Paper references: Vaswani et al. (2017), Alammar (2018)
- Difficulty: foundational

**Pilot 2: "The Superposition Hypothesis" (Intermediate)**
- Source: Week 9 (1077 lines, the largest file with most diagrams)
- Why: Core MI concept, 6 diagrams (most of any week), both math-heavy and conceptually rich, exercises figure/caption rendering
- Content types exercised: display math, figures with captions, pause-and-think, definitions, sidenotes (for geometric intuitions)
- Estimated word count: ~3000 words
- Paper references: Elhage et al. (2022)
- Images: phase_diagram.png, superposition_1d_antipodal.png, superposition_2d_orthogonal.png, superposition_2d_triangle.png, superposition_2d_pentagon.png, superposition_3d_packing.png
- Difficulty: intermediate

**Pilot 3: "Activation Patching and Causal Interventions" (Advanced)**
- Source: Week 6 (800 lines)
- Why: Methodological content, 3 diagrams, builds on prerequisite concepts (tests cross-article linking), exercises citations heavily
- Content types exercised: citations (multiple papers), figures, cross-article concept links, code examples (patching pseudocode), sidenotes
- Estimated word count: ~2500 words
- Paper references: Heimersheim & Nanda (2024), Nanda (2023), Wang et al. (2022)
- Images: act_patch_setup.png, act_patch_layers.png, act_patch_heads.png
- Difficulty: advanced

### Why These Three

1. **Difficulty spectrum:** foundational / intermediate / advanced
2. **Content type coverage:** Together they exercise all 6 content types (math, code, figures, citations, sidenotes, collapsible prompts)
3. **Diagram coverage:** 0, 6, and 3 diagrams respectively -- tests both with and without images
4. **Cross-reference testing:** The activation patching article naturally references concepts from attention and superposition, testing cross-article linking
5. **Manageable scope:** ~7500 words total across 3 articles, sourced from ~2535 lines of Typst

## Thematic Article Map (Full Conversion Reference)

For planning purposes, here is the proposed thematic article structure for the full site. This is not part of the pilot but informs how pilot articles fit into the larger picture.

| Article Slug | Title | Source Weeks | Block | Difficulty |
|-------------|-------|-------------|-------|------------|
| `attention-mechanism` | The Attention Mechanism | 1 | 1 | Foundational |
| `residual-stream` | The Residual Stream | 1, 2 | 1 | Foundational |
| `qk-ov-circuits` | QK and OV Circuits | 2 | 1 | Foundational |
| `what-is-mech-interp` | What is Mechanistic Interpretability? | 3 | 2 | Foundational |
| `features-and-circuits` | Features, Circuits, and Universality | 3 | 2 | Foundational |
| `induction-heads` | Induction Heads | 4 | 2 | Intermediate |
| `direct-logit-attribution` | Direct Logit Attribution | 4 | 2 | Intermediate |
| `logit-lens` | The Logit Lens and Tuned Lens | 5 | 2 | Intermediate |
| `probing` | Probing Classifiers | 5 | 2 | Intermediate |
| `activation-patching` | Activation Patching | 6 | 3 | Advanced |
| `ioi-circuit` | The IOI Circuit | 7, 8 | 3 | Advanced |
| `superposition` | The Superposition Hypothesis | 9 | 4 | Intermediate |
| `sparse-autoencoders` | Sparse Autoencoders | 10 | 4 | Advanced |
| `scaling-saes` | Scaling SAEs and Feature Geometry | 11 | 4 | Advanced |
| `steering` | Steering and Representation Engineering | 12 | 5 | Advanced |
| `circuit-tracing` | Circuit Tracing at Scale | 13 | 5 | Advanced |
| `model-diffing` | Model Diffing and Crosscoders | 14 | 5 | Advanced |
| `multimodal-mi` | Multimodal Mechanistic Interpretability | 14 | 5 | Advanced |
| `mi-for-safety` | MI for AI Safety | 15 | 6 | Advanced |
| `open-problems` | Open Problems and the Future | 16 | 6 | Advanced |

Total: ~20 articles. The pilot covers 3 of these.

## Conversion Workflow (Per Article)

The recommended workflow for converting each pilot article:

1. **Identify paper references** from the source Typst file and SOURCES.md
2. **Add references to references.json** (all citations must exist before article renders)
3. **Copy diagrams** to `src/topics/<slug>/images/`
4. **Write front matter** (title, description, prerequisites, difficulty, block, category)
5. **Convert content section by section:**
   - Strip Typst presentation boilerplate (imports, #show, title-slide, outline)
   - Drop recap sections (replace with cross-article links)
   - Convert `= Section` headings to `## Section` (h2)
   - Merge `#pause` + bullet sequences into prose paragraphs
   - Convert `#focus-slide` to emphasized key-insight paragraphs
   - Convert `#definition` to blockquote format
   - Convert `#pause-and-think` to `<details>` elements
   - Convert `#slide(composer:)` two-column layouts to flowing prose
   - Convert `#image` to markdown figure syntax with alt text
   - Convert `#table` to markdown tables
   - Convert all Typst math to KaTeX LaTeX
   - Add `{% cite "key" %}` for paper references
   - Add `{% sidenote "text" %}` for supplementary context
   - Add cross-article links for concept mentions
6. **Build and verify** all content renders correctly
7. **Review** for prose quality, completeness, and accuracy

## Open Questions

1. **Where should prerequisite rendering happen?**
   - The front matter includes `prerequisites` as structured data, but the article.njk layout does not yet render them.
   - Recommendation: Add prerequisite rendering to article.njk as a simple "Prerequisites: X, Y" line below the description. This is a small layout enhancement, not a new component.
   - Confidence: HIGH -- straightforward template change.

2. **Should difficulty badges be rendered?**
   - The front matter includes `difficulty`, but no badge/indicator exists in the layout.
   - Recommendation: Defer visual rendering of difficulty to Phase 5 (Navigation) or Phase 7 (Design) where it integrates with the sidebar and learning path. For now, include it in front matter as metadata.
   - Confidence: HIGH -- difficulty metadata is useful regardless of visual rendering.

3. **Should PassthroughCopy handle images?**
   - Currently `src/css` is passed through but `src/topics/*/images` is not.
   - Recommendation: Add `eleventyConfig.addPassthroughCopy("src/topics/*/images");` in eleventy.config.js. This is a one-line configuration change.
   - Confidence: HIGH -- verified pattern.

4. **How should definitions be styled?**
   - The Typst source uses `#definition(title: "X")[...]` blocks. Phase 3 did not create a definition shortcode or style.
   - Options: (a) Use Markdown blockquotes with bold titles (no new CSS), (b) Create a new `{% definition "title" "content" %}` shortcode.
   - Recommendation: Use blockquotes with bold titles for the pilot. If definitions need more visual distinction in the full conversion, add a CSS class or shortcode later.
   - Confidence: MEDIUM -- may want a shortcode for consistency across 20+ articles.

5. **What is the article URL slug convention?**
   - The existing `topics.11tydata.js` uses `page.fileSlug` for permalinks, which means the folder name becomes the URL slug.
   - Recommendation: Use kebab-case slugs matching the article topic (e.g., `attention-mechanism`, `superposition`, `activation-patching`). This is already the convention established by the folder structure.
   - Confidence: HIGH -- convention already established.

## Sources

### Primary (HIGH confidence)
- Direct analysis of `/Users/ivan/latex/mech-interp-course/` source material (16 .typ files, SOURCES.md, SYLLABUS.md, 27 PNG diagrams)
- Direct analysis of `/Users/ivan/src/learn-mech-interp/` build system (eleventy.config.js, shortcodes, layouts, CSS, references.json)
- Phase 3 artifacts (test article demonstrating all 6 content types)

### Secondary (MEDIUM confidence)
- [Pandoc Typst support](https://github.com/jgm/pandoc/issues/8740) - Typst reader exists but limited for presentation frameworks
- [Pandoc User's Guide](https://pandoc.org/MANUAL.html) - Typst listed as both input and output format

### Tertiary (LOW confidence)
- None needed -- this phase is editorial, not technical

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries needed, all infrastructure exists from Phase 3
- Architecture: HIGH -- patterns derived from direct analysis of source material and existing build system
- Pitfalls: HIGH -- based on understanding of the editorial nature of the conversion work and the specific Typst syntax patterns
- Pilot selection: HIGH -- based on systematic analysis of all 16 weeks for difficulty, content type coverage, and diagram count
- Thematic article map: MEDIUM -- the mapping from weeks to themes involves editorial judgment that may shift during actual conversion

**Research date:** 2026-02-03
**Valid until:** No expiration -- this research is based on stable source material and existing infrastructure, not evolving libraries
