# Requirements: Learn Mechanistic Interpretability

**Defined:** 2026-02-02
**Core Value:** People can learn Mechanistic Interpretability through well-structured, readable articles that build from foundations to frontier research, with easy navigation between topics and direct links to source papers.

## v1 Requirements

### Infrastructure

- [x] **INFR-01**: Site builds to fully static HTML/CSS/JS deployable on GitHub Pages
- [x] **INFR-02**: Eleventy static site generator with Nunjucks templating for DRY layouts
- [ ] **INFR-03**: Shared base layout (header, footer, navigation) inherited by all pages
- [x] **INFR-04**: Thematic folder structure for content (e.g., `/topics/probing/`, `/topics/steering/`)
- [x] **INFR-05**: GitHub Actions CI/CD pipeline deploying to GitHub Pages on push
- [ ] **INFR-06**: CSS custom properties (variables) for theming from day one

### Navigation

- [ ] **NAV-01**: Responsive layout that works on desktop (1200px+) and mobile (320px+)
- [ ] **NAV-02**: Sidebar navigation showing full topic hierarchy with current page highlighted
- [ ] **NAV-03**: Sidebar collapses to hamburger menu on mobile
- [ ] **NAV-04**: Breadcrumb navigation showing Home > Block > Topic
- [ ] **NAV-05**: Previous/Next article links at bottom of each article, following learning path order
- [ ] **NAV-06**: In-page table of contents auto-generated from headings, fixed on wide screens
- [ ] **NAV-07**: Homepage with hero section explaining the site and clear "start here" entry point
- [ ] **NAV-08**: Guided learning path visualization on homepage showing suggested reading order through all topics
- [ ] **NAV-09**: Prerequisite indicators per article showing "read X first" with links to those articles
- [ ] **NAV-10**: Difficulty indicators per article (Foundational / Intermediate / Advanced)

### Content Rendering

- [ ] **CONT-01**: KaTeX math rendering for inline ($...$) and display ($$...$$) math notation
- [ ] **CONT-02**: Build-time KaTeX rendering (no client-side JS needed for math display)
- [ ] **CONT-03**: Code snippets with syntax highlighting (Python/PyTorch primarily)
- [ ] **CONT-04**: Embedded diagrams from course PNGs with proper `<figure>` + `<figcaption>` and alt text
- [ ] **CONT-05**: Paper references as numbered inline citations linking to papers in new tabs
- [ ] **CONT-06**: Hover citations showing full reference details (title, authors, year, venue) on desktop
- [ ] **CONT-07**: Hover citations fall back to click-to-expand on mobile
- [ ] **CONT-08**: Margin notes/sidenotes for supplementary context on wide screens
- [ ] **CONT-09**: Margin notes collapse to expandable inline notes on narrow screens
- [ ] **CONT-10**: "Pause and think" collapsible prompts using `<details>`/`<summary>` elements
- [ ] **CONT-11**: Clean academic typography: readable font, ~18px body, 60-75 character line width
- [ ] **CONT-12**: Structured citation data (JSON) derived from course SOURCES.md for hover citations

### Content Authoring

- [ ] **AUTH-01**: 16 weeks of Typst slide content converted to readable long-form Markdown articles
- [ ] **AUTH-02**: Content reorganized into granular thematic pages (not by week)
- [ ] **AUTH-03**: Each article has front matter: title, description, prerequisites, difficulty, block/category
- [ ] **AUTH-04**: Cross-article concept links (mentions of "superposition" link to the superposition article)
- [ ] **AUTH-05**: Paper references embedded throughout articles with links to source papers
- [ ] **AUTH-06**: Course diagrams (~42 PNGs) placed in relevant articles with descriptive alt text

### Search & Discovery

- [ ] **SRCH-01**: Client-side full-text search across all articles using Pagefind
- [ ] **SRCH-02**: Search index generated at build time, works offline
- [ ] **SRCH-03**: Search results show article title, excerpt, and relevance
- [ ] **SRCH-04**: Curated glossary page with MI terms, brief definitions, and links to relevant article sections
- [ ] **SRCH-05**: Glossary terms alphabetically organized

### Design & UX

- [ ] **DSGN-01**: Distill.pub-inspired clean academic visual design with generous whitespace
- [ ] **DSGN-02**: Dark mode with auto-detection via `prefers-color-scheme` plus manual toggle
- [ ] **DSGN-03**: Dark mode tested with KaTeX rendering, code blocks, and diagrams
- [ ] **DSGN-04**: Semantic HTML throughout (`<article>`, `<nav>`, `<main>`, `<section>`, proper heading hierarchy)
- [ ] **DSGN-05**: Keyboard navigation support with visible focus indicators
- [ ] **DSGN-06**: Skip-to-content link for accessibility
- [ ] **DSGN-07**: Reading time estimate displayed near article title (calculated from word count at build time)

## v2 Requirements

### Polish & Enhancements

- **POLSH-01**: Print-friendly stylesheet hiding nav, expanding content width, showing URLs
- **POLSH-02**: Scroll progress indicator bar at top of articles
- **POLSH-03**: localStorage "mark as read" tracking per article
- **POLSH-04**: Open Graph meta tags and structured data for social sharing
- **POLSH-05**: RSS feed for new content additions
- **POLSH-06**: Interactive versions of key diagrams (SVG/D3.js replacements for select PNGs)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Server-side rendering or backend | Must be fully static for GitHub Pages |
| Heavy JS frameworks (React, Vue, Svelte) | Vanilla/near-vanilla constraint per user preference |
| Interactive code execution (Jupyter-style) | Massive complexity, ARENA already serves this niche |
| User accounts or authentication | Requires backend, contradicts static constraint |
| Comments or discussion features | Moderation burden, static site makes this hard |
| Video or audio content | Production overhead, text is the core value |
| Automated Typst-to-HTML pipeline | Manual adaptation improves pedagogical quality |
| Full concept graph visualization | High complexity for marginal benefit over simpler alternatives |
| Gamification (badges, streaks, points) | Wrong audience -- researchers are intrinsically motivated |
| Multi-language support | Enormous maintenance burden, no evidence of demand |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFR-01 | Phase 1 | Complete |
| INFR-02 | Phase 1 | Complete |
| INFR-03 | Phase 2 | Pending |
| INFR-04 | Phase 1 | Complete |
| INFR-05 | Phase 1 | Complete |
| INFR-06 | Phase 2 | Pending |
| NAV-01 | Phase 2 | Pending |
| NAV-02 | Phase 5 | Pending |
| NAV-03 | Phase 5 | Pending |
| NAV-04 | Phase 5 | Pending |
| NAV-05 | Phase 5 | Pending |
| NAV-06 | Phase 5 | Pending |
| NAV-07 | Phase 5 | Pending |
| NAV-08 | Phase 5 | Pending |
| NAV-09 | Phase 5 | Pending |
| NAV-10 | Phase 5 | Pending |
| CONT-01 | Phase 3 | Pending |
| CONT-02 | Phase 3 | Pending |
| CONT-03 | Phase 3 | Pending |
| CONT-04 | Phase 3 | Pending |
| CONT-05 | Phase 3 | Pending |
| CONT-06 | Phase 3 | Pending |
| CONT-07 | Phase 3 | Pending |
| CONT-08 | Phase 3 | Pending |
| CONT-09 | Phase 3 | Pending |
| CONT-10 | Phase 3 | Pending |
| CONT-11 | Phase 2 | Pending |
| CONT-12 | Phase 3 | Pending |
| AUTH-01 | Phase 4 | Pending |
| AUTH-02 | Phase 4 | Pending |
| AUTH-03 | Phase 4 | Pending |
| AUTH-04 | Phase 4 | Pending |
| AUTH-05 | Phase 4 | Pending |
| AUTH-06 | Phase 4 | Pending |
| SRCH-01 | Phase 6 | Pending |
| SRCH-02 | Phase 6 | Pending |
| SRCH-03 | Phase 6 | Pending |
| SRCH-04 | Phase 6 | Pending |
| SRCH-05 | Phase 6 | Pending |
| DSGN-01 | Phase 2 | Pending |
| DSGN-02 | Phase 7 | Pending |
| DSGN-03 | Phase 7 | Pending |
| DSGN-04 | Phase 2 | Pending |
| DSGN-05 | Phase 7 | Pending |
| DSGN-06 | Phase 7 | Pending |
| DSGN-07 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 46 total
- Mapped to phases: 46
- Unmapped: 0

---
*Requirements defined: 2026-02-02*
*Last updated: 2026-02-02 after roadmap creation (phase mappings added)*
