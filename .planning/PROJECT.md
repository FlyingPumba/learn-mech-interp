# Learn Mechanistic Interpretability

## What This Is

A static website for learning Mechanistic Interpretability, built with vanilla JS/HTML/CSS and deployed on GitHub Pages. Content is based on a 16-week university course covering transformer internals through frontier MI research, converted from Typst presentation slides into readable long-form articles organized by topic.

## Core Value

People can learn Mechanistic Interpretability through well-structured, readable articles that build from foundations to frontier research, with easy navigation between topics and direct links to source papers.

## Requirements

### Validated

(None yet -- ship to validate)

### Active

- [ ] Static site deployable on GitHub Pages with no build step beyond simple templating
- [ ] Vanilla JS/HTML/CSS with no heavy frameworks -- DRY templating for shared layout/components
- [ ] Thematic folder structure for content (e.g., `/topics/probing/`, `/topics/steering/`, `/topics/saes/`)
- [ ] Course content (16 weeks of Typst slides) converted to readable long-form articles
- [ ] Granular topic pages -- each major concept gets its own page (not grouped by week)
- [ ] Clean academic visual design (Distill.pub-inspired), light theme, readable typography
- [ ] KaTeX for math rendering (vectors, matrices, attention formulas)
- [ ] Existing course diagrams (~42 PNGs) embedded in articles, key ones flagged for future interactivity
- [ ] Guided learning path on homepage showing suggested reading order
- [ ] Free-browse navigation via sidebar or topic index -- every topic accessible without following the path
- [ ] Client-side full-text search across all articles (pre-built search index, works offline)
- [ ] Curated MI glossary/concept index page linking terms to relevant article sections
- [ ] Paper references and links throughout articles, opening in new tabs
- [ ] Responsive layout that works on desktop and mobile

### Out of Scope

- Server-side rendering or backend -- must be fully static for GitHub Pages
- Heavy JS frameworks (React, Vue, etc.) -- vanilla or near-vanilla only
- Interactive code execution or Jupyter-style notebooks -- this is a reading-focused site
- Video or audio content -- text and diagrams only
- User accounts, comments, or community features
- Automated Typst-to-HTML conversion pipeline -- content will be manually adapted

## Context

The source material lives at `/Users/ivan/latex/mech-interp-course` and is structured as:
- 16 weeks of Typst slides across 6 pedagogical blocks
- ~14,744 lines of Typst content
- ~42 custom PNG diagrams with Python generation scripts
- 50+ paper references cataloged in SOURCES.md
- Topics span: transformer architecture, residual stream, attention circuits, induction heads, logit lens, probing, activation patching, IOI circuit, superposition, SAEs, steering/RepE, circuit tracing, model diffing, multimodal MI, AI safety applications

The 6 course blocks are:
1. Transformer Foundations (weeks 1-2)
2. Foundations of MI (weeks 3-5)
3. Observation to Causation (weeks 6-8)
4. Superposition & Feature Extraction (weeks 9-11)
5. Advanced Topics & Frontiers (weeks 12-14)
6. Synthesis & Open Frontiers (weeks 15-16)

For the website, these will be broken into finer-grained thematic pages rather than preserved as blocks. The blocks still inform the suggested learning path order.

Paper references are already cataloged in SOURCES.md with full citations and organized by topic, which maps directly to the in-article reference links requirement.

## Constraints

- **Deployment**: GitHub Pages -- everything must be static, no server-side processing
- **Tech stack**: Vanilla JS, HTML, CSS -- no React/Vue/Svelte. Minimal dependencies (KaTeX is acceptable)
- **Content source**: Typst slides need manual adaptation to article format -- not 1:1 conversion
- **Search**: Must work client-side since there's no backend -- pre-built index at build/deploy time

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Vanilla JS over frameworks | GitHub Pages static constraint + simplicity + user preference | -- Pending |
| KaTeX over MathJax | Faster rendering, sufficient for the math notation used in MI content | -- Pending |
| Thematic organization over weekly | Better for reference use and concept-based learning | -- Pending |
| Client-side search (pre-built index) | No backend available on GitHub Pages | -- Pending |
| Distill.pub-inspired design | Clean academic aesthetic appropriate for technical MI content | -- Pending |

---
*Last updated: 2026-02-02 after initialization*
