# Project Research Summary

**Project:** Learn Mechanistic Interpretability (Static Educational Website)
**Domain:** Educational content platform (academic/technical)
**Researched:** 2026-02-02
**Confidence:** HIGH

## Executive Summary

This project is a static educational website for teaching Mechanistic Interpretability concepts, converting 16 weeks of Typst slide content into a structured, web-optimized learning resource. The recommended approach is a vanilla HTML static site built with Eleventy (11ty) using build-time math rendering, client-side search, and a Distill.pub-inspired academic design.

The core technical strategy is maximum simplicity: Eleventy assembles Markdown content into complete HTML at build time, KaTeX pre-renders all math equations server-side, and Pagefind generates a chunked search index post-build. This produces a fully functional site with zero client-side JavaScript frameworks, perfect for GitHub Pages deployment. The site delivers pre-rendered content that works instantly and scales gracefully to 40+ articles.

The primary risk is not technical but editorial: Typst slides are presentation fragments that require substantial prose expansion to become coherent standalone articles. Direct conversion produces sparse, disconnected content. Manual adaptation is essential, budgeting 2-4x the expected time for content transformation. Secondary risks include KaTeX equation overflow on mobile (preventable with proper CSS wrappers), GitHub Pages path configuration issues (solved by using relative paths from the start), and search index bloat from math content (prevented by stripping LaTeX from the index).

## Key Findings

### Recommended Stack

Build-time static generation with minimal client-side JavaScript delivers the best performance and maintainability for math-heavy educational content. Eleventy is the clear choice for static site generation: it outputs exactly the HTML you write without framework overhead, has first-class markdown-it integration for KaTeX, and supports powerful Nunjucks templating for DRY layouts. Pagefind solves client-side search without backend infrastructure by generating a chunked index that loads on-demand.

**Core technologies:**
- **Eleventy 3.1.2:** Static site generator that assembles layouts, partials, and content into complete HTML with no client-side framework overhead
- **Nunjucks (bundled):** Jinja2-style templating with template inheritance, includes, and macros for component-like patterns
- **markdown-it 14.1.0 + @mdit/plugin-katex 0.23.1:** Markdown processing with build-time KaTeX rendering (zero client-side math JS needed)
- **KaTeX 0.16.28:** Fast math typesetting with build-time pre-rendering via renderToString()
- **Pagefind 1.4.0:** Post-build search indexer that generates chunked client-side index (loads <100KB initially)
- **highlight.js 11.11.1:** Syntax highlighting for code blocks at build time
- **GitHub Actions:** Native GitHub Pages deployment with actions/upload-pages-artifact

**What NOT to use:**
- React/Vue/Svelte: Massive overkill for static content; contradicts architectural constraints
- MathJax: 3-10x slower than KaTeX with negligible quality difference
- Tailwind CSS: Adds build complexity for no benefit; custom CSS with CSS custom properties is cleaner
- Jekyll: Ruby dependency, slow builds, declining ecosystem

### Expected Features

Educational sites in this domain have well-established user expectations. Missing table-stakes features makes the site feel incomplete; differentiators create competitive advantage over existing MI resources (ARENA notebooks, scattered blog posts).

**Must have (table stakes):**
- Responsive layout with mobile-first design (70%+ access on mobile)
- Sidebar navigation showing full topic hierarchy with current page highlighted
- In-page table of contents for long-form articles with scroll-tracking
- KaTeX math rendering (MI content is unreadable without proper equation display)
- Code syntax highlighting (Python/PyTorch snippets throughout)
- Full-text client-side search (users need to find "induction heads", "superposition" instantly)
- Glossary of MI terminology (dense specialized vocabulary needs a reference)
- Paper references with links (research-driven field, every concept traces to papers)
- Semantic HTML and keyboard navigation (WCAG 2.2 Level AA baseline)
- Breadcrumb navigation for users arriving via external links

**Should have (competitive advantage):**
- Guided learning path with visual progression (unique: shows suggested order while allowing free browsing)
- Prerequisite indicators per article (no current MI resource does this at article level)
- Difficulty/level indicators (Foundational/Intermediate/Advanced badges)
- Hover citations Distill-style (inline references showing full citation on hover)
- Margin notes/sidenotes for supplementary context (Distill pattern, better than footnotes)
- Dark mode (technical audience expectation, reduces eye strain)
- "Pause and think" prompts (transforms passive reading into active learning)
- Cross-article concept linking (creates web of interconnected knowledge)

**Defer (v2+):**
- Interactive code execution (massive complexity; ARENA already serves this niche)
- User accounts and progress tracking (requires backend; contradicts static-site constraint)
- Comments/discussion (moderation burden; link to existing communities instead)
- Video/audio content (production overhead; link to external resources like Neel Nanda's YouTube)
- Multi-language support (enormous maintenance burden; no evidence of demand)

### Architecture Approach

The architecture is fundamentally build-time assembly: Eleventy consumes Markdown content and Nunjucks layouts, assembles everything into complete HTML pages, then Pagefind indexes the output. No client-side templating, no SPA routing, no JavaScript-driven page assembly. This produces the fastest possible page loads and works with zero JavaScript.

**Major components:**
1. **Eleventy build orchestrator** - Assembles layouts, partials, global data, and Markdown content into static HTML using markdown-it for content parsing and Nunjucks for template inheritance
2. **Global data files (JSON)** - Structured data drives navigation (topics.json for learning path), glossary page (glossary.json), and paper citations (papers.json)
3. **markdown-it + KaTeX plugin** - Server-side math rendering at build time converts LaTeX to HTML+MathML; no client-side KaTeX JS needed
4. **Pagefind post-build indexer** - Runs after Eleventy build to generate chunked client-side search index from built HTML
5. **GitHub Actions CI/CD** - Builds site on push to main and deploys to GitHub Pages using native actions/deploy-pages
6. **Layout chaining system** - base.njk (HTML skeleton) extends to article.njk (article chrome with sidebar/TOC) which receives Markdown content

**Key architectural patterns:**
- Build-time assembly over client-side rendering (no FOUC, perfect SEO, instant page loads)
- Layout chaining for DRY (change <head> once in base.njk, propagates everywhere)
- Data-driven page generation (glossary.json powers glossary page, inline tooltips, search metadata)
- Post-build search indexing (Pagefind reads built HTML, respects data-pagefind-body attributes)
- Directory data files for collection management (topics.json auto-tags all topic pages)

### Critical Pitfalls

**1. Typst slides to web articles - content shape mismatch**
Slides are bullet-point fragments; direct conversion produces sparse, disconnected content. Automated Typst-to-HTML conversion loses styling and breaks across versions. Manual adaptation is essential, budgeting 2-4x expected time. Extract math from Typst and convert to LaTeX syntax (Typst math differs from LaTeX). Establish conversion workflow on 2-3 articles before attempting all 16 weeks.

**2. KaTeX wide equations overflow on mobile**
Long equations (matrices, multi-step derivations) overflow 375px viewports. Wrap every .katex-display in a container div with overflow-x: auto; overflow-y: hidden (never apply directly to .katex-display due to scrollbar bug). Test every article on 375px viewport during development.

**3. GitHub Pages base path breaks all internal links**
Site works on localhost (/) but breaks on username.github.io/repo-name/ because root-relative paths ignore subdirectory. Use relative paths everywhere or configure base path variable. Add .nojekyll file to prevent Jekyll processing. Decide path strategy before any HTML is written.

**4. Client-side search index bloat with math content**
Search index grows to 1-2MB+ if it includes LaTeX strings or KaTeX HTML. Strip ALL math markup before indexing. Pre-build index at build time. Lazy-load only when user focuses search. Index title/headings/excerpts only, not full body. Target <200KB for ~42 articles.

**5. Vanilla JS template spaghetti - no DRY**
Without framework components, shared elements get copy-pasted across 40+ files. Navigation changes require editing every page. Use Nunjucks layouts/includes (Eleventy's built-in solution) - NOT client-side fetch() to load partials (causes FOUC). Establish layout system before creating any content pages.

## Implications for Roadmap

Based on research, the roadmap should follow a foundation-first approach with early validation of the content conversion workflow. The critical path is: scaffolding → template system → content conversion workflow → bulk content migration → polish.

### Phase 1: Foundation & Deployment Pipeline
**Rationale:** Solve GitHub Pages deployment and path configuration before building anything else. Every subsequent phase depends on correct deployment. Validates the entire build-to-deploy pipeline with minimal content.

**Delivers:**
- Eleventy config with markdown-it + KaTeX plugin
- Base layout (HTML skeleton, <head>, KaTeX CSS)
- Build scripts (Eleventy → Pagefind sequence)
- GitHub Actions deployment workflow
- .nojekyll file and path configuration
- Single "hello world" article deployed to GitHub Pages

**Addresses pitfalls:**
- GitHub Pages base path issues (Pitfall 3)
- Missing .nojekyll causing Jekyll processing
- Path strategy locked in before any content

**Research flags:** Standard patterns, no deep research needed

### Phase 2: Template System & Article Layout
**Rationale:** Establish DRY layout system before creating multiple pages. Layout chaining (base.njk → article.njk) and component partials (header, footer, sidebar, TOC) must work before content authoring begins.

**Delivers:**
- Layout chaining: base.njk, article.njk, glossary.njk
- Partials: header, footer, sidebar, breadcrumb, TOC
- Directory data file for auto-layout (topics.json)
- Article typography CSS (Distill-inspired)
- Responsive layout with mobile breakpoints
- KaTeX equation overflow wrappers in CSS

**Addresses pitfalls:**
- Template spaghetti (Pitfall 5)
- KaTeX mobile overflow (Pitfall 2)
- KaTeX font FOUT (preload critical fonts)

**Uses stack:** Nunjucks templating, markdown-it, CSS custom properties

**Research flags:** Standard patterns, refer to ARCHITECTURE.md build order

### Phase 3: Content Conversion Workflow
**Rationale:** The Typst-to-article transformation is the highest-risk area. Validate the editorial workflow on 2-3 representative articles before committing to all 16 weeks. Learn what works, establish standards, catch math rendering issues early.

**Delivers:**
- Content authoring guide (KaTeX LaTeX subset, editorial standards)
- Typst-to-LaTeX math conversion reference
- 2-3 pilot articles (one from each difficulty level)
- Image optimization pipeline (PNG → WebP, compression)
- Alt text writing guidelines for diagrams
- Validation that math renders correctly (align vs aligned, smart quotes workaround)

**Addresses pitfalls:**
- Typst slides to web articles mismatch (Pitfall 1) - CRITICAL
- Smart quotes breaking KaTeX (Pitfall 8)
- Unoptimized PNG bloat (Pitfall 7)
- align vs aligned environment confusion (Pitfall 11)

**Research flags:** HIGH - content conversion is the biggest unknown. May need mid-phase validation to adjust workflow.

### Phase 4: Navigation & Data Infrastructure
**Rationale:** With working articles, build the navigation and data systems. Topic-based organization (not week numbers) requires upfront information architecture work. Global data files power navigation, glossary, and citations.

**Delivers:**
- Sidebar navigation with topic hierarchy (collapsible sections)
- Homepage with guided learning path visualization
- Breadcrumb navigation
- Global data files: glossary.json, papers.json, topics.json (learning path order)
- Glossary page with alphabetical index
- Cross-article linking infrastructure (prerequisite indicators, related topics)

**Addresses pitfalls:**
- Navigation mirrors course structure not learning needs (Pitfall 9)
- Paper reference maintenance burden (Pitfall 14)

**Implements:** Data-driven page generation pattern from ARCHITECTURE.md

**Research flags:** MEDIUM - information architecture decisions need validation with representative content

### Phase 5: Bulk Content Migration
**Rationale:** With validated workflow and infrastructure, convert remaining articles. This is high-volume editorial work, not technical development. Parallelize across thematic blocks if multiple authors available.

**Delivers:**
- All 16 weeks converted to ~15-20 topic articles
- All 42 diagrams optimized and deployed
- glossary.json populated with MI terminology
- papers.json populated from SOURCES.md
- Learning path ordering finalized

**Addresses features:**
- All must-have content features from FEATURES.md
- Embedded diagrams with alt text
- Paper references as inline links (simple version, upgrade to hover citations later)

**Research flags:** LOW - pure execution following established workflow

### Phase 6: Search Implementation
**Rationale:** Search requires built HTML to index. Comes after bulk content so search can be tested with realistic content volume.

**Delivers:**
- Pagefind integration via eleventy.after hook
- Search page with Pagefind UI
- Math stripping from search index (data-pagefind-body attributes)
- Lazy-load search index on input focus
- Search index <200KB verification

**Addresses pitfalls:**
- Search index bloat (Pitfall 4) - CRITICAL
- Stale search index (Pitfall 13)

**Uses stack:** Pagefind 1.4.0 post-build indexer

**Research flags:** LOW - Pagefind integration is well-documented

### Phase 7: Polish & Differentiators
**Rationale:** Core site is functional. Add competitive advantage features that elevate quality above existing MI resources.

**Delivers:**
- Dark mode with prefers-color-scheme
- Hover citations (Distill-style) using structured papers.json
- Prerequisite indicators on articles
- Difficulty badges (Foundational/Intermediate/Advanced)
- Reading time estimates
- Print stylesheet
- Scroll progress indicator
- "Pause and think" prompts in select articles

**Addresses features:**
- Should-have differentiators from FEATURES.md
- UX enhancements that set site apart from ARENA/blog posts

**Research flags:** LOW - well-documented patterns

### Phase Ordering Rationale

**Why foundation first:** GitHub Pages deployment issues are binary (works or doesn't) and block all testing. Solve path configuration and deployment pipeline before building features.

**Why template system before content:** Copy-pasting HTML across 40+ pages creates unfixable maintenance burden. Layout chaining must exist before second article is created.

**Why content workflow validation before bulk migration:** Typst-to-article conversion is the highest-risk activity. Failing to validate workflow on 2-3 articles first means discovering problems after converting all 16 weeks.

**Why navigation after content exists:** Navigation structure (sidebar, learning path) depends on understanding actual topic relationships. Needs at least pilot articles to inform information architecture.

**Why search after bulk content:** Pagefind needs realistic content volume to validate index size and relevance. Testing search with 2-3 articles gives false confidence.

**Why polish last:** Dark mode, hover citations, prerequisite indicators are valuable but not blocking. Core educational value is in content + basic navigation. Polish elevates quality but site is functional without it.

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 3 (Content Conversion):** Typst-to-LaTeX math conversion, editorial workflow validation. HIGH risk area.
- **Phase 4 (Navigation/IA):** Information architecture for topic organization. Needs validation with stakeholders.

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Foundation):** Eleventy + GitHub Pages deployment is well-documented
- **Phase 2 (Templates):** Nunjucks layout chaining is standard Eleventy pattern
- **Phase 5 (Bulk Content):** Pure execution following Phase 3 workflow
- **Phase 6 (Search):** Pagefind integration is well-documented
- **Phase 7 (Polish):** Dark mode, hover citations are established patterns

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All recommendations verified from official docs, npm versions confirmed current, Eleventy + KaTeX + Pagefind is proven combination |
| Features | HIGH | Direct analysis of Distill.pub, ARENA, fast.ai, MIT OCW, Neel Nanda's guide; clear understanding of table stakes vs differentiators |
| Architecture | HIGH | Build-time assembly pattern is well-established; Eleventy docs comprehensive; component boundaries clear |
| Pitfalls | HIGH | All pitfalls verified from KaTeX GitHub issues, Pandoc discussions, multiple community sources; recovery strategies tested |

**Overall confidence:** HIGH

### Gaps to Address

**Content conversion workflow specifics:** Research identified the risk (slides to articles mismatch) and mitigation (manual adaptation, 2-4x time budget) but cannot predict exact editorial friction points until attempting first conversions. Phase 3 should include mid-phase validation checkpoint.

**Learning path information architecture:** Research recommends topic-based organization over week numbers but cannot prescribe exact topic hierarchy without domain expertise input. Phase 4 should begin with IA workshop/mapping session.

**KaTeX accessibility for screen readers:** Research confirmed KaTeX's accessibility gaps (NVDA cannot read hidden MathML, VoiceOver has limited access). Mitigation is to add aria-label to critical equations, but "critical" is subjective. Phase 7 accessibility pass needs stakeholder input on which equations require manual labeling.

**Performance targets:** Research provides optimization strategies (image compression, lazy loading, font preloading) but cannot predict actual Lighthouse scores without real content. Set baseline targets in Phase 2 (>90 performance score on 3G) and validate in Phase 5 with full content.

## Sources

### Primary (HIGH confidence)
- **STACK.md** - Eleventy official docs, npm version verification, KaTeX releases, Pagefind docs
- **FEATURES.md** - Direct analysis of Distill.pub, fast.ai, ARENA, MIT OCW, Neel Nanda's MI guide
- **ARCHITECTURE.md** - Eleventy official docs (layouts, data files, collections), Pagefind integration tutorials, GitHub Pages deployment guide
- **PITFALLS.md** - KaTeX GitHub issues (#2942, #327, #3120, #38, #820), GitHub Pages official docs, Pandoc Typst discussions (#9958)

### Secondary (MEDIUM confidence)
- CloudCannon Eleventy vs Astro comparison
- Pagefind vs Lunr.js vs Fuse.js comparison articles
- Tufte CSS and Distill.pub design analysis
- Community blog posts on Eleventy + KaTeX integration
- MDN Web Components and lazy loading guides

### Tertiary (LOW confidence, needs validation)
- Typst-to-HTML conversion capabilities (limited tooling available as of 2026)
- Exact search index size for math-stripped content (need to test with real content)

---
*Research completed: 2026-02-02*
*Ready for roadmap: yes*
