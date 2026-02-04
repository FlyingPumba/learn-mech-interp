export default {
  layout: "layouts/article.njk",
  permalink: "/topics/{{ page.fileSlug }}/",
  eleventyComputed: {
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
