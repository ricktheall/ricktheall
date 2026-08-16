import { describe, expect, it } from "vitest";

import { continuitySchema } from "@/lib/content/genre";
import { BIBLE_BOOKS } from "@/lib/books/canon";

import { isChapterComplete, isChapterRead, withChapterMarkedRead } from "./logic";
import { emptyChapterProgress, progressStateSchema, type ChapterProgress } from "./schema";

describe("reading is independent of the checkpoint", () => {
  it("counts a chapter as read from the reader's own declaration alone", () => {
    const read = withChapterMarkedRead(emptyChapterProgress);
    expect(isChapterRead(read)).toBe(true);
    // No quiz, no reflection — and that is fine.
    expect(isChapterComplete(read)).toBe(false);
    expect(read.checkpointPassed).toBe(false);
    expect(read.reflectionCompleted).toBe(false);
  });

  it("treats an unread chapter as unread", () => {
    expect(isChapterRead(emptyChapterProgress)).toBe(false);
  });

  it("is idempotent", () => {
    const once = withChapterMarkedRead(emptyChapterProgress);
    expect(withChapterMarkedRead(once)).toBe(once);
  });

  it("does not reset chapters finished before chapterRead existed", () => {
    const legacy: ChapterProgress = {
      maxReadingPercent: 90,
      lastSectionId: "x",
      checkpointPassed: true,
      reflectionCompleted: true,
      chapterCompleted: true,
    };
    expect(isChapterRead(legacy)).toBe(true);
  });
});

describe("stored state stays backwards compatible", () => {
  it("accepts state written before books, intents and chapterRead existed", () => {
    const legacy = {
      version: 1,
      chapters: {
        "ephesians-01": {
          maxReadingPercent: 90,
          lastSectionId: "ephesians-01-story",
          checkpointPassed: true,
          reflectionCompleted: true,
          chapterCompleted: true,
        },
      },
      preferences: { theme: "system", fontSize: "md" },
      feedback: null,
    };

    const parsed = progressStateSchema.safeParse(legacy);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    // The reader keeps everything they earned.
    expect(parsed.data.chapters["ephesians-01"]?.chapterCompleted).toBe(true);
    expect(parsed.data.books).toEqual({});
    expect(parsed.data.intents).toEqual({});
  });
});

describe("continuity refuses the wrong shape", () => {
  it("accepts narrative fields for a narrative chapter", () => {
    const parsed = continuitySchema.safeParse({
      mode: "narrative",
      before: "มนุษย์กระจัดกระจายที่บาเบล",
      now: "พระเจ้าเรียกอับราฮัม",
      next: "อับราฮัมจะวางใจพระสัญญาไหม",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects before/now/next on a psalm", () => {
    const parsed = continuitySchema.safeParse({
      mode: "poetry",
      before: "ก่อนหน้า",
      now: "ตอนนี้",
      next: "ต่อไป",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects a genealogy dressed up as a scene", () => {
    const parsed = continuitySchema.safeParse({
      mode: "genealogy",
      before: "ก่อนหน้า",
      now: "ตอนนี้",
      next: "ต่อไป",
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts a genealogy's own shape", () => {
    const parsed = continuitySchema.safeParse({
      mode: "genealogy",
      whoIsListed: "เชื้อสายของอาดัมถึงโนอาห์",
      whyItMatters: "ความตายซ้ำ ๆ แต่เส้นชีวิตยังไม่ขาด",
      whereItPoints: "ไปสู่โนอาห์ และพันธสัญญาหลังน้ำท่วม",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects an unknown mode", () => {
    expect(continuitySchema.safeParse({ mode: "vibes", a: "b" }).success).toBe(false);
  });
});

describe("every book declares a genre", () => {
  it("assigns a primary genre to all 66 books", () => {
    for (const book of BIBLE_BOOKS) {
      expect(book.primaryGenre).toBeTruthy();
    }
  });

  it("puts the epistles on argument and Revelation on apocalyptic", () => {
    expect(BIBLE_BOOKS.find((b) => b.id === "ephesians")?.primaryGenre).toBe("argument");
    expect(BIBLE_BOOKS.find((b) => b.id === "revelation")?.primaryGenre).toBe("apocalyptic");
    expect(BIBLE_BOOKS.find((b) => b.id === "psalms")?.primaryGenre).toBe("poetry");
    expect(BIBLE_BOOKS.find((b) => b.id === "genesis")?.primaryGenre).toBe("narrative");
  });
});
