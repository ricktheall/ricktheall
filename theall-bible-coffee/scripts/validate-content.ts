/**
 * Content gate for the MVP.
 *
 * Beyond schema validation this enforces the two rules the validation
 * experiment depends on:
 *   1. every correct checkpoint word really appears in the reader-visible text
 *   2. no distractor accidentally appears there
 * It also reports (without failing) when the chapter is still `draft`.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { chapterSchema, type Block, type Chapter } from "../src/lib/content/schema";

const CONTENT_FILES = [
  "content/books/ephesians/th/chapter-01.json",
  "content/books/revelation/th/chapter-01.json",
];

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
    case "caseStudy":
      return [block.title, block.person, block.place, block.when, ...block.paragraphs];
    case "research":
      return [block.finding, block.citation];
    case "quotation":
      return [block.text, block.author, block.attribution ?? ""];
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

  const kinds = chapter.sections.map((section) => section.kind);
  const requiredKinds = [
    "main-verse",
    "story",
    "context",
    "outline",
    "explanation",
    "metaphor",
    "connections",
    "application",
  ] as const;
  for (const kind of requiredKinds) {
    if (!kinds.includes(kind)) {
      errors.push(`${relativePath}: missing required section kind "${kind}"`);
    }
  }

  console.log(`✓ schema valid: ${relativePath}`);
  console.log(`  status: ${chapter.status}`);
  console.log(`  sections: ${chapter.sections.length}, sources: ${chapter.sources.length}`);
  console.log(
    `  checkpoint: ${chapter.checkpoint.options.length} options, ${chapter.checkpoint.correctOptionIds.length} correct`,
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

async function main(): Promise<void> {
  const errors: string[] = [];
  for (const file of CONTENT_FILES) {
    errors.push(...(await validateFile(file)));
  }

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
