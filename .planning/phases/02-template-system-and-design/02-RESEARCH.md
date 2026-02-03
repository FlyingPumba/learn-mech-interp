# Phase 2: Template System & Design - Research

**Researched:** 2026-02-03
**Domain:** Eleventy templating (Nunjucks), CSS design system, academic typography
**Confidence:** HIGH

## Summary

Phase 2 establishes the template inheritance system and visual design for the academic site. The research confirms that Eleventy's layout chaining system combined with Nunjucks blocks provides the foundation for DRY template inheritance. CSS custom properties on `:root` should define all theme values, enabling future dark mode or accessibility themes without restructuring.

The Distill.pub-inspired design targets: 18px body text, 60-75 character line width (~65ch), generous whitespace, and a mobile-first responsive approach. The existing base template already has the right structure; it needs expansion with semantic HTML landmarks, CSS custom properties, and responsive breakpoints at 320px (mobile base), 768px (tablet), and 1200px (desktop).

Key architectural insight: Eleventy's layout system is NOT Nunjucks `extends`. They work differently. Use Eleventy layouts (via front matter `layout:`) for content-to-template relationships, but use Nunjucks `extends`/`block` within templates for shared header/footer blocks. The `{{ content | safe }}` pattern injects Markdown content, while `{% block %}` patterns share template sections.

**Primary recommendation:** Build a three-layer template system (base.njk, article.njk, page.njk) with CSS custom properties for all theme values, semantic HTML5 landmarks, and mobile-first responsive styles using min-width breakpoints.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Eleventy | 3.1.2 | Layout system, data cascade | Already installed, provides layout chaining |
| Nunjucks | 3.x | Template inheritance, blocks, macros | Bundled with Eleventy, powerful extends/block system |
| CSS Custom Properties | Native | Theming, design tokens | No dependencies, browser baseline since 2017 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| System Font Stack | N/A | Typography | Zero-cost fonts, native feel, no FOUT |
| (none needed) | - | - | Phase 2 is pure CSS, no additional deps |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| System fonts | Google Fonts (Inter, Charter) | Web fonts add 20-100KB, FOUT risk; system fonts are instant |
| Plain CSS | Tailwind/SCSS | Adds build complexity; plain CSS with custom properties is simpler for this scale |
| Nunjucks macros | Eleventy shortcodes | Shortcodes are more powerful but macros are simpler for HTML partials |

**Installation:**
```bash
# No new packages needed for Phase 2
# All required functionality is already present in Eleventy 3.1.2
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── _includes/
│   ├── layouts/
│   │   ├── base.njk          # HTML5 document structure, head, CSS links
│   │   ├── article.njk       # Article-specific layout (extends base)
│   │   └── page.njk          # Generic page layout (extends base)
│   └── partials/
│       ├── header.njk        # Site header with nav
│       └── footer.njk        # Site footer
├── css/
│   ├── variables.css         # CSS custom properties (design tokens)
│   ├── base.css              # Reset, typography, semantic elements
│   ├── layout.css            # Responsive grid, container widths
│   └── components.css        # Reusable component styles
├── topics/
│   └── topics.11tydata.js    # Uses article.njk layout
└── index.njk                 # Uses page.njk layout
```

### Pattern 1: Eleventy Layout Chaining
**What:** Multiple layouts chain via front matter, each wrapping the previous
**When to use:** For shared boilerplate (base.njk) and content-type-specific structure (article.njk)
**Example:**
```nunjucks
{# src/_includes/layouts/article.njk #}
---
layout: layouts/base.njk
---
<article>
  <header>
    <h1>{{ title }}</h1>
    {% if description %}<p class="subtitle">{{ description }}</p>{% endif %}
  </header>
  <section class="article-body">
    {{ content | safe }}
  </section>
</article>
```

### Pattern 2: Nunjucks Includes for Partials
**What:** Shared header/footer via include (not extends/block)
**When to use:** For components that appear in multiple layouts
**Example:**
```nunjucks
{# src/_includes/layouts/base.njk #}
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ title }} | Learn Mechanistic Interpretability</title>
  <link rel="stylesheet" href="/css/variables.css">
  <link rel="stylesheet" href="/css/base.css">
  <link rel="stylesheet" href="/css/layout.css">
  <link rel="stylesheet" href="/css/components.css">
</head>
<body>
  {% include "partials/header.njk" %}
  <main>
    {{ content | safe }}
  </main>
  {% include "partials/footer.njk" %}
</body>
</html>
```

### Pattern 3: CSS Custom Properties for Theming
**What:** All theme values defined on :root with semantic naming
**When to use:** Every color, spacing, and typography value
**Example:**
```css
/* src/css/variables.css */
:root {
  /* Typography */
  --font-body: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-heading: Charter, "Bitstream Charter", "Sitka Text", Cambria, serif;
  --font-mono: ui-monospace, "SF Mono", Menlo, Monaco, "Cascadia Code", monospace;

  --font-size-base: 18px;
  --font-size-small: 0.875rem;    /* 14px */
  --font-size-h1: 2.5rem;         /* 40px mobile, scales up */
  --font-size-h2: 1.5rem;         /* 24px */
  --font-size-h3: 1.25rem;        /* 20px */

  --line-height-body: 1.6;
  --line-height-heading: 1.3;

  /* Colors */
  --color-text: rgba(0, 0, 0, 0.87);
  --color-text-secondary: rgba(0, 0, 0, 0.6);
  --color-background: #ffffff;
  --color-link: #0066cc;
  --color-link-hover: #004499;
  --color-border: rgba(0, 0, 0, 0.1);

  /* Spacing */
  --spacing-xs: 0.25rem;   /* 4px */
  --spacing-sm: 0.5rem;    /* 8px */
  --spacing-md: 1rem;      /* 16px */
  --spacing-lg: 1.5rem;    /* 24px */
  --spacing-xl: 2rem;      /* 32px */
  --spacing-2xl: 3rem;     /* 48px */
  --spacing-section: 4rem; /* 64px */

  /* Layout */
  --content-width: 65ch;           /* 60-75 chars optimal */
  --content-width-wide: 80ch;      /* For figures/code */
  --container-padding: var(--spacing-lg);
}
```

### Pattern 4: Semantic HTML Structure for Articles
**What:** Proper HTML5 landmarks and heading hierarchy
**When to use:** Every page
**Example:**
```html
<body>
  <header role="banner">
    <nav role="navigation" aria-label="Main">...</nav>
  </header>
  <main role="main">
    <article>
      <header>
        <h1>Article Title</h1>
      </header>
      <section aria-labelledby="intro-heading">
        <h2 id="intro-heading">Introduction</h2>
        ...
      </section>
    </article>
  </main>
  <footer role="contentinfo">...</footer>
</body>
```

### Pattern 5: Mobile-First Responsive CSS
**What:** Base styles for mobile, enhance with min-width queries
**When to use:** All layout CSS
**Example:**
```css
/* Base (mobile 320px+) */
.article-body {
  padding: var(--spacing-md);
  font-size: var(--font-size-base);
  line-height: var(--line-height-body);
  max-width: 100%;
}

/* Tablet (768px+) */
@media (min-width: 768px) {
  .article-body {
    padding: var(--spacing-xl);
    max-width: var(--content-width);
    margin: 0 auto;
  }
}

/* Desktop (1200px+) */
@media (min-width: 1200px) {
  .article-body {
    font-size: calc(var(--font-size-base) * 1.1);  /* Slightly larger for desktop */
  }
}
```

### Anti-Patterns to Avoid
- **Mixing Eleventy layouts with Nunjucks extends:** Eleventy's `layout:` front matter and Nunjucks `{% extends %}` are different systems. Use one or the other per template, not both.
- **Hardcoding values in CSS:** Every color, spacing, and font should use `var(--name)` for maintainability.
- **Desktop-first responsive:** Use min-width queries (mobile-first), not max-width.
- **Missing fallback values:** Always provide CSS fallbacks: `var(--color, #000)`.
- **Deep layout chains:** Keep to 2-3 levels max (base -> article -> content) to avoid complexity.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Template inheritance | Custom JS logic | Eleventy layout chaining | Data cascade handles inheritance automatically |
| CSS reset | Custom reset.css | Modern CSS defaults | Browsers have improved; minimal resets needed |
| Responsive container | Complex calc() | CSS `max-width: 65ch` with padding | ch unit auto-scales with font size |
| Component system | Framework | Nunjucks includes + macros | Simple enough for this project's scale |
| Dark mode toggle | Custom JS | CSS custom properties + prefers-color-scheme | Browser handles system preference |

**Key insight:** For a content-focused static site, vanilla CSS with custom properties and Eleventy's built-in templating handle 95% of needs without additional dependencies.

## Common Pitfalls

### Pitfall 1: Confusing Eleventy Layouts with Nunjucks Extends
**What goes wrong:** Using `{% extends %}` in a file that also has `layout:` in front matter causes unexpected results
**Why it happens:** They're separate systems - Eleventy wraps content, Nunjucks extends replaces blocks
**How to avoid:** Content files use `layout:` front matter; only use `{% extends %}` within `_includes/` templates if building complex template hierarchies
**Warning signs:** Content appearing twice or not at all; `{{ content }}` empty

### Pitfall 2: CSS Custom Properties Without Fallbacks
**What goes wrong:** Site breaks in edge cases or older tooling
**Why it happens:** Missing variable definition in some scope
**How to avoid:** Always use fallback: `var(--color-text, #333)`
**Warning signs:** Elements with no styling in certain contexts

### Pitfall 3: Using ch Unit Without Understanding
**What goes wrong:** Line lengths vary dramatically between fonts
**Why it happens:** `ch` is based on the "0" character width, which varies by font
**How to avoid:** Test with actual content; `65ch` is a starting point, adjust per font
**Warning signs:** Lines feeling too short or too long despite "correct" ch value

### Pitfall 4: Forgetting Viewport Meta Tag
**What goes wrong:** Mobile site appears zoomed out, tiny text
**Why it happens:** Missing `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
**How to avoid:** Include in base template `<head>` - already present in current base.njk
**Warning signs:** Site looks desktop-sized on mobile

### Pitfall 5: Over-Nesting CSS Selectors
**What goes wrong:** Specificity wars, hard to override styles
**Why it happens:** Writing `.article .header .title h1` instead of `.article-title`
**How to avoid:** Use flat BEM-style naming; keep selectors to 1-2 levels
**Warning signs:** Needing `!important` to override styles

### Pitfall 6: Not Testing Horizontal Scroll on Mobile
**What goes wrong:** Content overflows on narrow screens
**Why it happens:** Fixed-width elements, oversized images, code blocks
**How to avoid:** Add `overflow-x: auto` to code blocks; use `max-width: 100%` on images
**Warning signs:** Horizontal scrollbar appears on mobile

### Pitfall 7: Passthrough Copy Not Set for CSS
**What goes wrong:** CSS files not in _site output
**Why it happens:** Eleventy only processes template files by default
**How to avoid:** Add `eleventyConfig.addPassthroughCopy("src/css")` in config
**Warning signs:** 404 errors for CSS files in browser

## Code Examples

Verified patterns from official sources:

### Complete Base Layout
```nunjucks
{# src/_includes/layouts/base.njk #}
{# Source: Eleventy docs + Distill.pub patterns #}
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{% if title %}{{ title }} | {% endif %}Learn Mechanistic Interpretability</title>
  <meta name="description" content="{{ description | default('Learn Mechanistic Interpretability through structured articles covering transformer internals to frontier research.') }}">
  <link rel="stylesheet" href="/css/variables.css">
  <link rel="stylesheet" href="/css/base.css">
  <link rel="stylesheet" href="/css/layout.css">
  <link rel="stylesheet" href="/css/components.css">
</head>
<body>
  {% include "partials/header.njk" %}
  <main>
    {{ content | safe }}
  </main>
  {% include "partials/footer.njk" %}
</body>
</html>
```

### Semantic Header Partial
```nunjucks
{# src/_includes/partials/header.njk #}
<header class="site-header">
  <nav class="site-nav" aria-label="Main navigation">
    <a href="/" class="site-logo">Learn MI</a>
    <ul class="nav-links">
      <li><a href="/topics/">Topics</a></li>
    </ul>
  </nav>
</header>
```

### Typography Base CSS
```css
/* src/css/base.css */
/* Source: Distill.pub + MDN typography guides */

/* Reset and base */
*, *::before, *::after {
  box-sizing: border-box;
}

html {
  font-size: var(--font-size-base, 18px);
  -webkit-text-size-adjust: 100%;
}

body {
  margin: 0;
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: var(--line-height-body);
  color: var(--color-text);
  background-color: var(--color-background);
}

/* Headings */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  font-weight: 400;
  line-height: var(--line-height-heading);
  margin-top: var(--spacing-xl);
  margin-bottom: var(--spacing-md);
}

h1 {
  font-size: var(--font-size-h1);
  margin-top: 0;
}

h2 {
  font-size: var(--font-size-h2);
}

h3 {
  font-size: var(--font-size-h3);
  font-style: italic;
}

/* Links */
a {
  color: var(--color-link);
  text-decoration: underline;
  text-decoration-color: var(--color-border);
  text-underline-offset: 2px;
}

a:hover {
  color: var(--color-link-hover);
  text-decoration-color: currentColor;
}

/* Paragraphs */
p {
  margin-top: 0;
  margin-bottom: var(--spacing-md);
}

/* Lists */
ul, ol {
  padding-left: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
}

li {
  margin-bottom: var(--spacing-xs);
}

/* Code */
code {
  font-family: var(--font-mono);
  font-size: var(--font-size-small);
  background: rgba(0, 0, 0, 0.04);
  padding: 0.1em 0.3em;
  border-radius: 3px;
}

pre {
  background: rgba(0, 0, 0, 0.04);
  padding: var(--spacing-md);
  border-radius: 4px;
  overflow-x: auto;
  margin-bottom: var(--spacing-lg);
}

pre code {
  background: none;
  padding: 0;
}
```

### Responsive Layout CSS
```css
/* src/css/layout.css */

/* Container */
.container {
  width: 100%;
  max-width: var(--content-width);
  margin-left: auto;
  margin-right: auto;
  padding-left: var(--container-padding);
  padding-right: var(--container-padding);
}

/* Main content area */
main {
  min-height: calc(100vh - 200px); /* Ensure footer stays low */
}

/* Article body - optimal reading width */
.article-body {
  max-width: var(--content-width);
  margin-left: auto;
  margin-right: auto;
}

/* Wide content (figures, code blocks) */
.wide {
  max-width: var(--content-width-wide);
  margin-left: auto;
  margin-right: auto;
}

/* Responsive adjustments */
@media (min-width: 768px) {
  :root {
    --container-padding: var(--spacing-xl);
  }
}

@media (min-width: 1200px) {
  :root {
    --font-size-h1: 3rem;  /* Scale up headings on desktop */
    --font-size-h2: 1.75rem;
  }
}
```

### Article Layout Template
```nunjucks
{# src/_includes/layouts/article.njk #}
---
layout: layouts/base.njk
---
<article class="article">
  <header class="article-header">
    <h1 class="article-title">{{ title }}</h1>
    {% if description %}
    <p class="article-description">{{ description }}</p>
    {% endif %}
  </header>
  <div class="article-body">
    {{ content | safe }}
  </div>
</article>
```

### Eleventy Config Addition for CSS
```javascript
// Add to eleventy.config.js
// Source: https://www.11ty.dev/docs/copy/

export default function(eleventyConfig) {
  // ... existing config ...

  // Pass through CSS files
  eleventyConfig.addPassthroughCopy("src/css");

  // ... rest of config ...
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CSS preprocessors (SCSS/Less) | CSS custom properties | 2017+ baseline | No build step for CSS, native theming |
| px-based typography | rem/ch relative units | 2015+ best practice | Better accessibility, responsive scaling |
| Desktop-first responsive | Mobile-first (min-width) | 2012+ standard | Less code, better mobile performance |
| Float-based layouts | CSS Grid + Flexbox | 2017+ baseline | Simpler, more powerful layout |
| BEM with deep nesting | Flat CSS with custom properties | Current trend | Lower specificity, easier maintenance |

**Deprecated/outdated:**
- SASS/Less for simple theming: CSS custom properties handle this natively
- CSS frameworks (Bootstrap grid) for simple layouts: Unnecessary weight for content sites
- Separate mobile stylesheets: Single stylesheet with media queries is standard

## Open Questions

Things that couldn't be fully resolved:

1. **Exact serif font for headings**
   - What we know: Distill uses Cochin/Georgia; system-ui alternatives are Charter, Cambria
   - What's unclear: Which system serif renders best across platforms
   - Recommendation: Use Charter as primary (good macOS/Windows coverage), Cambria fallback, Georgia as final fallback

2. **Print styles**
   - What we know: Academic content often gets printed/PDF'd
   - What's unclear: Priority level for Phase 2 vs later phase
   - Recommendation: Defer to later phase; add basic `@media print` with hidden nav

3. **Dark mode**
   - What we know: CSS custom properties make this easy to add
   - What's unclear: Whether to include in Phase 2 or defer
   - Recommendation: Structure CSS for dark mode (all colors via variables) but implement toggle in later phase

## Sources

### Primary (HIGH confidence)
- [Eleventy Layouts](https://www.11ty.dev/docs/layouts/) - Layout system, content injection
- [Eleventy Layout Chaining](https://www.11ty.dev/docs/layout-chaining/) - Multi-layer layouts
- [Eleventy Common Pitfalls](https://www.11ty.dev/docs/pitfalls/) - Official gotchas
- [MDN CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/--*) - Syntax, usage, fallbacks
- [Nunjucks Templating](https://mozilla.github.io/nunjucks/templating.html) - extends, blocks, super()
- [Distill.pub Guide](https://distill.pub/guide/) - Academic typography, layout system
- [MDN Semantic HTML](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Accessibility/HTML) - Accessibility landmarks

### Secondary (MEDIUM confidence)
- [CSS-Tricks System Font Stack](https://css-tricks.com/snippets/css/system-font-stack/) - Cross-platform font fallbacks
- [Baymard Line Length Study](https://baymard.com/blog/line-length-readability) - 60-75 character research
- [BrowserStack Breakpoints Guide](https://www.browserstack.com/guide/responsive-design-breakpoints) - Mobile-first breakpoints
- [Modular Nunjucks + Eleventy](https://www.webstoemp.com/blog/modular-code-nunjucks-eleventy/) - Component patterns

### Tertiary (LOW confidence)
- Various community tutorials on Eleventy templating - Patterns verified against official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using built-in Eleventy/Nunjucks features, native CSS
- Architecture: HIGH - Patterns from official documentation, well-established
- Pitfalls: HIGH - Documented in official pitfalls page, verified by multiple sources
- Typography values: MEDIUM - Based on Distill.pub but will need visual testing

**Research date:** 2026-02-03
**Valid until:** 2026-03-03 (30 days - stable domain, CSS and Eleventy not changing rapidly)
