# Phase 7 Plan 01: Dark Mode Color System Summary

CSS variable-based dark mode foundation: 14 Prism token variables, 8 badge/selection variables, 8 decorative variables in :root, two dark override blocks (media query + data-attribute), all hardcoded colors in prism-theme/base/components migrated to var() references, dual-color focus indicators.

## Tasks Completed

| Task | Name | Commit | Duration |
|------|------|--------|----------|
| 1 | Add dark theme variables and Prism token variables to variables.css | d43ca50 | ~1min |
| 2 | Migrate Prism theme to variables and fix all hardcoded colors across CSS files | ecdaf36 | ~2min |

## Changes Made

### Task 1: Dark theme variables

Added to `:root` in `src/css/variables.css`:
- 14 Prism syntax highlighting token variables (comment, punctuation, keyword, string, number, function, operator, class, attr-name, deleted, deleted-bg, inserted, inserted-bg, highlight-bg)
- 1 selection color variable
- 6 difficulty badge variables (3 bg + 3 text)
- 8 decorative variables (header gradient, hero gradients, sidebar shadow, button hover bg, sidebar hover/active bg, feature card shadow)

Added two dark theme override blocks:
- `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { ... } }` for auto-detection
- `[data-theme="dark"] { ... }` for manual toggle override
- Both contain identical variable overrides covering text, background, interactive, border, Prism, selection, badge, and decorative categories

### Task 2: Migrate hardcoded colors to CSS custom properties

**prism-theme.css:** All 15 token color declarations now use `var(--prism-*)` references. Zero hardcoded hex or rgba color values remain in token rules.

**base.css:**
- `::selection` background migrated from hardcoded `rgba(0, 66, 118, 0.2)` to `var(--color-selection)`
- `:focus-visible` enhanced with dual-color approach: outline uses `var(--color-link)`, box-shadow uses `var(--color-background)` for contrast halo visible in both themes

**components.css:**
- Site header gradient: `rgba(0, 66, 118, 0.02)` to `var(--color-header-gradient)`
- Hero gradient: hardcoded rgba values to `var(--color-hero-gradient-start)` and `var(--color-hero-gradient-end)`
- Difficulty badges (foundational/intermediate/advanced): 6 hardcoded hex colors to `var(--color-badge-*)` references
- Sidebar open box-shadow: `rgba(0, 0, 0, 0.1)` to `var(--color-sidebar-shadow)`
- Button secondary hover: `rgba(0, 66, 118, 0.04)` to `var(--color-btn-secondary-hover-bg)`
- Sidebar topic hover: `rgba(0, 66, 118, 0.04)` to `var(--color-sidebar-hover-bg)`
- Sidebar topic active: `rgba(0, 66, 118, 0.08)` to `var(--color-sidebar-active-bg)`
- Feature card shadow: `rgba(0, 0, 0, 0.04)` to `var(--color-feature-card-shadow)`

## Deviations from Plan

None -- plan executed exactly as written.

## Decisions Made

- Dark background color: `#1a1a2e` (deep navy-purple, not pure black)
- Dark link color: `#6db3f2` (lighter blue for dark backgrounds, sufficient contrast)
- Prism dark palette inspired by VS Code dark theme (green strings, blue-green classes, purple attrs)
- Dual-color focus approach: outline color + background-color box-shadow halo for both-theme visibility

## Verification Results

- Full Eleventy build: 39 files, zero errors
- No hardcoded badge hex colors in CSS (only in variables.css definitions)
- 15 `var(--prism-*)` references in prism-theme.css
- Zero hardcoded hex colors in prism-theme.css
- Both dark theme blocks confirmed present in variables.css
- Site looks identical in light mode (only variable indirection added)

## Key Files

### Created
None

### Modified
- `src/css/variables.css` -- Added 30 light-theme variables to :root, two dark theme override blocks (113 new lines)
- `src/css/prism-theme.css` -- All 15 token colors migrated from hardcoded to var() references
- `src/css/base.css` -- Selection uses variable, focus-visible enhanced with box-shadow
- `src/css/components.css` -- 10 hardcoded colors migrated to var() references

## Metrics

- **Duration:** 2min 47s
- **Completed:** 2026-02-04
- **Tasks:** 2/2
- **Files modified:** 4
