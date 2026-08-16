import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { bookContentSchema, type BookContent } from "./book-schema";

/**
 * Loads book-level editorial metadata from
 * `content/books/<book-id>/th/book.json`, validated before it reaches a
 * component — the same contract as chapter content.
 *
 * Returns null when a book has no map yet, so the UI can fall back to a plain
 * chapter list instead of failing.
 */
export async function loadBookContent(bookId: string): Promise<BookContent | null> {
  const file = path.join(process.cwd(), "content", "books", bookId, "th", "book.json");

  let raw: string;
  try {
    raw = await readFile(file, "utf8");
  } catch {
    return null;
  }

  const parsed = bookContentSchema.safeParse(JSON.parse(raw) as unknown);
  if (!parsed.success) {
    throw new Error(
      `Invalid book content at ${file}:\n${parsed.error.issues
        .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
        .join("\n")}`,
    );
  }
  return parsed.data;
}
