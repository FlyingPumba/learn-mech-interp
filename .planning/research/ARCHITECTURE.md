# Architecture Research

**Domain:** Static educational website (Mechanistic Interpretability)
**Researched:** 2026-02-02
**Confidence:** HIGH

## System Overview

```
BUILD TIME (Node.js)                          BROWSER (client-side)
========================                      ========================

 Content Layer                                 Rendered Site
 +-----------+  +------------+                +------------------+
 | Markdown  |  | Nunjucks   |                | Static HTML      |
 | articles  |  | layouts &  |   Eleventy     | (pre-rendered    |
 | (.md)     |  | partials   | ============>  |  math, fully     |
 +-----------+  +------------+   build         |  assembled       |
       |              |          pipeline      |  pages)          |
 +-----------+  +------------+                +--------+---------+
 | Front     |  | Global     |                         |
 | matter    |  | data files |                         v
 | (YAML)    |  | (.json)    |                +-----------------+
 +-----------+  +------------+                | Pagefind search |
                      |                       | (chunked index) |
                      v                       +-----------------+
              +---------------+                        |
              | glossary.json |                        v
              | topics.json   |               +-----------------+
              | papers.json   |               | KaTeX CSS       |
              +---------------+               | (fonts + styles)|
                                              +-----------------+
                      |
                      v
              +---------------+
              | KaTeX SSR via |    At build time, math in Markdown
              | markdown-it   | -> is rendered to static HTML+MathML.
              | plugin        |    No client-side KaTeX JS needed.
              +---------------+
                      |
                      v
              +---------------+
              | Pagefind CLI  |    Runs AFTER Eleventy build.
              | indexes the   | -> Produces chunked search index
              | built HTML    |    in _site/_pagefind/
              +---------------+
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Eleventy (11ty) | Build orchestrator: assembles layouts, partials, data, and content into static HTML | `eleventy.config.js` with Nunjucks templates, markdown-it library |
| Nunjucks templates | DRY layout system: base layout, article layout, topic index, glossary page | `.njk` files in `src/_includes/` |
| Markdown content | Article source files with YAML front matter for metadata | `.md` files in `src/topics/` |
| Global data files | Structured data: glossary terms, paper references, topic metadata, learning path order | `.json` files in `src/_data/` |
| markdown-it + KaTeX plugin | Server-side math rendering at build time | `@mdit/plugin-katex` or `markdown-it-katex` in Eleventy config |
| Pagefind | Post-build search indexing: generates chunked client-side search index | `npx pagefind --site _site` in `eleventy.after` event |
| Vanilla CSS | Styling: Distill.pub-inspired academic design, responsive layout | CSS files in `src/assets/css/` |
| Vanilla JS | Minimal client-side behavior: search UI, sidebar toggle, smooth scrolling | JS files in `src/assets/js/` |
| GitHub Actions | CI/CD: builds site and deploys to GitHub Pages on push to main | `.github/workflows/deploy.yml` |

## Recommended Project Structure

```
learn-mech-interp/
├── .github/
│   └── workflows/
│       └── deploy.yml              # GitHub Actions: build + deploy to Pages
├── .planning/                      # Project planning (not deployed)
├── src/                            # Everything Eleventy processes
│   ├── _data/                      # Global data files
│   │   ├── glossary.json           # MI glossary terms + definitions
│   │   ├── papers.json             # Paper references (from SOURCES.md)
│   │   ├── topics.json             # Topic metadata + learning path order
│   │   └── site.json               # Site-wide config (title, baseUrl, etc.)
│   ├── _includes/                  # Layouts and partials (NOT output as pages)
│   │   ├── layouts/
│   │   │   ├── base.njk            # HTML skeleton: <head>, KaTeX CSS, scripts
│   │   │   ├── article.njk         # Article page: extends base, adds sidebar + TOC
│   │   │   ├── topic-index.njk     # Topic listing page layout
│   │   │   └── glossary.njk        # Glossary page layout
│   │   ├── partials/
│   │   │   ├── header.njk          # Site header + navigation
│   │   │   ├── footer.njk          # Site footer
│   │   │   ├── sidebar.njk         # Topic navigation sidebar
│   │   │   ├── toc.njk             # Table of contents (auto-generated)
│   │   │   ├── paper-ref.njk       # Paper citation card partial
│   │   │   ├── topic-card.njk      # Topic preview card for index pages
│   │   │   └── breadcrumb.njk      # Breadcrumb navigation
│   │   └── macros/
│   │       ├── math-block.njk      # Reusable math notation patterns
│   │       └── figure.njk          # Figure with caption macro
│   ├── assets/                     # Static assets (passed through to _site)
│   │   ├── css/
│   │   │   ├── main.css            # Core styles
│   │   │   ├── article.css         # Article-specific typography
│   │   │   ├── components.css      # Reusable component styles
│   │   │   └── responsive.css      # Mobile/responsive overrides
│   │   ├── js/
│   │   │   ├── search.js           # Pagefind UI initialization
│   │   │   ├── sidebar.js          # Sidebar toggle behavior
│   │   │   └── toc.js              # Active section highlighting
│   │   ├── images/
│   │   │   ├── diagrams/           # Course diagrams (~42 PNGs)
│   │   │   └── icons/              # UI icons (SVG preferred)
│   │   └── fonts/                  # Self-hosted fonts (if any)
│   ├── topics/                     # Content pages -- one folder per topic
│   │   ├── topics.json             # Directory data file: tags all as "topic"
│   │   ├── transformer-architecture/
│   │   │   └── index.md            # Article: Transformer Architecture
│   │   ├── residual-stream/
│   │   │   └── index.md            # Article: The Residual Stream
│   │   ├── attention-heads/
│   │   │   └── index.md            # Article: Attention Heads & Circuits
│   │   ├── induction-heads/
│   │   │   └── index.md            # Article: Induction Heads
│   │   ├── logit-lens/
│   │   │   └── index.md            # Article: Logit Lens
│   │   ├── probing/
│   │   │   └── index.md            # Article: Probing
│   │   ├── activation-patching/
│   │   │   └── index.md            # Article: Activation Patching
│   │   ├── ioi-circuit/
│   │   │   └── index.md            # Article: IOI Circuit Analysis
│   │   ├── superposition/
│   │   │   └── index.md            # Article: Superposition
│   │   ├── saes/
│   │   │   └── index.md            # Article: Sparse Autoencoders
│   │   ├── steering/
│   │   │   └── index.md            # Article: Steering & RepE
│   │   ├── circuit-tracing/
│   │   │   └── index.md            # Article: Circuit Tracing
│   │   ├── model-diffing/
│   │   │   └── index.md            # Article: Model Diffing
│   │   ├── multimodal-mi/
│   │   │   └── index.md            # Article: Multimodal MI
│   │   └── safety-applications/
│   │       └── index.md            # Article: AI Safety Applications
│   ├── glossary.njk                # Glossary page (renders from glossary.json)
│   ├── search.njk                  # Search page (Pagefind UI)
│   ├── index.njk                   # Homepage with learning path
│   └── 404.njk                     # Custom 404 page
├── eleventy.config.js              # Eleventy configuration
├── package.json                    # Dependencies
├── .nojekyll                       # Tells GitHub Pages to skip Jekyll
└── .gitignore                      # Excludes _site/, node_modules/
```

### Structure Rationale

- **`src/` as input directory:** Separates source from build output (`_site/`). Standard Eleventy convention. Keeps the project root clean.
- **`src/_data/` for global data:** Eleventy automatically makes all `.json` files here available as template variables. `glossary.json` drives the glossary page, `papers.json` drives citation links, `topics.json` drives the learning path and topic index.
- **`src/_includes/layouts/` and `src/_includes/partials/`:** Separates full-page layouts (which receive `{{ content | safe }}`) from includable fragments (header, footer, sidebar). Layouts chain: `article.njk` extends `base.njk`.
- **`src/topics/{topic-slug}/index.md`:** Each topic gets its own directory with an `index.md`. This produces clean URLs like `/topics/probing/` without any trailing `.html`. The `topics.json` directory data file auto-tags everything in this folder as belonging to the "topic" collection.
- **`src/assets/`:** Eleventy passthrough-copies this directory to `_site/assets/`. Images, CSS, JS, and fonts all live here. No processing needed -- just copied.
- **`src/topics/topics.json`:** A directory data file that applies shared front matter to all content in `src/topics/`. Sets `layout: layouts/article.njk` and `tags: topic` so every topic page automatically uses the article layout and joins the "topic" collection.

## Architectural Patterns

### Pattern 1: Build-Time Assembly (No Client-Side Templating)

**What:** All HTML is fully assembled at build time by Eleventy. The browser receives complete, ready-to-render HTML. There is no client-side template rendering, no JavaScript-driven page assembly, no SPA routing.

**When to use:** Always, for this project. This is the fundamental architectural decision.

**Trade-offs:**
- Pro: Fastest possible page loads; works with zero JS; perfect for SEO; GitHub Pages serves it directly
- Pro: No client-side rendering means no FOUC (Flash of Unstyled Content) or layout shifts from template injection
- Con: Every content change requires a rebuild (but builds are fast -- seconds for a site this size)
- Con: No dynamic content without JS (but this site has no dynamic content needs beyond search)

**Example -- how a topic page gets built:**
```
1. Eleventy reads src/topics/probing/index.md
2. Parses YAML front matter: layout, title, description, related topics, etc.
3. Renders Markdown to HTML via markdown-it (KaTeX plugin renders math inline)
4. Wraps in article.njk layout (which includes sidebar, TOC, header, footer)
5. article.njk extends base.njk (which adds <head>, KaTeX CSS, scripts)
6. Outputs _site/topics/probing/index.html -- a complete, standalone HTML page
```

### Pattern 2: Layout Chaining

**What:** Layouts extend other layouts, creating a chain. Content pages specify only the innermost layout; that layout specifies its parent, and so on up to the base.

**When to use:** Whenever you have multiple page types that share a common outer shell but differ in inner structure.

**Trade-offs:**
- Pro: Extreme DRY -- change the `<head>` once in `base.njk`, it propagates everywhere
- Pro: Page types (article, index, glossary) get their own layout without duplicating the base
- Con: Deep chains (3+ levels) can be hard to debug; stick to 2 levels for this project

**Example chain:**
```
base.njk                     # HTML skeleton, <head>, global CSS/JS
  └── article.njk            # Article chrome: sidebar, TOC, prev/next nav
       └── index.md          # Actual content (Markdown with math)

base.njk
  └── topic-index.njk        # Topic listing grid
       └── index.njk         # Homepage or topic index page

base.njk
  └── glossary.njk           # Glossary-specific layout (alphabetical, anchored)
       └── glossary.njk      # Glossary page template
```

### Pattern 3: Data-Driven Page Generation

**What:** Structured JSON data files in `_data/` drive page generation. A single template plus a data file produces multiple pages (or a single page with structured content).

**When to use:** For the glossary (one JSON file produces the entire glossary page), for the learning path (topic ordering is data, not hard-coded), and potentially for individual glossary term pages.

**Trade-offs:**
- Pro: Content authors edit JSON, not HTML; adding a glossary term never requires touching templates
- Pro: Same data powers multiple views (glossary page, inline tooltips, search metadata)
- Con: JSON is less friendly to edit than Markdown for long-form content; only use for structured/short data

**Example -- glossary.json driving the glossary page:**
```json
[
  {
    "term": "Superposition",
    "definition": "The hypothesis that neural networks represent more features than they have dimensions...",
    "relatedTopics": ["superposition", "saes"],
    "papers": ["elhage2022superposition"]
  },
  {
    "term": "Sparse Autoencoder",
    "definition": "A neural network trained to decompose activations into sparse, interpretable features...",
    "relatedTopics": ["saes"],
    "papers": ["bricken2023monosemanticity"]
  }
]
```

```nunjucks
{# glossary.njk #}
{% for entry in glossary | sort(attribute='term') %}
<dt id="{{ entry.term | slugify }}">{{ entry.term }}</dt>
<dd>
  {{ entry.definition }}
  {% if entry.relatedTopics.length %}
  <div class="related">
    {% for slug in entry.relatedTopics %}
    <a href="/topics/{{ slug }}/">{{ slug | topicName }}</a>
    {% endfor %}
  </div>
  {% endif %}
</dd>
{% endfor %}
```

### Pattern 4: Post-Build Search Indexing

**What:** Pagefind runs as a post-processing step after Eleventy outputs static HTML. It indexes the built pages and produces a chunked search index that loads on-demand in the browser.

**When to use:** For client-side full-text search without a backend.

**Trade-offs:**
- Pro: Near-zero configuration; works on the built HTML, so it indexes exactly what users see
- Pro: Chunked index means tiny initial payload (~54 KB) regardless of site size
- Pro: Includes a ready-to-use UI component
- Con: Cannot search during local development (Pagefind does not support watch mode)
- Con: Adds ~500 KB to the build output on disk (but only ~54 KB is loaded by the browser initially)

**Integration point in eleventy.config.js:**
```javascript
const { execSync } = require('child_process');

module.exports = function(eleventyConfig) {
  eleventyConfig.on('eleventy.after', () => {
    execSync('npx pagefind --site _site --glob "**/*.html"', {
      encoding: 'utf-8'
    });
  });
};
```

### Pattern 5: Directory Data Files for Collection Management

**What:** A `.json` file named after a directory automatically applies its data to every template in that directory. This is how all topic pages get the same layout and tags without repeating front matter.

**When to use:** Whenever a group of content files share common front matter.

**Example -- `src/topics/topics.json`:**
```json
{
  "layout": "layouts/article.njk",
  "tags": "topic",
  "permalink": "topics/{{ page.fileSlug }}/"
}
```

Now every `.md` file in `src/topics/` automatically uses the article layout, belongs to the "topic" collection, and gets a clean URL. Individual files only need to specify what is unique to them (title, description, related topics, etc.).

## Data Flow

### Build Pipeline Flow

```
Source Files                    Eleventy Build                     Output
============                    ==============                     ======

src/topics/*.md  ──────┐
                       │
src/_data/*.json ──────┤
                       ├──> Eleventy (markdown-it + KaTeX) ──> _site/*.html
src/_includes/*.njk ───┤         |
                       │         v
src/assets/** ─────────┘    Passthrough copy ──────────────> _site/assets/**
                                 |
                                 v
                         Pagefind indexer ──────────────────> _site/_pagefind/**
                                 |
                                 v
                         GitHub Actions deploy ────────────> GitHub Pages CDN
```

### Content Authoring Flow

```
Author writes/edits src/topics/probing/index.md
    |
    v
Front matter specifies: title, description, prereqs, related topics
    |
    v
Markdown body uses $...$ and $$...$$ for math, standard Markdown for text
    |
    v
References papers by key: [Elhage et al., 2022]({{ papers.elhage2022superposition.url }})
    |
    v
Git push to main triggers GitHub Actions
    |
    v
Build pipeline assembles, renders math, generates search index, deploys
```

### Browser Runtime Flow

```
User visits /topics/probing/
    |
    v
GitHub Pages serves _site/topics/probing/index.html (complete static HTML)
    |
    v
Browser renders pre-built HTML (math already rendered, no JS needed for content)
    |
    v
CSS loads: main.css, article.css, KaTeX font styles
    |
    v
Minimal JS loads: sidebar toggle, TOC active-section highlighting
    |
    v
If user searches: Pagefind JS loads (~8 KB), fetches initial index (~46 KB),
    then loads result fragments on-demand (~5-8 KB each)
```

### Key Data Flows

1. **Content to HTML:** Markdown + front matter flows through Eleventy's template pipeline. markdown-it parses Markdown to HTML, KaTeX plugin intercepts math delimiters and renders them to static HTML+MathML. Nunjucks layouts wrap the content with chrome (sidebar, header, footer). Output is a complete `.html` file.

2. **Data to Navigation:** `topics.json` (learning path order) and the Eleventy "topic" collection flow into `sidebar.njk` and `index.njk`. The sidebar shows all topics; the homepage shows them in learning-path order. Adding a new topic page automatically updates both.

3. **Data to Glossary:** `glossary.json` flows into `glossary.njk`, which renders a definition list. Each term links to relevant topic pages. Topic pages can link back to glossary entries via anchored URLs (`/glossary/#superposition`).

4. **Built HTML to Search Index:** After build, Pagefind reads all `.html` files in `_site/`, respecting `data-pagefind-body` attributes to index only article content (not nav/footer). Produces a chunked index in `_site/_pagefind/`.

5. **Search Query to Results:** In the browser, Pagefind JS intercepts user input, fetches the relevant index chunk(s), computes results locally, and fetches content fragments for display. All client-side, no server calls except static file fetches to the same origin.

## Scaling Considerations

This is a static educational site, not a high-traffic SaaS product. "Scaling" here means content growth and maintainability, not concurrent users.

| Concern | At 15 topics | At 40 topics | At 100+ topics |
|---------|-------------|-------------|----------------|
| Build time | <2 seconds | <5 seconds | <15 seconds (Eleventy is fast) |
| Navigation | Flat sidebar is fine | Need section grouping in sidebar | Need collapsible sections or search-first nav |
| Search index | ~50 KB initial payload | ~80 KB initial payload | ~150 KB initial payload (Pagefind scales well) |
| Glossary | Single page, manageable | Single page with alphabet nav | Consider splitting into sections or adding search |
| Cross-linking | Manual `relatedTopics` in front matter | Consider auto-linking via shared tags | Need tooling to detect broken links |
| CSS complexity | Single stylesheet sufficient | Component-based CSS helps | Consider CSS custom properties for theming |

### Scaling Priorities

1. **First bottleneck -- navigation overload:** When topics exceed ~25, a flat sidebar list becomes unwieldy. Group topics under the 6 course blocks (Foundations, Observation to Causation, etc.) with collapsible sections. This should be planned from the start even with fewer topics.

2. **Second bottleneck -- cross-link maintenance:** As topics grow, manually maintaining `relatedTopics` arrays in front matter becomes error-prone. An Eleventy plugin or custom collection that infers relationships from shared tags/glossary terms would help, but this is a later optimization.

## Anti-Patterns

### Anti-Pattern 1: Client-Side Template Assembly

**What people do:** Use JavaScript `fetch()` to load header.html, footer.html, sidebar.html at runtime and inject them into the page. Or use Web Components to define `<site-header>` that loads its content dynamically.

**Why it's wrong:** Causes Flash of Unstyled Content (FOUC). Navigation is invisible until JS runs. Breaks if JS fails. Slower perceived load. SEO crawlers may miss content. Adds complexity for no benefit when a build step exists.

**Do this instead:** Assemble everything at build time with Eleventy's `{% include %}` and layout system. The browser receives complete HTML.

### Anti-Pattern 2: Monolithic CSS File That Grows Forever

**What people do:** Put all styles in a single `style.css` that grows to 2000+ lines with no organization.

**Why it's wrong:** Hard to find styles, hard to avoid conflicts, hard to maintain, leads to specificity wars and `!important` abuse.

**Do this instead:** Split CSS by concern: `main.css` (base/reset), `article.css` (typography/content), `components.css` (reusable pieces), `responsive.css` (breakpoints). Use CSS custom properties for shared values (colors, spacing, fonts).

### Anti-Pattern 3: SPA Routing on GitHub Pages

**What people do:** Build a single-page application with client-side routing (hash-based or history API) thinking it's cleaner than separate HTML files.

**Why it's wrong:** GitHub Pages returns 404 for any URL that doesn't map to a real file. Workarounds (404.html redirect trick, HashRouter) break SEO entirely -- Google will only index the homepage. It also means the entire site's JS must load before any page renders.

**Do this instead:** Generate real HTML files for every URL. `/topics/probing/index.html` is a real file that GitHub Pages serves directly. No routing needed. Every page is independently crawlable and loads instantly.

### Anti-Pattern 4: Storing Content in JSON Instead of Markdown

**What people do:** Put article content in JSON data files or HTML strings, thinking it's "more structured."

**Why it's wrong:** JSON is hostile to long-form writing. No syntax highlighting, no paragraph breaks, escape character hell. Authors will hate editing it.

**Do this instead:** Use Markdown files for all long-form content (articles). Use JSON only for structured/tabular data (glossary terms, paper references, topic metadata). Let each format do what it's good at.

### Anti-Pattern 5: Duplicating the Header/Footer in Every HTML File

**What people do:** Copy-paste the header and footer HTML into every page, planning to "search and replace" when changes happen.

**Why it's wrong:** Inevitably, some pages get out of sync. A navigation link change requires editing 20+ files. One missed file causes a broken nav.

**Do this instead:** This is the entire reason for using Eleventy. Define the header and footer once as partials, include them in a base layout, and every page inherits them automatically.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| GitHub Pages | Serves built `_site/` directory as static files | Via GitHub Actions `actions/deploy-pages` |
| KaTeX CDN (fonts) | CSS `@font-face` references | Only the CSS file is needed -- KaTeX fonts can be self-hosted for reliability, or served from CDN. Math HTML is pre-rendered. |
| Pagefind | Post-build CLI tool | Installed as npm dev dependency; runs automatically after Eleventy build |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Content (Markdown) to Layout (Nunjucks) | Front matter data + `{{ content \| safe }}` in layouts | Content specifies its layout via `layout` key; layouts receive rendered content |
| Data files to Templates | Eleventy's global data cascade | Any `.njk` or `.md` can access `{{ glossary }}`, `{{ papers }}`, `{{ topics }}` |
| Build output to Pagefind | File system -- Pagefind reads `_site/*.html` | `data-pagefind-body` attribute controls what gets indexed |
| Eleventy to GitHub Actions | `package.json` scripts: `"build": "eleventy"` | Actions workflow runs `npm ci && npm run build` then deploys `_site/` |
| Topic pages to Glossary | URL-based linking: `/glossary/#term-slug` | Glossary terms have `id` attributes; topic pages link with anchors |
| Topic pages to each other | `relatedTopics` front matter array + `topics.json` learning path | Sidebar shows all topics; article footer shows related/next topics |

## Build Order (Dependencies Between Components)

This is the recommended order for building the system, based on what depends on what.

```
Phase 1: Foundation (no content dependency)
├── eleventy.config.js          # Must exist first
├── base.njk layout             # HTML skeleton
├── header.njk + footer.njk     # Global chrome
├── main.css                    # Base styles
└── site.json                   # Global config

Phase 2: Content Pipeline (depends on Phase 1)
├── markdown-it + KaTeX setup   # Math rendering in Eleventy config
├── article.njk layout          # Article page structure
├── article.css                 # Article typography
├── topics.json dir data file   # Auto-tags + auto-layout for topics
└── First topic page (.md)      # Proves the pipeline works end-to-end

Phase 3: Navigation (depends on Phase 2 -- needs at least one topic)
├── sidebar.njk                 # Topic navigation
├── toc.njk                     # Table of contents
├── breadcrumb.njk              # Breadcrumbs
├── index.njk (homepage)        # Learning path display
└── topic-index.njk layout      # Topic listing page

Phase 4: Data-Driven Features (depends on Phase 1, benefits from Phase 2 content)
├── glossary.json               # Term definitions
├── papers.json                 # Paper references
├── topics.json (data file)     # Learning path ordering
├── glossary.njk page           # Glossary page
└── Cross-link infrastructure   # Topic-to-glossary, topic-to-topic links

Phase 5: Search (depends on Phase 2 -- needs built HTML to index)
├── Pagefind integration        # eleventy.after hook
├── search.njk page             # Search UI page
└── data-pagefind-body attrs    # Control what gets indexed

Phase 6: Deployment Pipeline (depends on all above)
├── .github/workflows/deploy.yml
├── .nojekyll
├── Path prefix config (if needed)
└── 404.njk page

Phase 7: Content Migration (depends on Phase 2-4 for templates and data structures)
├── Convert all 16 weeks of content to topic pages
├── Populate glossary.json
├── Populate papers.json
└── Set learning path ordering
```

**Rationale:** The build order ensures that each phase produces a testable, working artifact. After Phase 2, you have a single working article page with rendered math. After Phase 3, you have navigation. After Phase 5, you have search. After Phase 6, it's live. Phase 7 is the bulk of the work (content migration) but it's decoupled from infrastructure.

## Sources

- [Eleventy official documentation](https://www.11ty.dev/docs/) -- Layouts, includes, collections, data files, deployment (HIGH confidence)
- [Eleventy Layouts docs](https://www.11ty.dev/docs/layouts/) -- Layout chaining, content injection (HIGH confidence)
- [Eleventy Global Data Files docs](https://www.11ty.dev/docs/data-global/) -- `_data/` directory, JSON data access (HIGH confidence)
- [Eleventy "Create Pages From Data" docs](https://www.11ty.dev/docs/pages-from-data/) -- Pagination for data-driven page generation (HIGH confidence)
- [Pagefind official site](https://pagefind.app/) -- Architecture, chunked index, setup (HIGH confidence)
- [KaTeX official docs -- auto-render extension](https://katex.org/docs/autorender.html) -- Delimiter config, client-side rendering (HIGH confidence)
- [KaTeX GitHub](https://github.com/KaTeX/KaTeX) -- Server-side rendering capability (HIGH confidence)
- [GitHub Pages official docs](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) -- 1 GB size limit, 100 GB/month bandwidth, 10 builds/hour (HIGH confidence)
- [Distill.pub template guide](https://distill.pub/guide/) -- Layout system, CSS framework, custom elements (MEDIUM confidence)
- [distillpub/template GitHub](https://github.com/distillpub/template) -- Project structure reference (MEDIUM confidence)
- [Pagefind + Eleventy integration tutorials](https://rknight.me/blog/using-pagefind-with-eleventy-for-search/) -- `eleventy.after` hook pattern, `data-pagefind-body` (MEDIUM confidence, multiple sources agree)
- [markdown-it-katex / @mdit/plugin-katex](https://github.com/11ty/eleventy/issues/1318) -- Build-time math rendering in Eleventy (MEDIUM confidence, community-verified pattern)
- [Deploy Eleventy to GitHub Pages with GitHub Actions](https://medium.com/@kinneko-de/deploy-eleventy-to-github-pages-60816d552317) -- CI/CD workflow pattern (MEDIUM confidence)
- [SPA routing on GitHub Pages -- community discussion](https://github.com/orgs/community/discussions/64096) -- Why SPA routing breaks SEO on GH Pages (MEDIUM confidence)
- [Lunr.js vs Pagefind comparison](https://brainbaking.com/post/2022/08/implementing-searching-in-static-websites/) -- Fragmented vs monolithic index architecture (MEDIUM confidence)

---
*Architecture research for: Static educational website (Mechanistic Interpretability)*
*Researched: 2026-02-02*
