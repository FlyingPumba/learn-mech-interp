# Roadmap: Learn Mechanistic Interpretability

## Overview

This roadmap delivers a static educational website for Mechanistic Interpretability, built with Eleventy and deployed on GitHub Pages. The journey starts with deployment infrastructure, builds up a template system and content rendering engine, validates the Typst-to-article conversion workflow on pilot articles, adds navigation and information architecture, migrates all course content, then layers on search and polish. Each phase delivers a coherent, verifiable capability that unblocks the next.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Deployment** - Eleventy scaffolding, build pipeline, and GitHub Pages deployment with a single test article
- [x] **Phase 2: Template System & Design** - DRY layout system, responsive design, academic typography, and CSS theming
- [x] **Phase 3: Content Rendering Engine** - KaTeX math, code highlighting, figures, citations, margin notes, and interactive elements
- [x] **Phase 4: Content Authoring & Pilot Articles** - Typst-to-article conversion workflow validated with 2-3 representative pilot articles
- [x] **Phase 5: Navigation & Information Architecture** - Sidebar, homepage, learning path, breadcrumbs, TOC, and article metadata indicators
- [ ] **Phase 5.1: Bulk Content Migration** (INSERTED) - Convert all remaining Typst course content into thematic articles with diagrams, references, and cross-links
- [ ] **Phase 6: Search & Glossary** - Pagefind client-side search and curated MI glossary page
- [ ] **Phase 7: Polish & Accessibility** - Dark mode, keyboard navigation, accessibility features, and reading time estimates

## Phase Details

### Phase 1: Foundation & Deployment
**Goal**: A minimal Eleventy site builds and deploys to GitHub Pages automatically on push, proving the entire pipeline works before any real content is added
**Depends on**: Nothing (first phase)
**Requirements**: INFR-01, INFR-02, INFR-04, INFR-05
**Success Criteria** (what must be TRUE):
  1. Running the build command produces a fully static `_site/` directory with valid HTML, CSS, and JS files
  2. Pushing to main triggers a GitHub Actions workflow that deploys the site to GitHub Pages without manual intervention
  3. A test article is accessible at its thematic URL path (e.g., `/topics/test/`) on the live GitHub Pages site
  4. The thematic folder structure exists and new content files placed in `/topics/<name>/` automatically build to the correct output path
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md - Initialize Eleventy project with thematic folder structure
- [x] 01-02-PLAN.md - GitHub Actions deployment workflow and verification

### Phase 2: Template System & Design
**Goal**: All pages inherit from a shared layout system with polished, modern academic design, responsive across desktop and mobile, so that adding new articles requires only a Markdown file with front matter
**Depends on**: Phase 1
**Requirements**: INFR-03, INFR-06, NAV-01, CONT-11, DSGN-01, DSGN-04
**Success Criteria** (what must be TRUE):
  1. Changing the header or footer in one template file propagates to every page on the site
  2. Articles render with clean academic typography: readable font at ~18px, 60-75 character line width, generous whitespace
  3. The site layout works on desktop (1200px+) and mobile (320px+) without horizontal scrolling or overlapping elements
  4. All pages use semantic HTML elements (`<article>`, `<nav>`, `<main>`, `<section>`) with proper heading hierarchy
  5. CSS custom properties control all theme values (colors, spacing, fonts) from a single location
  6. Site feels modern and polished with intentional visual design (not plain/default styling)
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md - CSS design system with custom properties and responsive styles
- [x] 02-02-PLAN.md - Template system with partials and visual verification
- [x] 02-03-PLAN.md - Visual polish with collaborative design research

### Phase 3: Content Rendering Engine
**Goal**: The article template can render all content types needed for MI educational material -- math equations, code blocks, figures with captions, paper citations with hover details, margin notes, and collapsible prompts
**Depends on**: Phase 2
**Requirements**: CONT-01, CONT-02, CONT-03, CONT-04, CONT-05, CONT-06, CONT-07, CONT-08, CONT-09, CONT-10, CONT-12
**Success Criteria** (what must be TRUE):
  1. Inline and display math renders correctly at build time (no client-side KaTeX JS needed) and equations do not overflow on mobile viewports
  2. Paper references appear as numbered inline citations; hovering on desktop shows full citation details (title, authors, year, venue); tapping on mobile expands the citation
  3. Margin notes display in the margin on wide screens and collapse to expandable inline notes on narrow screens
  4. Code blocks render with Python/PyTorch syntax highlighting, and figures display with proper `<figure>`/`<figcaption>` elements and alt text
  5. "Pause and think" prompts appear as collapsible `<details>`/`<summary>` blocks that readers can expand
**Plans**: 2 plans

Plans:
- [x] 03-01-PLAN.md -- Build-time math rendering, syntax highlighting, and figures
- [x] 03-02-PLAN.md -- Citations with hover tooltips, margin notes, and collapsible prompts

### Phase 4: Content Authoring & Pilot Articles
**Goal**: The Typst-to-article conversion workflow is validated end-to-end with 2-3 representative pilot articles spanning different difficulty levels, proving that the full course can be converted at quality
**Depends on**: Phase 3
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06
**Success Criteria** (what must be TRUE):
  1. At least 2-3 pilot articles exist as readable long-form content (not bullet-point fragments), each reorganized by theme rather than by lecture week
  2. Each article has complete front matter (title, description, prerequisites, difficulty, block/category) and the build system uses this metadata
  3. Mentions of concepts covered in other articles link directly to those articles (cross-article concept linking works)
  4. Paper references are embedded throughout pilot articles with working links to source papers in new tabs
  5. Course diagrams appear in pilot articles with descriptive alt text and proper figure/caption markup
**Plans**: 3 plans

Plans:
- [x] 04-01-PLAN.md -- Infrastructure prep, references expansion, and "The Attention Mechanism" pilot article
- [x] 04-02-PLAN.md -- "The Superposition Hypothesis" pilot article (6 diagrams)
- [x] 04-03-PLAN.md -- "Activation Patching and Causal Interventions" pilot article (cross-article links)

### Phase 5: Navigation & Information Architecture
**Goal**: Users can navigate the full site through multiple paths -- a sidebar topic hierarchy, a guided learning path on the homepage, breadcrumbs, prev/next links, and in-page table of contents -- without getting lost
**Depends on**: Phase 4
**Requirements**: NAV-02, NAV-03, NAV-04, NAV-05, NAV-06, NAV-07, NAV-08, NAV-09, NAV-10
**Success Criteria** (what must be TRUE):
  1. A sidebar shows the full topic hierarchy with the current page highlighted, and collapses to a hamburger menu on mobile
  2. The homepage has a hero section explaining the site, a clear "start here" entry point, and a visual learning path showing suggested reading order through all topics
  3. Each article shows breadcrumbs (Home > Block > Topic), previous/next links following the learning path, and an auto-generated table of contents fixed on wide screens
  4. Each article displays prerequisite indicators ("read X first" with links) and a difficulty badge (Foundational / Intermediate / Advanced)
**Plans**: 4 plans

Plans:
- [x] 05-01-PLAN.md -- Foundation: install plugins, create learningPath.json, register plugins, create collection
- [x] 05-02-PLAN.md -- Sidebar navigation, mobile hamburger toggle, page layout restructuring
- [x] 05-03-PLAN.md -- Article navigation: breadcrumbs, TOC, prev/next, difficulty badge, prerequisites
- [x] 05-04-PLAN.md -- Homepage: learning path visualization, fix "start here" link

### Phase 5.1: Bulk Content Migration (INSERTED)
**Goal**: All 16 weeks of Typst course content from `/Users/ivan/latex/mech-interp-course` are converted into thematic long-form articles, reorganized by topic rather than by week, with all diagrams, paper references, cross-article links, and front matter -- making the site a complete MI learning resource covering the full curriculum
**Depends on**: Phase 5 (navigation infrastructure must be in place so new articles automatically appear in sidebar, learning path, and prev/next links)
**Requirements**: AUTH-01 (full completion -- currently partial with 3 pilots)
**Source material**: All 16 weeks across 6 blocks, ~14,744 lines of Typst, 27+ diagrams, 60+ paper references in SOURCES.md. The 3 pilot articles from Phase 4 covered only a fraction of their respective weeks -- all 16 weeks need complete conversion, including expanding/replacing the pilot articles where they fall short of the full week content.
**Research**: Leverage existing course research at `/Users/ivan/latex/mech-interp-course/.planning/phases/*/*-RESEARCH.md` (domain content, not infrastructure)
**Success Criteria** (what must be TRUE):
  1. All 16 weeks of course content are fully converted -- every major topic exists as a readable long-form article (not bullet-point fragments), reorganized by theme rather than by lecture week
  2. All course diagrams (~27 PNGs) are placed in their relevant articles with descriptive alt text and figure/caption markup
  3. All paper references from SOURCES.md are in references.json and cited throughout articles with working hover tooltips
  4. learningPath.json is updated with all blocks and topics, and the sidebar/homepage reflect the full course structure
  5. Cross-article links connect related concepts across the full article set (not just within pilot articles)
  6. Each article has complete front matter (title, description, prerequisites, difficulty, block) and renders correctly with all content types
  7. Pilot articles from Phase 4 are expanded or supplemented to cover the full content of their respective weeks (weeks 1, 6, 9) -- no week content is skipped because "it was already done"
**Plans**: 10 plans

Plans:
- [ ] 05.1-01-PLAN.md -- Data prep: add all references to references.json and update learningPath.json
- [ ] 05.1-02-PLAN.md -- Block 1: review attention-mechanism + create transformer-circuits
- [ ] 05.1-03-PLAN.md -- Block 2 Part 1: create what-is-mech-interp + induction-heads
- [ ] 05.1-04-PLAN.md -- Block 2 Part 2 + Block 3 review: create observational-tools + review activation-patching
- [ ] 05.1-05-PLAN.md -- Block 3: create ioi-circuit (Weeks 7-8 combined)
- [ ] 05.1-06-PLAN.md -- Block 4: review superposition + create sparse-autoencoders + scaling-saes
- [ ] 05.1-07-PLAN.md -- Block 5 Part 1: create steering + circuit-tracing (6 PNGs)
- [ ] 05.1-08-PLAN.md -- Block 5 Part 2 + Block 6 Part 1: create model-diffing-universality + mi-safety (5 PNGs)
- [ ] 05.1-09-PLAN.md -- Block 6 Part 2: create open-problems (capstone)
- [ ] 05.1-10-PLAN.md -- Cross-link audit and final verification

### Phase 6: Search & Glossary
**Goal**: Users can find any concept across all articles through full-text search and browse a curated MI glossary, making the site useful as both a learning resource and a reference
**Depends on**: Phase 5.1 (needs bulk content for meaningful search testing; glossary data populated alongside content)
**Requirements**: SRCH-01, SRCH-02, SRCH-03, SRCH-04, SRCH-05
**Success Criteria** (what must be TRUE):
  1. Typing a query into the search box returns relevant articles with title, excerpt, and relevance ranking, and the search works offline
  2. The search index is generated at build time and does not include raw LaTeX or KaTeX HTML markup (keeping index size reasonable)
  3. A glossary page lists MI terms alphabetically with brief definitions and links to relevant article sections
**Plans**: TBD

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD

### Phase 7: Polish & Accessibility
**Goal**: The site meets accessibility standards and provides quality-of-life features (dark mode, reading time, keyboard navigation) that make it feel polished and professional
**Depends on**: Phase 6
**Requirements**: DSGN-02, DSGN-03, DSGN-05, DSGN-06, DSGN-07
**Success Criteria** (what must be TRUE):
  1. Dark mode activates automatically via `prefers-color-scheme` and can be toggled manually; KaTeX rendering, code blocks, and diagrams all display correctly in dark mode
  2. The site is fully keyboard-navigable with visible focus indicators, and a skip-to-content link appears on Tab for screen reader users
  3. Each article displays a reading time estimate near the title, calculated from word count at build time
**Plans**: TBD

Plans:
- [ ] 07-01: TBD
- [ ] 07-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 5.1 -> 6 -> 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Deployment | 2/2 | Complete | 2026-02-03 |
| 2. Template System & Design | 3/3 | Complete | 2026-02-03 |
| 3. Content Rendering Engine | 2/2 | Complete | 2026-02-03 |
| 4. Content Authoring & Pilot Articles | 3/3 | Complete | 2026-02-04 |
| 5. Navigation & Information Architecture | 4/4 | Complete | 2026-02-04 |
| 5.1. Bulk Content Migration (INSERTED) | 0/10 | Not started | - |
| 6. Search & Glossary | 0/TBD | Not started | - |
| 7. Polish & Accessibility | 0/TBD | Not started | - |
