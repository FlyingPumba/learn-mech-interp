# Feature Research

**Domain:** Static educational website for Mechanistic Interpretability
**Researched:** 2026-02-02
**Confidence:** HIGH (based on direct analysis of Distill.pub, fast.ai, ARENA, MIT OCW, 3Blue1Brown, Neel Nanda's site, and multiple web sources)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete or amateurish.

#### Navigation & Structure

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Responsive layout (desktop + mobile) | 70%+ of educational content accessed on mobile. Non-responsive = unusable for many visitors | MEDIUM | Already in requirements. Use CSS media queries at 768px/1024px breakpoints minimum. Mobile needs collapsible sidebar |
| Sidebar navigation with topic hierarchy | Every serious documentation/educational site has this (Distill, fast.ai, ARENA, MDN, Stripe docs). Users need to see where they are and what else exists | MEDIUM | Left sidebar preferred -- gains more attention per eye-tracking research. Should show full topic tree with current page highlighted. Collapsible on mobile |
| Breadcrumb navigation | Shows "you are here" in content hierarchy. Essential when users arrive via search or external links (common for MI content shared on Twitter/forums) | LOW | Format: Home > Block Name > Topic. Use semantic `<nav>` with `aria-label="breadcrumb"`. SEO benefit: breadcrumb schema markup |
| Previous/Next article links | Sequential learning is core to this site. Users finishing one article need an obvious path forward | LOW | Should be category-aware: next/prev within the current thematic block, not just global ordering. Place at bottom of article |
| In-page table of contents | Long-form technical articles need jump-to-section navigation. Distill shows TOC in left sidebar on wide screens. fast.ai has per-page TOC | LOW | Auto-generated from headings. Fixed sidebar TOC on desktop (wide screens), collapsible at top on mobile. Highlight current section on scroll |
| Readable typography | Academic/technical audience expects clean, readable text. Distill's typography is the benchmark in this space | MEDIUM | Serif or clean sans-serif body text, ~18px, 60-75 char line width. Already planned as "Distill-inspired" |
| Homepage with clear entry point | Users need to understand what this site is and how to start within 5 seconds | LOW | Hero section explaining what this is, then guided learning path, then browse-by-topic option |

#### Content Features

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| KaTeX math rendering | MI content is heavy with vectors, matrices, attention formulas. Unrendered LaTeX is unreadable | LOW | Already decided. KaTeX is faster than MathJax and sufficient for MI math. Use auto-render extension for inline `$...$` and display `$$...$$` |
| Code snippets with syntax highlighting | MI articles reference Python/PyTorch code constantly (TransformerLens, hooks, tensor ops). Must render properly | LOW | Use Prism.js or highlight.js. Python is the primary language. Read-only display, not executable (per out-of-scope) |
| Embedded diagrams/figures | 42 existing PNG diagrams from the course. Technical content without visuals is incomplete | LOW | Already planned. Use `<figure>` + `<figcaption>` for proper semantics. Responsive image sizing. Alt text for accessibility |
| Paper references with links | MI is a research-driven field. Every concept traces to papers. SOURCES.md already catalogs 50+ papers | LOW | Already decided. Links open in new tabs. Use consistent citation format. At minimum: inline text links to paper URLs |
| Clean academic visual design | Target audience (ML practitioners, researchers) expects professional academic presentation, not a marketing site | MEDIUM | Distill.pub-inspired: generous whitespace, restrained color palette, clear heading hierarchy, no visual clutter |

#### Search & Discovery

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Full-text search | Users looking for specific concepts (e.g., "induction heads", "superposition") need to find them instantly. Every comparable site has search | MEDIUM | Already decided: client-side with pre-built index. Pagefind recommended over Lunr for large sites -- smaller index, chunked loading. Lunr viable for ~50 pages but index grows linearly |
| Glossary/concept index | MI has dense specialized vocabulary (residual stream, superposition, SAE, circuit, feature, ablation). Newcomers need a reference | MEDIUM | Already decided. Links terms to relevant article sections. Alphabetical listing with brief definitions and "read more" links |

#### Accessibility

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Semantic HTML structure | Screen readers, SEO, and maintainability all require proper `<article>`, `<nav>`, `<main>`, `<section>`, heading hierarchy | LOW | Use HTML5 semantic elements throughout. WCAG 2.2 Level AA is the 2026 standard. Proper heading order (h1 > h2 > h3) |
| Keyboard navigation | WCAG requirement. Tab through links, skip-to-content link, focus indicators | LOW | Ensure all interactive elements are keyboard accessible. Visible focus outlines (do not remove outline without replacement) |
| Alt text on all images | 42 diagrams need meaningful alt text describing what the diagram shows for screen readers | LOW | Per-diagram alt text written during content conversion. Technical diagrams need descriptive alt text, not just "Figure 3" |

### Differentiators (Competitive Advantage)

Features that set this site apart from other MI educational resources (ARENA notebooks, Neel Nanda's blog posts, scattered papers). These are not expected but valuable.

#### Educational Features

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Guided learning path with visual progression | Most MI resources are either rigid (ARENA: follow this order) or scattered (blog posts, papers). A visible learning path that you can follow OR deviate from is unique. Shows suggested order while allowing free browsing | MEDIUM | Already decided. Homepage shows the path through 6 blocks. Each article shows where it sits in the path. Different from a simple sidebar -- this is a visual map of the learning journey |
| Prerequisite indicators per article | No MI resource currently tells you "read X before this". Neel Nanda's guide suggests order but doesn't enforce it at the article level. This reduces frustration from jumping into advanced content unprepared | LOW | Simple metadata: "Prerequisites: Residual Stream, Attention Mechanism". Links to those articles. Can be as simple as a styled box at the top of each article |
| Difficulty/level indicators | Articles span from "what is a transformer" to "circuit tracing in frontier models". Signaling difficulty helps self-directed learners pick appropriate content | LOW | Three levels sufficient: Foundational / Intermediate / Advanced. Badge or tag near article title. Maps roughly to course blocks 1-2 / 3-4 / 5-6 |
| Reading time estimates | Helps users decide whether to start an article now or bookmark it. Common on Medium, dev.to, fast.ai. Especially useful for long technical articles | LOW | Calculate from word count at build time (250 wpm average). Display near title. For math-heavy articles, consider a 1.3x multiplier |
| "Pause and think" prompts | Unique to well-designed educational content. Inline boxes that pose a question before revealing the answer. Transforms passive reading into active learning. Not found on any current MI educational site | LOW | Simple HTML pattern: styled box with question, collapsible/expandable answer. No JS framework needed -- `<details>`/`<summary>` HTML elements work natively |

#### Content & Reference Features

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Hover citations (Distill-style) | Inline numbered citations that show full reference on hover. Far superior to footnotes-at-bottom for research-heavy content. Shows: title, authors, year, venue without leaving the page | MEDIUM | Distill's defining UX feature. Implement with CSS hover + positioned tooltip. Requires structured citation data (already in SOURCES.md). Falls back to click-to-expand on mobile |
| Margin notes / sidenotes | Place supplementary context, caveats, and asides in the margin rather than interrupting text flow. Distill uses this extensively. Better than footnotes for non-essential context | MEDIUM | Requires wider layout with margin space. On narrow screens, collapse to expandable inline notes. CSS-only implementation possible (Tufte CSS pattern) |
| Cross-article concept linking | When an article mentions "superposition", link directly to the superposition article section. Creates a web of interconnected knowledge rather than isolated articles | LOW | Build during content authoring. Simple `<a href>` links. But needs a consistent slug/anchor strategy across all articles |

#### UX Enhancements

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Dark mode | Researchers and ML practitioners often work late. Dark mode reduces eye strain. fast.ai supports it. Increasingly expected by technical audiences (though not universal -- some academic sites skip it) | MEDIUM | Use `prefers-color-scheme` media query for auto-detection, plus manual toggle. Requires designing a second color palette. Test KaTeX and code block rendering in dark mode. Use CSS custom properties for theming |
| Print-friendly stylesheet | Academic users print articles for offline reading, annotation, meetings. Distill supports print styling | LOW | CSS `@media print`: hide nav/sidebar, expand content width, show URLs after links, control page breaks around figures. Low effort, high polish signal |
| Scroll progress indicator | For long articles, a thin progress bar at top shows reading progress. Subtle signal of article length and position | LOW | Thin bar at top of viewport. ~10 lines of vanilla JS. Lightweight visual cue |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but would create problems for this specific project.

| Anti-Feature | Why Requested | Why Problematic | Alternative |
|--------------|---------------|-----------------|-------------|
| Interactive code execution (Jupyter-style) | MI learning involves running code. ARENA does this. Seems natural | Massive complexity. Requires server-side execution or WASM runtime. Contradicts static-site constraint. Maintenance burden. ARENA already serves this niche well | Link to relevant ARENA notebooks and Colab notebooks. Provide code snippets for reading, not execution. State clearly: "for hands-on coding, see ARENA" |
| User accounts and progress tracking | Users want to track which articles they've read, resume where they left off | Requires backend/database. Contradicts static-site constraint. Auth is a rabbit hole. Privacy concerns | Browser localStorage for simple "mark as read" checkboxes (no account needed). Or: let users use browser bookmarks. Keep it simple |
| Comments and discussion | Community engagement, Q&A on articles | Moderation burden. Spam. Quality control. Static site makes this hard (Disqus is heavy, privacy-invasive) | Link to relevant community spaces: MI Slack, Alignment Forum, LessWrong. "Discuss this article" links to existing communities |
| Video/audio content | Multimodal learning. Neel Nanda has YouTube content | Production overhead. Hosting costs. Bandwidth. Maintenance of two content formats. Text is the core value proposition | Link to external video resources where relevant (Neel Nanda's YouTube, 3Blue1Brown). Keep the site focused on reading |
| Automated Typst-to-HTML pipeline | DRY principle. Manual conversion is tedious | Typst slides and readable articles are fundamentally different formats. Automated conversion produces poor-quality prose from bullet-point slides. Manual adaptation is the feature, not the bug | Manual content adaptation. The conversion process is where pedagogical improvement happens -- turning slide bullets into flowing explanations |
| Full concept map / knowledge graph visualization | Looks impressive. Shows relationships between all concepts visually | HIGH complexity interactive visualization for marginal benefit. Hard to make usable. Becomes stale if content changes. The sidebar + prerequisite indicators + cross-links achieve the same goal more simply | Prerequisite indicators + cross-article links + the guided learning path visual on the homepage. These three together create a navigable knowledge structure without the complexity of a graph viz |
| Gamification (badges, streaks, points) | Engagement. Motivation. Duolingo-style | Wrong audience. Researchers and ML practitioners are intrinsically motivated. Gamification feels patronizing for academic content. Adds complexity with no real value | Clean progress indicators (difficulty badges, reading time) respect the audience without infantilizing them |
| Real-time search suggestions / autocomplete | Polished search UX | Significant JS complexity for marginal benefit on a ~50-page site. Pagefind/Lunr already return results quickly. Over-engineering | Simple search box with results page. Fast enough for this scale |
| Font size controls | Accessibility | Modern browsers have built-in zoom (Ctrl+/Cmd+). Custom font controls add UI clutter and often break layout. The correct approach is good default typography | Set readable defaults (18px body, proper line height). Let browser zoom handle the rest. Responsive design handles screen sizes |
| Multi-language support / i18n | Broader reach | Enormous ongoing maintenance burden. Content quality in translation is critical for technical/mathematical content. No evidence of demand for non-English MI content at this stage | English only. If demand emerges later, consider it as a separate project |

## Feature Dependencies

```
Sidebar Navigation
    +-- requires --> Topic/Content Hierarchy (must define URL structure first)
    +-- requires --> Responsive Layout (sidebar must collapse on mobile)

In-Page Table of Contents
    +-- requires --> Consistent Heading Structure (h2/h3 hierarchy in articles)
    +-- enhances --> Scroll Progress Indicator (both track reading position)

Full-Text Search
    +-- requires --> Content Pages (need content to index)
    +-- requires --> Build Step (to generate search index)
    +-- enhances --> Glossary (search can surface glossary entries)

Hover Citations
    +-- requires --> Structured Citation Data (SOURCES.md conversion to JSON/structured format)
    +-- enhances --> Paper Reference Links (citations link to papers)

Guided Learning Path
    +-- requires --> Topic/Content Hierarchy
    +-- requires --> Prerequisite Indicators (path implies order, prerequisites explain why)
    +-- enhances --> Prev/Next Navigation (next article follows the learning path)

Dark Mode
    +-- requires --> CSS Custom Properties (theming system)
    +-- requires --> Testing KaTeX + code blocks in dark context

Margin Notes / Sidenotes
    +-- requires --> Wide Layout with Margin Space
    +-- conflicts with --> Sidebar TOC on same side (both want the margin)

Prerequisite Indicators
    +-- requires --> Cross-Article Linking (prerequisites link to other articles)
    +-- enhances --> Guided Learning Path (prerequisites define the path edges)

Print Stylesheet
    +-- independent --> Can be added at any time, no dependencies
```

### Dependency Notes

- **Sidebar Navigation requires Topic Hierarchy:** The URL structure and content organization must be defined before the sidebar can be built. This is foundational -- get it right first.
- **Hover Citations require Structured Citation Data:** The 50+ papers in SOURCES.md need to be converted to a structured format (JSON or similar) that the hover component can consume. This is a data transformation task.
- **Margin Notes conflict with Sidebar TOC:** If the left margin has the TOC and the right margin has notes, the content column narrows. Choose one side for TOC and the other for margin notes, or use margin notes only when TOC is hidden (mobile/narrow). Distill places TOC left and notes right -- this works but requires ~1200px+ viewport.
- **Dark Mode requires CSS Custom Properties:** All colors must use CSS variables for theme switching. Easier to implement from the start than retrofit.
- **Learning Path requires Prerequisite Indicators:** The visual learning path on the homepage is only useful if individual articles also show their prerequisites. These two features are two views of the same underlying data (article dependency graph).

## MVP Definition

### Launch With (v1)

Minimum viable product -- the site is useful and complete enough to share.

- [ ] Responsive layout (desktop + mobile) -- foundational; everything sits on this
- [ ] Sidebar navigation with topic hierarchy -- primary discovery mechanism
- [ ] Breadcrumb navigation -- orientation for users arriving via external links
- [ ] In-page table of contents (auto-generated from headings) -- essential for long articles
- [ ] Previous/Next article navigation -- supports sequential learning
- [ ] KaTeX math rendering -- content is unreadable without it
- [ ] Code snippets with syntax highlighting -- MI articles reference code constantly
- [ ] Embedded diagrams with alt text -- 42 existing PNGs
- [ ] Paper references as inline links (new tab) -- simple version; hover citations can come later
- [ ] Full-text client-side search -- core discovery feature
- [ ] Glossary/concept index page -- MI vocabulary reference
- [ ] Guided learning path on homepage -- the "start here" experience
- [ ] Clean academic design with readable typography -- the Distill-inspired look
- [ ] Semantic HTML and keyboard navigation -- accessibility baseline
- [ ] Homepage with clear entry point -- explains what the site is

### Add After Validation (v1.x)

Features to add once core content is live and people are using the site.

- [ ] Prerequisite indicators per article -- add once article dependency data is mapped
- [ ] Difficulty/level indicators -- add once content is categorized by level
- [ ] Reading time estimates -- trivial to add, nice polish
- [ ] Dark mode -- add after confirming light theme works well
- [ ] Hover citations (Distill-style) -- upgrade from simple links; needs structured citation data
- [ ] Margin notes / sidenotes -- for supplementary context; needs layout adjustment
- [ ] "Pause and think" prompts -- add during content refinement pass
- [ ] Cross-article concept linking -- add as content matures and cross-references become clear
- [ ] Print-friendly stylesheet -- low effort, nice touch
- [ ] Scroll progress indicator -- tiny enhancement

### Future Consideration (v2+)

Features to defer until the site has proven its value.

- [ ] localStorage "mark as read" tracking -- only if users request it
- [ ] Concept relationship visualization (simple, not full graph) -- only if the learning path view isn't sufficient
- [ ] RSS feed for new content -- only if content updates are ongoing
- [ ] SEO optimization (Open Graph tags, structured data) -- for discoverability if the site gains traction

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Responsive layout | HIGH | MEDIUM | P1 |
| Sidebar navigation | HIGH | MEDIUM | P1 |
| KaTeX math rendering | HIGH | LOW | P1 |
| Code syntax highlighting | HIGH | LOW | P1 |
| Full-text search | HIGH | MEDIUM | P1 |
| In-page TOC | HIGH | LOW | P1 |
| Breadcrumbs | MEDIUM | LOW | P1 |
| Prev/Next navigation | MEDIUM | LOW | P1 |
| Paper reference links | HIGH | LOW | P1 |
| Glossary page | HIGH | MEDIUM | P1 |
| Guided learning path | HIGH | MEDIUM | P1 |
| Clean academic typography | HIGH | MEDIUM | P1 |
| Embedded diagrams | HIGH | LOW | P1 |
| Semantic HTML + a11y | MEDIUM | LOW | P1 |
| Homepage | HIGH | LOW | P1 |
| Prerequisite indicators | HIGH | LOW | P2 |
| Difficulty indicators | MEDIUM | LOW | P2 |
| Reading time estimates | LOW | LOW | P2 |
| Dark mode | MEDIUM | MEDIUM | P2 |
| Hover citations | MEDIUM | MEDIUM | P2 |
| Margin notes / sidenotes | MEDIUM | MEDIUM | P2 |
| "Pause and think" prompts | MEDIUM | LOW | P2 |
| Cross-article concept links | HIGH | LOW | P2 |
| Print stylesheet | LOW | LOW | P2 |
| Scroll progress indicator | LOW | LOW | P3 |
| localStorage read tracking | LOW | LOW | P3 |
| RSS feed | LOW | LOW | P3 |
| Open Graph / structured data | LOW | LOW | P3 |

**Priority key:**
- P1: Must have for launch -- site is broken or useless without these
- P2: Should have, add in refinement phase -- these elevate quality
- P3: Nice to have, add if time permits -- polish and optimization

## Competitor Feature Analysis

| Feature | Distill.pub | fast.ai Course | ARENA | Neel Nanda's Site | MIT OCW | Our Approach |
|---------|-------------|----------------|-------|-------------------|---------|--------------|
| Sidebar navigation | No (article-based journal) | Yes (collapsible) | Minimal | No (blog format) | Yes (course-level) | Yes -- full topic hierarchy |
| Table of contents | Left sidebar on wide screens | Yes | Via Streamlit | No | No | Auto-generated, fixed sidebar on wide screens |
| Breadcrumbs | No | Partial | No | No | Yes | Yes -- full hierarchy breadcrumbs |
| Prev/Next navigation | No | Yes (lesson sequence) | No (notebook-based) | No | Yes | Yes -- within thematic blocks |
| Math rendering | MathJax | KaTeX | Jupyter/MathJax | LaTeX in blog | Varies | KaTeX (fast, sufficient) |
| Code blocks | Prism.js | Yes (with annotations) | Jupyter cells | No | Varies | Prism.js or highlight.js, read-only |
| Search | No | Yes (Quarto-based) | No | No | Yes | Yes -- Pagefind or Lunr, client-side |
| Glossary | No | No | No | No | No | Yes -- curated MI glossary |
| Learning path | No (standalone articles) | Yes (lesson sequence) | Yes (chapter sequence) | Yes (blog post guide) | Yes (syllabus) | Yes -- visual path on homepage + per-article |
| Prerequisite indicators | No | Stated once at start | Dependency map exists | Mentioned in guide | Course prerequisites | Yes -- per-article with links |
| Difficulty indicators | Peer-review badges | No | No | No | Course level (UG/Grad) | Yes -- Foundational/Intermediate/Advanced |
| Reading time | No | No | No | No | No | Yes |
| Dark mode | No | Yes | No | No | No | Planned for v1.x |
| Hover citations | Yes (defining feature) | No | No | No | No | Planned for v1.x |
| Margin notes | Yes | No | No | No | No | Planned for v1.x |
| Interactive diagrams | Yes (D3.js) | No | Plotly in notebooks | No | No | Not for v1 -- flag diagrams for future |
| Responsive | Yes | Yes | Partial (Streamlit) | Yes (Squarespace) | Yes | Yes |
| Print stylesheet | Yes | No | No | No | Varies | Planned for v1.x |

**Key insight from competitor analysis:** No single existing MI resource combines structured navigation, curated glossary, prerequisite indicators, and search. ARENA is the closest competitor for MI education but uses a notebook-based format. Neel Nanda's guide is the best "how to get started" resource but is a single blog post, not a structured site. Distill.pub set the gold standard for article design but is a journal, not a curriculum. This site can occupy the unique position of "Distill-quality articles with ARENA-level curriculum structure."

## Sources

- [Distill.pub](https://distill.pub) -- direct analysis of features, article format guide
- [Distill Article Guide](https://distill.pub/guide/) -- citation, footnote, layout, and code features
- [fast.ai Course](https://course.fast.ai) -- navigation, search, dark mode, educational structure
- [ARENA Education](https://www.arena.education) -- curriculum structure, chapter organization
- [ARENA GitHub](https://github.com/callummcdougall/ARENA_3.0) -- content structure, dependency map
- [3Blue1Brown](https://www.3blue1brown.com) -- topic organization, metadata, lesson structure
- [MIT OCW](https://ocw.mit.edu) -- course browsing, search, breadcrumbs, level filtering
- [Neel Nanda's MI Guide](https://www.neelnanda.io/mechanistic-interpretability/getting-started) -- MI learning path recommendations, resource organization
- [NN/g Breadcrumb Guidelines](https://www.nngroup.com/articles/breadcrumbs/) -- breadcrumb UX best practices
- [Smashing Magazine on Breadcrumbs](https://www.smashingmagazine.com/2022/04/breadcrumbs-ux-design/) -- breadcrumb design patterns
- [Smashing Magazine on Dark Mode](https://www.smashingmagazine.com/2025/04/inclusive-dark-mode-designing-accessible-dark-themes/) -- accessible dark mode design
- [Communicating with Interactive Articles](https://distill.pub/2020/communicating-with-interactive-articles/) -- interactive article research and patterns

---
*Feature research for: Static educational website for Mechanistic Interpretability*
*Researched: 2026-02-02*
