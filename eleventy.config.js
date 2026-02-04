// Eleventy configuration (ESM syntax)
// Source: https://www.11ty.dev/docs/config/
import fs from "node:fs";
import { EleventyHtmlBasePlugin, IdAttributePlugin } from "@11ty/eleventy";
import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import eleventyNavigationPlugin from "@11ty/eleventy-navigation";
import pluginTOC from "eleventy-plugin-toc";
import markdownIt from "markdown-it";
import { katex } from "@mdit/plugin-katex";
import { figure } from "@mdit/plugin-figure";

// Shortcode counters (reset on each build to prevent stale values in --serve mode)
let citationCounter = {};
let sidenoteCounter = {};
let marginCounter = {};

export default function(eleventyConfig) {
  // Reset shortcode counters before each build
  eleventyConfig.on("eleventy.before", () => {
    citationCounter = {};
    sidenoteCounter = {};
    marginCounter = {};
  });

  // Configure markdown-it with KaTeX and figure plugins
  const md = markdownIt({ html: true })
    .use(katex, {
      output: "htmlAndMathml",
      throwOnError: false,
      errorColor: "#cc0000"
    })
    .use(figure);

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

  // Learning path collection: topics sorted by learningPath.json order
  eleventyConfig.addCollection("learningPath", function(collectionApi) {
    const pathData = JSON.parse(
      fs.readFileSync("src/_data/learningPath.json", "utf-8")
    );
    const order = pathData.blocks.flatMap(b => b.topics.map(t => t.slug));
    const topics = collectionApi.getFilteredByGlob("src/topics/*/index.md");
    return topics
      .filter(item => order.includes(item.fileSlug))
      .sort((a, b) => order.indexOf(a.fileSlug) - order.indexOf(b.fileSlug));
  });

  // Pass through CSS files to _site/css/
  eleventyConfig.addPassthroughCopy("src/css");

  // Pass through article-local images (e.g., src/topics/superposition/images/)
  eleventyConfig.addPassthroughCopy("src/topics/*/images");

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

    return `<label for="${id}" class="sidenote-toggle sidenote-number"></label>` +
      `<input type="checkbox" id="${id}" class="sidenote-toggle-input"/>` +
      `<span class="sidenote">${content}</span>`;
  });

  // Margin note shortcode: {% marginnote "content" %} renders unnumbered margin note
  eleventyConfig.addShortcode("marginnote", function(content) {
    const pageUrl = this.page.url;
    if (!marginCounter[pageUrl]) marginCounter[pageUrl] = 0;
    marginCounter[pageUrl]++;
    const id = `mn-${marginCounter[pageUrl]}`;

    return `<label for="${id}" class="sidenote-toggle marginnote-indicator">&#8853;</label>` +
      `<input type="checkbox" id="${id}" class="sidenote-toggle-input"/>` +
      `<span class="marginnote">${content}</span>`;
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
    pathPrefix: "/learn-mech-interp/"
  };
}
