---
phase: 02-template-system-and-design
verified: 2026-02-03T19:26:37Z
status: gaps_found
score: 5/6 must-haves verified
gaps:
  - truth: "All pages use semantic HTML elements with proper heading hierarchy"
    status: partial
    reason: "Homepage skips heading levels (h1 to h3, skipping h2)"
    artifacts:
      - path: "src/index.njk"
        issue: "Feature cards use h3 but there's no h2 between h1 and h3"
    missing:
      - "Add h2 for 'Why Learn MI?' or 'Features' section before feature cards"
      - "OR change feature card headings from h3 to h2"
---

# Phase 2: Template System & Design Verification Report

**Phase Goal:** All pages inherit from a shared layout system with polished, modern academic design, responsive across desktop and mobile, so that adding new articles requires only a Markdown file with front matter

**Verified:** 2026-02-03T19:26:37Z
**Status:** gaps_found (minor)
**Re-verification:** No (initial verification)

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Changing header or footer in one template file propagates to every page on the site | ✓ VERIFIED | header.njk and footer.njk included in base.njk; both homepage and test article render same header/footer markup |
| 2 | Articles render with clean academic typography: readable font at ~18px, 60-75 character line width, generous whitespace | ✓ VERIFIED | variables.css sets --font-size-base: 18px; --content-width: 65ch; article-body uses max-width: var(--content-width, 65ch) |
| 3 | Site layout works on desktop (1200px+) and mobile (320px+) without horizontal scrolling or overlapping elements | ✓ VERIFIED | layout.css has 3 responsive breakpoints (@media min-width: 768px, 1200px, 1400px); mobile-first approach with container padding |
| 4 | All pages use semantic HTML elements with proper heading hierarchy | ⚠️ PARTIAL | Semantic elements present (article, nav, main, section, header, footer) but homepage has heading hierarchy issue (h1 → h3, skips h2) |
| 5 | CSS custom properties control all theme values from a single location | ✓ VERIFIED | variables.css defines 42 custom properties; base.css uses var() 49 times; all colors, spacing, fonts reference variables |
| 6 | Site feels modern and polished with intentional visual design | ✓ VERIFIED | Hero section with gradient, feature cards, cool blue accent (#004276), refined typography, single-line footer, Distill.pub-inspired design |

**Score:** 5/6 truths fully verified, 1 partial (semantic HTML heading hierarchy)

### Required Artifacts

All artifacts from plan must_haves verified:

#### Plan 02-01 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/css/variables.css` | Design tokens | ✓ VERIFIED | 73 lines, 42 custom properties, contains --font-size-base |
| `src/css/base.css` | Reset and typography | ✓ VERIFIED | 205 lines, contains box-sizing reset, 49 var() usages |
| `src/css/layout.css` | Responsive layout | ✓ VERIFIED | 126 lines, contains @media queries at 768px, 1200px, 1400px |
| `src/css/components.css` | Component styles | ✓ VERIFIED | 377 lines, contains .site-header, .site-footer, .hero, .btn classes |
| `eleventy.config.js` | Passthrough copy | ✓ VERIFIED | Contains addPassthroughCopy("src/css") |

#### Plan 02-02 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/_includes/layouts/base.njk` | Base HTML structure | ✓ VERIFIED | 20 lines, includes partials/header.njk and partials/footer.njk, links 4 CSS files |
| `src/_includes/layouts/article.njk` | Article layout | ✓ VERIFIED | 14 lines, contains layout: layouts/base.njk, semantic article > header > h1 structure |
| `src/_includes/partials/header.njk` | Shared header | ✓ VERIFIED | 8 lines, contains site-header class, semantic nav with aria-label |
| `src/_includes/partials/footer.njk` | Shared footer | ✓ VERIFIED | 9 lines, contains site-footer class, single-line layout |
| `src/topics/topics.11tydata.js` | Layout assignment | ✓ VERIFIED | 4 lines, assigns layouts/article.njk to all topics |

#### Plan 02-03 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/css/variables.css` | Refined color palette | ✓ VERIFIED | Cool blue accent (#004276), modern sans-serif fonts throughout |
| `src/css/components.css` | Polished components | ✓ VERIFIED | Hero section, feature cards, buttons, refined header/footer with gradients |
| `src/index.njk` | Homepage with hero | ✓ VERIFIED | 35 lines, hero section with CTAs, 3-column feature cards |

### Key Link Verification

All critical wiring verified:

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| base.njk | variables.css | stylesheet link | ✓ WIRED | `<link rel="stylesheet" href="/css/variables.css">` |
| base.njk | base.css | stylesheet link | ✓ WIRED | `<link rel="stylesheet" href="/css/base.css">` |
| base.njk | layout.css | stylesheet link | ✓ WIRED | `<link rel="stylesheet" href="/css/layout.css">` |
| base.njk | components.css | stylesheet link | ✓ WIRED | `<link rel="stylesheet" href="/css/components.css">` |
| base.njk | header.njk | Nunjucks include | ✓ WIRED | `{% include "partials/header.njk" %}` - renders in both pages |
| base.njk | footer.njk | Nunjucks include | ✓ WIRED | `{% include "partials/footer.njk" %}` - renders in both pages |
| article.njk | base.njk | Layout chaining | ✓ WIRED | `layout: layouts/base.njk` in frontmatter |
| topics.11tydata.js | article.njk | Directory data | ✓ WIRED | All topics/*.md use article layout automatically |
| base.css | variables.css | CSS var() | ✓ WIRED | 49 var() references to custom properties |
| eleventy.config.js | src/css/ | Passthrough copy | ✓ WIRED | All 4 CSS files copied to _site/css/ on build |

### Requirements Coverage

Phase 2 requirements from REQUIREMENTS.md:

| Requirement | Status | Blocking Issue |
|-------------|--------|----------------|
| INFR-03: Shared base layout inherited by all pages | ✓ SATISFIED | None |
| INFR-06: CSS custom properties for theming | ✓ SATISFIED | None |
| NAV-01: Responsive layout (1200px+ and 320px+) | ✓ SATISFIED | None |
| CONT-11: Clean academic typography (~18px, 60-75ch) | ✓ SATISFIED | None |
| DSGN-01: Distill.pub-inspired design with whitespace | ✓ SATISFIED | None |
| DSGN-04: Semantic HTML with proper heading hierarchy | ⚠️ PARTIAL | Homepage heading hierarchy issue (h1→h3) |

**Coverage:** 5/6 requirements satisfied, 1 partial

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| src/index.njk | 39 | Heading level skip (h1→h3) | ⚠️ Warning | Violates WCAG heading hierarchy best practices |

**Severity Breakdown:**
- 🛑 Blocker: 0 (none found)
- ⚠️ Warning: 1 (heading hierarchy)
- ℹ️ Info: 0

### Build Verification

```bash
npm run build
# ✓ SUCCESS: Build completes in 0.10s
# ✓ Wrote 2 files (index.html, topics/test/index.html)
# ✓ Copied 4 files (CSS files to _site/css/)

ls _site/css/
# ✓ variables.css (2104 bytes)
# ✓ base.css (4042 bytes)
# ✓ layout.css (2708 bytes)
# ✓ components.css (8882 bytes)
```

### Artifact Quality Assessment

#### Level 1: Existence
✓ All planned artifacts exist at expected paths

#### Level 2: Substantive
✓ All CSS files substantive (73-377 lines each, total 781 lines)
✓ All template files substantive (8-20 lines, appropriate for templates)
✓ No TODO/FIXME/placeholder comments found
✓ No empty return statements or stub patterns
✓ All files have real implementations

#### Level 3: Wired
✓ CSS files linked in base.njk and built to _site/css/
✓ Partials included and rendering in all pages
✓ Layout chaining working (article.njk extends base.njk)
✓ Directory data file assigning layouts automatically
✓ CSS custom properties used throughout all stylesheets

### Gaps Summary

**1 minor gap found** affecting 1 of 6 success criteria:

#### Gap 1: Heading Hierarchy Issue (Homepage)

**Truth affected:** "All pages use semantic HTML elements with proper heading hierarchy"

**Issue:** The homepage uses h1 for the hero title, then immediately jumps to h3 for feature card headings, skipping h2. This violates WCAG heading hierarchy guidelines.

**Current structure:**
```html
<h1 class="hero-title">Learn Mechanistic Interpretability</h1>
<!-- No h2 here -->
<h3>Structured Learning</h3>
<h3>Research-Based</h3>
<h3>Build Intuition</h3>
```

**Why it matters:** Screen readers and assistive technology rely on proper heading hierarchy for navigation. Skipping levels creates confusion about content structure.

**Fix options:**
1. Add an h2 before feature cards (e.g., `<h2>Why Learn MI?</h2>` or `<h2>Features</h2>`)
2. Change feature card headings from h3 to h2

**Severity:** ⚠️ Warning (not blocking, but should be fixed for accessibility compliance)

**Test article heading hierarchy:** ✓ Correct (only has h1, no hierarchy issue)

---

## Conclusion

Phase 2 goal is **substantially achieved** with one minor accessibility gap.

### What Works
- ✅ Complete three-layer template system (base → article → content)
- ✅ Header/footer partials propagate changes to all pages
- ✅ CSS design system with 42 custom properties
- ✅ Mobile-first responsive design with 3 breakpoints
- ✅ Academic typography (18px, 65ch line width)
- ✅ Modern polished design (hero, feature cards, cool blue accent)
- ✅ Semantic HTML (article, nav, main, section, header, footer)
- ✅ Build succeeds, CSS files copied, templates render correctly
- ✅ Adding new articles requires only Markdown with frontmatter

### What Needs Fixing
- ⚠️ Homepage heading hierarchy (h1→h3 skip)

### Recommendation

**Status: PROCEED WITH CAVEAT**

The phase successfully delivers the template system and responsive design. The heading hierarchy gap is minor and doesn't block Phase 3 work. It should be fixed before final deployment for WCAG compliance, but can be deferred to a polish/accessibility phase or fixed opportunistically.

The core phase goal is met: adding new articles now requires only a Markdown file with front matter. The template system is DRY, responsive, and polished.

---

_Verified: 2026-02-03T19:26:37Z_
_Verifier: Claude (gsd-verifier)_
_Methodology: Goal-backward verification with 3-level artifact checks_
