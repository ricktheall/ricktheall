import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { chapterSchema, type Chapter } from "./schema";

/**
 * Build-time / server-side content loader.
 * Chapter JSON is validated with Zod before it can reach a React component.
 */
export async function loadChapter(bookId: string, chapterNumber: number): Promise<Chapter> {
  const file = path.join(
    process.cwd(),
    "content",
    "books",
    bookId,
    "th",
    `chapter-${String(chapterNumber).padStart(2, "0")}.json`,
  );

  const raw = await readFile(file, "utf8");
  const parsed = chapterSchema.safeParse(JSON.parse(raw) as unknown);

  if (!parsed.success) {
    throw new Error(
      `Invalid chapter content at ${file}:\n${parsed.error.issues
        .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
        .join("\n")}`,
    );
  }

  return parsed.data;
}

export function loadEphesians1(): Promise<Chapter> {
  return loadChapter("ephesians", 1);
}
