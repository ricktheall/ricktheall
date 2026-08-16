import { describe, expect, it } from "vitest";

import {
  BIBLE_BOOKS,
  NEW_TESTAMENT,
  OLD_TESTAMENT,
  TOTAL_CHAPTERS,
  chapterKeyFor,
  findBook,
  parseChapterKey,
} from "./canon";

describe("the canon", () => {
  it("has exactly 66 books, 39 old and 27 new", () => {
    expect(BIBLE_BOOKS).toHaveLength(66);
    expect(OLD_TESTAMENT).toHaveLength(39);
    expect(NEW_TESTAMENT).toHaveLength(27);
  });

  it("totals 1,189 chapters", () => {
    expect(TOTAL_CHAPTERS).toBe(1189);
  });

  it("is ordered from Genesis to Revelation with no gaps", () => {
    BIBLE_BOOKS.forEach((book, index) => {
      expect(book.order).toBe(index + 1);
    });
    expect(BIBLE_BOOKS[0]?.id).toBe("genesis");
    expect(BIBLE_BOOKS[65]?.id).toBe("revelation");
  });

  it("has no duplicate ids or codes", () => {
    expect(new Set(BIBLE_BOOKS.map((b) => b.id)).size).toBe(66);
    expect(new Set(BIBLE_BOOKS.map((b) => b.code)).size).toBe(66);
  });

  it("gives every book a Thai name, an English name and a positive chapter count", () => {
    for (const book of BIBLE_BOOKS) {
      expect(book.nameTh.length).toBeGreaterThan(0);
      expect(book.nameEn.length).toBeGreaterThan(0);
      expect(book.chapterCount).toBeGreaterThan(0);
    }
  });

  it("marks only books that actually have prepared content as ready", () => {
    const ready = BIBLE_BOOKS.filter((b) => b.lessonStatus === "ready").map((b) => b.id);
    expect(ready).toEqual(["ephesians"]);
  });
});

describe("chapter keys", () => {
  it("round-trips the key the reader already uses", () => {
    expect(chapterKeyFor("ephesians", 1)).toBe("ephesians-01");
    expect(parseChapterKey("ephesians-01")).toEqual({ bookId: "ephesians", chapterNumber: 1 });
  });

  it("handles books with three-digit chapter counts", () => {
    expect(parseChapterKey("psalms-150")).toEqual({ bookId: "psalms", chapterNumber: 150 });
  });

  it("handles book ids that contain digits and hyphens", () => {
    expect(parseChapterKey("1-samuel-31")).toEqual({ bookId: "1-samuel", chapterNumber: 31 });
  });

  it("rejects unknown books and out-of-range chapters", () => {
    expect(parseChapterKey("atlantis-01")).toBeNull();
    expect(parseChapterKey("ephesians-07")).toBeNull();
    expect(parseChapterKey("nonsense")).toBeNull();
  });

  it("looks books up by id", () => {
    expect(findBook("revelation")?.chapterCount).toBe(22);
    expect(findBook("nope")).toBeUndefined();
  });
});
