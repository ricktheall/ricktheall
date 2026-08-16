import { describe, expect, it } from "vitest";

import { BIBLE_BOOKS, TOTAL_CHAPTERS, findBook, type BibleBook } from "@/lib/books/canon";

import {
  bookPercent,
  bookStatus,
  cupState,
  nextReadyBook,
  nextUnreadChapter,
  summariseJourney,
  withChapterRead,
} from "./book-logic";
import { emptyBookProgress, type BookProgress } from "./schema";

const EPHESIANS = findBook("ephesians") as BibleBook;
const JONAH = findBook("jonah") as BibleBook;
const NOW = "2026-08-16T09:00:00.000Z";

function readChapters(book: BibleBook, chapters: readonly number[]): BookProgress {
  return chapters.reduce<BookProgress>(
    (progress, chapter) => withChapterRead(book, progress, chapter, NOW),
    emptyBookProgress,
  );
}

describe("book status", () => {
  it("starts not-started", () => {
    expect(bookStatus(EPHESIANS, undefined)).toBe("not-started");
    expect(bookPercent(EPHESIANS, undefined)).toBe(0);
  });

  it("is in-progress after one chapter", () => {
    const progress = readChapters(EPHESIANS, [1]);
    expect(bookStatus(EPHESIANS, progress)).toBe("in-progress");
    expect(bookPercent(EPHESIANS, progress)).toBe(17);
  });

  it("is completed only when every chapter is read", () => {
    const almost = readChapters(EPHESIANS, [1, 2, 3, 4, 5]);
    expect(bookStatus(EPHESIANS, almost)).toBe("in-progress");

    const all = readChapters(EPHESIANS, [1, 2, 3, 4, 5, 6]);
    expect(bookStatus(EPHESIANS, all)).toBe("completed");
    expect(bookPercent(EPHESIANS, all)).toBe(100);
    expect(all.completedAt).toBe(NOW);
  });
});

describe("recording a chapter", () => {
  it("is idempotent and keeps chapters sorted", () => {
    let progress = readChapters(EPHESIANS, [3, 1]);
    progress = withChapterRead(EPHESIANS, progress, 1, NOW);
    expect(progress.completedChapters).toEqual([1, 3]);
  });

  it("ignores chapters outside the book", () => {
    const progress = withChapterRead(EPHESIANS, emptyBookProgress, 99, NOW);
    expect(progress.completedChapters).toEqual([]);
  });

  it("keeps the original start date", () => {
    const first = withChapterRead(EPHESIANS, emptyBookProgress, 1, "2026-01-01T00:00:00.000Z");
    const second = withChapterRead(EPHESIANS, first, 2, NOW);
    expect(second.startedAt).toBe("2026-01-01T00:00:00.000Z");
  });
});

describe("cup states", () => {
  it("blurs books with no lesson, and lights up books with one", () => {
    expect(cupState(JONAH, undefined)).toBe("coming-soon");
    expect(cupState(EPHESIANS, undefined)).toBe("ready");
  });

  it("lets reader progress win over lesson availability", () => {
    expect(cupState(JONAH, readChapters(JONAH, [1]))).toBe("reading");
    expect(cupState(JONAH, readChapters(JONAH, [1, 2, 3, 4]))).toBe("completed");
  });
});

describe("continuing and recommending", () => {
  it("offers the first unread chapter", () => {
    expect(nextUnreadChapter(EPHESIANS, readChapters(EPHESIANS, [1, 2]))).toBe(3);
    expect(nextUnreadChapter(EPHESIANS, readChapters(EPHESIANS, [2]))).toBe(1);
  });

  it("recommends the next ready book that is not finished", () => {
    const genesis = findBook("genesis") as BibleBook;
    expect(nextReadyBook(BIBLE_BOOKS, genesis, () => false)?.id).toBe("ephesians");
    expect(nextReadyBook(BIBLE_BOOKS, genesis, () => true)).toBeNull();
  });
});

describe("journey summary", () => {
  it("counts books and chapters against the whole canon", () => {
    const books = new Map<string, BookProgress>([
      ["ephesians", readChapters(EPHESIANS, [1, 2, 3, 4, 5, 6])],
      ["jonah", readChapters(JONAH, [1])],
    ]);
    const summary = summariseJourney(BIBLE_BOOKS, (id) => books.get(id), TOTAL_CHAPTERS);

    expect(summary.completedBooks).toBe(1);
    expect(summary.readingBooks).toBe(1);
    expect(summary.completedChapters).toBe(7);
    expect(summary.totalBooks).toBe(66);
    expect(summary.totalChapters).toBe(1189);
    expect(summary.hasAnyProgress).toBe(true);
  });

  it("reports an untouched journey as empty", () => {
    const summary = summariseJourney(BIBLE_BOOKS, () => undefined, TOTAL_CHAPTERS);
    expect(summary.hasAnyProgress).toBe(false);
    expect(summary.completedChapters).toBe(0);
  });
});
