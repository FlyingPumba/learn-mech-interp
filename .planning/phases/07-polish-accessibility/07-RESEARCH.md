# Phase 7: Polish & Accessibility - Research

**Researched:** 2026-02-04
**Domain:** Dark mode theming (CSS custom properties + toggle), keyboard accessibility (WCAG 2.2), reading time estimation (Eleventy filter)
**Confidence:** HIGH

## Summary

Phase 7 adds three polish features: dark mode with auto-detection and manual toggle, keyboard navigation with visible focus indicators and skip-to-content link, and reading time estimates on articles. All three build on existing infrastructure -- the site already has 42 CSS custom properties defined in `variables.css`, a `:focus-visible` rule in `base.css`, a `.skip-link` class and `.visually-hidden` class in `components.css`, and an Eleventy config that supports custom filters.

The dark mode implementation follows a well-established pattern: define light/dark color tokens as CSS custom properties on `:root`, use `@media (prefers-color-scheme: dark)` for auto-detection, allow manual override via a `data-theme` attribute on `<html>`, persist the choice in `localStorage`, and inject a blocking `<script>` in `<head>` to prevent FOUC (flash of unstyled content). The site's existing Prism code theme uses hardcoded `rgba()` values for token colors rather than CSS custom properties, so those must be migrated to variables. KaTeX renders using `currentColor` and inherits text color from its parent, so math will adapt to dark mode naturally -- only the KaTeX error color (`#cc0000`) and any explicit `\color{}` in math source need attention.

For accessibility, the site already has a `.skip-link` CSS class and `:focus-visible` outline defined, but neither is wired into the HTML templates. The skip-to-content link needs to be added as the first child of `<body>` in `base.njk`, and `<main>` needs an `id="main-content"` target. Focus indicators need enhancement for dark mode (the current `outline: 2px solid var(--color-link)` may not contrast well against dark backgrounds) and the WCAG 2.2 recommendation is a dual-color approach.

Reading time is a simple Eleventy filter that strips HTML tags, counts words, divides by ~225-238 WPM, and returns a formatted string. No external library is needed.

**Primary recommendation:** Implement dark mode by adding a `[data-theme="dark"]` variable override block in `variables.css`, convert Prism token colors to CSS custom properties, add a dark mode toggle button in the header, add a FOUC-prevention inline script in `<head>`, wire up the existing skip-link CSS in the base template, enhance focus indicators with a dual-color outline, and add a custom `readingTime` Eleventy filter.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| (no new libraries) | - | Dark mode, accessibility, reading time | All features are achievable with CSS custom properties, vanilla JS, and a custom Eleventy filter. No npm packages needed. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none needed) | - | - | The existing CSS custom property architecture and Eleventy filter system cover all requirements |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom dark mode toggle | eleventy-plugin-theme-toggle | Adds a dependency for what is ~30 lines of JS; unnecessary |
| Custom reading time filter | eleventy-plugin-reading-time | Adds a dependency for what is ~10 lines of JS; package is 5+ years old |
| CSS custom properties for dark mode | CSS `light-dark()` function | `light-dark()` is Baseline 2024 (supported in all modern browsers since May 2024) but does not support manual toggle override without `color-scheme` manipulation; the custom property + `data-theme` approach is more flexible and well-understood |
| `data-theme` attribute on `<html>` | CSS class on `<body>` (e.g., `body.dark-theme`) | Both work; `data-theme` on `<html>` is the more modern convention and allows CSS selectors like `[data-theme="dark"]` which read more clearly |

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── css/
│   ├── variables.css        # ADD: dark theme variable overrides
│   ├── base.css             # MODIFY: enhanced focus indicators, selection color for dark mode
│   ├── components.css       # MODIFY: dark mode toggle button styles, Pagefind dark overrides
│   ├── prism-theme.css      # MODIFY: convert hardcoded colors to CSS custom properties
│   ├── katex-overrides.css  # MODIFY: error color variable for dark mode
│   └── layout.css           # (minimal changes, already uses variables)
├── js/
│   ├── sidebar-toggle.js    # (existing, no changes)
│   └── theme-toggle.js      # NEW: dark mode toggle logic
├── _includes/
│   ├── layouts/
│   │   ├── base.njk         # MODIFY: add skip link, FOUC script, toggle button placement
│   │   └── article.njk      # MODIFY: add reading time display, main id
│   └── partials/
│       └── header.njk       # MODIFY: add dark mode toggle button
└── topics/
    └── */index.md           # (no changes to content files)
```

### Pattern 1: Dark Mode via CSS Custom Properties + data-theme
**What:** Define all color values as CSS custom properties on `:root` (light) and override them under `[data-theme="dark"]` and `@media (prefers-color-scheme: dark)`.
**When to use:** When building a theme system for a static site with manual toggle support.
**Example:**
```css
/* variables.css - Light theme (default, already exists) */
:root {
  --color-text: rgba(0, 0, 0, 0.87);
  --color-background: #ffffff;
  /* ...42 variables already defined... */
}

/* Dark theme - auto-detected from OS */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --color-text: rgba(255, 255, 255, 0.87);
    --color-background: #1a1a2e;
    --color-background-subtle: rgba(255, 255, 255, 0.04);
    --color-background-code: rgba(255, 255, 255, 0.08);
    --color-link: #6db3f2;
    --color-link-hover: #8ec5f5;
    --color-link-visited: #a0aec0;
    --color-border: rgba(255, 255, 255, 0.1);
    --color-border-strong: rgba(255, 255, 255, 0.2);
    --color-text-secondary: rgba(255, 255, 255, 0.6);
    --color-text-muted: rgba(255, 255, 255, 0.4);
  }
}

/* Dark theme - manually selected */
[data-theme="dark"] {
  --color-text: rgba(255, 255, 255, 0.87);
  --color-background: #1a1a2e;
  /* ...same overrides as above... */
}
```
**Source:** CSS-Tricks Complete Guide to Dark Mode, MDN prefers-color-scheme

### Pattern 2: FOUC Prevention with Inline Head Script
**What:** A tiny inline `<script>` in `<head>` that reads the saved theme from `localStorage` (or falls back to system preference) and sets `data-theme` on `<html>` before the browser paints.
**When to use:** Always, for any dark mode implementation on a static site. Without this, users will see a flash of the light theme before JS loads.
**Example:**
```html
<!-- In base.njk <head>, BEFORE any stylesheet links -->
<script>
(function() {
  var saved = localStorage.getItem('theme');
  if (saved === 'dark' || saved === 'light') {
    document.documentElement.setAttribute('data-theme', saved);
  }
  // If saved === 'system' or null, do nothing - CSS media query handles it
})();
</script>
```
**Source:** CSS-Tricks Dark Mode Guide, Tailwind CSS docs

### Pattern 3: Three-State Toggle (Light / Dark / System)
**What:** A toggle button that cycles between light, dark, and system (auto) modes. System means "follow the OS preference." Storing 'system' in localStorage (or removing the key) defers to the CSS `prefers-color-scheme` media query.
**When to use:** Best practice for respecting user choice hierarchy: explicit site preference > OS preference.
**Example:**
```javascript
// theme-toggle.js
(function() {
  var toggle = document.querySelector('.theme-toggle');
  if (!toggle) return;

  var states = ['system', 'light', 'dark'];
  var current = localStorage.getItem('theme') || 'system';

  function apply(theme) {
    if (theme === 'system') {
      document.documentElement.removeAttribute('data-theme');
      localStorage.removeItem('theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    }
    updateLabel(theme);
  }

  function updateLabel(theme) {
    var labels = { system: 'Auto', light: 'Light', dark: 'Dark' };
    toggle.setAttribute('aria-label', 'Color theme: ' + labels[theme]);
  }

  toggle.addEventListener('click', function() {
    var idx = states.indexOf(current);
    current = states[(idx + 1) % states.length];
    apply(current);
  });

  updateLabel(current);
})();
```
**Note:** The requirements specify auto-detection via `prefers-color-scheme` plus manual toggle. A two-state toggle (light/dark) that also respects system preference may be simpler. Three-state adds a "system" mode that returns to OS default. Either approach satisfies the requirements; two-state is simpler to implement and understand.

### Pattern 4: Skip-to-Content Link
**What:** A visually hidden link that appears on Tab, letting keyboard users skip past the navigation to the main content.
**When to use:** On every page. Required by WCAG 2.4.1 (Bypass Blocks).
**Example:**
```html
<!-- First child of <body> in base.njk -->
<a href="#main-content" class="skip-link">Skip to content</a>
<!-- ... header, sidebar ... -->
<main id="main-content" tabindex="-1">
  {{ content | safe }}
</main>
```
The `.skip-link` CSS class already exists in `components.css` with the correct off-screen + on-focus pattern.
**Source:** WebAIM Skip Navigation, W3C WCAG 2.4.1

### Pattern 5: Reading Time Filter
**What:** An Eleventy filter that strips HTML, counts words, divides by average reading speed, and returns a human-readable estimate.
**When to use:** Display near the article title for user expectation-setting.
**Example:**
```javascript
// In eleventy.config.js
eleventyConfig.addFilter("readingTime", function(content) {
  if (!content) return "";
  var text = content.replace(/<[^>]*>/g, " ");       // strip HTML tags
  text = text.replace(/\s+/g, " ").trim();            // normalize whitespace
  var words = text.split(" ").filter(function(w) { return w.length > 0; }).length;
  var minutes = Math.ceil(words / 230);                // 230 WPM is standard for technical content
  return minutes + " min read";
});
```
```njk
{# In article.njk, inside .article-header #}
<p class="article-meta">{{ content | readingTime }}</p>
```
**Source:** BryceWray.com Eleventy word count, rubenwardy Eleventy wordcount

### Anti-Patterns to Avoid
- **Setting dark mode colors only inside `@media (prefers-color-scheme: dark)` on `:root`:** This prevents manual override. The media query block must use `:root:not([data-theme="light"])` to yield to explicit user choice.
- **Loading the theme toggle script as an external file without a FOUC prevention script in `<head>`:** The external JS loads after the CSS, causing a flash. The inline script must come first.
- **Using `display: none` to hide the skip link:** This removes it from the tab order entirely, defeating its purpose. Use the off-screen positioning pattern already in `.skip-link`.
- **Applying dark mode only to `body`:** CSS custom property overrides must be on `:root` (or `html`) so they cascade to everything, including the `<body>` background and any elements that reference them.
- **Using `filter: invert(1)` on the entire page for dark mode:** This inverts images, code blocks with backgrounds, and other elements in undesirable ways. Use explicit color variable swapping instead.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dark mode color palette | Manually picking dark colors one-by-one | Systematic approach: invert text/bg, desaturate accent colors by 10-20%, test contrast | Ad-hoc color picks lead to contrast failures and inconsistent aesthetics |
| FOUC prevention | CSS-only approach or async JS | Inline `<script>` in `<head>` before stylesheets | CSS alone cannot read localStorage; external JS loads too late |
| HTML stripping for word count | Custom parser or DOM library | Regex `/<[^>]*>/g` is sufficient for word counting | JSdom would be overkill for this; regex is standard for rough word counts at build time |
| Focus indicator colors in dark mode | Separate focus styles for dark/light | Use dual-color approach (black outline + white box-shadow or vice versa) that works in both modes | A single-color outline will fail contrast in one mode or the other |

**Key insight:** The site already has 95% of the infrastructure needed for dark mode (CSS custom properties for all colors), a skip-link CSS class, and `:focus-visible` styling. Phase 7 is primarily about wiring these pieces together and adding the dark mode color values, not building from scratch.

## Common Pitfalls

### Pitfall 1: Flash of Unstyled Content (FOUC) on Dark Mode
**What goes wrong:** Page loads in light mode, then flashes to dark mode after JavaScript executes.
**Why it happens:** The dark mode preference is stored in `localStorage`, which is only accessible via JavaScript. If the JS runs after the page renders, the user sees a flash.
**How to avoid:** Add a tiny inline `<script>` in `<head>` before any `<link>` stylesheets that reads `localStorage` and sets `data-theme` on `<html>`. This runs synchronously before the browser paints.
**Warning signs:** Visible white flash when loading pages with dark mode enabled, especially on slower connections.

### Pitfall 2: Prism Token Colors Not Adapting to Dark Mode
**What goes wrong:** Code blocks remain with light-mode token colors in dark mode, making text unreadable.
**Why it happens:** The current `prism-theme.css` uses hardcoded `rgba(0, 0, 0, ...)` values and hex colors like `#004276`, `#22863a`, `#6f42c1` for syntax tokens. These do not respond to CSS custom property overrides.
**How to avoid:** Convert all Prism token colors to CSS custom properties (e.g., `--prism-keyword`, `--prism-string`, `--prism-comment`, etc.) defined in `:root`, then override them in the dark theme block. Reference the `prism-theme-vars` project for standard variable naming.
**Warning signs:** Code blocks that are unreadable or have poor contrast in dark mode.

### Pitfall 3: KaTeX Error Color Hardcoded
**What goes wrong:** KaTeX rendering errors show in `#cc0000` (red) which may not be visible against certain dark backgrounds.
**Why it happens:** The `errorColor` option is passed to KaTeX at build time in `eleventy.config.js` and gets embedded directly in the HTML output.
**How to avoid:** Keep `#cc0000` for now (it is visible against dark backgrounds like `#1a1a2e`), but verify contrast. KaTeX text otherwise inherits `color` from its parent (via `currentColor`), so math adapts to dark mode automatically.
**Warning signs:** Error markers invisible or clashing in dark mode.

### Pitfall 4: Difficulty Badges with Hardcoded Background Colors
**What goes wrong:** Difficulty badges (foundational/intermediate/advanced) use hardcoded light-mode backgrounds (`#e8f5e9`, `#fff3e0`, `#fce4ec`) that look wrong in dark mode.
**Why it happens:** These colors were defined directly as hex values, not as CSS custom properties.
**How to avoid:** Define dark mode variants for difficulty badge backgrounds and text colors. In dark mode, use darker, more saturated versions (e.g., dark green, dark orange, dark red backgrounds with lighter text).
**Warning signs:** Bright pastel badge backgrounds jarring against a dark page background.

### Pitfall 5: Selection Color Not Adapting
**What goes wrong:** Text selection uses `rgba(0, 66, 118, 0.2)` which is barely visible on dark backgrounds.
**Why it happens:** The `::selection` color in `base.css` is hardcoded to a semi-transparent blue based on the light theme.
**How to avoid:** Define `::selection` color using a CSS custom property that changes with the theme.
**Warning signs:** Selected text disappearing or being nearly invisible in dark mode.

### Pitfall 6: Focus Indicator Not Visible in Both Modes
**What goes wrong:** The focus outline (`2px solid var(--color-link)`) may not have 3:1 contrast against the dark background.
**Why it happens:** A single-color outline can only guarantee contrast against one background color.
**How to avoid:** Use the dual-color "oreo" pattern: `outline: 2px solid` for one color with `box-shadow: 0 0 0 4px` for the contrasting second color. Or use a focus variable that adapts. The Sara Soueidan recommendation is `outline: 3px solid black; box-shadow: 0 0 0 6px white;` which works against any background.
**Warning signs:** Focus ring invisible when tabbing through elements in dark mode.

### Pitfall 7: Sidebar and Mobile Overlay Colors
**What goes wrong:** The mobile sidebar overlay and hamburger icon do not adapt to dark mode.
**Why it happens:** The sidebar uses `background: var(--color-background)` which will adapt, but the `box-shadow: 4px 0 12px rgba(0, 0, 0, 0.1)` is hardcoded. The hamburger icon uses `background: var(--color-text)` which will adapt.
**How to avoid:** Update the sidebar box-shadow to use a variable or a dark-mode-appropriate value. The hamburger icon should adapt automatically since it uses `var(--color-text)`.
**Warning signs:** Dark sidebar with light box-shadow or invisible shadow.

### Pitfall 8: Header/Footer Gradient Backgrounds
**What goes wrong:** The site header has `background: linear-gradient(180deg, rgba(0, 66, 118, 0.02) 0%, transparent 100%)` and the hero section has similar light-mode gradients.
**Why it happens:** These subtle gradient tints are based on the light theme blue and assume a white background.
**How to avoid:** Define gradient tint colors as CSS variables or use different gradient values in dark mode. The subtle tint may be imperceptible in dark mode, so it could simply be set to `transparent` or adjusted.
**Warning signs:** Subtle visual inconsistencies in header/hero areas in dark mode.

## Code Examples

Verified patterns from official sources and codebase analysis:

### Dark Mode Variable Block (for variables.css)
```css
/* Source: Site analysis + CSS-Tricks dark mode guide */
/* Auto-detection: OS prefers dark, user hasn't explicitly set light */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --color-text: rgba(255, 255, 255, 0.87);
    --color-text-secondary: rgba(255, 255, 255, 0.6);
    --color-text-muted: rgba(255, 255, 255, 0.4);
    --color-background: #1a1a2e;
    --color-background-subtle: rgba(255, 255, 255, 0.04);
    --color-background-code: rgba(255, 255, 255, 0.08);
    --color-link: #6db3f2;
    --color-link-hover: #8ec5f5;
    --color-link-visited: #a0aec0;
    --color-border: rgba(255, 255, 255, 0.1);
    --color-border-strong: rgba(255, 255, 255, 0.2);
  }
}

/* Manual dark mode override */
[data-theme="dark"] {
  --color-text: rgba(255, 255, 255, 0.87);
  --color-text-secondary: rgba(255, 255, 255, 0.6);
  --color-text-muted: rgba(255, 255, 255, 0.4);
  --color-background: #1a1a2e;
  --color-background-subtle: rgba(255, 255, 255, 0.04);
  --color-background-code: rgba(255, 255, 255, 0.08);
  --color-link: #6db3f2;
  --color-link-hover: #8ec5f5;
  --color-link-visited: #a0aec0;
  --color-border: rgba(255, 255, 255, 0.1);
  --color-border-strong: rgba(255, 255, 255, 0.2);
}
```

### FOUC Prevention Script (for base.njk <head>)
```html
<!-- Source: Tailwind CSS docs, CSS-Tricks dark mode guide -->
<script>
(function() {
  var t = localStorage.getItem('theme');
  if (t === 'dark' || t === 'light') {
    document.documentElement.setAttribute('data-theme', t);
  }
})();
</script>
```

### Prism Theme Dark Mode Variables (for prism-theme.css)
```css
/* Source: prism-theme-vars project + site's existing color palette */
:root {
  --prism-comment: rgba(0, 0, 0, 0.4);
  --prism-punctuation: rgba(0, 0, 0, 0.6);
  --prism-keyword: #004276;
  --prism-string: #22863a;
  --prism-number: #6f42c1;
  --prism-function: #005cc5;
  --prism-operator: rgba(0, 0, 0, 0.6);
  --prism-class: #005cc5;
  --prism-attr-name: #6f42c1;
  --prism-deleted: #b31d28;
  --prism-deleted-bg: rgba(179, 29, 40, 0.08);
  --prism-inserted: #22863a;
  --prism-inserted-bg: rgba(34, 134, 58, 0.08);
  --prism-highlight-bg: rgba(0, 66, 118, 0.06);
}

/* Dark values (added in variables.css dark block) */
/* --prism-comment: rgba(255, 255, 255, 0.4); */
/* --prism-punctuation: rgba(255, 255, 255, 0.5); */
/* --prism-keyword: #7ec8e3; */
/* --prism-string: #98c379; */
/* --prism-number: #d19a66; */
/* --prism-function: #dcdcaa; */
/* --prism-operator: rgba(255, 255, 255, 0.5); */
/* --prism-class: #4ec9b0; */
/* --prism-attr-name: #c678dd; */
```

### Skip-to-Content Link (for base.njk)
```html
<!-- Source: WebAIM Skip Navigation, existing .skip-link CSS -->
<body>
  <a href="#main-content" class="skip-link">Skip to content</a>
  {% include "partials/header.njk" %}
  <div class="page-layout">
    {% include "partials/sidebar.njk" %}
    <main id="main-content" tabindex="-1">
      {{ content | safe }}
    </main>
  </div>
  {% include "partials/footer.njk" %}
</body>
```

### Enhanced Focus Indicators (for base.css)
```css
/* Source: Sara Soueidan focus indicator guide, WCAG 2.4.7/2.4.13 */
:focus-visible {
  outline: 2px solid var(--color-link);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px var(--color-background);
}
```

### Reading Time Filter (for eleventy.config.js)
```javascript
// Source: BryceWray.com, rubenwardy blog, common Eleventy pattern
eleventyConfig.addFilter("readingTime", function(content) {
  if (!content) return "";
  // Strip HTML tags
  var text = content.replace(/<[^>]*>/g, " ");
  // Normalize whitespace
  text = text.replace(/\s+/g, " ").trim();
  // Count words
  var words = text.split(" ").filter(function(w) { return w.length > 0; }).length;
  // 230 WPM for technical/mathematical content (slightly below the 238 standard)
  var minutes = Math.ceil(words / 230);
  return minutes + " min read";
});
```

### Reading Time Display (for article.njk)
```njk
<header class="article-header">
  {% if difficulty %}
    <span class="difficulty-badge difficulty-{{ difficulty }}">{{ difficulty | capitalize }}</span>
  {% endif %}
  <h1 class="article-title">{{ title }}</h1>
  {% if description %}
    <p class="article-description">{{ description }}</p>
  {% endif %}
  <div class="article-meta">
    {{ content | readingTime }}
  </div>
</header>
```

### Dark Mode Toggle Button (for header.njk)
```html
<!-- Source: WAI-ARIA best practices for toggle buttons -->
<button class="theme-toggle" aria-label="Toggle dark mode" type="button">
  <svg class="theme-icon-light" aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="12" cy="12" r="5"/>
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
  </svg>
  <svg class="theme-icon-dark" aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
  </svg>
</button>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@media (prefers-color-scheme: dark)` only | `prefers-color-scheme` + `data-theme` attribute + localStorage | ~2020 | Users can override OS preference |
| `filter: invert(1)` for quick dark mode | Explicit CSS custom property color system | ~2019 | Proper dark mode without image/media artifacts |
| CSS `light-dark()` function | Available since May 2024 (Baseline 2024) | 2024 | Reduces duplication but cannot handle manual toggle without JS; complementary, not replacement |
| `:focus` for all focus styles | `:focus-visible` for keyboard-only focus indicators | 2022 (widely supported) | Mouse clicks no longer show outlines; keyboard navigation does |
| WCAG 2.1 AA focus requirements | WCAG 2.2 SC 2.4.11/2.4.13 (Focus Not Obscured) | Oct 2023 | Focused elements must be at least partially visible; new AA criterion |

**Deprecated/outdated:**
- `filter: invert(1)` for dark mode: Causes unwanted inversion of images and media. Use explicit variable overrides.
- `:focus` without `:focus-visible`: Shows outlines on mouse clicks, annoying users. Use `:focus-visible` for keyboard-only indicators.
- Separate light/dark CSS files loaded via JS: Causes FOUC and doubles CSS maintenance. Use CSS custom property overrides in a single file.

## Open Questions

Things that couldn't be fully resolved:

1. **Exact dark mode color palette**
   - What we know: The light theme uses Distill-inspired blues (`#004276`), with text at `rgba(0,0,0,0.87)` and backgrounds at `#ffffff`. Dark mode needs inverted values with sufficient contrast.
   - What's unclear: The exact dark background color (common options: `#121212`, `#1a1a2e`, `#1e1e1e`, `#0f0f23`) and the exact link/accent colors for dark mode. These are aesthetic choices.
   - Recommendation: Start with `#1a1a2e` (dark navy, echoing the blue accent) for background, `rgba(255,255,255,0.87)` for text, and `#6db3f2` (lighter blue) for links. Fine-tune by visual testing. All contrast ratios should meet WCAG AA (4.5:1 for text, 3:1 for large text and UI components).

2. **Two-state vs three-state toggle**
   - What we know: Requirements say "auto-detection via `prefers-color-scheme` plus manual toggle." A two-state toggle (light/dark) that also respects system preference before first interaction satisfies this. A three-state toggle (light/dark/system) adds an explicit "return to system" option.
   - What's unclear: Whether users need the ability to explicitly return to system preference after overriding, or if clearing localStorage is sufficient.
   - Recommendation: Start with a two-state toggle. Before the user clicks, the site follows their OS preference. After clicking, it locks to the toggled mode. This is the simplest UX that satisfies the requirements. A "reset to system" option can be added later if desired.

3. **Pagefind UI dark mode**
   - What we know: Pagefind UI uses CSS custom properties (`--pagefind-ui-*`) that are already mapped to site variables in `components.css`. These should adapt automatically when the site variables change.
   - What's unclear: Whether the Pagefind search results modal/dropdown has any hardcoded colors that don't respond to the variables.
   - Recommendation: Test Pagefind UI in dark mode after implementing the color variable overrides. If issues arise, add specific overrides in the dark theme block.

4. **Reading time accuracy for math-heavy content**
   - What we know: Standard reading time assumes ~230 WPM for prose. Articles in this site contain significant KaTeX math, code blocks, and technical notation.
   - What's unclear: Whether stripping HTML tags adequately handles KaTeX-rendered content. KaTeX's `htmlAndMathml` output includes both visual HTML spans and MathML; the regex strip will remove the HTML but leave MathML text content, which may inflate word count.
   - Recommendation: The regex approach is good enough for an estimate. Math-heavy articles may read slightly higher than actual, but reading time is inherently approximate. Consider stripping `<math>` and `<annotation>` elements if the numbers seem significantly off.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `variables.css` (42 CSS custom properties), `base.css` (`:focus-visible` rule), `components.css` (`.skip-link` class), `prism-theme.css` (hardcoded token colors), `katex-overrides.css`, `base.njk` (template structure), `article.njk` (article layout), `eleventy.config.js` (filter system)
- [MDN prefers-color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-color-scheme) - Media query specification
- [MDN light-dark()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/light-dark) - New CSS function, Baseline 2024
- [WCAG 2.2 Focus Visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html) - SC 2.4.7 requirements
- [WebAIM Skip Navigation](https://webaim.org/techniques/skipnav/) - Skip link implementation patterns
- KaTeX source (`katex.css`): Uses `currentColor` for text, inherits from parent -- dark mode text color works automatically

### Secondary (MEDIUM confidence)
- [CSS-Tricks Dark Mode Guide](https://css-tricks.com/a-complete-guide-to-dark-mode-on-the-web/) - Comprehensive implementation patterns
- [Sara Soueidan Focus Indicators](https://www.sarasoueidan.com/blog/focus-indicators/) - Dual-color focus indicator approach
- [BryceWray.com Eleventy Word Count](https://www.brycewray.com/posts/2022/09/word-count-reading-time-eleventy/) - Reading time template approach
- [rubenwardy Eleventy Wordcount](https://blog.rubenwardy.com/2023/10/29/eleventy-wordcount/) - Filter-based word counting with HTML stripping
- [prism-theme-vars](https://github.com/antfu/prism-theme-vars) - CSS variable naming convention for Prism themes
- [KaTeX GitHub Discussion #2553](https://github.com/KaTeX/KaTeX/discussions/2553) - CSS variable approach for KaTeX dark mode

### Tertiary (LOW confidence)
- Dark mode color palette values (`#1a1a2e`, `#6db3f2`) - Common recommendations from multiple web sources, but exact values are aesthetic choices that need visual testing and WCAG contrast verification

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new libraries needed; all features use existing CSS/JS/Eleventy patterns
- Architecture: HIGH - CSS custom property dark mode is the established pattern; skip-link and focus-visible are well-documented standards; reading time filter is a common Eleventy recipe
- Pitfalls: HIGH - FOUC prevention, Prism token colors, hardcoded badge colors, and selection colors are all verifiable from direct codebase inspection
- Dark color palette: MEDIUM - Color values need visual testing and contrast verification; initial values are best-practice starting points

**Research date:** 2026-02-04
**Valid until:** 2026-04-04 (90 days -- standards are stable; CSS features are mature)
