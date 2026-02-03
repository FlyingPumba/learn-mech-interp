# Phase 1: Foundation & Deployment - Research

**Researched:** 2026-02-03
**Domain:** Eleventy static site generator + GitHub Pages deployment
**Confidence:** HIGH

## Summary

Phase 1 establishes the build and deployment infrastructure for a static educational site. The research confirms Eleventy 3.x as the mature standard for static site generation with excellent Nunjucks templating support. GitHub Pages deployment has evolved: the recommended approach now uses the official `actions/deploy-pages` workflow with `actions/upload-pages-artifact`, though the community `peaceiris/actions-gh-pages` action remains well-supported for branch-based deployment.

The key architectural decisions are straightforward: Eleventy's directory data files elegantly solve the thematic folder structure requirement (INFR-04), and Nunjucks template inheritance provides the DRY layouts required by INFR-02. The main complexity is understanding when to use `pathPrefix` for GitHub Pages deployment.

**Primary recommendation:** Use Eleventy 3.x with the official GitHub Actions Pages workflow (`actions/upload-pages-artifact` + `actions/deploy-pages`), organizing content in `src/topics/<name>/` directories with directory data files to control permalinks and layouts per topic.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @11ty/eleventy | 3.1.2 | Static site generator | Official stable release, Node 18+ support, zero-config to start |
| Nunjucks | 3.x | Templating language | Bundled with Eleventy, supports extends/block/include/macros |
| Node.js | 18+ | JavaScript runtime | Required minimum for Eleventy 3.x |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @11ty/eleventy-navigation | 1.0+ | Hierarchical navigation | Phase 5 (Navigation), not needed for Phase 1 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Official actions/deploy-pages | peaceiris/actions-gh-pages | peaceiris pushes to gh-pages branch (simpler mental model but requires branch configuration); official workflow uses artifacts (cleaner, no extra branch) |
| Nunjucks | Liquid | Liquid is Jekyll-compatible but Nunjucks has better template inheritance with blocks |

**Installation:**
```bash
npm init -y
npm install @11ty/eleventy
```

## Architecture Patterns

### Recommended Project Structure
```
learn-mech-interp/
├── eleventy.config.js       # Eleventy configuration
├── package.json
├── src/                     # Input directory
│   ├── _includes/           # Layouts and partials
│   │   └── layouts/
│   │       └── base.njk     # Base HTML template
│   ├── _data/               # Global data files
│   ├── topics/              # Thematic content folders
│   │   ├── topics.11tydata.js   # Directory data: layout + permalink pattern
│   │   └── test/            # Test article folder
│   │       └── index.md     # Test article content
│   └── index.njk            # Homepage
├── _site/                   # Output directory (gitignored)
└── .github/
    └── workflows/
        └── deploy.yml       # GitHub Actions workflow
```

### Pattern 1: Directory Data Files for Thematic URLs
**What:** A single data file applies layout and permalink patterns to all content in a folder
**When to use:** When you have a folder of similar content that should share configuration
**Example:**
```javascript
// src/topics/topics.11tydata.js
// Source: https://www.11ty.dev/docs/data-template-dir/
export default {
  layout: "layouts/base.njk",
  permalink: function (data) {
    // Outputs to /topics/<folder-name>/
    return `/topics/${this.slugify(data.page.fileSlug)}/`;
  }
};
```

### Pattern 2: Base Layout with Content Injection
**What:** A base Nunjucks template that child templates extend or content injects into
**When to use:** For DRY HTML boilerplate (doctype, head, body structure)
**Example:**
```html
<!-- src/_includes/layouts/base.njk -->
<!-- Source: https://www.11ty.dev/docs/layouts/ -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ title }}</title>
</head>
<body>
  <main>
    {{ content | safe }}
  </main>
</body>
</html>
```

### Pattern 3: Front Matter for Article Metadata
**What:** YAML front matter in Markdown files for per-article configuration
**When to use:** Every content file
**Example:**
```markdown
---
title: Test Article
description: A test article to verify the build pipeline
---

This is the test article content.
```

### Anti-Patterns to Avoid
- **Mixing input and output directories:** Never set input and output to the same folder; Eleventy will get confused
- **Hardcoding absolute URLs:** Use Eleventy's `url` filter for all internal links to respect `pathPrefix`
- **Using `layout` in Nunjucks `extends` AND front matter:** Choose one approach per file; mixing causes unexpected behavior

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| URL slugification | Custom regex | Eleventy's built-in `slugify` filter | Handles unicode, special chars, edge cases |
| GitHub Pages deployment | Custom scripts | `actions/upload-pages-artifact` + `actions/deploy-pages` | Handles permissions, environments, artifacts automatically |
| Path prefix handling | Manual URL concatenation | `EleventyHtmlBasePlugin` + `pathPrefix` config | Automatically transforms all absolute URLs |
| Directory-wide config | Copying front matter | Directory data files (`*.11tydata.js`) | Single source of truth, cleaner content files |

**Key insight:** Eleventy's data cascade handles inheritance; don't duplicate configuration across files.

## Common Pitfalls

### Pitfall 1: GitHub Pages Environment Not Created
**What goes wrong:** Workflow fails with "environment 'github-pages' doesn't exist"
**Why it happens:** GitHub Actions workflow pushed before enabling Pages in repository settings
**How to avoid:** Enable GitHub Pages in Settings > Pages > Source: GitHub Actions BEFORE pushing workflow
**Warning signs:** Workflow runs but deploy step fails immediately

### Pitfall 2: Broken Asset URLs on GitHub Pages
**What goes wrong:** CSS/JS/images return 404 on deployed site but work locally
**Why it happens:** Site deployed to `username.github.io/repo-name/` but URLs point to `/assets/...` instead of `/repo-name/assets/...`
**How to avoid:** Use `pathPrefix` in config and add `EleventyHtmlBasePlugin`; OR deploy to a custom domain / user site (no subdirectory)
**Warning signs:** Working local dev server, broken production links

### Pitfall 3: Dates Off by One Day
**What goes wrong:** Article dates display as previous day
**Why it happens:** Timezone handling between your local machine and build server
**How to avoid:** For Phase 1, not critical; address in content phase by using explicit timezone or date strings
**Warning signs:** Dates inconsistent between local build and deployed site

### Pitfall 4: YAML Parsing Errors in Permalinks
**What goes wrong:** Build fails with "can not read a block mapping entry"
**Why it happens:** Permalink contains template syntax but isn't quoted
**How to avoid:** Always quote permalink values containing `{{ }}` template syntax
**Warning signs:** YAML parsing errors on build

### Pitfall 5: Using Old GitHub Actions Versions
**What goes wrong:** Workflow fails or shows deprecation warnings
**Why it happens:** Artifacts actions v3 deprecated as of January 2025
**How to avoid:** Use `actions/upload-pages-artifact@v4`, `actions/deploy-pages@v4`, `actions/checkout@v5`
**Warning signs:** Deprecation warnings in workflow logs

## Code Examples

Verified patterns from official sources:

### Eleventy Configuration (ESM)
```javascript
// eleventy.config.js
// Source: https://www.11ty.dev/docs/config/
import { EleventyHtmlBasePlugin } from "@11ty/eleventy";

export default function(eleventyConfig) {
  // Add base plugin for path prefix support
  eleventyConfig.addPlugin(EleventyHtmlBasePlugin);

  // Pass through static assets (if any)
  // eleventyConfig.addPassthroughCopy("src/assets");

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    templateFormats: ["md", "njk", "html"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
};

// Export pathPrefix for GitHub Pages (repo subdirectory deployment)
// Omit if deploying to custom domain or user/org site root
export const config = {
  pathPrefix: "/learn-mech-interp/"
};
```

### GitHub Actions Workflow (Official Method)
```yaml
# .github/workflows/deploy.yml
# Source: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v5

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build site
        run: npx @11ty/eleventy

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v4
        with:
          path: _site

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### Directory Data File for Topics
```javascript
// src/topics/topics.11tydata.js
// Source: https://www.11ty.dev/docs/data-template-dir/
export default {
  layout: "layouts/base.njk",
  // All files in /topics/ will output to /topics/<folder-name>/
  permalink: function (data) {
    return `/topics/${data.page.fileSlug}/`;
  }
};
```

### Test Article
```markdown
---
title: Test Article
description: A minimal test article to verify the build and deployment pipeline
---

# Test Article

This is a test article to verify:

1. The Eleventy build completes successfully
2. The GitHub Actions workflow deploys to GitHub Pages
3. The thematic URL structure works (/topics/test/)

If you can read this on the live site, the foundation phase is complete.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CommonJS config (`module.exports`) | ESM config (`export default`) | Eleventy 3.0 (Oct 2024) | Use `eleventy.config.js` with ESM syntax |
| `peaceiris/actions-gh-pages` | Official `actions/deploy-pages` | 2024 | Either works; official is cleaner (no extra branch) |
| `actions/upload-artifact@v3` | `actions/upload-pages-artifact@v4` | Jan 2025 | v3 deprecated; use v4 for Pages |
| `.eleventy.js` filename | `eleventy.config.js` preferred | Eleventy 2.0+ | Both work; new name clearer |

**Deprecated/outdated:**
- `actions/upload-artifact@v3` and `actions/download-artifact@v3`: Deprecated Jan 2025, use v4
- Jekyll-style deployment (pushing to gh-pages branch): Still works but official workflow is cleaner

## Open Questions

Things that couldn't be fully resolved:

1. **pathPrefix for this specific repository**
   - What we know: pathPrefix needed when deploying to `username.github.io/repo-name/`
   - What's unclear: Will this repo use a custom domain or stay at default GitHub Pages URL?
   - Recommendation: Include pathPrefix in config now (`/learn-mech-interp/`); easy to remove if custom domain added later

2. **Node.js version choice**
   - What we know: Eleventy 3.x requires Node 18+; Node 20 is current LTS
   - What's unclear: Any specific version constraints from future phases?
   - Recommendation: Use Node 20 LTS in GitHub Actions for stability

## Sources

### Primary (HIGH confidence)
- [Eleventy Getting Started](https://www.11ty.dev/docs/) - Installation, basic setup
- [Eleventy Configuration](https://www.11ty.dev/docs/config/) - Config file format, directory settings
- [Eleventy Layouts](https://www.11ty.dev/docs/layouts/) - Layout system, content variable
- [Eleventy Permalinks](https://www.11ty.dev/docs/permalinks/) - URL customization
- [Eleventy Directory Data Files](https://www.11ty.dev/docs/data-template-dir/) - Per-folder configuration
- [Eleventy Data Cascade](https://www.11ty.dev/docs/data-cascade/) - Data priority order
- [Eleventy Nunjucks](https://www.11ty.dev/docs/languages/nunjucks/) - Nunjucks integration
- [Eleventy Deployment](https://www.11ty.dev/docs/deployment/) - GitHub Pages instructions
- [Eleventy Pitfalls](https://www.11ty.dev/docs/pitfalls/) - Common mistakes
- [GitHub Pages Custom Workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) - Official workflow documentation
- [actions/deploy-pages](https://github.com/actions/deploy-pages) - Official deployment action
- [actions/upload-pages-artifact](https://github.com/actions/upload-pages-artifact) - Official artifact action

### Secondary (MEDIUM confidence)
- [peaceiris/actions-gh-pages](https://github.com/peaceiris/actions-gh-pages) - Popular community deployment action
- [Eleventy 2025 Year in Review](https://www.11ty.dev/blog/review-2025/) - Version/ecosystem currency

### Tertiary (LOW confidence)
- Various community tutorials on project structure - Patterns verified against official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Verified against official Eleventy docs and GitHub Actions docs
- Architecture: HIGH - Patterns from official documentation with working examples
- Pitfalls: HIGH - Documented in official pitfalls page and GitHub changelog

**Research date:** 2026-02-03
**Valid until:** 2026-03-03 (30 days - Eleventy ecosystem is stable)
