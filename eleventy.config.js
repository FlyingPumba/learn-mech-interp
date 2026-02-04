// Eleventy configuration (ESM syntax)
// Source: https://www.11ty.dev/docs/config/
import { EleventyHtmlBasePlugin } from "@11ty/eleventy";
import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import markdownIt from "markdown-it";
import { katex } from "@mdit/plugin-katex";
import { figure } from "@mdit/plugin-figure";

export default function(eleventyConfig) {
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

  // Pass through CSS files to _site/css/
  eleventyConfig.addPassthroughCopy("src/css");

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
