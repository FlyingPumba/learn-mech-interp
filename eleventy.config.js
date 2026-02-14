// Eleventy configuration (ESM syntax)
// Source: https://www.11ty.dev/docs/config/
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import matter from "gray-matter";
import { EleventyHtmlBasePlugin, IdAttributePlugin } from "@11ty/eleventy";
import { scanBlocks } from "./lib/scanBlocks.js";
import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import eleventyNavigationPlugin from "@11ty/eleventy-navigation";
import pluginTOC from "eleventy-plugin-toc";
import markdownIt from "markdown-it";
import { katex } from "@mdit/plugin-katex";
import { figure } from "@mdit/plugin-figure";
import markdownItAnchor from "markdown-it-anchor";
import slugify from "@sindresorhus/slugify";

// Shortcode counters (reset on each build to prevent stale values in --serve mode)
let citationCounter = {};
let sidenoteCounter = {};
let marginCounter = {};
let buildId = Date.now();

function validate() {
  const errors = [];
  const { blocks } = scanBlocks();
  const refs = JSON.parse(fs.readFileSync("src/_data/references.json", "utf-8"));

  // 1. Check for duplicate reference titles and URLs
  const titleToKeys = new Map();
  const urlToKeys = new Map();
  for (const [key, ref] of Object.entries(refs)) {
    if (ref.title) {
      if (!titleToKeys.has(ref.title)) titleToKeys.set(ref.title, []);
      titleToKeys.get(ref.title).push(key);
    }
    if (ref.url) {
      if (!urlToKeys.has(ref.url)) urlToKeys.set(ref.url, []);
      urlToKeys.get(ref.url).push(key);
    }
  }
  for (const [title, keys] of titleToKeys) {
    if (keys.length > 1) {
      errors.push(`Duplicate reference title "${title}" in keys: ${keys.join(", ")}`);
    }
  }
  for (const [url, keys] of urlToKeys) {
    if (keys.length > 1) {
      errors.push(`Duplicate reference URL "${url}" in keys: ${keys.join(", ")}`);
    }
  }

  // 2. Check block order contiguity
  const blockOrders = blocks.map(b => b.order).sort((a, b) => a - b);
  for (let i = 0; i < blockOrders.length; i++) {
    if (blockOrders[i] !== i + 1) {
      errors.push(`Block order is not contiguous: expected ${i + 1}, got ${blockOrders[i]}. ` +
        `Blocks: ${blocks.map(b => `${b.slug}(${b.order})`).join(", ")}`);
      break;
    }
  }

  // Check for duplicate block orders
  const blockOrderSet = new Set(blockOrders);
  if (blockOrderSet.size !== blockOrders.length) {
    errors.push(`Duplicate block orders found: ${blockOrders.join(", ")}`);
  }

  const allGlossaryTerms = new Map(); // term -> [article slugs]
  const allArticleSlugs = new Set();

  for (const block of blocks) {
    // 2. Check _block.json fields
    if (!block.title) errors.push(`Block ${block.slug}: missing title in _block.json`);
    if (block.order == null) errors.push(`Block ${block.slug}: missing order in _block.json`);

    // 3. Check article order contiguity within block
    const artOrders = block.topics.map(t => t.order).sort((a, b) => a - b);
    for (let i = 0; i < artOrders.length; i++) {
      if (artOrders[i] !== i + 1) {
        errors.push(`Block "${block.slug}": article order not contiguous. Expected ${i + 1}, got ${artOrders[i]}. ` +
          `Articles: ${block.topics.map(t => `${t.slug}(${t.order})`).join(", ")}`);
        break;
      }
    }

    // Check for duplicate article orders within block
    const artOrderSet = new Set(artOrders);
    if (artOrderSet.size !== artOrders.length) {
      errors.push(`Block "${block.slug}": duplicate article orders: ${artOrders.join(", ")}`);
    }

    for (const topic of block.topics) {
      allArticleSlugs.add(topic.slug);
      const mdPath = path.join("src/topics", block.slug, topic.slug, "index.md");
      if (!fs.existsSync(mdPath)) continue;

      const raw = fs.readFileSync(mdPath, "utf-8");
      const { data } = matter(raw);

      // 4. Required frontmatter
      if (!data.title) errors.push(`${topic.slug}: missing 'title' in frontmatter`);
      if (!data.description) errors.push(`${topic.slug}: missing 'description' in frontmatter`);
      if (data.order == null) errors.push(`${topic.slug}: missing 'order' in frontmatter`);

      // 5. Validate citation keys
      const citeMatches = raw.matchAll(/\{%[-\s]*cite\s+"([^"]+)"\s*[-\s]*%\}/g);
      for (const m of citeMatches) {
        if (!refs[m[1]]) {
          errors.push(`${topic.slug}: cite key "${m[1]}" not found in references.json`);
        }
      }

      // 6. Collect glossary terms for duplicate check
      if (Array.isArray(data.glossary)) {
        for (const entry of data.glossary) {
          if (!allGlossaryTerms.has(entry.term)) {
            allGlossaryTerms.set(entry.term, []);
          }
          allGlossaryTerms.get(entry.term).push(topic.slug);
        }
      }
    }
  }

  // 7. Validate prerequisites (second pass: all slugs now collected)
  for (const block of blocks) {
    for (const topic of block.topics) {
      const mdPath = path.join("src/topics", block.slug, topic.slug, "index.md");
      if (!fs.existsSync(mdPath)) continue;
      const { data } = matter(fs.readFileSync(mdPath, "utf-8"));
      if (Array.isArray(data.prerequisites)) {
        for (const prereq of data.prerequisites) {
          if (prereq.url) {
            const prereqMatch = prereq.url.match(/\/topics\/([^/]+)\//);
            if (prereqMatch && !allArticleSlugs.has(prereqMatch[1])) {
              errors.push(`${topic.slug}: prerequisite "${prereq.url}" references non-existent article`);
            }
          }
        }
      }
    }
  }

  // 8. Duplicate glossary terms
  for (const [term, slugs] of allGlossaryTerms) {
    if (slugs.length > 1) {
      errors.push(`Glossary term "${term}" defined in multiple articles: ${slugs.join(", ")}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `\n=== Build validation failed ===\n` +
      errors.map(e => `  - ${e}`).join("\n") +
      `\n\nSet SKIP_VALIDATION=1 to bypass.\n`
    );
  }
}

export default function(eleventyConfig) {
  // Cache-busting for static assets (CSS/JS). Updates each rebuild in --serve mode.
  eleventyConfig.addGlobalData("buildId", () => String(buildId));

  // Reset shortcode counters and run validation before each build
  eleventyConfig.on("eleventy.before", () => {
    buildId = Date.now();
    citationCounter = {};
    sidenoteCounter = {};
    marginCounter = {};
    if (!process.env.SKIP_VALIDATION) {
      validate();
    }
  });

  // Run Pagefind indexer after each build
  eleventyConfig.on("eleventy.after", () => {
    execSync(`npx pagefind --site _site`, {
      encoding: "utf-8",
      stdio: "inherit",
    });
  });

  // Configure markdown-it with KaTeX and figure plugins
  const md = markdownIt({ html: true })
    .use(katex, {
      output: "htmlAndMathml",
      throwOnError: false,
      errorColor: "#cc0000"
    })
    .use(figure)
    .use(markdownItAnchor, { permalink: false, slugify });

  eleventyConfig.setLibrary("md", md);

  // Add base plugin for path prefix support on GitHub Pages
  eleventyConfig.addPlugin(EleventyHtmlBasePlugin);

  // Syntax highlighting (PrismJS, build-time)
  eleventyConfig.addPlugin(syntaxHighlight);

  // Heading ID attributes (required before TOC plugin)
  eleventyConfig.addPlugin(IdAttributePlugin);

  // Navigation plugin for sidebar hierarchy and breadcrumbs
  eleventyConfig.addPlugin(eleventyNavigationPlugin);

  // Table of contents from rendered headings
  eleventyConfig.addPlugin(pluginTOC, {
    tags: ["h2", "h3"],
    wrapper: "",
    wrapperClass: "",
    ul: true
  });

  // Learning path collection: topics sorted by filesystem-derived order
  eleventyConfig.addCollection("learningPath", function(collectionApi) {
    const pathData = scanBlocks();
    const order = pathData.blocks.flatMap(b => b.topics.map(t => t.slug));
    const topics = collectionApi.getFilteredByGlob("src/topics/*/*/index.md");
    return topics
      .filter(item => order.includes(item.fileSlug))
      .sort((a, b) => order.indexOf(a.fileSlug) - order.indexOf(b.fileSlug));
  });

  // Pass through CSS files to _site/css/
  eleventyConfig.addPassthroughCopy("src/css");

  // Pass through JS files to _site/js/
  eleventyConfig.addPassthroughCopy("src/js");

  // Pass through article-local images, remapping from nested block structure
  // to flat output so /topics/<article>/images/ URLs remain stable
  const blockDirs = fs.readdirSync("src/topics", { withFileTypes: true })
    .filter(d => d.isDirectory());
  for (const block of blockDirs) {
    const blockPath = path.join("src/topics", block.name);
    const articles = fs.readdirSync(blockPath, { withFileTypes: true })
      .filter(d => d.isDirectory() && !d.name.startsWith("_"));
    for (const article of articles) {
      const imgDir = path.join(blockPath, article.name, "images");
      if (fs.existsSync(imgDir)) {
        eleventyConfig.addPassthroughCopy({
          [imgDir]: path.join("topics", article.name, "images")
        });
      }
    }
  }

  // Citation shortcode: {% cite "key" %} renders numbered inline citation with tooltip
  eleventyConfig.addShortcode("cite", function(key) {
    const pageUrl = this.page.url;
    if (!citationCounter[pageUrl]) citationCounter[pageUrl] = 0;
    citationCounter[pageUrl]++;

    const refs = this.ctx.references || {};
    const ref = refs[key];
    if (!ref) return `<span class="citation-error">[??]</span>`;

    const num = citationCounter[pageUrl];
    return `<span class="citation" tabindex="0" role="doc-noteref">` +
      `<a href="${ref.url}" target="_blank" rel="noopener" class="citation-number">[${num}]</a>` +
      `<span class="citation-tooltip" role="tooltip">` +
        `<strong>${ref.title}</strong><br>` +
        `${ref.authors}<br>` +
        `<em>${ref.venue}, ${ref.year}</em>` +
      `</span></span>`;
  });

  // Sidenote shortcode: {% sidenote "content" %} renders Tufte-style numbered sidenote
  eleventyConfig.addShortcode("sidenote", function(content) {
    const pageUrl = this.page.url;
    if (!sidenoteCounter[pageUrl]) sidenoteCounter[pageUrl] = 0;
    sidenoteCounter[pageUrl]++;
    const id = `sn-${sidenoteCounter[pageUrl]}`;

    return `<span class="sidenote-wrapper">` +
      `<label for="${id}" class="sidenote-toggle sidenote-number"></label>` +
      `<input type="checkbox" id="${id}" class="sidenote-toggle-input"/>` +
      `<span class="sidenote">${content}</span>` +
    `</span>`;
  });

  // Margin note shortcode: {% marginnote "content" %} renders unnumbered margin note
  eleventyConfig.addShortcode("marginnote", function(content) {
    const pageUrl = this.page.url;
    if (!marginCounter[pageUrl]) marginCounter[pageUrl] = 0;
    marginCounter[pageUrl]++;
    const id = `mn-${marginCounter[pageUrl]}`;

    return `<span class="sidenote-wrapper">` +
      `<label for="${id}" class="sidenote-toggle marginnote-indicator">&#8853;</label>` +
      `<input type="checkbox" id="${id}" class="sidenote-toggle-input"/>` +
      `<span class="marginnote">${content}</span>` +
    `</span>`;
  });

  // Reading time filter: strips HTML, counts words, returns "N min read"
  eleventyConfig.addFilter("readingTime", function(content) {
    if (!content) return "";
    var text = content.replace(/<[^>]*>/g, " ");
    text = text.replace(/\s+/g, " ").trim();
    var words = text.split(" ").filter(function(w) { return w.length > 0; }).length;
    var minutes = Math.ceil(words / 230);
    return minutes + " min read";
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    templateFormats: ["md", "njk", "html"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    pathPrefix: "/"
  };
}
