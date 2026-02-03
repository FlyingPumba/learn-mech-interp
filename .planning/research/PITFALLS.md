# Pitfalls Research

**Domain:** Static educational website -- math-heavy Mechanistic Interpretability content converted from Typst slides
**Researched:** 2026-02-02
**Confidence:** HIGH (verified across official docs, GitHub issues, and multiple community sources)

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: Typst Slides to Web Articles -- The Content Shape Mismatch

**What goes wrong:**
Slides are bullet-point fragments with minimal prose. Directly converting them to web pages produces sparse, disconnected content that reads like a lecture outline rather than a coherent article. Readers who were not in the lecture have no narrative thread to follow. Conversely, trying to auto-convert Typst to HTML via Pandoc loses styling, colors, and Typst-specific layout constructs because Pandoc's AST cannot represent them.

**Why it happens:**
Slides are designed for a speaker to fill in gaps verbally. The information density per slide is deliberately low. Teams underestimate the editorial effort needed to transform fragmented bullet points into readable prose. They also overestimate the capabilities of Typst-to-HTML conversion tools, which remain limited in 2025/2026 -- Pandoc's Typst reader cannot preserve colors, padding, or custom styling, and template compatibility breaks across Typst/Pandoc version updates.

**How to avoid:**
- Do NOT attempt automated Typst-to-HTML conversion. Instead, use the Typst source as a content outline and manually author HTML articles with expanded prose, definitions, and connecting narrative.
- Extract math expressions from Typst source and convert them to KaTeX-compatible LaTeX strings. Typst math syntax differs from LaTeX (e.g., `$x^2$` in Typst vs `$x^{2}$` in LaTeX for complex expressions). Build a small conversion reference or script for common patterns.
- Budget 2-4x the time you think content conversion will take. Each 1-hour lecture's slides may need 4-8 hours of editorial work to become a good article.
- Keep the original Typst source alongside the HTML for reference, but do not try to maintain a live pipeline between them.

**Warning signs:**
- Articles that are mostly bullet points with no connecting sentences
- Readers asking "what does this mean?" about content that was obvious in the lecture context
- Math expressions rendering incorrectly because Typst math notation was pasted directly without conversion to LaTeX

**Phase to address:**
Content conversion phase (early). Establish the conversion workflow and editorial standards on 2-3 articles before attempting all 16 weeks.

---

### Pitfall 2: KaTeX Wide Equations Overflow on Mobile

**What goes wrong:**
Math-heavy pages with long equations (matrix operations, multi-step derivations common in Mech Interp) overflow their containers on mobile devices. Users see equations cut off with no indication there is more content. If you naively add `overflow-x: auto` directly to `.katex` or `.katex-display`, a vertical scrollbar also appears due to a long-standing KaTeX CSS bug related to line box height calculations.

**Why it happens:**
KaTeX renders equations at fixed widths determined by the math content. It has no built-in line-breaking for display math. Mobile viewports (320-414px) cannot accommodate equations that assume 800px+ of horizontal space. The overflow CSS bug occurs because the scrollbar takes up part of the `.katex` box height, triggering a need for vertical scroll that was not previously needed.

**How to avoid:**
- Wrap every `.katex-display` element in a container div and apply `overflow-x: auto; overflow-y: hidden;` to the wrapper -- never to `.katex-display` directly. This is the verified workaround from KaTeX GitHub discussions.
- For the longest equations (matrices, multi-line derivations), consider splitting them into multiple steps or using `\small` or `\footnotesize` as a fallback on narrow viewports via CSS media queries that adjust the KaTeX container font size.
- Test every article page on a 375px-wide viewport during development. Do not leave mobile testing until the end.

**Warning signs:**
- Horizontal content cut off on phone screens
- Unexpected vertical scrollbars appearing on equation blocks
- Users not realizing an equation extends beyond the visible area (no visual affordance for scrolling)

**Phase to address:**
Template/CSS foundation phase. The equation wrapper pattern must be established in the base CSS before any content is authored, so that all articles inherit correct overflow behavior.

---

### Pitfall 3: GitHub Pages Base Path Breaks All Internal Links

**What goes wrong:**
The site works perfectly on `localhost` (served at `/`) but breaks completely when deployed to GitHub Pages at `username.github.io/repo-name/`. All root-relative links (`/about.html`, `/css/style.css`, `/images/diagram.png`) return 404. CSS and JS fail to load, images are broken, and navigation is non-functional.

**Why it happens:**
GitHub Pages project sites are served from a subdirectory (`/repo-name/`), not from root. Root-relative paths ignore the subdirectory prefix. This is the single most common GitHub Pages deployment failure, and it bites vanilla HTML sites harder than framework-based sites because frameworks typically have a `basePath` config option.

**How to avoid:**
- Use relative paths everywhere (`./css/style.css`, `../images/diagram.png`) instead of root-relative paths (`/css/style.css`). This makes the site work regardless of where it is served.
- Alternatively, if you plan to use a custom domain (which serves from root), use root-relative paths but test with the GitHub Pages subdirectory path during CI.
- Add a `.nojekyll` file to the repository root to prevent Jekyll processing (which would ignore underscore-prefixed directories and slow down deployment).
- If any build script generates paths, make the base path configurable -- a single variable that can be set to `/` for local dev and `/repo-name/` for GitHub Pages.

**Warning signs:**
- Site works locally but shows unstyled HTML or 404s on GitHub Pages
- Images load locally but are broken in deployment
- Any use of paths starting with `/` in HTML `href` or `src` attributes

**Phase to address:**
Project scaffolding phase (first phase). The path strategy must be decided before any HTML is written. Retrofitting relative paths across 40+ pages is painful.

---

### Pitfall 4: Client-Side Search Index Bloat with Math Content

**What goes wrong:**
For a math-heavy site with ~16 weeks of content, the search index JSON file grows to 1-2MB+ because it includes raw LaTeX strings, KaTeX HTML output, or both. Users on mobile or slow connections wait 3-5 seconds for search to become functional. On 3G connections, search may take over a minute to load. The search results also return irrelevant matches on LaTeX command fragments (`\frac`, `\mathbb`) rather than meaningful content.

**Why it happens:**
Client-side search libraries like Lunr.js or FlexSearch require the full index to be downloaded to the browser. If you index page content that includes LaTeX markup, the index is polluted with math syntax tokens. The index file contains both the search index and the document store (titles, snippets for display), and both grow with content volume. Math content is especially bad because LaTeX markup is verbose (`\frac{d}{dx}\left[\sum_{i=1}^{n}...\right]` is many tokens that carry no searchable meaning).

**How to avoid:**
- Strip ALL LaTeX/math markup before indexing. Index only the prose text, headings, and concept names. Math should not be searchable via the general search.
- Pre-build the search index at build time (not at runtime in the browser). Lunr.js supports serialized pre-built indexes that load faster than building from raw documents.
- Lazy-load the search index only when the user focuses the search input, not on page load. This prevents the index from competing with page content for bandwidth.
- Keep the index lean: index title, headings, and a plain-text excerpt (200-300 chars) per article. Do NOT index full article body text.
- For ~42 articles (16 weeks), a well-optimized index should be under 200KB. If it exceeds 500KB, you are indexing too much content.

**Warning signs:**
- Search index JSON file exceeds 500KB
- Search results showing LaTeX command fragments
- Noticeable delay before search becomes functional
- Search relevance is poor (math-heavy pages always rank highest due to token density)

**Phase to address:**
Search implementation phase. Must be designed with math-stripping from the start. Retrofitting search to strip math from an already-built index requires rebuilding the entire indexing pipeline.

---

### Pitfall 5: Vanilla JS Template Spaghetti -- No Components, No DRY

**What goes wrong:**
Without a framework's component model, shared elements (header, footer, navigation sidebar, article layout, breadcrumbs) get copy-pasted across 40+ HTML files. When the navigation structure changes (adding a new week, renaming a section), you must update every file. Missed updates create inconsistent navigation. The site becomes unmaintainable after ~15 pages.

**Why it happens:**
Vanilla HTML has no built-in `include` mechanism. Developers start by copying a template HTML file for each new article, and the divergence begins immediately. Without discipline, each page drifts. Some pages have the old nav, some have the new nav, some have a typo in the footer.

**How to avoid:**
- Use Web Components (Custom Elements) for shared UI. Define `<site-header>`, `<site-nav>`, `<site-footer>` as custom elements in JS files. Each page includes the same `<site-header></site-header>` tag and gets identical output. Changing the header means changing one JS file.
- Alternatively, use a simple build script that assembles pages from partials (a header.html fragment, a footer.html fragment, and per-page content). This can be a 30-line Node.js or Python script. This approach means the final HTML files are generated, not hand-maintained.
- Do NOT use `fetch()` to load partials at runtime on every page load. This adds HTTP requests, creates FOUC (flash of unstyled content), and breaks if JavaScript fails. Server-side/build-time assembly or Web Components are both better.
- Choose ONE approach (Web Components or build-time partials) and commit to it before writing any content pages.

**Warning signs:**
- Copy-pasting header/nav HTML between pages
- Navigation changes requiring edits to more than 1-2 files
- Pages with inconsistent headers, footers, or navigation
- Desire to "just quickly fix this one page" without updating others

**Phase to address:**
Template system phase (early, before content). The component/partial strategy must be built and validated before any article pages are created. This is architectural -- changing it later means rewriting every page.

---

## Moderate Pitfalls

Mistakes that cause delays or technical debt.

### Pitfall 6: KaTeX Font Loading Flash (FOUT)

**What goes wrong:**
Math equations briefly render in the wrong font or with incorrect spacing before KaTeX fonts load, causing a visible flash. On slower connections, equations may appear garbled for 1-2 seconds. This is especially jarring on pages with many equations where the flash cascades down the page.

**Why it happens:**
KaTeX requires custom web fonts (KaTeX_Main, KaTeX_Math, KaTeX_AMS, KaTeX_Size1-4, etc.) to render correctly. If these are not preloaded, the browser discovers them only when rendering the first equation, causing a font swap flash.

**How to avoid:**
- Add `<link rel="preload">` tags for the most critical KaTeX WOFF2 fonts (KaTeX_Main-Regular, KaTeX_Math-Italic, KaTeX_AMS-Regular at minimum) in the HTML `<head>`.
- Self-host KaTeX fonts rather than loading from a CDN -- this gives you control over caching headers and reduces DNS lookup time.
- If using server-side (build-time) KaTeX rendering, the CSS and fonts are all you need on the client -- no KaTeX JS required, further reducing load time.

**Warning signs:**
- Equations briefly showing in system fonts before snapping to KaTeX fonts
- Layout shifts when equations "settle" into their final size
- Lighthouse flagging CLS (Cumulative Layout Shift) issues on math-heavy pages

**Phase to address:**
Template/CSS foundation phase. Font preloading should be part of the base HTML template.

---

### Pitfall 7: 42 Unoptimized PNGs Destroy Page Load Times

**What goes wrong:**
The 42 diagrams are exported from presentation tools as large PNGs (often 1-3MB each at 2x resolution). A page with 4-5 diagrams loads 5-15MB of images. Mobile users on cellular connections experience 10+ second load times. Even on fast connections, the page feels sluggish.

**Why it happens:**
Presentation software exports at print-quality resolution. Developers drop these directly into `<img>` tags without optimization. PNGs are lossless and large by default. Without lazy loading, all images on a page load immediately.

**How to avoid:**
- Run all PNGs through an optimizer (oxipng, pngcrush, or TinyPNG) as a build step. Expect 30-70% size reduction without quality loss.
- Convert diagrams to WebP format where transparency is not needed (WebP is ~50% smaller than PNG). Keep PNG only for diagrams requiring transparency.
- Set explicit `width` and `height` attributes on all `<img>` tags to prevent layout shift (CLS).
- Use `loading="lazy"` on all images except the first visible one on each page. The first image should use `fetchpriority="high"` instead.
- Use `srcset` to serve smaller images on mobile. A 1400px-wide diagram does not need to be sent to a 375px-wide phone.
- Target: no single image over 200KB after optimization. Total image payload per page under 500KB on initial load.

**Warning signs:**
- Any PNG file over 500KB in the repository
- Pages taking more than 3 seconds to reach Largest Contentful Paint
- Lighthouse performance score below 90 on image-heavy pages
- No `width`/`height` attributes on `<img>` tags

**Phase to address:**
Image pipeline phase, before content is authored. Establish the optimization pipeline so that every image added to the site is automatically processed.

---

### Pitfall 8: Markdown Smart Quotes and Special Characters Break KaTeX

**What goes wrong:**
If any content pipeline step processes text through a Markdown parser or text processor with "smart quotes" enabled, straight quotes (`'`) get converted to curly quotes, breaking math expressions with primes (e.g., `f'(x)` becomes `f'(x)` which KaTeX cannot parse). Similarly, hyphens may become em-dashes, and other character substitutions can corrupt math notation.

**Why it happens:**
Many text editors, Markdown processors, and even copy-paste from Google Docs or Typst's rendered output perform typographic substitutions. These are invisible unless you specifically look for them in the source.

**How to avoid:**
- Define a KaTeX macro to convert the curly quote back: `\gdef\'{'}` (as recommended in KaTeX's official Common Issues page).
- Ensure your text editor is configured to not auto-replace quotes in code/math contexts.
- If using any Markdown processing step, disable smart quotes (`smartypants: false` or equivalent).
- Include `<!DOCTYPE html>` in every page (required by KaTeX -- without it, browsers render in quirks mode and KaTeX may render incorrectly).
- Add a build-time validation step that checks for curly quotes inside math delimiters.

**Warning signs:**
- KaTeX parse errors on pages that "look correct" in the source
- Equations with primes, apostrophes, or derivatives failing to render
- Inconsistent rendering between local dev and production

**Phase to address:**
Content authoring workflow phase. Establish encoding/character rules before any math content is written.

---

### Pitfall 9: Navigation Structure That Mirrors Course Structure, Not Learning Needs

**What goes wrong:**
The site organizes content as "Week 1, Week 2, ... Week 16" because that is how the course was taught. This structure is meaningless to self-learners who are not enrolled in the course. They cannot tell which week covers "attention head analysis" vs "feature visualization" without clicking into each one. The navigation becomes a flat, unhelpful list of numbers.

**Why it happens:**
It is the path of least resistance to preserve the original course structure. The slides already have week numbers. Renaming and reorganizing feels like extra work.

**How to avoid:**
- Organize primarily by topic, not by week. "Superposition", "Attention Heads", "Feature Visualization" are meaningful navigation labels. Week numbers can appear as secondary metadata.
- Group topics into 3-5 high-level sections (e.g., "Foundations", "Core Techniques", "Advanced Topics", "Applications") with 3-6 articles each.
- Provide a "learning path" or "suggested reading order" that preserves the sequential nature of the course for those who want it, without making it the only navigation mode.
- Keep the top-level navigation to 7 or fewer items (the cognitive load limit for quick scanning).

**Warning signs:**
- Navigation sidebar is just "Week 1" through "Week 16"
- Users cannot find a specific topic without linear scanning
- No way to tell what a section covers without clicking into it

**Phase to address:**
Information architecture phase, before building navigation components. Restructuring navigation after 40+ pages are built means updating every page's breadcrumbs and cross-links.

---

### Pitfall 10: KaTeX Accessibility Gaps for Screen Readers

**What goes wrong:**
KaTeX renders equations as `aria-hidden="true"` HTML with hidden MathML for screen readers. However, NVDA (the most popular free screen reader on Windows) cannot read the hidden MathML at all. VoiceOver on iOS can access it only through sequential navigation, not touch exploration. Screen reader users encounter equations as complete silence.

**Why it happens:**
KaTeX's accessibility support has been incomplete since 2014 (GitHub issue #38). The hidden MathML approach relies on browser and screen reader support for MathML, which remains inconsistent. The KaTeX team has stated nobody is actively working on accessibility improvements.

**How to avoid:**
- For critical equations (definitions, key results), add an `aria-label` with a plain-English reading of the equation. For example: `aria-label="The loss function L equals the negative log probability of y given x"`.
- Consider providing alt-text descriptions for the most important equations (the 20-30 key formulas across the entire site, not every inline `$x$`).
- Document this limitation in your site's accessibility statement.
- If accessibility is a hard requirement, evaluate MathJax instead -- MathJax 4's `a11y/explorer` and `a11y/speech` components generate `aria-label` and `aria-braillelabel` attributes automatically. The performance cost is higher but accessibility is substantially better.

**Warning signs:**
- Zero screen reader testing during development
- No `aria-label` attributes on any math elements
- Accessibility audit flags all equations as inaccessible

**Phase to address:**
Accessibility pass (can be a later phase). The base template should be designed to make adding `aria-label` easy, but the actual labels can be added incrementally.

---

## Minor Pitfalls

Mistakes that cause annoyance but are fixable.

### Pitfall 11: KaTeX `align` vs `aligned` Environment Confusion

**What goes wrong:**
LaTeX uses `\begin{align}...\end{align}` for multi-line equations. KaTeX does not support `align` -- it requires `aligned` instead. Content converted from LaTeX or Typst using `align` fails to render silently or throws parse errors.

**How to avoid:**
- Use `aligned` everywhere in KaTeX. Do a find-and-replace for `\begin{align}` to `\begin{aligned}` during content conversion.
- Document the KaTeX-specific LaTeX subset in your content authoring guide. Include a cheat sheet of "LaTeX commands that differ in KaTeX."

**Phase to address:** Content conversion phase.

---

### Pitfall 12: `.nojekyll` File Missing from GitHub Pages Deployment

**What goes wrong:**
Without `.nojekyll`, GitHub Pages runs the Jekyll processor on your site. Files and directories starting with underscores (`_components/`, `_includes/`) are silently excluded from the deployed site. The site appears to deploy but components, CSS partials, or other underscore-prefixed resources return 404.

**How to avoid:**
- Add an empty `.nojekyll` file to the repository root in the very first commit.
- If using GitHub Actions for deployment, ensure the action includes `.nojekyll` in the deployed output.

**Phase to address:** Project scaffolding phase (first commit).

---

### Pitfall 13: Search Index Not Rebuilt After Adding Content

**What goes wrong:**
A pre-built search index becomes stale as new articles are added. Users search for terms that exist in new articles but get no results. The search appears broken for new content.

**How to avoid:**
- Make search index generation part of the build/deploy pipeline, not a manual step.
- Add a build script that regenerates the index from all content files whenever the site is built.
- Include a "last indexed" timestamp visible to developers (not users) for debugging.

**Phase to address:** Search implementation phase, with CI/CD integration.

---

### Pitfall 14: 50+ Paper References Become Maintenance Burden

**What goes wrong:**
Paper references are hardcoded as inline links throughout articles. When a paper URL changes (common with arXiv, conference proceedings), multiple articles have broken links. There is no central bibliography to update.

**How to avoid:**
- Create a central `references.json` or `bibliography.js` file mapping paper IDs to metadata (title, authors, year, URL, arXiv ID).
- Reference papers by ID in articles: `<cite data-ref="elhage2022superposition">` or similar.
- A small script or Web Component resolves the reference ID to a full citation with link.
- This also enables a bibliography page listing all referenced papers.

**Phase to address:** Content infrastructure phase, before articles reference papers.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Copy-pasting HTML for each article page | Fast to create first few pages | Unmaintainable after 15+ pages; nav changes require editing every file | Never -- set up templates/components first |
| Inlining all CSS in each HTML file | No external dependencies | Impossible to maintain consistent styling; changes require editing every file | Never for a multi-page site |
| Loading full KaTeX JS on every page | Simple setup | 347KB+ per page even for pages with minimal math | Acceptable for MVP; switch to build-time rendering later |
| Indexing full article HTML for search | Better search coverage | 1-2MB index file; irrelevant math token matches | Never -- always strip math from search index |
| Using absolute paths (`/css/style.css`) | Works locally | Breaks on GitHub Pages subdirectory deployment | Only if using a custom domain served from root |
| Skipping image optimization | Fast content authoring | Multi-MB pages, terrible mobile experience | Only for internal review builds, never for production |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| GitHub Pages | Not adding `.nojekyll` file | Add empty `.nojekyll` to repo root in first commit |
| GitHub Pages | Using root-relative paths without base path config | Use relative paths or configure base path variable |
| KaTeX CDN | Loading from CDN without font preloading | Self-host KaTeX and preload critical WOFF2 fonts |
| KaTeX CDN | Loading both JS and CSS when only CSS is needed (for pre-rendered math) | If pre-rendering math at build time, only include CSS + fonts on client |
| Lunr.js / FlexSearch | Building index at runtime in browser | Pre-build and serialize index at build time; lazy-load on search focus |

## Performance Traps

Patterns that work at small scale but fail as content grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading all KaTeX fonts eagerly | FOUT, high initial payload | Preload only critical fonts; let others load on demand | Noticeable at >5 equations per page |
| No image lazy loading | Slow page loads, bandwidth waste | `loading="lazy"` on all below-fold images | Breaks at 3+ images per page on mobile |
| Runtime search index building | Multi-second pause before search works | Pre-build index; lazy-load serialized index | Breaks at ~20 pages of content |
| Single-file search index | Growing index bloats initial search load | Split index by section or lazy-load chunks | Breaks at ~50+ articles |
| No CSS/JS minification | Slightly larger files | Minify in build step | Minor impact but cumulative across 40+ pages |
| Rendering KaTeX client-side on every page view | 347KB JS + parse time per page | Pre-render at build time, serve only CSS + HTML | Noticeable on math-heavy pages (>20 equations) |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Week-number-only navigation | Users cannot find topics; must click through each week | Topic-based navigation with week numbers as secondary info |
| No progress indication in learning path | Users lose their place; no sense of how far through the material they are | Visual progress markers; "you are here" indicators |
| Dense math without prose explanation | Self-learners cannot follow derivations that were explained verbally in lecture | Add 2-3 sentences of plain English before/after every significant equation block |
| No way to jump between related topics | Users reading about attention heads cannot easily find the related superposition content | Cross-reference links ("See also: Superposition") at the end of each article |
| Equations without context on mobile | Long equations scroll horizontally but user does not realize there is more content | Visual scroll indicator (fade/shadow on right edge) for overflowing equations |
| Search returns math gibberish | User searches "superposition" and gets results showing `\mathbb{R}^n \to \mathbb{R}^m` | Strip math from search index; show prose excerpts in results |
| No dark mode | Many developers/researchers prefer dark mode; bright white pages with dense text cause eye strain | CSS `prefers-color-scheme` media query with dark mode support |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Article pages:** Often missing `<meta>` description and Open Graph tags -- verify each page has them for link previews
- [ ] **KaTeX rendering:** Often missing `<!DOCTYPE html>` declaration -- verify it exists on every page (KaTeX renders incorrectly in quirks mode)
- [ ] **Images:** Often missing `width` and `height` attributes -- verify all `<img>` tags have them (prevents CLS)
- [ ] **Images:** Often missing `alt` text -- verify all diagrams have descriptive alt text
- [ ] **Navigation:** Often missing "current page" indicator -- verify the nav highlights which article the user is reading
- [ ] **Mobile viewport:** Often missing `<meta name="viewport">` tag -- verify it exists (without it, mobile browsers render at desktop width)
- [ ] **Search:** Often missing "no results" state -- verify search shows a helpful message when nothing matches
- [ ] **External links:** Often missing `target="_blank" rel="noopener"` -- verify paper reference links open in new tabs
- [ ] **404 page:** Often missing entirely on GitHub Pages -- verify a custom 404.html exists
- [ ] **Print stylesheet:** Often missing for educational content -- verify math renders correctly when printing articles

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Base path breaks on GitHub Pages | LOW | Find-and-replace all root-relative paths to relative paths; test deployment |
| Copy-pasted HTML divergence across pages | HIGH | Extract common elements into components/partials; regenerate all pages from template |
| Unoptimized images in production | LOW | Run batch optimizer; replace files; no HTML changes needed if filenames preserved |
| Search index includes math tokens | MEDIUM | Rebuild index pipeline with math stripping; regenerate index |
| KaTeX accessibility gaps | MEDIUM | Add `aria-label` to critical equations incrementally; full audit can be phased |
| Navigation restructuring (weeks to topics) | HIGH | Requires renaming files, updating all cross-references, redirecting old URLs |
| Smart quote corruption in math | LOW | Batch find-and-replace curly quotes in math delimiters; add macro workaround |
| Missing `.nojekyll` | LOW | Add the file and redeploy; immediate fix |
| Stale search index | LOW | Add index rebuild to deploy script; one-time fix |
| Font loading FOUT | LOW | Add preload tags to base template; propagates to all pages |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Base path / GitHub Pages deployment | Scaffolding (Phase 1) | Deploy a "hello world" page to GitHub Pages and verify paths work |
| `.nojekyll` missing | Scaffolding (Phase 1) | Confirm underscore-prefixed directories are served |
| Template spaghetti (no DRY) | Template system (Phase 2) | Change the header text in one place; verify it updates on all pages |
| KaTeX equation overflow on mobile | CSS foundation (Phase 2) | Test a wide matrix equation on 375px viewport |
| KaTeX font FOUT | CSS foundation (Phase 2) | Throttle network in DevTools; verify no font flash |
| Smart quotes breaking math | Content workflow (Phase 3) | Render an equation with prime notation `f'(x)` successfully |
| Typst-to-article content mismatch | Content conversion (Phase 3) | Have someone unfamiliar with the course read one article and assess comprehension |
| Navigation mirrors course not topics | Information architecture (Phase 3) | User can find "superposition" content without knowing which week it was taught |
| Unoptimized PNGs | Image pipeline (Phase 3) | No image file exceeds 200KB; Lighthouse performance score > 90 |
| Search index bloat with math | Search implementation (Phase 4) | Search index under 200KB; search for "superposition" returns relevant prose results |
| Stale search index | CI/CD integration (Phase 4) | Add an article and verify it appears in search without manual index rebuild |
| Paper reference maintenance | Content infrastructure (Phase 3) | Change a paper URL in one place; verify all citing articles update |
| KaTeX accessibility | Accessibility pass (Phase 5) | Test with VoiceOver; key equations are announced meaningfully |
| Equation `align` vs `aligned` | Content conversion (Phase 3) | Grep for `\begin{align}` (without `ed`) and confirm zero matches |

## Sources

- [KaTeX Common Issues (official)](https://katex.org/docs/issues)
- [KaTeX Font Documentation (official)](https://katex.org/docs/font)
- [KaTeX Browser Setup (official)](https://katex.org/docs/browser)
- [KaTeX GitHub: Overflow discussion #2942](https://github.com/KaTeX/KaTeX/discussions/2942)
- [KaTeX GitHub: Break/wrap formula #327](https://github.com/KaTeX/KaTeX/issues/327)
- [KaTeX GitHub: Accessibility discussion #3120](https://github.com/KaTeX/KaTeX/discussions/3120)
- [KaTeX GitHub: Accessibility issue #38](https://github.com/KaTeX/KaTeX/issues/38)
- [KaTeX GitHub: VoiceOver MathML issue #820](https://github.com/KaTeX/KaTeX/issues/820)
- [GitHub Pages Limits (official)](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
- [GitHub Pages Path Issues - Maxim Orlov](https://maximorlov.com/deploying-to-github-pages-dont-forget-to-fix-your-links/)
- [Simon Willison: GitHub Pages .nojekyll](https://til.simonwillison.net/github/github-pages)
- [Lunr.js Pre-building Indexes (official)](https://lunrjs.com/guides/index_prebuilding.html)
- [Aaron Luna: Lunr.js search for Hugo static site](https://aaronluna.dev/blog/add-search-to-static-site-lunrjs-hugo-vanillajs/)
- [Prefetch.eu: Adventures rendering LaTeX on the web](https://prefetch.eu/blog/2022/website-adventures-maths/)
- [KaTeX vs MathJax comparison (BigGo)](https://biggo.com/news/202511040733_KaTeX_MathJax_Web_Rendering_Comparison)
- [Pandoc: Typst property output (official)](https://pandoc.org/typst-property-output.html)
- [Pandoc GitHub: Typst to HTML discussion #9958](https://github.com/jgm/pandoc/discussions/9958)
- [MDN: Lazy Loading](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Lazy_loading)
- [MDN: Web Components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components)
- [Request Metrics: Image Optimization Guide 2026](https://requestmetrics.com/web-performance/high-performance-images/)
- [freeCodeCamp: Reusable HTML Components](https://www.freecodecamp.org/news/reusable-html-components-how-to-reuse-a-header-and-footer-on-a-website/)
- [Higher Education Marketing: Website Information Architecture](https://www.higher-education-marketing.com/blog/higher-education-website-best-practices-information-architecture)
- [Wrapping wide KaTeX equations (Bourne2Learn)](https://bourne2learn.com/math/katex/katex-wrap-examples.php)
- [Math rendering accessibility conflicts](https://vm70.neocities.org/posts/2024-03-24-math-rendering/)

---
*Pitfalls research for: Static educational website -- Mechanistic Interpretability, math-heavy, Typst-to-web conversion*
*Researched: 2026-02-02*
