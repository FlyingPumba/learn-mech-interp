export default {
  layout: "layouts/article.njk",
  permalink: "/topics/{{ page.fileSlug }}/",
  eleventyComputed: {
    block: (data) => {
      // data.page.inputPath = "./src/topics/<block>/<article>/index.md"
      const parts = data.page.inputPath.split("/");
      const topicsIdx = parts.indexOf("topics");
      if (topicsIdx === -1 || topicsIdx + 2 >= parts.length) return undefined;
      return parts[topicsIdx + 1];
    },
    eleventyNavigation: (data) => {
      if (!data.title || !data.block) return undefined;
      return {
        key: data.page.fileSlug,
        parent: data.block,
        order: data.order || 0
      };
    }
  }
};
