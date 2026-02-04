# Phase 6: Search & Glossary - Research

**Researched:** 2026-02-04
**Domain:** Client-side static search (Pagefind) + build-time glossary generation (Eleventy data)
**Confidence:** HIGH

## Summary

Phase 6 adds two features: full-text search across all 35 articles and a curated glossary page of MI terms. Both must be generated at build time with no runtime dependencies.

For search, Pagefind is the standard solution for static sites and is explicitly specified in the requirements (SRCH-01). It runs as a post-build step, indexing the generated HTML and producing a static search bundle that loads in the browser. The Pagefind Default UI provides a drop-in search component with CSS variable theming. The site's existing `EleventyHtmlBasePlugin` with `pathPrefix: "/learn-mech-interp/"` will automatically transform Pagefind's CSS/JS paths, but the Pagefind UI `baseUrl` option must be set to match the pathPrefix so search result URLs resolve correctly.

For the glossary, Eleventy's global data file system (`src/_data/glossary.json`) is the natural approach. A Nunjucks template iterates over the structured data to render an alphabetically-organized glossary page at `/glossary/`. Each term includes a brief definition and links to the article sections where that term is discussed. This follows the same pattern already used for `references.json` and `learningPath.json`.

**Primary recommendation:** Install Pagefind as a dev dependency, run it via `execSync` in the `eleventy.after` event, add `data-pagefind-body` to the article content wrapper, create a dedicated search page at `/search/`, and create `glossary.json` as a global data file rendered by a Nunjucks template.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pagefind | 1.4.0 | Static full-text search indexing and UI | The standard for static site search; used by 11ty community, Eleventy docs itself uses it; specified in SRCH-01 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none needed) | - | - | Pagefind is self-contained; glossary uses existing Eleventy data cascade |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Pagefind | Lunr.js | Lunr requires manual index construction, larger bundle, no built-in UI |
| Pagefind | Algolia | External service, runtime dependency, violates SRCH-02 offline requirement |
| Pagefind Default UI | Custom search UI via Pagefind JS API | More control but significant extra work; Default UI is sufficient and themeable |

**Installation:**
```bash
npm install --save-dev pagefind
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── _data/
│   ├── glossary.json       # Curated MI glossary terms (new)
│   ├── learningPath.json   # Existing
│   └── references.json     # Existing
├── _includes/
│   └── layouts/
│       ├── base.njk         # Add Pagefind UI CSS/JS links
│       └── article.njk      # Add data-pagefind-body attribute
├── search/
│   └── index.njk            # Dedicated search page (new)
├── glossary/
│   └── index.njk            # Glossary page (new)
└── topics/
    └── */index.md           # Existing articles (indexed by Pagefind)
```

After build, Pagefind adds to `_site/`:
```
_site/
└── pagefind/
    ├── pagefind.js           # Search API
    ├── pagefind-ui.js        # Default UI component
    ├── pagefind-ui.css       # Default UI styles
    ├── pagefind-entry.json   # Index metadata
    ├── pagefind.*.pf_meta    # Fragment metadata files
    ├── pagefind.*.pf_index   # Index chunk files
    └── pagefind.*.pf_fragment # Content fragment files
```

### Pattern 1: Pagefind Integration via eleventy.after Event
**What:** Run Pagefind CLI after Eleventy builds the site, within the same build process.
**When to use:** Standard approach for Eleventy sites with fewer than ~3000 pages (this site has 37).
**Example:**
```javascript
// In eleventy.config.js (ESM syntax - this project uses "type": "module")
import { execSync } from "node:child_process";

export default function(eleventyConfig) {
  eleventyConfig.on("eleventy.after", () => {
    execSync(`npx pagefind --site _site`, {
      encoding: "utf-8",
      stdio: "inherit",
    });
  });

  // ... rest of config
}
```
**Source:** [Pagefind docs](https://pagefind.app/docs/), community pattern from [rknight.me](https://rknight.me/blog/using-pagefind-with-eleventy-for-search/), [slecache.com](https://slecache.com/posts/adding-pagefind-search-to-a-static-eleventy-site/)

### Pattern 2: data-pagefind-body for Content Scoping
**What:** Mark the article body as the indexable content area so Pagefind ignores sidebar, header, footer, navigation.
**When to use:** Always. Without this, search results include sidebar text and navigation labels.
**Example:**
```html
<!-- In article.njk layout -->
<div class="article-body" data-pagefind-body>
  {{ content | safe }}
</div>
```
**Important:** Once any page uses `data-pagefind-body`, pages WITHOUT it are excluded from the index entirely. The search page and glossary page should NOT have this attribute (they are reference pages, not content to search). The homepage also should not have it.
**Source:** [Pagefind indexing docs](https://pagefind.app/docs/indexing/)

### Pattern 3: Pagefind UI with pathPrefix
**What:** Configure Pagefind's Default UI to work with GitHub Pages subpath deployment.
**When to use:** This site uses `pathPrefix: "/learn-mech-interp/"`.
**Example:**
```html
<!-- Search page template (search/index.njk) -->
---
title: Search
layout: layouts/base.njk
---
<div class="search-page">
  <h1>Search</h1>
  <div id="search"></div>
</div>

<link href="/pagefind/pagefind-ui.css" rel="stylesheet">
<script src="/pagefind/pagefind-ui.js"></script>
<script>
  window.addEventListener('DOMContentLoaded', function() {
    new PagefindUI({
      element: "#search",
      showSubResults: true,
      showImages: false,
      baseUrl: "/learn-mech-interp/"
    });
  });
</script>
```
**Key detail:** The `<link href>` and `<script src>` paths will be automatically transformed by `EleventyHtmlBasePlugin` (verified: it processes both `link[href]` and `script[src]` via `@11ty/posthtml-urls`). So writing `/pagefind/pagefind-ui.css` in the template produces `/learn-mech-interp/pagefind/pagefind-ui.css` in the output HTML. However, the `baseUrl` inside the JavaScript string is NOT transformed by the plugin -- it must be hardcoded or dynamically set.
**Source:** [Pagefind UI docs](https://pagefind.app/docs/ui/), [Pagefind search config](https://pagefind.app/docs/search-config/), verified via `@11ty/posthtml-urls` source code

### Pattern 4: Glossary from Global Data File
**What:** Create `src/_data/glossary.json` containing MI terms with definitions and article links, rendered by a Nunjucks template.
**When to use:** This is Eleventy's standard pattern for data-driven pages.
**Example:**
```json
// src/_data/glossary.json
[
  {
    "term": "Activation Patching",
    "definition": "A causal intervention technique that replaces activations at specific model components to determine their functional role.",
    "links": [
      { "article": "/topics/activation-patching/", "section": "#how-activation-patching-works", "label": "Activation Patching" }
    ]
  },
  {
    "term": "Attention Head",
    "definition": "An individual attention computation within a multi-head attention layer, computing its own QK and OV circuits.",
    "links": [
      { "article": "/topics/attention-mechanism/", "section": "#multi-head-attention", "label": "The Attention Mechanism" },
      { "article": "/topics/qk-ov-circuits/", "section": "", "label": "QK and OV Circuits" }
    ]
  }
]
```

```html
<!-- src/glossary/index.njk -->
---
title: Glossary
layout: layouts/base.njk
---
<div class="glossary-page">
  <h1>MI Glossary</h1>
  <p>Key terms in mechanistic interpretability with links to where they are discussed.</p>

  <nav class="glossary-nav" aria-label="Glossary alphabetical navigation">
    {%- set letters = [] -%}
    {%- for entry in glossary -%}
      {%- set letter = entry.term | upper | truncate(1, true, "") -%}
      {%- if letter not in letters -%}
        {%- set _ = letters.push(letter) -%}
      {%- endif -%}
    {%- endfor -%}
    {%- for letter in letters -%}
      <a href="#letter-{{ letter }}">{{ letter }}</a>
    {%- endfor -%}
  </nav>

  {%- set currentLetter = "" -%}
  {%- for entry in glossary -%}
    {%- set letter = entry.term | upper | truncate(1, true, "") -%}
    {%- if letter != currentLetter -%}
      {%- set currentLetter = letter -%}
      <h2 id="letter-{{ letter }}">{{ letter }}</h2>
    {%- endif -%}
    <dl class="glossary-entry">
      <dt>{{ entry.term }}</dt>
      <dd>
        {{ entry.definition }}
        {%- if entry.links.length -%}
          <span class="glossary-links">See:
          {%- for link in entry.links -%}
            {% if loop.index > 1 %}, {% endif %}
            <a href="{{ link.article }}{{ link.section }}">{{ link.label }}</a>
          {%- endfor -%}
          </span>
        {%- endif -%}
      </dd>
    </dl>
  {%- endfor -%}
</div>
```
**Source:** Eleventy global data files pattern, consistent with existing `references.json` and `learningPath.json` usage in this project.

### Pattern 5: Pagefind CSS Theming Integration
**What:** Map Pagefind UI CSS variables to the site's existing CSS custom properties.
**When to use:** Always, to maintain visual consistency with the site design.
**Example:**
```css
/* In a new or existing CSS file */
.pagefind-ui {
  --pagefind-ui-scale: 0.9;
  --pagefind-ui-primary: var(--color-link, #004276);
  --pagefind-ui-text: var(--color-text, rgba(0, 0, 0, 0.87));
  --pagefind-ui-background: var(--color-background, #ffffff);
  --pagefind-ui-border: var(--color-border, rgba(0, 0, 0, 0.1));
  --pagefind-ui-tag: var(--color-background-subtle, rgba(0, 0, 0, 0.02));
  --pagefind-ui-border-width: 1px;
  --pagefind-ui-border-radius: var(--radius-md, 4px);
  --pagefind-ui-font: var(--font-body);
}
```
**Source:** [Pagefind UI usage docs](https://pagefind.app/docs/ui-usage/)

### Anti-Patterns to Avoid
- **Indexing the entire page without `data-pagefind-body`:** Search results will include sidebar navigation text, header, footer, and breadcrumb content, producing noisy and irrelevant results.
- **Using Pagefind Node.js API when CLI suffices:** The CLI approach is simpler and sufficient for a 37-page site. The Node.js API is for advanced use cases like custom records or in-memory indexing.
- **Creating a search page without a fallback for `--serve` mode:** Pagefind index is not available during `eleventy --serve` development. The search page should degrade gracefully (show empty search or a note).
- **Hardcoding pathPrefix in multiple places:** Use Eleventy's data cascade or global data to centralize the pathPrefix value if it needs to appear in JavaScript initialization.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Full-text search | Custom search index, inverted index | Pagefind | Handles tokenization, stemming, relevance ranking, fragment loading, offline support, WebAssembly-powered |
| Search UI | Custom search input, results rendering, debouncing | Pagefind Default UI | Handles input debouncing, result pagination, excerpt generation, keyboard navigation, accessibility |
| Alphabetical grouping for glossary | Custom sort/group logic in JS | Nunjucks template logic with sorted JSON data | Keep the data file pre-sorted alphabetically; template just iterates |

**Key insight:** Pagefind solves the hard parts of search (indexing, relevance ranking, incremental loading, offline support) with zero runtime dependencies. The only integration work is: (1) install it, (2) tell it what to index, (3) add the UI to a page. The glossary is straightforward Eleventy data rendering with no special libraries needed.

## Common Pitfalls

### Pitfall 1: pathPrefix Not Reflected in Search Result URLs
**What goes wrong:** Search results link to `/topics/sparse-autoencoders/` instead of `/learn-mech-interp/topics/sparse-autoencoders/`, producing 404s on GitHub Pages.
**Why it happens:** Pagefind's `baseUrl` defaults to `"/"`. The HTML in `_site/` contains the pathPrefix in links (added by EleventyHtmlBasePlugin), but Pagefind strips URLs to their path-only form during indexing.
**How to avoid:** Set `baseUrl: "/learn-mech-interp/"` in the PagefindUI constructor. This prepends the path prefix to all search result URLs.
**Warning signs:** Search works locally but result links 404 on GitHub Pages.

### Pitfall 2: Pages Without data-pagefind-body Disappear from Index
**What goes wrong:** After adding `data-pagefind-body` to the article layout, the homepage and other non-article pages vanish from search results.
**Why it happens:** When ANY page uses `data-pagefind-body`, Pagefind only indexes pages that have this attribute. Pages without it are completely excluded.
**How to avoid:** This is actually desired behavior for this site. We only want the 35 topic articles in the search index, not the homepage, search page, or glossary page. Verify this is intentional and document it.
**Warning signs:** Searching for "Learn Mechanistic Interpretability" (homepage title) returns no results.

### Pitfall 3: Sidebar and Navigation Content Polluting Search Results
**What goes wrong:** Searching for any topic name returns every page because the sidebar lists all topic names on every page.
**Why it happens:** Without `data-pagefind-body`, Pagefind indexes the full `<body>` including sidebar navigation.
**How to avoid:** Use `data-pagefind-body` on the `article-body` div. Pagefind also auto-excludes `<nav>` and `<footer>` elements, but explicit scoping with `data-pagefind-body` is more reliable.
**Warning signs:** Every search query returns all 35 articles.

### Pitfall 4: Search Not Working During Development
**What goes wrong:** The search page shows an error or empty results during `eleventy --serve`.
**Why it happens:** Pagefind runs after the build completes. In `--serve` mode with the `eleventy.after` event, the index IS generated on initial build, but subsequent incremental rebuilds during development may not re-run the indexer, or the pagefind directory may not exist if `_site` was cleaned.
**How to avoid:** Accept this limitation. Add a graceful fallback or note on the search page. Alternatively, run `npm run build` once to generate the index, then use `--serve`. The search page should handle the case where Pagefind resources are not available.
**Warning signs:** Console errors about missing `/pagefind/pagefind-ui.js`.

### Pitfall 5: KaTeX/Math Content in Search Index
**What goes wrong:** Search results contain raw LaTeX or garbled math notation in excerpts.
**Why it happens:** KaTeX renders math as complex HTML with many nested spans. Pagefind indexes the text content, which may include partial math symbols.
**How to avoid:** Add `data-pagefind-ignore` to math-heavy elements if excerpts look bad, OR accept that Pagefind handles this reasonably (it strips HTML tags from excerpts). Test with actual content to verify. Pagefind's built-in handling of HTML is generally good enough.
**Warning signs:** Search excerpts showing broken math like "x W d f" instead of meaningful text.

### Pitfall 6: Glossary Data Becoming Stale
**What goes wrong:** Glossary links point to article sections that have been renamed or removed.
**Why it happens:** Glossary section links (e.g., `#how-activation-patching-works`) are tightly coupled to heading text. When article headings change, the anchor IDs change (via markdown-it-anchor + slugify), but the glossary JSON is not updated.
**How to avoid:** Use broad article-level links (e.g., `/topics/activation-patching/`) as the primary link, with section anchors as optional enhancements. Document in the glossary JSON format that section anchors may break and should be verified periodically.
**Warning signs:** Clicking glossary links scrolls to the top of the article instead of the specific section.

### Pitfall 7: GitHub Actions Build Not Including Pagefind Step
**What goes wrong:** Search works locally but the deployed site has no search index.
**Why it happens:** The current deploy.yml runs `npx @11ty/eleventy` directly, and if Pagefind is integrated via the `eleventy.after` event in the config, it should run automatically. However, if using the `package.json` script approach instead, the deploy workflow must be updated to use `npm run build`.
**How to avoid:** Use the `eleventy.after` event approach so Pagefind runs automatically as part of any Eleventy build, regardless of how the build is invoked. The current deploy.yml runs `npx @11ty/eleventy` which triggers the config and its events.
**Warning signs:** Deployed site has no `/pagefind/` directory.

## Code Examples

### Build Integration (eleventy.config.js addition)
```javascript
// Source: Pagefind docs + Eleventy community pattern
// Add to existing eleventy.config.js
import { execSync } from "node:child_process";

// Inside the default export function:
eleventyConfig.on("eleventy.after", () => {
  execSync(`npx pagefind --site _site`, {
    encoding: "utf-8",
    stdio: "inherit",
  });
});
```

### Article Layout Indexing (article.njk modification)
```html
<!-- Add data-pagefind-body to the content wrapper -->
<div class="article-body" data-pagefind-body>
  {{ content | safe }}
</div>
```

### Search Page (search/index.njk)
```html
---
title: Search
layout: layouts/base.njk
---
<div class="search-page">
  <h1>Search Articles</h1>
  <div id="search"></div>
</div>

<link href="/pagefind/pagefind-ui.css" rel="stylesheet">
<script src="/pagefind/pagefind-ui.js"></script>
<script>
  window.addEventListener('DOMContentLoaded', function() {
    new PagefindUI({
      element: "#search",
      showSubResults: true,
      showImages: false,
      baseUrl: "/learn-mech-interp/"
    });
  });
</script>
```

### Glossary Data Structure (glossary.json)
```json
[
  {
    "term": "Sparse Autoencoder (SAE)",
    "definition": "A neural network with an overcomplete latent space trained with a sparsity penalty to decompose model activations into interpretable features.",
    "links": [
      { "article": "/topics/sparse-autoencoders/", "label": "Sparse Autoencoders" },
      { "article": "/topics/sae-interpretability/", "label": "Feature Dashboards" }
    ]
  }
]
```

### Pagefind UI Theming (CSS)
```css
/* Map Pagefind UI variables to site design tokens */
.pagefind-ui {
  --pagefind-ui-scale: 0.9;
  --pagefind-ui-primary: var(--color-link, #004276);
  --pagefind-ui-text: var(--color-text, rgba(0, 0, 0, 0.87));
  --pagefind-ui-background: var(--color-background, #ffffff);
  --pagefind-ui-border: var(--color-border, rgba(0, 0, 0, 0.1));
  --pagefind-ui-tag: var(--color-background-subtle, rgba(0, 0, 0, 0.02));
  --pagefind-ui-border-width: 1px;
  --pagefind-ui-border-radius: var(--radius-md, 4px);
  --pagefind-ui-font: var(--font-body);
}
```

### Header Navigation Update (header.njk)
```html
<header class="site-header">
  <nav class="site-nav" aria-label="Main navigation">
    <a href="/" class="site-logo">Learn MI</a>
    <ul class="nav-links">
      <li><a href="/topics/">Topics</a></li>
      <li><a href="/glossary/">Glossary</a></li>
      <li><a href="/search/">Search</a></li>
    </ul>
    <button class="sidebar-toggle" aria-expanded="false" aria-controls="sidebar" aria-label="Toggle navigation menu" hidden>
      <span class="hamburger-icon" aria-hidden="true"></span>
    </button>
  </nav>
</header>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Lunr.js (client-side index built at build time, full index downloaded) | Pagefind (WebAssembly-powered, incremental chunk loading) | 2022-2023 | Dramatically smaller initial download; search works on sites with thousands of pages |
| External search services (Algolia, Meilisearch) | Static search bundles (Pagefind) | 2022-2023 | No runtime dependencies, no API keys, works offline, free |
| Manual search page with JSON index | Pagefind Default UI with CSS variable theming | Pagefind 1.0+ | Drop-in UI component with accessibility, debouncing, pagination built in |

**Deprecated/outdated:**
- Lunr.js: Still works but requires downloading the entire index upfront (Pagefind loads chunks incrementally)
- elasticlunr: Unmaintained, same limitations as Lunr
- DocSearch (Algolia): Requires external service, application process; overkill for a personal learning site

## Open Questions

1. **pathPrefix in Pagefind UI baseUrl**
   - What we know: `baseUrl: "/learn-mech-interp/"` must be set in the PagefindUI constructor for GitHub Pages deployment
   - What's unclear: Whether to hardcode this or dynamically read it from a data attribute or Eleventy-injected value
   - Recommendation: Hardcode it in the search page template. The pathPrefix is already hardcoded in `eleventy.config.js` and is unlikely to change. If it does change, it would require updates in multiple places anyway.

2. **Glossary content scope**
   - What we know: The glossary should contain MI terms with definitions and links to articles
   - What's unclear: How many terms to include, and whether to auto-extract terms from article content or manually curate them
   - Recommendation: Manually curate. Start with key terms from each of the 8 blocks (roughly 60-100 terms). Extracting terms automatically from markdown would require custom tooling and is error-prone. The `glossary.json` format is easy to maintain and extend.

3. **Search accessibility on the search page vs. inline header search**
   - What we know: Requirements specify a "search box" (SRCH-01) that returns results
   - What's unclear: Whether search should be a dedicated page, an inline component in the header, or both
   - Recommendation: Start with a dedicated search page linked from the header navigation. An inline search in the header adds complexity (overlay/modal behavior, mobile handling) and is not required by the success criteria. The search page is simpler and fully satisfies all requirements.

4. **Pagefind behavior with KaTeX HTML output**
   - What we know: KaTeX renders math as complex nested HTML spans. Pagefind processes text content within HTML.
   - What's unclear: Whether Pagefind excerpts will display garbled math fragments
   - Recommendation: Test after initial integration. If math appears garbled in excerpts, add `data-pagefind-ignore` to `<span class="katex">` elements via Pagefind's `exclude_selectors` CLI option.

## Sources

### Primary (HIGH confidence)
- [Pagefind official docs](https://pagefind.app/docs/) - Installation, configuration, indexing, UI, API, hosting
- [Pagefind UI configuration](https://pagefind.app/docs/ui/) - CSS variables, constructor options, baseUrl
- [Pagefind search config](https://pagefind.app/docs/search-config/) - Browser-side configuration including baseUrl and bundlePath
- [Pagefind indexing docs](https://pagefind.app/docs/indexing/) - data-pagefind-body, data-pagefind-ignore, built-in exclusions
- [Pagefind metadata docs](https://pagefind.app/docs/metadata/) - data-pagefind-meta, automatic metadata extraction
- [Pagefind weighting docs](https://pagefind.app/docs/weighting/) - Heading weight defaults (h1=7, h2=6, etc.)
- [Pagefind Node.js API](https://pagefind.app/docs/node-api/) - createIndex, addDirectory, writeFiles
- [Pagefind CLI config](https://pagefind.app/docs/config-options/) - site, exclude_selectors, output-subdir
- `@11ty/posthtml-urls` source code (verified locally) - Confirms `link[href]` and `script[src]` are both transformed by EleventyHtmlBasePlugin
- [Eleventy HTML Base Plugin docs](https://www.11ty.dev/docs/plugins/html-base/) - pathPrefix transformation behavior
- npm registry: `pagefind` version 1.4.0 (verified via `npm view pagefind version`)

### Secondary (MEDIUM confidence)
- [Per Mortensen: Adding Pagefind to an Eleventy site](https://permortensen.com/adding-pagefind-to-an-eleventy-site/) - Node.js API integration pattern
- [Robb Knight: Using PageFind with Eleventy](https://rknight.me/blog/using-pagefind-with-eleventy-for-search/) - CLI integration via eleventy.after
- [slecache: Adding Pagefind Search to Eleventy](https://slecache.com/posts/adding-pagefind-search-to-a-static-eleventy-site/) - Complete integration walkthrough with data attributes and CSS theming
- [Chris McLeod: pagefind-search web component](https://chrismcleod.dev/blog/adding-site-search-eleventy-pagefind-web-component/) - Alternative web component approach (by Zach Leatherman)

### Tertiary (LOW confidence)
- (none - all findings verified with official docs or source code)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Pagefind is the clear standard; version verified on npm; official docs thoroughly reviewed
- Architecture: HIGH - Integration patterns verified with official docs and multiple community implementations; pathPrefix handling verified via source code inspection of @11ty/posthtml-urls
- Pitfalls: HIGH - All pitfalls derived from documented behavior (data-pagefind-body exclusion, baseUrl default) or verified source code analysis (EleventyHtmlBasePlugin attribute list)

**Research date:** 2026-02-04
**Valid until:** 2026-04-04 (Pagefind is stable; no major version changes expected)
