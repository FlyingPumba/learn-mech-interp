import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { scanBlocks } from "../../lib/scanBlocks.js";

const TOPICS_DIR = path.resolve("src", "topics");

/**
 * Build the glossary array from article frontmatter `glossary` entries.
 * Returns the same shape as the old glossary.json:
 * [{ term, definition, links: [{ article, label }] }]
 *
 * If the same term appears in multiple articles, the first definition
 * (by learning-path order) wins and all defining articles are linked.
 */
export default function () {
  const { blocks } = scanBlocks();

  // term -> { definition, links: [{ article, label }] }
  const termMap = new Map();

  for (const block of blocks) {
    for (const topic of block.topics) {
      const mdPath = path.join(TOPICS_DIR, block.slug, topic.slug, "index.md");
      if (!fs.existsSync(mdPath)) continue;

      const { data } = matter(fs.readFileSync(mdPath, "utf-8"));
      if (!Array.isArray(data.glossary)) continue;

      for (const entry of data.glossary) {
        const link = {
          article: `/topics/${topic.slug}/`,
          label: data.title || topic.slug,
        };

        if (termMap.has(entry.term)) {
          // Term already seen: keep first definition, add this article's link
          termMap.get(entry.term).links.push(link);
        } else {
          termMap.set(entry.term, {
            term: entry.term,
            definition: entry.definition,
            links: [link],
          });
        }
      }
    }
  }

  // Return sorted alphabetically by term
  return Array.from(termMap.values())
    .sort((a, b) => a.term.localeCompare(b.term));
}
