import { describe, expect, it } from "vitest";

import { buildChapterPages } from "./pages";
import type { Chapter, Section } from "./schema";

function section(id: string, kind: Section["kind"], text: string): Section {
  return {
    id,
    navLabel: id,
    title: id,
    kind,
    blocks: [{ type: "paragraph", text }],
    sourceIds: [],
  };
}

function chapterWith(sections: Section[], extra: Partial<Chapter> = {}): Chapter {
  return {
    schemaVersion: 1,
    status: "draft",
    locale: "th",
    bookId: "genesis",
    chapterNumber: 1,
    contentVersion: 1,
    title: "หัวเรื่อง",
    summary: "สรุป",
    estimatedMinutes: 10,
    mainVerse: {
      reference: "ปฐมกาล 1:27",
      text: null,
      translationId: null,
      rightsStatus: "reference-only",
      attribution: null,
    },
    sections,
    checkpoint: null,
    reflection: null,
    completion: null,
    sources: [],
    ...extra,
  } as Chapter;
}

const scriptureLayer: NonNullable<Chapter["scripture"]> = {
  reference: "ปฐมกาล 1",
  translationId: null,
  text: null,
  rightsStatus: "reference-only",
  attribution: null,
  license: null,
  copyrightNotice: null,
};

describe("chapter pages", () => {
  it("puts Scripture first and the ending last", () => {
    const pages = buildChapterPages(
      chapterWith(
        [
          section("s", "story", "เรื่อง"),
          section("a", "application", "ลงมือ"),
          section("t", "teaching", "สอน"),
        ],
        { scripture: scriptureLayer },
      ),
    );

    expect(pages[0]?.id).toBe("scripture");
    expect(pages.at(-1)?.id).toBe("close");
  });

  it("numbers steps by the pages a chapter actually produced, with no gaps", () => {
    const pages = buildChapterPages(
      chapterWith([section("s", "story", "เรื่อง")], { scripture: scriptureLayer }),
    );

    expect(pages.map((page) => page.step)).toEqual([1, 2, 3]);
    expect(pages.map((page) => page.id)).toEqual(["scripture", "story", "close"]);
  });

  it("always ends a chapter, even one with no checkpoint of its own", () => {
    const pages = buildChapterPages(chapterWith([section("s", "story", "เรื่อง")]));
    expect(pages.some((page) => page.id === "close")).toBe(true);
  });

  it("never drops a section — every kind in the schema lands on exactly one page", () => {
    const kinds = [
      "main-verse",
      "story",
      "context",
      "outline",
      "explanation",
      "metaphor",
      "connections",
      "application",
      "research",
      "teaching",
      "christ",
      "eternal",
      "share",
    ] as const;

    const pages = buildChapterPages(
      chapterWith(
        kinds.map((kind) => section(kind, kind, kind)),
        { scripture: scriptureLayer },
      ),
    );

    const placed = pages.flatMap((page) => page.sections.map((item) => item.id));
    expect(placed).toHaveLength(kinds.length);
    expect(new Set(placed)).toEqual(new Set(kinds));
  });

  it("prefers the author's emphasised sentence for the pause card", () => {
    const withEmphasis: Section = {
      ...section("t", "teaching", "ประโยคธรรมดา"),
      blocks: [
        { type: "paragraph", text: "ประโยคธรรมดา" },
        { type: "paragraph", text: "ประโยคที่เน้น", emphasis: true },
      ],
    };

    const pages = buildChapterPages(chapterWith([withEmphasis]));
    const brew = pages.find((page) => page.id === "brew");
    expect(brew?.pause).toBe("ประโยคที่เน้น");
  });

  it("uses the sixty-second summary for the pages it was written for", () => {
    const pages = buildChapterPages(
      chapterWith([section("t", "teaching", "สอน"), section("c", "christ", "พระคริสต์")], {
        sixtySecondSummary: {
          whatHappened: "เกิดอะไรขึ้น",
          bigIdea: "ใจความใหญ่",
          whatWeSeeAboutGod: "เห็นพระเจ้า",
          wholeBibleDirection: "ทิศทาง",
        },
      }),
    );

    expect(pages.find((page) => page.id === "brew")?.tldr).toBe("ใจความใหญ่");
    expect(pages.find((page) => page.id === "big")?.tldr).toBe("ทิศทาง");
  });
});
