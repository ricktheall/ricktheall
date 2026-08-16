"use client";

import Link from "next/link";

import { BIBLE_BOOKS, findBook, type BibleBook } from "@/lib/books/canon";
import { bookStatus, nextUnreadChapter } from "@/lib/progress/book-logic";
import { useProgress } from "@/lib/progress/provider";

/**
 * The returning reader's first sight: the cup already on the table.
 *
 * A reader who has started should not have to walk the 66-cup library again
 * every day to get back to where they were — that is friction we would be
 * adding to ourselves. Open → Continue → Chapter, in one tap.
 *
 * Renders nothing for a first-time visitor, so the hero stays the front door.
 */
export function ResumeCard() {
  const { book: bookProgress, hydrated } = useProgress();

  if (!hydrated) return null;

  // The furthest-along book still in progress, in canonical order.
  const current: BibleBook | undefined = BIBLE_BOOKS.filter(
    (book) => bookStatus(book, bookProgress(book.id)) === "in-progress",
  )[0];

  if (current === undefined) return null;

  const progress = bookProgress(current.id);
  const chapter = nextUnreadChapter(current, progress);
  const readCount = progress.completedChapters.length;
  const book = findBook(current.id);
  if (book === undefined) return null;

  return (
    <section
      aria-labelledby="resume-title"
      className="mt-6 rounded-2xl border border-[var(--accent)] bg-[var(--accent-soft)] p-5 sm:p-6"
    >
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
        อ่านต่อจากตรงนี้
      </p>
      <h2 id="resume-title" className="mt-2 font-serif text-xl font-semibold leading-snug">
        {book.nameTh} บทที่ {chapter}
      </h2>
      <p className="mt-1 text-[0.9rem] tabular-nums text-[var(--foreground-muted)]">
        อ่านแล้ว {readCount} / {book.chapterCount} บท
      </p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link
          href={`/th/books/${book.id}/${chapter}`}
          className="flex min-h-12 items-center justify-center rounded-full bg-[var(--primary)] px-6 text-[0.95rem] font-semibold text-[var(--primary-foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
        >
          อ่านต่อบทที่ {chapter} →
        </Link>
        <Link
          href="/th/library"
          className="text-[0.88rem] text-[var(--foreground-muted)] underline underline-offset-4 hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
        >
          ดูการเดินทาง 66 แก้ว
        </Link>
      </div>
    </section>
  );
}
