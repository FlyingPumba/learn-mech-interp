---
phase: 03-content-rendering-engine
plan: 01
subsystem: content-rendering
tags: [katex, prismjs, markdown-it, figure, math-rendering, syntax-highlighting]

# Dependency graph
requires:
  - phase: 02-template-system-and-design
    provides: "Base layout (base.njk), CSS custom properties, article template"
provides:
  - "Build-time KaTeX math rendering (inline and display) via markdown-it plugin"
  - "Build-time PrismJS syntax highlighting via Eleventy plugin"
  - "Figure/figcaption wrapping via markdown-it figure plugin"
  - "KaTeX CDN CSS and mobile overflow fixes"
  - "Academic-light Prism theme matching site design"
affects:
  - 03-02 (citations, margin notes, collapsible prompts - same markdown-it instance)
  - 04-content-authoring (pilot articles will use math, code, and figures)

# Tech tracking
tech-stack:
  added:
    - "@mdit/plugin-katex (build-time KaTeX math rendering)"
    - "katex (math typesetting engine)"
    - "@11ty/eleventy-plugin-syntaxhighlight (PrismJS build-time highlighting)"
    - "@mdit/plugin-figure (figure/figcaption from images)"
  patterns:
    - "setLibrary for markdown-it plugins, addPlugin for Eleventy plugins"
    - "CDN for KaTeX CSS, local files for custom overrides and theme"

key-files:
  created:
    - "src/css/katex-overrides.css"
    - "src/css/prism-theme.css"
  modified:
    - "eleventy.config.js"
    - "package.json"
    - "src/_includes/layouts/base.njk"
    - "src/topics/test/index.md"

key-decisions:
  - "KaTeX CSS from CDN (jsdelivr) rather than local copy for simplicity"
  - "KaTeX version 0.16.28 CDN CSS pinned to match installed npm package"
  - "Custom Prism theme using site CSS variables instead of off-the-shelf theme"
  - "htmlAndMathml output mode for visual rendering plus accessibility"

patterns-established:
  - "markdown-it plugin chain: setLibrary with .use() calls for content plugins"
  - "CSS files in src/css/ auto-copied via existing passthrough rule"
  - "CDN stylesheet links in base.njk head after local CSS links"

# Metrics
duration: 3min
completed: 2026-02-03
---

# Phase 3 Plan 1: Build-Time Math, Code, and Figure Rendering Summary

**Build-time KaTeX math (inline + display) and PrismJS syntax highlighting with markdown-it figure plugin, all zero client-side JS**

## Performance

- **Duration:** 2min 38s
- **Started:** 2026-02-04T02:18:09Z
- **Completed:** 2026-02-04T02:20:47Z
- **Tasks:** 3/3
- **Files modified:** 7

## Accomplishments

- KaTeX renders inline ($...$) and display ($$...$$) math to HTML+MathML at build time with zero client-side JavaScript
- PrismJS highlights Python/PyTorch code blocks at build time with an academic-themed color palette
- Figure plugin wraps images with titles in semantic `<figure>`/`<figcaption>` markup
- Mobile overflow handling via katex-overrides.css prevents equations from breaking page layout
- Test article demonstrates all three content types with verified HTML output

## Task Commits

Each task was committed atomically:

1. **Task 1: Install plugins and configure Eleventy** - `445a418` (feat)
2. **Task 2: Add KaTeX CSS, Prism theme, and overflow fixes** - `d4ad924` (feat)
3. **Task 3: Update test article with content demos** - `26b92c5` (feat)

## Files Created/Modified

- `eleventy.config.js` - Added markdown-it with KaTeX + figure plugins, syntax highlight plugin
- `package.json` - Added 4 new dependencies (@mdit/plugin-katex, katex, syntaxhighlight, @mdit/plugin-figure)
- `package-lock.json` - Lock file updated for new dependencies
- `src/_includes/layouts/base.njk` - Added KaTeX CDN CSS, katex-overrides.css, and prism-theme.css links in head
- `src/css/katex-overrides.css` - Mobile overflow fixes, font sizing for rendered math
- `src/css/prism-theme.css` - Academic-light theme with site CSS variable integration
- `src/topics/test/index.md` - Comprehensive demo of inline math, display math, code blocks, and figures

## Decisions Made

- **KaTeX CSS via CDN:** Using jsdelivr CDN for KaTeX 0.16.28 CSS rather than bundling locally. Simpler, no file management needed. Can switch to local later if offline support matters.
- **Custom Prism theme:** Built a custom academic-light theme using the site's CSS variables (--font-mono, --color-background-code, --color-link for keywords) rather than using an off-the-shelf theme. Colors are subtle: blue keywords (#004276), green strings (#22863a), purple numbers (#6f42c1), muted comments.
- **htmlAndMathml output:** Using KaTeX's `output: "htmlAndMathml"` for both visual rendering (KaTeX HTML) and accessibility (MathML for screen readers).
- **Plugin ordering:** setLibrary called before addPlugin(syntaxHighlight) per research pitfall #4. Both work at different layers (markdown-it vs Eleventy template).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] KaTeX CDN version mismatch**
- **Found during:** Task 2
- **Issue:** Plan specified KaTeX 0.16.21 CDN URL but installed npm package is 0.16.28. Mismatched versions could cause rendering inconsistencies.
- **Fix:** Updated CDN link to katex@0.16.28 to match the installed package
- **Files modified:** src/_includes/layouts/base.njk
- **Verification:** Build succeeds, CSS link version matches `node_modules/katex/package.json`
- **Committed in:** d4ad924 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Version alignment fix was necessary for correct rendering. No scope creep.

## Issues Encountered

None - all plugins installed and configured without issues.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- markdown-it instance is ready for additional plugins in 03-02 (citations, margin notes)
- The `.use()` chain in eleventy.config.js can be extended with more markdown-it plugins
- Test article can be further extended with citation, sidenote, and collapsible prompt demos
- html: true is enabled in markdown-it, allowing `<details>`/`<summary>` passthrough for collapsible prompts

---
*Phase: 03-content-rendering-engine*
*Completed: 2026-02-03*
