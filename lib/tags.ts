// Tags are stored as a normalized, comma-separated string on `urls.tags`.

const MAX_TAGS = 8;
const MAX_TAG_LENGTH = 24;

/**
 * Parses free-text input into a normalized tag list: lowercased, spaces
 * collapsed to hyphens, deduped, and capped in count and length.
 */
export function parseTags(input: string): string[] {
  const seen = new Set<string>();
  for (const raw of input.split(",")) {
    const tag = raw
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    if (tag && tag.length <= MAX_TAG_LENGTH) {
      seen.add(tag);
    }
    if (seen.size >= MAX_TAGS) break;
  }
  return [...seen];
}

/** Serializes a tag list to the stored form, or null when empty. */
export function serializeTags(tags: string[]): string | null {
  return tags.length > 0 ? tags.join(",") : null;
}

/** Splits the stored form back into a tag array. */
export function splitTags(stored: string | null | undefined): string[] {
  return stored ? stored.split(",").filter(Boolean) : [];
}
