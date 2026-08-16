import type { BibleBook } from "@/lib/books/canon";

import { emptyBookProgress, type BookProgress } from "./schema";

/**
 * Pure rules for the 66-cup journey. Free of React and storage so they can be
 * tested directly, in the same spirit as `logic.ts`.
 */

/** How far a reader has got in a book. Derived, never stored. */
export type BookStatus = "not-started" | "in-progress" | "completed";

/**
 * What a cup looks like in the library. Reader progress always wins over
 * lesson availability: a book you finished shows as finished even if we have
 * not published a lesson for it.
 */
export type CupState = "coming-soon" | "ready" | "reading" | "completed";

export function bookProgressOrEmpty(progress: BookProgress | undefined): BookProgress {
  return progress ?? emptyBookProgress;
}

export function completedChapterCount(progress: BookProgress | undefined): number {
  return bookProgressOrEmpty(progress).completedChapters.length;
}

export function bookStatus(book: BibleBook, progress: BookProgress | undefined): BookStatus {
  const done = completedChapterCount(progress);
  if (done >= book.chapterCount) return "completed";
  if (done > 0 || bookProgressOrEmpty(progress).startedAt !== null) return "in-progress";
  return "not-started";
}

/** Always computed from completed chapters, so the two can never disagree. */
export function bookPercent(book: BibleBook, progress: BookProgress | undefined): number {
  if (book.chapterCount <= 0) return 0;
  const ratio = completedChapterCount(progress) / book.chapterCount;
  return Math.round(Math.min(Math.max(ratio, 0), 1) * 100);
}

export function cupState(book: BibleBook, progress: BookProgress | undefined): CupState {
  const status = bookStatus(book, progress);
  if (status === "completed") return "completed";
  if (status === "in-progress") return "reading";
  return book.lessonStatus === "ready" ? "ready" : "coming-soon";
}

/** Records a finished chapter. Idempotent, and keeps the list sorted. */
export function withChapterRead(
  book: BibleBook,
  progress: BookProgress | undefined,
  chapterNumber: number,
  now: string,
): BookProgress {
  const previous = bookProgressOrEmpty(progress);
  if (chapterNumber < 1 || chapterNumber > book.chapterCount) return previous;
  if (previous.completedChapters.includes(chapterNumber)) return previous;

  const completedChapters = [...previous.completedChapters, chapterNumber].sort((a, b) => a - b);
  const finished = completedChapters.length >= book.chapterCount;

  return {
    completedChapters,
    completedMovements: previous.completedMovements,
    startedAt: previous.startedAt ?? now,
    completedAt: finished ? now : previous.completedAt,
    celebrated: previous.celebrated,
  };
}

/** The next chapter a reader has not finished, for the "continue" action. */
export function nextUnreadChapter(book: BibleBook, progress: BookProgress | undefined): number {
  const done = new Set(bookProgressOrEmpty(progress).completedChapters);
  for (let chapter = 1; chapter <= book.chapterCount; chapter += 1) {
    if (!done.has(chapter)) return chapter;
  }
  return book.chapterCount;
}

/**
 * Which book to suggest after finishing one: the next book in canonical order
 * that has a lesson and is not already finished. Deterministic on purpose —
 * no generated recommendations in this release.
 */
export function nextReadyBook(
  books: readonly BibleBook[],
  finished: BibleBook,
  isCompleted: (book: BibleBook) => boolean,
): BibleBook | null {
  const candidates = books.filter((b) => b.lessonStatus === "ready" && !isCompleted(b));
  return (
    candidates.find((b) => b.order > finished.order) ??
    candidates.find((b) => b.id !== finished.id) ??
    null
  );
}

export interface JourneySummary {
  completedBooks: number;
  readingBooks: number;
  completedChapters: number;
  totalBooks: number;
  totalChapters: number;
  hasAnyProgress: boolean;
}

export function summariseJourney(
  books: readonly BibleBook[],
  progressFor: (bookId: string) => BookProgress | undefined,
  totalChapters: number,
): JourneySummary {
  let completedBooks = 0;
  let readingBooks = 0;
  let completedChapters = 0;

  for (const book of books) {
    const progress = progressFor(book.id);
    completedChapters += completedChapterCount(progress);
    const status = bookStatus(book, progress);
    if (status === "completed") completedBooks += 1;
    else if (status === "in-progress") readingBooks += 1;
  }

  return {
    completedBooks,
    readingBooks,
    completedChapters,
    totalBooks: books.length,
    totalChapters,
    hasAnyProgress: completedChapters > 0 || readingBooks > 0 || completedBooks > 0,
  };
}
