import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const TOPICS_DIR = path.resolve("src", "topics");

/**
 * Scan src/topics/<block>/_block.json and article frontmatter to build the
 * learning-path data structure.  Returns the same shape as the old
 * learningPath.json: { blocks: [{ slug, title, order, topics: [{ slug, title, order }] }] }
 */
export function scanBlocks() {
  const blockDirs = fs.readdirSync(TOPICS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory());

  const blocks = [];

  for (const dir of blockDirs) {
    const metaPath = path.join(TOPICS_DIR, dir.name, "_block.json");
    if (!fs.existsSync(metaPath)) continue;               // no _block.json = not a block

    const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));

    const articleDirs = fs.readdirSync(path.join(TOPICS_DIR, dir.name), { withFileTypes: true })
      .filter(d => d.isDirectory() && !d.name.startsWith("_"));

    const topics = [];
    for (const art of articleDirs) {
      const mdPath = path.join(TOPICS_DIR, dir.name, art.name, "index.md");
      if (!fs.existsSync(mdPath)) continue;

      const { data } = matter(fs.readFileSync(mdPath, "utf-8"));
      topics.push({
        slug: art.name,
        title: data.title || art.name,
        order: data.order ?? 0,
      });
    }

    topics.sort((a, b) => a.order - b.order);

    blocks.push({
      slug: dir.name,
      title: meta.title,
      order: meta.order,
      topics,
    });
  }

  blocks.sort((a, b) => a.order - b.order);
  return { blocks };
}
