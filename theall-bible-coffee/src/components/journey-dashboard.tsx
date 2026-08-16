"use client";

import Link from "next/link";
import { useMemo } from "react";

import { BookCup } from "@/components/book-cup";
import { BIBLE_BOOKS, TOTAL_CHAPTERS, type BibleBook } from "@/lib/books/canon";
import {
  bookPercent,
  bookStatus,
  cupState,
  nextUnreadChapter,
  summariseJourney,
} from "@/lib/progress/book-logic";
import { useProgress } from "@/lib/progress/provider";

const th = (value: number) => value.toLocaleString("th-TH");

export function JourneyDashboard() {
  const { book: bookProgress, hydrated } = useProgress();

  const progressFor = useMemo(
    () => (bookId: string) => (hydrated ? bookProgress(bookId) : undefined),
    [bookProgress, hydrated],
  );

  const summary = summariseJourney(BIBLE_BOOKS, progressFor, TOTAL_CHAPTERS);

  // The most recently touched book that is not finished, for one-tap continue.
  const current: BibleBook | undefined = BIBLE_BOOKS.filter(
    (b) => bookStatus(b, progressFor(b.id)) === "in-progress" && b.lessonStatus === "ready",
  )[0];

  return (
    <div className="pb-16">
      <section className="text-center">
        <p className="text-sm font-medium tracking-wide text-[var(--accent)]">
          66 แก้ว · การเดินทางหนึ่งชีวิต
        </p>
        <h1 className="mt-3 font-serif text-[1.5rem] font-semibold leading-[1.5] tracking-tight">
          การเดินทางผ่านพระคัมภีร์ของคุณ
        </h1>
        <p className="mt-4 font-serif text-[2.6rem] font-semibold leading-none text-[var(--accent)]">
          {th(summary.completedBooks)} / 66
        </p>
        <p className="mt-2 text-[0.95rem] text-[var(--foreground-muted)]">
          เล่ม · {th(summary.completedChapters)} / {th(summary.totalChapters)} บท
        </p>
      </section>

      {!summary.hasAnyProgress && (
        <p className="mt-6 text-center text-[0.9rem] text-[var(--foreground-subtle)]">
          การเดินทางของคุณยังไม่เริ่ม — ชงแก้วแรกวันนี้ได้เลย
        </p>
      )}

      <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="อ่านจบแล้ว" value={th(summary.completedBooks)} />
        <Stat label="กำลังอ่าน" value={th(summary.readingBooks)} />
        <Stat label="บททั้งหมด" value={th(summary.completedChapters)} />
        <Stat label="ยังรออยู่" value={th(summary.totalBooks - summary.completedBooks)} />
      </dl>

      <div className="mt-6">
        {current ? (
          <Link
            // The book page is the safe target: it knows which chapters are
            // actually published, so this can never point at a missing route.
            href={`/th/books/${current.id}`}
            className="flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--primary)] px-5 text-[0.95rem] font-semibold text-[var(--primary-foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
          >
            อ่านต่อ — {current.nameTh} {nextUnreadChapter(current, progressFor(current.id))}
          </Link>
        ) : (
          <Link
            href="/th/library"
            className="flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--primary)] px-5 text-[0.95rem] font-semibold text-[var(--primary-foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
          >
            เปิดห้องสมุดกาแฟ
          </Link>
        )}
      </div>

      <section className="mt-10">
        <div className="flex items-baseline justify-between gap-3 border-b border-[var(--border)] pb-2">
          <h2 className="text-base font-semibold tracking-tight">66 แก้วของฉัน</h2>
          <span className="text-xs text-[var(--foreground-subtle)]">
            {th(summary.completedBooks)} / 66 เล่ม
          </span>
        </div>

        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[0.72rem] text-[var(--foreground-subtle)]">
          <li>เบลอ = กำลังเตรียม</li>
          <li>ชัด = พร้อมอ่าน</li>
          <li>มีกาแฟ = กำลังอ่าน</li>
          <li>คว่ำแก้ว = อ่านจบแล้ว</li>
        </ul>

        <ul className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(52px,1fr))] gap-x-2 gap-y-4">
          {BIBLE_BOOKS.map((book) => {
            const progress = progressFor(book.id);
            const state = cupState(book, progress);
            return (
              <li key={book.id} className="flex flex-col items-center gap-1">
                <BookCup book={book} state={state} percent={bookPercent(book, progress)} />
                <span className="sr-only">
                  {book.nameTh} — {state === "completed" ? "อ่านจบแล้ว" : state === "reading" ? "กำลังอ่าน" : state === "ready" ? "พร้อมอ่าน" : "กำลังเตรียม"}
                </span>
                <span aria-hidden="true" className="text-[0.62rem] text-[var(--foreground-subtle)]">
                  {book.code}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
      <dd className="font-serif text-[1.4rem] font-semibold leading-tight">{value}</dd>
      <dt className="text-[0.72rem] text-[var(--foreground-subtle)]">{label}</dt>
    </div>
  );
}
