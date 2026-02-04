# Phase 3: Content Rendering Engine - Research

**Researched:** 2026-02-03
**Domain:** Build-time math rendering, syntax highlighting, academic citations, margin notes, figures, collapsible elements
**Confidence:** HIGH

## Summary

Phase 3 adds six content rendering capabilities to the article template: math equations (KaTeX), syntax-highlighted code blocks, figures with captions, academic citations with hover details, margin notes/sidenotes, and collapsible "pause and think" prompts. The research confirms that all six can be implemented with build-time rendering (no client-side JS for core functionality) using well-established libraries and CSS patterns.

The core approach is to extend the existing markdown-it configuration in Eleventy with plugins for math (`@mdit/plugin-katex`) and figures (`@mdit/plugin-figure`), add the official Eleventy syntax highlighting plugin (`@11ty/eleventy-plugin-syntaxhighlight` using PrismJS), build a custom citation system driven by JSON data in `_data/`, implement Tufte CSS-inspired sidenotes with a checkbox-hack for responsive collapse, and use native `<details>`/`<summary>` for collapsible prompts.

The citation hover system is the one area where no off-the-shelf solution perfectly fits the requirements. The recommendation is a custom implementation: JSON citation data in `_data/references.json`, an Eleventy shortcode for inline numbered citations, and CSS tooltips for hover details on desktop with a fallback checkbox-toggle for mobile. This is a manageable amount of custom code (roughly 50 lines of JS for the shortcode + 80 lines of CSS for tooltips).

**Primary recommendation:** Use established markdown-it plugins for math and figures, the official Eleventy syntax highlighting plugin for code, Tufte CSS patterns for margin notes, native HTML for collapsible prompts, and a custom shortcode + CSS tooltip for the citation system.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @mdit/plugin-katex | 0.23.x | Build-time KaTeX math rendering | Actively maintained, extends KaTeX options, supports `$`/`$$` delimiters, outputs pre-rendered HTML+MathML |
| katex | 0.16.x | Math typesetting engine | Fastest math renderer, used by @mdit/plugin-katex, build-time `renderToString()` |
| @11ty/eleventy-plugin-syntaxhighlight | 5.x | Build-time PrismJS syntax highlighting | Official Eleventy plugin, zero client JS, build-time transforms, ESM support |
| @mdit/plugin-figure | latest | `<figure>`/`<figcaption>` from images | Same plugin family as @mdit/plugin-katex, automatic figure wrapping |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| KaTeX CSS (CDN or local) | 0.16.x | Styling for rendered math HTML | Required when using `output: "htmlAndMathml"` (default) |
| PrismJS theme CSS | bundled | Code block colors | Choose a theme (e.g., prism-tomorrow, prism-one-light) matching the site design |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @11ty/eleventy-plugin-syntaxhighlight (PrismJS) | highlight.js via markdown-it `highlight` option | highlight.js has auto-detection but the official plugin has better Eleventy integration, line highlighting, and community support |
| @11ty/eleventy-plugin-syntaxhighlight (PrismJS) | Shiki via `amendLibrary` | VS Code-quality highlighting but requires async workaround with `eleventy.before` event; PrismJS is sufficient for Python/PyTorch |
| @mdit/plugin-figure | markdown-it-image-figures | Similar features; @mdit/plugin-figure is from the same maintained family as @mdit/plugin-katex |
| Custom citation shortcode | eleventy-plugin-citations | Plugin v0.1.10 uses BibTeX/CSL (heavyweight), no hover tooltips, Pandoc syntax; custom approach is simpler for JSON-driven numbered citations |
| Custom citation shortcode | markdown-it-footnote | Generates footnotes, not inline numbered citations with hover; would need heavy CSS/JS to convert to hover tooltips |
| Tufte CSS sidenotes | Distill.pub `<dt-byline>` etc. | Distill's web components are tightly coupled to their platform; Tufte CSS patterns are portable and CSS-only |

**Installation:**
```bash
# Math rendering
npm install @mdit/plugin-katex katex

# Syntax highlighting (official Eleventy plugin)
npm install @11ty/eleventy-plugin-syntaxhighlight

# Figure/figcaption for images
npm install @mdit/plugin-figure
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── _data/
│   └── references.json       # Structured citation data (CONT-12)
├── _includes/
│   ├── layouts/
│   │   ├── base.njk           # Add KaTeX CSS + Prism CSS links
│   │   └── article.njk        # Unchanged
│   └── partials/
│       ├── header.njk         # Unchanged
│       └── footer.njk         # Unchanged
├── css/
│   ├── variables.css          # Add citation/sidenote/details tokens
│   ├── base.css               # Unchanged
│   ├── layout.css             # Extend 1400px grid for margin notes
│   ├── components.css         # Add citation, sidenote, details styles
│   └── katex-overrides.css    # KaTeX mobile overflow fixes (NEW)
├── topics/
│   └── test/
│       └── index.md           # Extend with content type demos
└── index.njk
```

### Pattern 1: Markdown-it Plugin Registration in Eleventy Config
**What:** Register all markdown-it plugins in `eleventy.config.js` using `setLibrary`
**When to use:** When configuring KaTeX and figure plugins together
**Example:**
```js
// eleventy.config.js
// Source: https://mdit-plugins.github.io/katex.html
import markdownIt from "markdown-it";
import { katex } from "@mdit/plugin-katex";
import { figure } from "@mdit/plugin-figure";

export default function(eleventyConfig) {
  const md = markdownIt({ html: true })
    .use(katex, {
      output: "htmlAndMathml",    // HTML for display + MathML for accessibility
      throwOnError: false,         // Render errors as red text instead of crashing build
      errorColor: "#cc0000"
    })
    .use(figure);

  eleventyConfig.setLibrary("md", md);
  // ... rest of config
}
```

### Pattern 2: Eleventy Syntax Highlighting Plugin (Separate from markdown-it)
**What:** The official plugin hooks into Eleventy's template engine, not markdown-it directly
**When to use:** Always use this plugin instead of configuring markdown-it's `highlight` option
**Example:**
```js
// eleventy.config.js
// Source: https://www.11ty.dev/docs/plugins/syntaxhighlight/
import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";

export default function(eleventyConfig) {
  eleventyConfig.addPlugin(syntaxHighlight);
  // ... setLibrary for markdown-it with katex/figure still works alongside this
}
```

### Pattern 3: JSON-Driven Citation Data with Shortcode
**What:** Store citation data in `_data/references.json`, render via Eleventy shortcode
**When to use:** For numbered inline citations with hover tooltips
**Example:**
```js
// eleventy.config.js - Citation shortcode
eleventyConfig.addShortcode("cite", function(key) {
  const refs = this.ctx.references;  // From _data/references.json
  const ref = refs[key];
  if (!ref) {
    return `<span class="citation-error">[??]</span>`;
  }
  return `<span class="citation" tabindex="0" role="doc-noteref">` +
    `<a href="${ref.url}" target="_blank" rel="noopener" class="citation-number">[${ref.number}]</a>` +
    `<span class="citation-tooltip" role="tooltip">` +
      `<strong>${ref.title}</strong><br>` +
      `${ref.authors}<br>` +
      `<em>${ref.venue}, ${ref.year}</em>` +
    `</span>` +
  `</span>`;
});
```

```json
// src/_data/references.json
{
  "elhage2022toy": {
    "number": 1,
    "title": "Toy Models of Superposition",
    "authors": "Elhage et al.",
    "year": 2022,
    "venue": "Anthropic",
    "url": "https://transformer-circuits.pub/2022/toy_model/index.html"
  }
}
```

Usage in Markdown:
```markdown
Superposition occurs when models represent more features than dimensions {% cite "elhage2022toy" %}.
```

### Pattern 4: Tufte-Style Sidenotes with CSS Checkbox Hack
**What:** Margin notes visible on wide screens, collapsible on narrow screens using CSS only
**When to use:** For supplementary context that should not interrupt reading flow
**Example HTML (in Markdown via shortcode or direct HTML):**
```html
<label for="sn-1" class="sidenote-toggle sidenote-number"></label>
<input type="checkbox" id="sn-1" class="sidenote-toggle-input"/>
<span class="sidenote">This supplementary info appears in the margin on wide screens.</span>
```

**Example CSS (adapted from Tufte CSS):**
```css
/* Sidenote counter */
.sidenote-number { counter-increment: sidenote-counter; }
.sidenote-number::after {
  content: counter(sidenote-counter);
  font-size: 0.75rem;
  vertical-align: super;
}
.sidenote::before {
  content: counter(sidenote-counter) " ";
  font-size: 0.75rem;
  vertical-align: super;
}

/* Desktop: show in margin */
.sidenote {
  float: right;
  clear: right;
  margin-right: -60%;
  width: 50%;
  font-size: var(--font-size-small);
  line-height: 1.3;
}

/* Hide toggle controls on desktop */
.sidenote-toggle-input { display: none; }
label.sidenote-toggle:not(.sidenote-number) { display: none; }

/* Mobile: collapse to expandable */
@media (max-width: 1399px) {
  .sidenote { display: none; }
  label.sidenote-toggle:not(.sidenote-number) { display: inline; cursor: pointer; }
  .sidenote-toggle-input:checked + .sidenote {
    display: block;
    float: none;
    width: 95%;
    margin: 0.5rem 2.5%;
    background: var(--color-background-subtle);
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--radius-md);
  }
}
```

### Pattern 5: Details/Summary for Collapsible Prompts
**What:** Native HTML5 `<details>`/`<summary>` for "Pause and think" blocks
**When to use:** For self-check questions or optional deeper dives
**Example in Markdown (html: true in markdown-it):**
```html
<details class="pause-and-think">
<summary>Pause and think: Why might a model use superposition?</summary>

Consider what happens when the number of features exceeds the number of
dimensions in the residual stream. The model faces a tradeoff between...

</details>
```

**CSS:**
```css
.pause-and-think {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  margin: var(--spacing-lg) 0;
  background: var(--color-background-subtle);
}

.pause-and-think summary {
  cursor: pointer;
  font-weight: 600;
  color: var(--color-link);
}

.pause-and-think[open] summary {
  margin-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
  padding-bottom: var(--spacing-sm);
}
```

### Pattern 6: KaTeX CSS with Mobile Overflow Fix
**What:** Prevent math equations from breaking mobile layouts
**When to use:** All pages with math content
**Example:**
```css
/* katex-overrides.css */
.katex-display {
  overflow-x: auto;
  overflow-y: hidden;
  padding: var(--spacing-xs) 0;
  -webkit-overflow-scrolling: touch;
}

/* Ensure inline math doesn't overflow */
.katex {
  font-size: 1.1em; /* Slightly larger than body for readability */
}

/* On mobile, allow horizontal scroll for wide equations */
@media (max-width: 767px) {
  .katex-display > .katex {
    max-width: 100%;
  }
}
```

### Anti-Patterns to Avoid
- **Client-side KaTeX JS:** Build-time rendering via @mdit/plugin-katex eliminates the need for client-side KaTeX JavaScript. Only the KaTeX CSS is needed.
- **Using `output: "mathml"` alone:** MathML-only output skips the KaTeX CSS requirement but browser support for MathML rendering quality varies. Use `"htmlAndMathml"` for consistent display plus accessibility.
- **Mixing setLibrary and the syntax highlight plugin incorrectly:** The official `@11ty/eleventy-plugin-syntaxhighlight` hooks into Eleventy's template processing, not into markdown-it. Using `setLibrary` for KaTeX/figure and `addPlugin` for syntax highlighting works because they operate at different levels.
- **Forgetting html: true in markdown-it:** Required for `<details>`, `<summary>`, and inline HTML for sidenotes/citations to pass through Markdown processing.
- **Complex citation plugins when JSON + shortcode suffices:** `eleventy-plugin-citations` uses BibTeX/CSL/citeproc (heavy dependencies) and doesn't provide hover tooltips. A simple JSON-driven shortcode is more appropriate for this project's needs.
- **JavaScript-based sidenotes:** Tufte CSS's checkbox-hack approach is purely CSS, works without JS, and degrades gracefully. No need for sidenotes.js or similar.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Math rendering | Custom LaTeX parser | @mdit/plugin-katex + katex | Thousands of LaTeX edge cases; KaTeX handles them all |
| Syntax highlighting | Custom token colorizer | @11ty/eleventy-plugin-syntaxhighlight | Language grammars are extremely complex; PrismJS handles 290+ languages |
| Figure wrapping | Custom markdown-it rule | @mdit/plugin-figure | Handles edge cases (linked images, standalone detection) |
| Math CSS/fonts | Custom math styling | KaTeX CSS (CDN or bundled) | KaTeX's CSS handles hundreds of math symbols, sizing, and layout |
| PrismJS theme CSS | Custom code colors | Existing Prism themes | Pre-tested color contrast and accessibility |

**Key insight:** The content rendering stack is almost entirely build-time plugins. The only custom code needed is the citation shortcode (~50 lines), citation CSS tooltip (~80 lines), and sidenote CSS (~60 lines). Everything else uses established libraries.

## Common Pitfalls

### Pitfall 1: KaTeX CSS Missing or Wrong Version
**What goes wrong:** Math renders as unstyled text, broken layout, or missing symbols
**Why it happens:** @mdit/plugin-katex renders HTML at build time but the browser needs KaTeX CSS to style it
**How to avoid:** Include KaTeX CSS in base.njk `<head>`. Pin the CSS version to match the installed katex npm package version. Either use CDN (`https://cdn.jsdelivr.net/npm/katex@0.16.28/dist/katex.min.css`) or copy locally.
**Warning signs:** Math appears but looks wrong; fractions stack incorrectly; symbols render as boxes

### Pitfall 2: Math Overflow on Mobile
**What goes wrong:** Wide equations extend beyond the viewport, creating horizontal scroll on the entire page
**Why it happens:** KaTeX uses absolute positioning internally; `overflow: hidden` clips content; default display math has no max-width
**How to avoid:** Add `overflow-x: auto; overflow-y: hidden;` to `.katex-display`. This makes individual equations scrollable without affecting the page. Do NOT use `overflow: hidden` as it clips subscripts and superscripts.
**Warning signs:** Horizontal scrollbar on the entire page (not just the equation); math cut off at the right edge

### Pitfall 3: Dollar Signs in Non-Math Context
**What goes wrong:** Regular dollar signs in text (e.g., "$5") get interpreted as math delimiters
**Why it happens:** @mdit/plugin-katex defaults to dollar-sign delimiters
**How to avoid:** Use `allowInlineWithSpace: false` (default) so `$ 5` with a space is not treated as math. Escape literal dollar signs with `\$` when needed. The plugin requires no space after opening `$` for inline math.
**Warning signs:** Text like "costs $5" rendering as broken math

### Pitfall 4: setLibrary and addPlugin Order
**What goes wrong:** Syntax highlighting or KaTeX stops working
**Why it happens:** `setLibrary` replaces the markdown-it instance entirely; if called after `addPlugin(syntaxHighlight)`, the plugin's configuration may be lost, or vice versa
**How to avoid:** Call `setLibrary` first to set up markdown-it with KaTeX and figure plugins, then call `addPlugin(syntaxHighlight)`. The syntax highlight plugin operates on Eleventy's template layer, not on markdown-it directly, so it works alongside `setLibrary`.
**Warning signs:** One of the two features (math or code highlighting) works but not both

### Pitfall 5: Markdown Inside HTML Blocks
**What goes wrong:** Markdown formatting (bold, links, lists) inside `<details>` blocks renders as raw text
**Why it happens:** markdown-it treats content inside HTML block-level elements as raw HTML by default
**How to avoid:** Leave a blank line after `<summary>` and before `</details>`. markdown-it re-enters Markdown processing mode after a blank line following an HTML block tag. Alternatively, use a paired shortcode that explicitly calls `markdownIt.render()` on the inner content.
**Warning signs:** Stars, brackets, and other Markdown syntax appearing literally inside collapsible blocks

### Pitfall 6: Sidenote IDs Must Be Unique
**What goes wrong:** Clicking one sidenote toggle opens/closes a different sidenote
**Why it happens:** The checkbox hack ties `<label for="id">` to `<input id="id">`; duplicate IDs break the association
**How to avoid:** Use a shortcode that auto-generates unique IDs (counter per page), or use a naming convention like `sn-{article-slug}-{n}`
**Warning signs:** Multiple sidenotes opening simultaneously; wrong sidenote expanding

### Pitfall 7: Citation Numbers Becoming Stale
**What goes wrong:** Citation numbers in articles don't match the references
**Why it happens:** If citation numbers are manually assigned in `references.json` and articles are added/removed
**How to avoid:** Either auto-number citations per page at build time (shortcode maintains a counter) or use a deterministic numbering scheme. Per-page numbering is simpler and matches academic convention.
**Warning signs:** `[3]` in text pointing to a different paper than expected

### Pitfall 8: PrismJS Theme Conflicting with Site Design
**What goes wrong:** Code blocks have jarring colors that don't match the site's academic aesthetic
**Why it happens:** Using a default Prism theme without customization
**How to avoid:** Choose a subtle theme (e.g., a custom theme based on the site's CSS variables) or customize an existing theme. The `prism-one-light` or `prism-github` themes pair well with academic sites. Include the theme CSS file in `base.njk`.
**Warning signs:** Code blocks visually "pop out" of the page design instead of integrating

## Code Examples

Verified patterns from official sources:

### Complete Eleventy Config Integration
```js
// eleventy.config.js
// Sources:
//   https://mdit-plugins.github.io/katex.html
//   https://www.11ty.dev/docs/plugins/syntaxhighlight/
//   https://www.11ty.dev/docs/languages/markdown/
import { EleventyHtmlBasePlugin } from "@11ty/eleventy";
import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import markdownIt from "markdown-it";
import { katex } from "@mdit/plugin-katex";
import { figure } from "@mdit/plugin-figure";

export default function(eleventyConfig) {
  // Base plugin for GitHub Pages path prefix
  eleventyConfig.addPlugin(EleventyHtmlBasePlugin);

  // Syntax highlighting (PrismJS, build-time)
  eleventyConfig.addPlugin(syntaxHighlight);

  // Configure markdown-it with KaTeX and figure plugins
  const md = markdownIt({ html: true })
    .use(katex, {
      output: "htmlAndMathml",
      throwOnError: false,
      errorColor: "#cc0000"
    })
    .use(figure);

  eleventyConfig.setLibrary("md", md);

  // Pass through CSS files
  eleventyConfig.addPassthroughCopy("src/css");

  // Citation shortcode
  let citationCounter = {};
  eleventyConfig.addShortcode("cite", function(key) {
    const page = this.page;
    const pageUrl = page.url;
    if (!citationCounter[pageUrl]) citationCounter[pageUrl] = 0;
    citationCounter[pageUrl]++;

    const refs = this.ctx.references || {};
    const ref = refs[key];
    if (!ref) return `<span class="citation-error">[??]</span>`;

    const num = citationCounter[pageUrl];
    return `<span class="citation" tabindex="0" role="doc-noteref">` +
      `<a href="${ref.url}" target="_blank" rel="noopener" class="citation-number">[${num}]</a>` +
      `<span class="citation-tooltip" role="tooltip">` +
        `<strong>${ref.title}</strong><br>` +
        `${ref.authors}<br>` +
        `<em>${ref.venue}, ${ref.year}</em>` +
      `</span></span>`;
  });

  // Sidenote shortcode
  let sidenoteCounter = {};
  eleventyConfig.addShortcode("sidenote", function(content) {
    const page = this.page;
    const pageUrl = page.url;
    if (!sidenoteCounter[pageUrl]) sidenoteCounter[pageUrl] = 0;
    sidenoteCounter[pageUrl]++;
    const id = `sn-${sidenoteCounter[pageUrl]}`;

    return `<label for="${id}" class="sidenote-toggle sidenote-number"></label>` +
      `<input type="checkbox" id="${id}" class="sidenote-toggle-input"/>` +
      `<span class="sidenote">${content}</span>`;
  });

  // Margin note shortcode (no number)
  let marginCounter = {};
  eleventyConfig.addShortcode("marginnote", function(content) {
    const page = this.page;
    const pageUrl = page.url;
    if (!marginCounter[pageUrl]) marginCounter[pageUrl] = 0;
    marginCounter[pageUrl]++;
    const id = `mn-${marginCounter[pageUrl]}`;

    return `<label for="${id}" class="sidenote-toggle marginnote-indicator">&#8853;</label>` +
      `<input type="checkbox" id="${id}" class="sidenote-toggle-input"/>` +
      `<span class="marginnote">${content}</span>`;
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    templateFormats: ["md", "njk", "html"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    pathPrefix: "/learn-mech-interp/"
  };
}
```

### Citation JSON Data Structure
```json
{
  "elhage2022toy": {
    "title": "Toy Models of Superposition",
    "authors": "Elhage, N., Hume, T., Olsson, C., et al.",
    "year": 2022,
    "venue": "Anthropic",
    "url": "https://transformer-circuits.pub/2022/toy_model/index.html"
  },
  "olsson2022context": {
    "title": "In-context Learning and Induction Heads",
    "authors": "Olsson, C., Elhage, N., Nanda, N., et al.",
    "year": 2022,
    "venue": "Anthropic",
    "url": "https://transformer-circuits.pub/2022/in-context-learning-and-induction-heads/index.html"
  }
}
```

### CSS Tooltip for Citations
```css
/* Citation tooltip - desktop hover */
.citation {
  position: relative;
  display: inline;
}

.citation-number {
  text-decoration: none;
  color: var(--color-link);
  font-weight: 600;
}

.citation-tooltip {
  display: none;
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-text);
  color: var(--color-background);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: var(--font-size-small);
  line-height: 1.4;
  white-space: normal;
  width: max-content;
  max-width: 300px;
  z-index: 10;
  pointer-events: none;
}

/* Show on hover (desktop) */
.citation:hover .citation-tooltip,
.citation:focus-within .citation-tooltip {
  display: block;
}

/* Mobile: tap to expand inline */
@media (max-width: 767px) {
  .citation-tooltip {
    position: static;
    transform: none;
    display: none;
    background: var(--color-background-subtle);
    color: var(--color-text);
    margin: var(--spacing-xs) 0;
    width: 100%;
    max-width: 100%;
  }

  .citation:focus-within .citation-tooltip {
    display: block;
  }
}
```

### Base Layout Head Additions
```html
<!-- In base.njk <head> -->
<!-- KaTeX CSS for math rendering (version must match installed katex package) -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.28/dist/katex.min.css"
      integrity="sha384-..." crossorigin="anonymous">
<!-- PrismJS theme for code highlighting -->
<link rel="stylesheet" href="/css/prism-theme.css">
<!-- KaTeX overflow fixes -->
<link rel="stylesheet" href="/css/katex-overrides.css">
```

### Markdown Content Using All Content Types
```markdown
---
title: Understanding Superposition
description: How neural networks represent more features than dimensions
---

The key insight is that $d$-dimensional representations can encode
$n \gg d$ features using superposition {% cite "elhage2022toy" %}.

$$
\mathbf{W} = \sum_{i=1}^{n} f_i \mathbf{e}_i \mathbf{e}_i^T
$$

{% sidenote "This is analogous to compressed sensing in signal processing." %}

Here is a simple example in PyTorch:

```python
import torch

W = torch.randn(d_model, n_features)
features = W @ activations
```

![Superposition diagram](/images/superposition.png "Feature directions in a 2D model with 5 features")

<details class="pause-and-think">
<summary>Pause and think: What happens as sparsity increases?</summary>

As features become sparser, the model can pack more features into each
dimension because interference between features decreases...

</details>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Client-side KaTeX/MathJax JS | Build-time KaTeX via markdown-it plugin | 2020+ (plugin matured) | No flash of unrendered LaTeX, faster page load, no JS dependency |
| `output: "html"` only | `output: "htmlAndMathml"` | KaTeX 0.16+ | Both visual rendering and screen reader accessibility |
| JavaScript sidenotes libraries | CSS-only checkbox hack (Tufte CSS) | 2015+ (established) | No JS dependency, graceful degradation |
| BibTeX/CSL citation processing | JSON + shortcode for simple sites | Current trend for SSGs | Avoids heavyweight academic toolchain; sufficient for educational sites |
| markdown-it-katex (old) | @mdit/plugin-katex (maintained) | 2022+ | Old plugin unmaintained, requires manual KaTeX version override |
| Prism.js v1 (stalled) | @11ty/eleventy-plugin-syntaxhighlight v5 (PrismJS) | Active | Official Eleventy support, ESM, build-time only |

**Deprecated/outdated:**
- `markdown-it-katex`: Unmaintained, requires manual KaTeX version pinning. Use `@mdit/plugin-katex` instead.
- Client-side MathJax: 3-10x slower than KaTeX, larger bundle, unnecessary when build-time rendering is available.
- `prism-themes` as separate install: The Eleventy syntax highlight plugin bundles PrismJS; just include a CSS theme file.

## Open Questions

1. **KaTeX CSS: CDN vs. local copy**
   - What we know: CDN is simpler (one `<link>` tag); local copy avoids external dependency and works offline
   - What's unclear: Whether the site should avoid all external CDN dependencies for reliability
   - Recommendation: Start with CDN for simplicity; switch to local if offline support matters. The CSS is ~25KB gzipped.

2. **PrismJS theme selection**
   - What we know: Many themes exist; the site uses a light theme with cool blue (#004276) accent
   - What's unclear: Which theme best matches the Distill-inspired design
   - Recommendation: Start with `prism-one-light` or a custom theme derived from the site's CSS variables. The planner should include a task for theme selection/customization.

3. **Sidenote integration with existing grid layout**
   - What we know: `layout.css` already has a 3-column grid at 1400px+ with `/* Future: margin notes will use grid-column: 3 */`. Tufte CSS uses float-based positioning with negative margins.
   - What's unclear: Whether to use the existing CSS grid approach or Tufte's float approach for sidenotes
   - Recommendation: Use the existing CSS grid at 1400px+ (sidenotes in grid-column: 3), and fall back to Tufte's checkbox collapse below 1400px. The grid approach is cleaner and already scaffolded.

4. **Citation numbering: per-page vs. global**
   - What we know: Academic convention is per-page (or per-article) numbering; global numbering would require maintaining a master list
   - What's unclear: Whether to restart numbering at [1] for each article
   - Recommendation: Per-page numbering (restart at [1] per article). This matches academic paper convention and avoids cross-article coupling.

5. **Counter state across Eleventy builds**
   - What we know: Eleventy shortcodes using module-level counters may persist across incremental builds during `--serve` mode
   - What's unclear: Whether this causes duplicate or stale counter values
   - Recommendation: Reset counters using an `eleventy.before` event callback, or key counters by page URL and reset per build. Test during development.

## Sources

### Primary (HIGH confidence)
- [@mdit/plugin-katex docs](https://mdit-plugins.github.io/katex.html) - Plugin API, options, ESM usage
- [KaTeX options](https://katex.org/docs/options.html) - output, throwOnError, errorColor, maxSize
- [Eleventy Syntax Highlighting Plugin](https://www.11ty.dev/docs/plugins/syntaxhighlight/) - v5.x ESM config, PrismJS build-time
- [Eleventy Markdown docs](https://www.11ty.dev/docs/languages/markdown/) - setLibrary, amendLibrary API
- [Eleventy Global Data Files](https://www.11ty.dev/docs/data-global/) - _data directory, JSON files
- [Eleventy Shortcodes](https://www.11ty.dev/docs/shortcodes/) - addShortcode, addPairedShortcode API
- [Tufte CSS](https://edwardtufte.github.io/tufte-css/) - Sidenote HTML/CSS structure, checkbox hack, responsive behavior
- [Tufte CSS source](https://github.com/edwardtufte/tufte-css) - Actual CSS for sidenotes/margin notes
- [@mdit/plugin-figure docs](https://mdit-plugins.github.io/figure.html) - Figure plugin API

### Secondary (MEDIUM confidence)
- [Gwern sidenotes survey](https://gwern.net/sidenote) - Comprehensive review of sidenote implementations
- [KaTeX responsive issues (GitHub #455)](https://github.com/KaTeX/KaTeX/issues/455) - Overflow behavior, CSS fixes
- [KaTeX overflow discussion (#2942)](https://github.com/KaTeX/KaTeX/discussions/2942) - Vertical overflow with horizontal scroll
- [eleventy-plugin-citations](https://github.com/h-tex/eleventy-plugin-citations) - BibTeX/CSL approach (evaluated, not recommended)
- [CSS-only tooltips 2025 guide](https://dev.to/satyam_gupta_0d1ff2152dcc/css-tooltips-a-developers-guide-to-better-ux-2025-guide-5eoe) - Hover tooltip patterns, accessibility
- [11ty Math blog post](https://bkardell.com/blog/11tyMath.html) - MathML output approach
- [Prism vs highlight.js comparison](https://github.com/highlightjs/highlight.js/issues/3625) - Performance benchmarks, feature comparison
- [markdown-it-image-figures](https://github.com/Antonio-Laguna/markdown-it-image-figures) - Alternative figure plugin
- [Collapsible Markdown sections](https://gist.github.com/pierrejoubert73/902cc94d79424356a8d20be2b382e1ab) - details/summary in Markdown

### Tertiary (LOW confidence)
- Community blog posts on Eleventy + KaTeX integration patterns - verified against official docs
- CSS tooltip accessibility discussions - general guidance, specifics depend on implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified via official docs, npm, and plugin documentation
- Architecture: HIGH - Patterns verified against Eleventy docs, Tufte CSS source, and KaTeX docs
- Pitfalls: HIGH - Known issues documented in GitHub issues and official docs
- Citation system: MEDIUM - Custom implementation; pattern verified from CSS tooltip guides and Eleventy shortcode docs, but no single authoritative source for the combined approach

**Research date:** 2026-02-03
**Valid until:** 2026-03-03 (30 days - stable domain; KaTeX, PrismJS, and Eleventy not changing rapidly)
