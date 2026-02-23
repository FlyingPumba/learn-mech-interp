import { execSync } from "node:child_process";

/**
 * Extracts per-file git metadata (creation date, modification date, authors)
 * in a single git log pass. Returns a map keyed by relative file path.
 */
export default function () {
  // Warn if shallow repository (dates will be incomplete)
  const isShallow = execSync("git rev-parse --is-shallow-repository", {
    encoding: "utf-8",
  }).trim();
  if (isShallow === "true") {
    console.warn(
      "Warning: shallow git clone detected. Git dates and contributors will be incomplete. " +
        "Use fetch-depth: 0 in CI for accurate metadata."
    );
  }

  // Single git log call: newest-first, with file paths
  // Format: ISO date and author name, followed by list of changed files
  const raw = execSync(
    'git log --format="COMMIT|%aI|%aN" --name-only --diff-filter=ACMR -- src/topics/',
    { encoding: "utf-8", maxBuffer: 50 * 1024 * 1024 }
  );

  const files = new Map();

  let currentDate = null;
  let currentAuthor = null;

  for (const line of raw.split("\n")) {
    if (line.startsWith("COMMIT|")) {
      const parts = line.split("|");
      currentDate = parts[1];
      currentAuthor = parts[2];
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed || !currentDate) continue;

    if (!files.has(trimmed)) {
      files.set(trimmed, {
        created: currentDate,
        modified: currentDate,
        authors: new Set([currentAuthor]),
      });
    } else {
      const entry = files.get(trimmed);
      // git log is newest-first, so each subsequent appearance is older
      // Keep updating created to get the oldest date
      entry.created = currentDate;
      entry.authors.add(currentAuthor);
    }
  }

  // Convert to plain object with serializable values
  const result = {};
  for (const [fp, data] of files) {
    result[fp] = {
      created: data.created,
      modified: data.modified,
      authors: Array.from(data.authors),
    };
  }

  return result;
}
