/**
 * Content gate for the MVP.
 *
 * Beyond schema validation this enforces the two rules the validation
 * experiment depends on:
 *   1. every correct checkpoint word really appears in the reader-visible text
 *   2. no distractor accidentally appears there
 * It also reports (without failing) when the chapter is still `draft`.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { chapterSchema, type Block, type Chapter } from "../src/lib/content/schema";

const CONTENT_ROOT = "content/books";
const CHAPTER_FILE = /^chapter-(\d{2,3})\.json$/;

/** Discovered, not listed by hand — adding a chapter must not mean editing this script. */
async function discoverContent(): Promise<{ files: string[]; bookIds: string[] }> {
  const files: string[] = [];
  const bookIds: string[] = [];
  let books: string[] = [];
  try {
    books = await readdir(CONTENT_ROOT);
  } catch {
    return { files, bookIds };
  }
  for (const bookId of books.sort()) {
    const dir = path.join(CONTENT_ROOT, bookId, "th");
    let entries: string[] = [];
    try {
      entries = await readdir(dir);
    } catch {
      continue;
    }
    const chapters = entries.filter((name) => CHAPTER_FILE.test(name)).sort();
    if (chapters.length === 0) continue;
    bookIds.push(bookId);
    for (const name of chapters) files.push(path.join(dir, name));
  }
  return { files, bookIds };
}

function blockText(block: Block): string[] {
  switch (block.type) {
    case "paragraph":
    case "heading":
      return [block.text];
    case "list":
      return block.items;
    case "callout":
      return [block.title ?? "", block.text];
    case "scriptureReference":
      return [block.reference, block.text ?? "", block.note ?? "", block.attribution ?? ""];
    case "greekTerm":
      return [block.greek, block.transliteration, block.gloss, block.explanation];
    case "application":
      return [block.title, block.text, ...block.prompts];
  }
}

/** Everything a reader can actually see inside the chapter body. */
function visibleText(chapter: Chapter): string {
  const parts: string[] = [chapter.title, chapter.summary];
  for (const section of chapter.sections) {
    parts.push(section.title, section.navLabel);
    for (const block of section.blocks) parts.push(...blockText(block));
  }
  return parts.join("\n");
}

/**
 * The section kinds a chapter must carry to be readable end to end.
 *
 * Two chapter shapes exist, and each has its own minimum. A chapter carrying a
 * `scripture` layer is written for the Scripture-first reader, whose pages are
 * *derived* from section kinds — so the rule is that every page it produces has
 * something on it, not that it matches a fixed eight-section list. A chapter
 * without a `scripture` layer is the original Ephesians shape, and keeps the
 * section list that reader was built to render.
 */
function structuralErrors(chapter: Chapter, relativePath: string): string[] {
  const errors: string[] = [];
  const kinds = new Set(chapter.sections.map((section) => section.kind));

  const requiredKinds =
    chapter.scripture === undefined
      ? ([
          "main-verse",
          "story",
          "context",
          "outline",
          "explanation",
          "metaphor",
          "connections",
          "application",
        ] as const)
      : (["story", "context", "application"] as const);

  for (const kind of requiredKinds) {
    if (!kinds.has(kind)) {
      errors.push(`${relativePath}: missing required section kind "${kind}"`);
    }
  }

  if (chapter.scripture !== undefined) {
    const bodyKinds = ["outline", "explanation", "metaphor", "teaching"] as const;
    if (!bodyKinds.some((kind) => kinds.has(kind))) {
      errors.push(
        `${relativePath}: a Scripture-first chapter needs at least one of ${bodyKinds.join(", ")} so its Deep Brew page is not empty`,
      );
    }
  }

  return errors;
}

async function validateFile(relativePath: string): Promise<string[]> {
  const errors: string[] = [];
  const absolute = path.join(process.cwd(), relativePath);
  const raw = await readFile(absolute, "utf8");

  const parsed = chapterSchema.safeParse(JSON.parse(raw) as unknown);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      errors.push(`${relativePath}: ${issue.path.join(".") || "(root)"} — ${issue.message}`);
    }
    return errors;
  }

  const chapter = parsed.data;
  const text = visibleText(chapter);

  // Reference-only Scripture must never carry a translated body or attribution.
  for (const section of chapter.sections) {
    for (const block of section.blocks) {
      if (
        block.type === "scriptureReference" &&
        block.rightsStatus === "reference-only" &&
        (block.text !== null || block.attribution !== null)
      ) {
        errors.push(
          `${relativePath}: section ${section.id} carries Bible text or attribution while marked reference-only`,
        );
      }
    }
  }

  errors.push(...structuralErrors(chapter, relativePath));

  // Only movement-end chapters carry a checkpoint; ordinary ones stop here.
  if (chapter.checkpoint === null) {
    console.log(`✓ schema valid: ${relativePath}`);
    console.log(`  status: ${chapter.status}`);
    console.log(`  sections: ${chapter.sections.length}, sources: ${chapter.sources.length}`);
    console.log("  checkpoint: none (movement-end checkpoint)");
    if (chapter.status !== "final") {
      console.log(`  ! ${relativePath} is "${chapter.status}" — not ready for validation with real readers`);
    }
    return errors;
  }

  const correctIds = new Set(chapter.checkpoint.correctOptionIds);

  for (const option of chapter.checkpoint.options) {
    const appears = text.includes(option.word);
    if (correctIds.has(option.id) && !appears) {
      errors.push(
        `${relativePath}: correct checkpoint word "${option.word}" (${option.id}) does not appear in the visible chapter text`,
      );
    }
    if (!correctIds.has(option.id) && appears) {
      errors.push(
        `${relativePath}: distractor "${option.word}" (${option.id}) appears in the visible chapter text — it would be an unfair option`,
      );
    }
  }

  console.log(`✓ schema valid: ${relativePath}`);
  console.log(`  status: ${chapter.status}`);
  console.log(`  sections: ${chapter.sections.length}, sources: ${chapter.sources.length}`);
  console.log(
    chapter.checkpoint === null
      ? "  checkpoint: none (movement-end checkpoint)"
      : `  checkpoint: ${chapter.checkpoint.options.length} options, ${chapter.checkpoint.correctOptionIds.length} correct`,
  );

  if (chapter.status !== "final") {
    console.log(
      `  ! ${relativePath} is "${chapter.status}" — not ready for validation with real readers`,
    );
  }
  const unverified = chapter.sources.filter((source) => source.status === "unverified");
  if (unverified.length > 0) {
    console.log(`  ! ${unverified.length} source(s) still marked unverified`);
  }

  return errors;
}

/**
 * The library marks a book "ready" from `BOOKS_WITH_LESSONS` in canon.ts,
 * which is client-safe and so cannot read the filesystem. This keeps the two
 * honest: a book may never be advertised as ready without content, and content
 * may never sit unpublished because someone forgot the canon entry.
 */
/** Book maps are content too, and must fail the gate when malformed. */
async function validateBookMaps(): Promise<string[]> {
  const { bookContentSchema } = await import("../src/lib/content/book-schema");
  const errors: string[] = [];
  let books: string[] = [];
  try {
    books = await readdir(CONTENT_ROOT);
  } catch {
    return errors;
  }
  let checked = 0;
  for (const bookId of books.sort()) {
    const file = path.join(CONTENT_ROOT, bookId, "th", "book.json");
    let raw: string;
    try {
      raw = await readFile(file, "utf8");
    } catch {
      continue;
    }
    checked += 1;
    const parsed = bookContentSchema.safeParse(JSON.parse(raw) as unknown);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        errors.push(`${file}: ${issue.path.join(".")}: ${issue.message}`);
      }
      continue;
    }
    if (parsed.data.bookId !== bookId) {
      errors.push(`${file}: bookId "${parsed.data.bookId}" does not match its directory`);
    }
  }
  if (checked > 0) console.log(`Checked ${checked} book map(s).`);
  return errors;
}

async function validateReadyBooks(bookIds: readonly string[]): Promise<string[]> {
  const { BIBLE_BOOKS } = await import("../src/lib/books/canon");

  const declared = new Set(
    BIBLE_BOOKS.filter((book) => book.lessonStatus === "ready").map((book) => book.id),
  );
  const onDisk = new Set(bookIds);
  const errors: string[] = [];

  for (const id of declared) {
    if (!onDisk.has(id)) {
      errors.push(`canon.ts marks "${id}" as ready, but content/books/${id}/th has no chapters`);
    }
  }
  for (const id of onDisk) {
    if (!declared.has(id)) {
      errors.push(`content exists for "${id}", but canon.ts does not list it in BOOKS_WITH_LESSONS`);
    }
  }
  return errors;
}

async function main(): Promise<void> {
  const { files, bookIds } = await discoverContent();
  const errors: string[] = [];
  for (const file of files) {
    errors.push(...(await validateFile(file)));
  }
  errors.push(...(await validateBookMaps()));
  errors.push(...(await validateReadyBooks(bookIds)));
  console.log(`\nChecked ${files.length} chapter file(s) across ${bookIds.length} book(s).`);

  if (errors.length > 0) {
    console.error("\nContent validation failed:");
    for (const error of errors) console.error(`  ✗ ${error}`);
    process.exit(1);
  }

  console.log("\nContent validation passed.");
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
