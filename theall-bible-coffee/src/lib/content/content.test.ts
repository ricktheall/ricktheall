import { describe, expect, it } from "vitest";

import ephesiansJson from "../../../content/books/ephesians/th/chapter-01.json";
import revelationJson from "../../../content/books/revelation/th/chapter-01.json";
import { chapterSchema, type Block, type Chapter } from "./schema";

const CHAPTERS = [
  ["เอเฟซัส 1", ephesiansJson],
  ["วิวรณ์ 1", revelationJson],
] as const;

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
      return [block.reference, block.text ?? "", block.note ?? ""];
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

function visibleText(chapter: Chapter): string {
  return chapter.sections
    .flatMap((section) => [section.title, ...section.blocks.flatMap(blockText)])
    .join("\n");
}

describe.each(CHAPTERS)("%s content", (_label, json) => {
  const parsed = chapterSchema.safeParse(json);

  it("matches the content schema", () => {
    expect(parsed.success).toBe(true);
  });

  it("carries all ten required parts of the chapter", () => {
    if (!parsed.success) throw parsed.error;
    const kinds = parsed.data.sections.map((section) => section.kind);
    expect(kinds).toEqual([
      "main-verse",
      "story",
      "context",
      "outline",
      "explanation",
      "metaphor",
      "connections",
      "application",
    ]);
    expect(parsed.data.checkpoint.options.length).toBeGreaterThanOrEqual(6);
    expect(parsed.data.completion.centralTruth.length).toBeGreaterThan(0);
  });

  it("only shows the Bible reference while translation rights are unconfirmed", () => {
    if (!parsed.success) throw parsed.error;
    expect(parsed.data.mainVerse.rightsStatus).toBe("reference-only");
    expect(parsed.data.mainVerse.text).toBeNull();
    expect(parsed.data.mainVerse.attribution).toBeNull();
  });

  it("uses three correct words that really appear in the chapter", () => {
    if (!parsed.success) throw parsed.error;
    const chapter = parsed.data;
    const text = visibleText(chapter);
    const correct = new Set(chapter.checkpoint.correctOptionIds);

    expect(correct.size).toBe(3);
    for (const option of chapter.checkpoint.options) {
      expect(text.includes(option.word)).toBe(correct.has(option.id));
    }
  });
});
