import "server-only";

import { readdir } from "node:fs/promises";
import path from "node:path";

/**
 * Discovers which chapters actually exist on disk, so publishing a chapter is
 * a content-only act: drop `content/books/<book>/th/chapter-NN.json` in place
 * and the route, the book page and the library all pick it up.
 */

const CONTENT_ROOT = path.join(process.cwd(), "content", "books");
const CHAPTER_FILE = /^chapter-(\d{2,3})\.json$/;

async function safeReaddir(dir: string): Promise<string[]> {
  try {
    return await readdir(dir);
  } catch {
    return [];
  }
}

/** Chapter numbers published for a book, ascending. Empty when none are. */
export async function listPublishedChapters(bookId: string): Promise<number[]> {
  const entries = await safeReaddir(path.join(CONTENT_ROOT, bookId, "th"));
  return entries
    .map((name) => CHAPTER_FILE.exec(name))
    .filter((match): match is RegExpExecArray => match !== null)
    .map((match) => Number.parseInt(match[1] as string, 10))
    .filter((n) => Number.isInteger(n) && n > 0)
    .sort((a, b) => a - b);
}

/** Book ids that have at least one published chapter. */
export async function listBooksWithContent(): Promise<string[]> {
  const entries = await safeReaddir(CONTENT_ROOT);
  const found: string[] = [];
  for (const bookId of entries) {
    const chapters = await listPublishedChapters(bookId);
    if (chapters.length > 0) found.push(bookId);
  }
  return found.sort();
}

export async function isChapterPublished(bookId: string, chapterNumber: number): Promise<boolean> {
  return (await listPublishedChapters(bookId)).includes(chapterNumber);
}
