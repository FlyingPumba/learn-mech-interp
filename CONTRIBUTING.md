# Contributing

Thank you for your interest in contributing to the mechanistic interpretability curriculum. This guide covers the project structure, how to run the site locally, and how to add or modify articles.

## Getting started

### Prerequisites

- Node.js 20+
- npm

### Local development

```bash
git clone <repo-url>
cd learn-mech-interp
npm install
npm start        # serve locally with hot reload
npm run build    # one-off production build
```

The site will be available at `http://localhost:8080/learn-mech-interp/`.

## Project structure

```
src/
  topics/
    <block-slug>/
      _block.json                  # Block metadata: { "title": "...", "order": N }
      <article-slug>/
        index.md                   # Article content with frontmatter
        images/                    # Article-specific images (optional)
    topics.11tydata.js             # Computed data for all articles
  _data/
    learningPath.js                # Computed from filesystem (do not edit)
    glossary.js                    # Computed from article frontmatter (do not edit)
    references.json                # Centralized bibliography
  _includes/
    layouts/                       # Nunjucks layouts
    partials/                      # Reusable template fragments
  glossary/
    index.njk                      # Glossary page
  index.njk                        # Home page
lib/
  scanBlocks.js                    # Filesystem scanner (shared by data files and config)
eleventy.config.js                 # Eleventy configuration and build-time validation
ARTICLE_GUIDELINES.md              # Tone, structure, and content rules for articles
```

Key points:
- **`learningPath.js` and `glossary.js` are computed from the filesystem.** You never edit them directly. The sidebar, topics page, prev/next navigation, and glossary all update automatically when you add or modify articles.
- **`references.json`** is the only data file you edit by hand (to add new citations).
- **URLs are flat.** An article at `src/topics/probing/probing-classifiers/index.md` is served at `/topics/probing-classifiers/`, not `/topics/probing/probing-classifiers/`.

## Adding a new article

### 1. Choose the right block

Articles are grouped into thematic blocks. Each block is a directory under `src/topics/` with a `_block.json` file. Pick the block that fits your article's topic.

If no existing block fits, see [Adding a new block](#adding-a-new-block) below.

### 2. Create the article directory

```bash
mkdir src/topics/<block-slug>/<article-slug>
```

The article slug becomes part of the URL (`/topics/<article-slug>/`), so choose something short, lowercase, and hyphenated.

### 3. Write `index.md`

Create `src/topics/<block-slug>/<article-slug>/index.md` with this frontmatter:

```yaml
---
title: "Your Article Title"
description: "A one-sentence summary for the article header and metadata."
order: N
prerequisites:
  - title: "Prerequisite Article Title"
    url: "/topics/prerequisite-slug/"
glossary:
  - term: "Key Term"
    definition: "Concise definition of the term."
---

Article content here...
```

**Required fields:**
- `title` -- the article's display title
- `description` -- shown below the title on the article page
- `order` -- integer position within the block (1-indexed, contiguous, no gaps)

**Optional fields:**
- `prerequisites` -- list of articles the reader should complete first
- `glossary` -- terms this article defines (appear on the glossary page)

### 4. Set the correct order

The `order` field determines where the article appears within its block. Orders must be contiguous starting from 1. If you are adding an article to a block that already has 3 articles (orders 1, 2, 3), your new article should be order 4 (appending) or you need to renumber existing articles to insert it elsewhere.

### 5. Add citations

If your article cites papers, add entries to `src/_data/references.json`:

```json
"bibtex_key": {
  "title": "Paper Title",
  "authors": "Last, F., Last, F., et al.",
  "year": 2024,
  "venue": "Conference or Publisher",
  "url": "https://..."
}
```

Then reference them inline with `{% cite "bibtex_key" %}`.

### 6. Add images (optional)

Place images in `src/topics/<block-slug>/<article-slug>/images/`. Reference them with absolute paths:

```markdown
![Alt text](/topics/<article-slug>/images/filename.png)
```

The build remaps nested image directories to flat output paths, so the URL does not include the block slug.

### 7. Read the article guidelines

**Before writing content, read `ARTICLE_GUIDELINES.md`.** It covers tone, structure, formatting, and the pedagogical approach. The short version:

- Articles cover **techniques, concepts, or ideas** -- not individual papers
- Start with motivation, then concrete examples, then abstractions
- Use `{% sidenote "..." %}` for tangents and `{% marginnote "..." %}` for unnumbered margin notes
- Use `<details class="pause-and-think">` for engagement prompts (aim for 1--3 per article)
- Use blockquote format for key definitions: `> **Term:** Definition here.`
- Cite at the point of the claim with `{% cite "key" %}`
- Keep articles to roughly 15--25 minutes reading time

### 8. Verify

Run `npm run build`. The build-time validator checks:

- Required frontmatter fields (`title`, `description`, `order`)
- Contiguous ordering within blocks (no gaps or duplicates)
- All `{% cite "key" %}` keys exist in `references.json`
- All prerequisite URLs point to existing articles
- No duplicate glossary terms across articles

If the build fails, the error message will tell you exactly what to fix.

## Modifying an existing article

- **Content edits** (fixing errors, improving explanations, adding sections): edit `index.md` directly. Read `ARTICLE_GUIDELINES.md` if you are making substantive changes.
- **Reordering**: change the `order` field in the affected articles. Keep orders contiguous within the block.
- **Moving to a different block**: `git mv` the article directory, then update the `order` fields in both the source and destination blocks so they remain contiguous.
- **Adding glossary terms**: add entries to the `glossary:` list in the article's frontmatter. Each term must be unique across all articles.
- **Adding citations**: add the reference to `src/_data/references.json`, then use `{% cite "key" %}` in the article.

## Adding a new block

1. Create `src/topics/<block-slug>/_block.json`:

```json
{
  "title": "Block Display Title",
  "order": N
}
```

2. Block `order` must be contiguous with existing blocks. If there are currently 12 blocks (orders 1--12), a new block should be order 13 (appending) or you need to renumber existing blocks to insert it.

3. Add at least one article inside the block directory.

## Build-time validation

Every build (including `npm start` in dev mode) runs validation. To temporarily skip it while working on incomplete articles:

```bash
SKIP_VALIDATION=1 npm start
```

Do not merge to `main` with validation disabled. CI will catch it.

## Shortcode reference

| Shortcode | Usage | Purpose |
|-----------|-------|---------|
| `{% cite "key" %}` | Inline | Numbered citation with hover tooltip |
| `{% sidenote "text" %}` | Inline | Numbered Tufte-style sidenote |
| `{% marginnote "text" %}` | Inline | Unnumbered margin note |

## Deployment

The site deploys automatically to GitHub Pages on push to `main`. The CI pipeline runs `npm ci`, builds with Eleventy, and uploads the `_site` directory. Pagefind search indexing happens as part of the build.
