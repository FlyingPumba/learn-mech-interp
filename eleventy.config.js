// Eleventy configuration (ESM syntax)
// Source: https://www.11ty.dev/docs/config/
import { EleventyHtmlBasePlugin } from "@11ty/eleventy";

export default function(eleventyConfig) {
  // Add base plugin for path prefix support on GitHub Pages
  eleventyConfig.addPlugin(EleventyHtmlBasePlugin);

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
