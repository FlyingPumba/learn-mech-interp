# Phase 5: Navigation & Information Architecture - Research

**Researched:** 2026-02-04
**Domain:** Eleventy navigation, sidebar, breadcrumbs, TOC, learning path data model
**Confidence:** HIGH

## Summary

Phase 5 adds multi-path navigation to the site: a sidebar topic hierarchy, homepage learning path, breadcrumbs, prev/next links, in-page table of contents, and article metadata indicators (prerequisites, difficulty). The site already has a basic header with a "Topics" link, a hero section on the homepage, and article front matter with `prerequisites`, `difficulty`, and `block` fields. The work is primarily about wiring these together with Eleventy's data cascade, the official navigation plugin, and CSS layout changes.

The standard approach uses three pillars: (1) `@11ty/eleventy-navigation` plugin for sidebar hierarchy and breadcrumbs, (2) a global data file (`_data/learningPath.json`) defining the ordered learning path for prev/next links and homepage visualization, and (3) Eleventy's built-in `IdAttributePlugin` (v3.0.0+) combined with `eleventy-plugin-toc` for auto-generated table of contents. The sidebar hamburger menu on mobile requires minimal JavaScript for proper accessibility (the CSS-only checkbox hack has well-documented accessibility problems).

**Primary recommendation:** Use `@11ty/eleventy-navigation` for sidebar + breadcrumbs, a global data file for learning path ordering, Eleventy's built-in `IdAttributePlugin` for heading anchors, `eleventy-plugin-toc` for TOC generation, and a small JS snippet (~15 lines) for the mobile hamburger toggle with proper ARIA attributes.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@11ty/eleventy-navigation` | 1.0.5 | Sidebar hierarchy + breadcrumbs | Official Eleventy plugin, used on 11ty.dev itself, supports ESM import |
| `eleventy-plugin-toc` | 1.1.5 | Auto-generate TOC from rendered content | Most widely used Eleventy TOC plugin, simple filter-based API |
| Eleventy `IdAttributePlugin` | built-in (v3.0.0+) | Add `id` attributes to headings | Built into Eleventy 3, no extra dependency, works across all template languages |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `markdown-it-anchor` | 9.x | Add heading IDs for markdown content | Alternative to IdAttributePlugin if more control needed over markdown heading slugification |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `eleventy-plugin-toc` | `@uncenter/eleventy-plugin-toc` | More actively maintained fork with nested TOC support; original is simpler and sufficient for flat h2/h3 list |
| `eleventy-plugin-toc` | Hand-rolled TOC filter with cheerio | Full control but reinvents the wheel; the plugin is ~50 lines of logic |
| `IdAttributePlugin` | `markdown-it-anchor` | markdown-it-anchor only works with Markdown; IdAttributePlugin works across all template types |
| `@11ty/eleventy-navigation` | Custom collection + manual hierarchy | Navigation plugin handles breadcrumbs, hierarchy, ordering, active states out of the box |

**Installation:**
```bash
npm install @11ty/eleventy-navigation eleventy-plugin-toc
```

## Architecture Patterns

### Recommended Data Model

The learning path order and topic metadata should be centralized in a global data file. Articles already have `block`, `difficulty`, and `prerequisites` in front matter. The missing piece is a canonical ordering.

```
src/_data/
├── references.json      # (exists) citation data
└── learningPath.json    # (new) ordered list of topics with block groupings
```

Example `learningPath.json`:
```json
{
  "blocks": [
    {
      "slug": "transformer-foundations",
      "title": "Transformer Foundations",
      "topics": [
        { "slug": "attention-mechanism", "title": "The Attention Mechanism" }
      ]
    },
    {
      "slug": "superposition-and-feature-extraction",
      "title": "Superposition & Feature Extraction",
      "topics": [
        { "slug": "superposition", "title": "The Superposition Hypothesis" }
      ]
    },
    {
      "slug": "observation-to-causation",
      "title": "Observation to Causation",
      "topics": [
        { "slug": "activation-patching", "title": "Activation Patching and Causal Interventions" }
      ]
    }
  ]
}
```

This data file serves four purposes:
1. **Sidebar hierarchy** (blocks as groups, topics as items)
2. **Homepage learning path visualization** (ordered blocks with topics)
3. **Prev/next links** (flatten the topics array for sequential navigation)
4. **Breadcrumbs** (topic -> block -> home)

### Pattern 1: Navigation Plugin for Sidebar + Breadcrumbs

**What:** Use `@11ty/eleventy-navigation` with `eleventyNavigation` front matter for each article, deriving `key`, `parent`, and `order` from existing front matter fields.

**When to use:** Sidebar rendering and breadcrumb generation.

**Implementation approach:**

Add `eleventyNavigation` to the topics directory data file (`topics.11tydata.js`) so it's automatically computed from existing front matter:

```js
// src/topics/topics.11tydata.js
export default {
  layout: "layouts/article.njk",
  permalink: "/topics/{{ page.fileSlug }}/",
  eleventyComputed: {
    eleventyNavigation: (data) => ({
      key: data.title,
      parent: data.block,
      order: data.order || 0
    })
  }
};
```

Render the sidebar using a Nunjucks recursive macro in a partial:

```nunjucks
{# src/_includes/partials/sidebar.njk #}
{% set navPages = collections.all | eleventyNavigation %}

{% macro renderNavItem(entry) %}
<li>
  {% if entry.children.length %}
    <details {% if entry.children | selectattr("url", "equalto", page.url) | first %}open{% endif %}>
      <summary>{{ entry.title }}</summary>
      <ul>
        {% for child in entry.children %}{{ renderNavItem(child) }}{% endfor %}
      </ul>
    </details>
  {% else %}
    <a href="{{ entry.url }}"{% if entry.url == page.url %} aria-current="page"{% endif %}>
      {{ entry.title }}
    </a>
  {% endif %}
</li>
{% endmacro %}

<nav class="sidebar-nav" aria-label="Topics">
  <ul>
    {% for entry in navPages %}{{ renderNavItem(entry) }}{% endfor %}
  </ul>
</nav>
```

Breadcrumbs use the same plugin:

```nunjucks
{# In article.njk layout #}
{% if eleventyNavigation %}
  {% set crumbs = collections.all | eleventyNavigationBreadcrumb(eleventyNavigation.key) %}
  <nav class="breadcrumbs" aria-label="Breadcrumb">
    <ol>
      <li><a href="/">Home</a></li>
      {% for crumb in crumbs %}
        <li><a href="{{ crumb.url }}">{{ crumb.title }}</a></li>
      {% endfor %}
      <li aria-current="page">{{ title }}</li>
    </ol>
  </nav>
{% endif %}
```

### Pattern 2: Data-Driven Prev/Next Links

**What:** Use the `learningPath.json` global data file to create a custom Eleventy collection sorted in learning path order, then use `getPreviousCollectionItem` and `getNextCollectionItem` filters.

**When to use:** Bottom-of-article prev/next navigation.

```js
// In eleventy.config.js
eleventyConfig.addCollection("learningPath", function(collectionApi) {
  const allTopics = collectionApi.getFilteredByGlob("src/topics/*/index.md");
  // Sort by learningPath.json order (accessed via data cascade)
  // The data file flattens blocks -> topics into a single ordered array
  return allTopics.sort((a, b) => {
    // Use the learningPath data to determine order
    const pathOrder = getLearningPathOrder(); // helper to flatten blocks->topics
    const aIndex = pathOrder.indexOf(a.fileSlug);
    const bIndex = pathOrder.indexOf(b.fileSlug);
    return aIndex - bIndex;
  });
});
```

In the article layout:

```nunjucks
{% set prevArticle = collections.learningPath | getPreviousCollectionItem(page) %}
{% set nextArticle = collections.learningPath | getNextCollectionItem(page) %}

<nav class="article-nav" aria-label="Article navigation">
  {% if prevArticle %}
    <a href="{{ prevArticle.url }}" class="article-nav-prev">
      Previous: {{ prevArticle.data.title }}
    </a>
  {% endif %}
  {% if nextArticle %}
    <a href="{{ nextArticle.url }}" class="article-nav-next">
      Next: {{ nextArticle.data.title }}
    </a>
  {% endif %}
</nav>
```

### Pattern 3: Auto-Generated Table of Contents

**What:** Use Eleventy's built-in `IdAttributePlugin` to add `id` attributes to all headings, then use `eleventy-plugin-toc` to generate a TOC from the rendered content.

**When to use:** Fixed sidebar TOC on wide screens, collapsed/hidden on mobile.

```js
// In eleventy.config.js
import { IdAttributePlugin } from "@11ty/eleventy";
import pluginTOC from "eleventy-plugin-toc";

eleventyConfig.addPlugin(IdAttributePlugin);
eleventyConfig.addPlugin(pluginTOC, {
  tags: ["h2", "h3"],
  wrapper: "nav",
  wrapperClass: "toc",
  ul: true
});
```

In the article layout:

```nunjucks
<aside class="article-toc">
  <h2 class="toc-title">Contents</h2>
  {{ content | toc | safe }}
</aside>
<div class="article-body">
  {{ content | safe }}
</div>
```

CSS for sticky positioning on wide screens:

```css
.article-toc {
  display: none; /* hidden on mobile */
}

@media (min-width: 1200px) {
  .article-toc {
    display: block;
    position: sticky;
    top: 2rem;
    align-self: start;
    max-height: calc(100vh - 4rem);
    overflow-y: auto;
    font-size: 0.875rem;
  }
}
```

### Pattern 4: Mobile Hamburger Menu

**What:** Minimal JavaScript toggle for the sidebar on mobile, with proper ARIA attributes.

**Why not CSS-only:** The checkbox hack has well-documented accessibility problems: (1) `aria-expanded` cannot be managed in CSS alone, (2) screen readers cannot determine the menu's state, (3) semantic mismatch (checkboxes are for form input, not toggle controls). Multiple accessibility experts recommend against it.

**Implementation:** Progressive enhancement pattern.

```html
<!-- In header.njk -->
<button class="sidebar-toggle" aria-expanded="false" aria-controls="sidebar"
        aria-label="Toggle navigation" hidden>
  <span class="hamburger-icon"></span>
</button>
```

```js
// sidebar-toggle.js (~15 lines)
const toggle = document.querySelector('.sidebar-toggle');
const sidebar = document.getElementById('sidebar');
if (toggle && sidebar) {
  toggle.hidden = false; // Show button only when JS is available
  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    sidebar.classList.toggle('sidebar-open');
  });
}
```

```css
/* Mobile: sidebar hidden by default, slides in when open */
@media (max-width: 767px) {
  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    position: fixed;
    top: 0;
    left: 0;
    width: 280px;
    height: 100vh;
    z-index: 50;
    overflow-y: auto;
    background: var(--color-background);
  }
  .sidebar.sidebar-open {
    transform: translateX(0);
  }
}
```

### Pattern 5: Difficulty Badges

**What:** Visual difficulty indicators using CSS classes derived from front matter.

```nunjucks
{% if difficulty %}
  <span class="difficulty-badge difficulty-{{ difficulty }}">
    {{ difficulty | capitalize }}
  </span>
{% endif %}
```

```css
.difficulty-badge {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.2em 0.6em;
  border-radius: 3px;
}
.difficulty-foundational { background: #e8f5e9; color: #2e7d32; }
.difficulty-intermediate { background: #fff3e0; color: #e65100; }
.difficulty-advanced { background: #fce4ec; color: #c62828; }
```

### Recommended Layout Changes

The current layout is a single-column centered layout. Phase 5 needs a multi-column layout on wide screens:

```
Desktop (1200px+):
┌──────────────────────────────────────────────────┐
│ Header                                            │
├─────────┬──────────────────────────┬─────────────┤
│ Sidebar │ Article Content          │ TOC         │
│ (nav)   │ (65ch, centered)         │ (sticky)    │
│         │                          │             │
├─────────┴──────────────────────────┴─────────────┤
│ Prev/Next Navigation                              │
├──────────────────────────────────────────────────┤
│ Footer                                            │
└──────────────────────────────────────────────────┘

Mobile (< 768px):
┌────────────────────┐
│ Header + Hamburger │
├────────────────────┤
│ Breadcrumbs        │
├────────────────────┤
│ Article Content    │
├────────────────────┤
│ Prev/Next          │
├────────────────────┤
│ Footer             │
└────────────────────┘
```

This requires restructuring the grid. The current 1400px+ breakpoint uses a 3-column grid for sidenotes. The sidebar should be placed outside the article grid, using the overall page layout, while the TOC goes in the right margin where sidenotes currently live.

**Key CSS approach:**

```css
/* Page-level grid for sidebar + content */
@media (min-width: 1200px) {
  .page-with-sidebar {
    display: grid;
    grid-template-columns: 240px 1fr;
    max-width: 1400px;
    margin: 0 auto;
  }
}

/* Article-level grid for content + TOC */
@media (min-width: 1400px) {
  .article {
    display: grid;
    grid-template-columns: 1fr minmax(auto, 65ch) 250px;
  }
}
```

### Anti-Patterns to Avoid

- **Hardcoding navigation order in templates:** Use data files or front matter to drive ordering, not template logic
- **CSS-only hamburger menu with checkbox hack:** Inaccessible to screen readers, cannot manage `aria-expanded` state, semantic mismatch
- **Using `display: none` for mobile sidebar:** Use `visibility: hidden` + `transform` to properly manage focus without layout jumps
- **Putting TOC in the content file:** The `toc` filter requires the `content` template variable, which is only available in layout templates
- **Nesting sidebar inside `<main>`:** The sidebar is site-wide navigation, not part of the main content area; keep it as a sibling of `<main>`

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Topic hierarchy for sidebar | Manual nested list in template | `@11ty/eleventy-navigation` plugin | Handles depth, ordering, active states, breadcrumbs automatically |
| Heading IDs for anchor links | Custom markdown-it rule | `IdAttributePlugin` (built-in) | Built into Eleventy 3, deduplicates, handles all template types |
| TOC generation from headings | Custom HTML parser + list builder | `eleventy-plugin-toc` | Parses rendered HTML, handles nesting, configurable tag selection |
| Prev/next collection items | Manual index lookup in arrays | `getPreviousCollectionItem` / `getNextCollectionItem` filters | Built-in Eleventy filters, handle edge cases (first/last item) |

**Key insight:** Eleventy's data cascade and plugin ecosystem already solve every sub-problem in this phase. The work is integration and layout, not building navigation primitives.

## Common Pitfalls

### Pitfall 1: TOC Plugin Requires Heading IDs
**What goes wrong:** TOC generates empty output because headings have no `id` attributes.
**Why it happens:** Markdown rendering doesn't add heading IDs by default in Eleventy.
**How to avoid:** Register `IdAttributePlugin` BEFORE the TOC plugin. Verify headings have IDs in the built output.
**Warning signs:** Empty `<nav class="toc"></nav>` in rendered pages.

### Pitfall 2: Navigation Plugin Parent Keys Must Exist
**What goes wrong:** Articles don't appear in the sidebar hierarchy.
**Why it happens:** The `parent` value in `eleventyNavigation` references a key that doesn't exist (no page or virtual key for that parent).
**How to avoid:** Create placeholder pages for block-level categories with `permalink: false` and `eleventyNavigation.key` matching the block slug, or use the navigation plugin's virtual pages feature.
**Warning signs:** Topics appear as top-level items instead of nested under blocks.

### Pitfall 3: Sidenote Layout Conflict with New Grid
**What goes wrong:** Sidenotes break when the article grid changes from 3-column to accommodate the sidebar.
**Why it happens:** The current sidenote CSS uses `float: right; margin-right: -60%` which depends on the article being in a specific grid context.
**How to avoid:** Test sidenotes at all breakpoints after grid changes. The sidebar grid is at the page level, the sidenote grid is at the article level. They should be independent as long as the article grid structure is preserved within its column.
**Warning signs:** Sidenotes overlapping content or disappearing on wide screens.

### Pitfall 4: CJS Plugin in ESM Project
**What goes wrong:** `eleventy-plugin-toc` is a CommonJS package; importing it in an ESM project may cause errors.
**Why it happens:** The project uses `"type": "module"` in `package.json`, and `eleventy-plugin-toc` uses `module.exports`.
**How to avoid:** Node.js 22+ can `require()` ESM modules. Use `import pluginTOC from "eleventy-plugin-toc"` which works because Node.js can import CJS from ESM. If issues arise, use `const pluginTOC = (await import("eleventy-plugin-toc")).default`.
**Warning signs:** `ERR_REQUIRE_ESM` or `Cannot find module` errors during build.

### Pitfall 5: Sticky TOC Overflow
**What goes wrong:** Sticky TOC extends beyond viewport on long articles with many headings.
**Why it happens:** No `max-height` or `overflow-y: auto` set on the sticky element.
**How to avoid:** Set `max-height: calc(100vh - offset)` and `overflow-y: auto` on the TOC container.
**Warning signs:** TOC content cut off at bottom of viewport with no scroll.

### Pitfall 6: eleventyComputed Circular Reference
**What goes wrong:** Build fails with stack overflow when using `eleventyComputed` for navigation data.
**Why it happens:** `eleventyComputed` functions that reference other computed values can create circular dependencies.
**How to avoid:** Keep computed navigation data simple, referencing only raw front matter values (`data.title`, `data.block`), not other computed values.
**Warning signs:** Maximum call stack exceeded errors during build.

## Code Examples

### Complete eleventy.config.js Changes

```js
// Add to eleventy.config.js
import { IdAttributePlugin } from "@11ty/eleventy";
import eleventyNavigationPlugin from "@11ty/eleventy-navigation";
import pluginTOC from "eleventy-plugin-toc";

// Inside the default export function:
eleventyConfig.addPlugin(IdAttributePlugin);
eleventyConfig.addPlugin(eleventyNavigationPlugin);
eleventyConfig.addPlugin(pluginTOC, {
  tags: ["h2", "h3"],
  wrapper: "",        // We wrap manually in template for more control
  wrapperClass: "",
  ul: true
});

// Learning path collection (sorted by learningPath.json order)
eleventyConfig.addCollection("learningPath", function(collectionApi) {
  const fs = await import("fs");
  const pathData = JSON.parse(
    fs.readFileSync("src/_data/learningPath.json", "utf-8")
  );
  const order = pathData.blocks.flatMap(b => b.topics.map(t => t.slug));
  const topics = collectionApi.getFilteredByGlob("src/topics/*/index.md");
  return topics.sort((a, b) => {
    return order.indexOf(a.fileSlug) - order.indexOf(b.fileSlug);
  });
});
```

### Updated Article Layout (article.njk)

```nunjucks
---
layout: layouts/base.njk
---
{# Breadcrumbs #}
{% if eleventyNavigation %}
  {% set crumbs = collections.all | eleventyNavigationBreadcrumb(eleventyNavigation.key) %}
  <nav class="breadcrumbs" aria-label="Breadcrumb">
    <ol>
      <li><a href="/">Home</a></li>
      {% for crumb in crumbs %}
        <li><a href="{{ crumb.url }}">{{ crumb.title }}</a></li>
      {% endfor %}
      <li aria-current="page">{{ title }}</li>
    </ol>
  </nav>
{% endif %}

<article class="article">
  <header class="article-header">
    {# Difficulty badge #}
    {% if difficulty %}
      <span class="difficulty-badge difficulty-{{ difficulty }}">{{ difficulty | capitalize }}</span>
    {% endif %}
    <h1 class="article-title">{{ title }}</h1>
    {% if description %}
      <p class="article-description">{{ description }}</p>
    {% endif %}
    {# Prerequisites #}
    {% if prerequisites and prerequisites.length %}
      <div class="article-prerequisites">
        <strong>Prerequisites:</strong>
        {% for prereq in prerequisites %}
          {% if loop.index > 1 %}, {% endif %}
          <a href="{{ prereq.url }}">{{ prereq.title }}</a>
        {% endfor %}
      </div>
    {% endif %}
  </header>

  <div class="article-content-wrapper">
    {# In-page TOC (wide screens) #}
    <aside class="article-toc" aria-label="Table of contents">
      <h2 class="toc-heading">Contents</h2>
      {{ content | toc | safe }}
    </aside>

    <div class="article-body">
      {{ content | safe }}
    </div>
  </div>
</article>

{# Prev/Next navigation #}
{% set prevArticle = collections.learningPath | getPreviousCollectionItem %}
{% set nextArticle = collections.learningPath | getNextCollectionItem %}
{% if prevArticle or nextArticle %}
<nav class="article-nav" aria-label="Article navigation">
  {% if prevArticle %}
    <a href="{{ prevArticle.url }}" class="article-nav-link article-nav-prev">
      <span class="article-nav-label">Previous</span>
      <span class="article-nav-title">{{ prevArticle.data.title }}</span>
    </a>
  {% endif %}
  {% if nextArticle %}
    <a href="{{ nextArticle.url }}" class="article-nav-link article-nav-next">
      <span class="article-nav-label">Next</span>
      <span class="article-nav-title">{{ nextArticle.data.title }}</span>
    </a>
  {% endif %}
</nav>
{% endif %}
```

### Homepage Learning Path Visualization

```nunjucks
{# On homepage, iterate over learningPath data #}
<section class="learning-path">
  <h2>Learning Path</h2>
  <p class="learning-path-description">Follow this suggested reading order, or jump to any topic.</p>
  <ol class="learning-path-blocks">
    {% for block in learningPath.blocks %}
    <li class="learning-path-block">
      <h3 class="learning-path-block-title">{{ block.title }}</h3>
      <ol class="learning-path-topics">
        {% for topic in block.topics %}
        <li>
          <a href="/topics/{{ topic.slug }}/">{{ topic.title }}</a>
        </li>
        {% endfor %}
      </ol>
    </li>
    {% endfor %}
  </ol>
</section>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `markdown-it-anchor` for heading IDs | Eleventy `IdAttributePlugin` (built-in) | Eleventy 3.0.0 (2024) | No extra dependency, works with all template types |
| CSS checkbox hack for mobile nav | JS `<button>` with `aria-expanded` | Industry consensus ~2020+ | Proper screen reader support, semantic correctness |
| Manual prev/next indexing | `getPreviousCollectionItem` / `getNextCollectionItem` filters | Eleventy 0.11.0 (2020) | Built-in, handles edge cases |

**Deprecated/outdated:**
- `markdown-it-anchor` for heading IDs: Still works but `IdAttributePlugin` is the built-in solution for Eleventy 3. May still want `markdown-it-anchor` if you need permalink anchors (clickable link icons next to headings), which `IdAttributePlugin` does not provide.

## Open Questions

1. **TOC plugin ESM compatibility**
   - What we know: `eleventy-plugin-toc` is CJS. Node.js ESM can import CJS modules. The project uses Eleventy 3.1.2 with `"type": "module"`.
   - What's unclear: Whether `import pluginTOC from "eleventy-plugin-toc"` works out of the box or needs a dynamic import workaround.
   - Recommendation: Try the simple `import` first. If it fails, use `const { default: pluginTOC } = await import("eleventy-plugin-toc")` in an async config function. If that also fails, hand-roll a ~30-line TOC filter using regex or a simple HTML parser.

2. **Block-level navigation keys**
   - What we know: The navigation plugin needs parent keys to exist. Blocks (e.g., "transformer-foundations") are categories, not pages.
   - What's unclear: Whether virtual pages with `permalink: false` or a data-only approach works best for defining block-level nav entries.
   - Recommendation: Create lightweight `.md` files for each block at `src/topics/blocks/transformer-foundations.md` with `permalink: false` and `eleventyNavigation.key` set to the block slug. Alternatively, define them in `topics.11tydata.js` using `eleventyComputed`. Test both approaches; the former is simpler.

3. **Grid layout conflict with sidenotes**
   - What we know: Sidenotes currently use `float: right; margin-right: -60%` in the article body, relying on a 3-column grid at 1400px+.
   - What's unclear: Whether adding a sidebar column outside the article will interfere with the sidenote float positioning.
   - Recommendation: The page-level grid (sidebar + main content area) and the article-level grid (content + sidenotes) should be independent. The sidebar column contains the sidebar nav; the main content column contains the article which has its own internal grid. Test at 1200px, 1400px, and 1600px+ to verify no conflicts.

## Sources

### Primary (HIGH confidence)
- [Eleventy Navigation Plugin docs](https://www.11ty.dev/docs/plugins/navigation/) - full API, breadcrumbs, rendering options
- [Eleventy IdAttributePlugin docs](https://www.11ty.dev/docs/plugins/id-attribute/) - configuration, ESM import, options
- [Eleventy Collection Item Filters](https://www.11ty.dev/docs/filters/collection-items/) - getPreviousCollectionItem, getNextCollectionItem
- [Eleventy Collections docs](https://www.11ty.dev/docs/collections/) - addCollection, sorting, filtering
- [Eleventy Global Data Files](https://www.11ty.dev/docs/data-global/) - _data directory, JSON files

### Secondary (MEDIUM confidence)
- [eleventy-plugin-toc GitHub](https://github.com/jdsteinbach/eleventy-plugin-toc) - configuration options, usage
- [@uncenter/eleventy-plugin-toc GitHub](https://github.com/uncenter/eleventy-plugin-toc) - updated fork, nested TOC
- [Mike Aparicio - Nested Navigation in Eleventy](https://www.mikeaparicio.com/posts/2022-08-19-nested-navigation-in-eleventy/) - recursive macro pattern with `<details>`
- [markdown-it-anchor GitHub](https://github.com/valeriangalliat/markdown-it-anchor) - v9.x, heading ID generation
- [CSS-Tricks - Sticky Table of Contents](https://css-tricks.com/sticky-table-of-contents-with-scrolling-active-states/) - sticky positioning pattern
- [CSS-Tricks - Dynamically-Sized Sticky Sidebar](https://css-tricks.com/a-dynamically-sized-sticky-sidebar-with-html-and-css/) - flex + sticky layout

### Tertiary (LOW confidence)
- [UnusedCSS - CSS-Only Hamburger Menu](https://unused-css.com/blog/css-only-hamburger-menu/) - checkbox hack pattern (documented here as what NOT to do for a11y)
- [justmarkup.com - Hamburger Menu Do's and Don'ts](https://justmarkup.com/articles/2019-12-04-hamburger-menu/) - accessibility analysis of checkbox approach
- [a11ymatters.com - Accessible Mobile Navigation](https://a11ymatters.com/pattern/mobile-nav/) - ARIA patterns for mobile nav

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Eleventy plugins with documented ESM support, used in production on 11ty.dev
- Architecture: HIGH - Patterns verified against official docs, multiple community examples confirm approach
- Pitfalls: HIGH - Heading ID prerequisite is well-documented; hamburger accessibility is covered by multiple a11y resources
- TOC ESM compatibility: MEDIUM - CJS-to-ESM import generally works in Node.js but untested for this specific plugin in this project

**Research date:** 2026-02-04
**Valid until:** 2026-03-06 (stable ecosystem, 30-day validity)
