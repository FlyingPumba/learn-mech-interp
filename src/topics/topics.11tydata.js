// Directory data file for all content in /topics/
// Source: https://www.11ty.dev/docs/data-template-dir/
export default {
  layout: "layouts/base.njk",
  // All files in /topics/ will output to /topics/<folder-name>/
  permalink: function(data) {
    return `/topics/${data.page.fileSlug}/`;
  }
};
