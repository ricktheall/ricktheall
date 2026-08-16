"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { BookCup } from "@/components/book-cup";
import { NEW_TESTAMENT, OLD_TESTAMENT, type BibleBook } from "@/lib/books/canon";
import { bookPercent, completedChapterCount, cupState, type CupState } from "@/lib/progress/book-logic";
import { useProgress } from "@/lib/progress/provider";
import { cn } from "@/lib/utils";

const STATE_LABEL: Record<CupState, string> = {
  "coming-soon": "กำลังเตรียม",
  ready: "พร้อมอ่าน",
  reading: "กำลังอ่าน",
  completed: "อ่านจบแล้ว",
};

type Filter = "all" | "old" | "new" | "ready" | "reading" | "completed";

const FILTERS: readonly { id: Filter; label: string }[] = [
  { id: "all", label: "ทั้งหมด" },
  { id: "old", label: "พันธสัญญาเดิม" },
  { id: "new", label: "พันธสัญญาใหม่" },
  { id: "ready", label: "พร้อมอ่าน" },
  { id: "reading", label: "กำลังอ่าน" },
  { id: "completed", label: "อ่านจบแล้ว" },
];

export function LibraryGrid() {
  const { book: bookProgress, hydrated } = useProgress();
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const describe = useMemo(
    () => (book: BibleBook) => {
      // Before hydration every cup renders from empty state, so server and
      // client markup agree; real progress appears on the next paint.
      const progress = hydrated ? bookProgress(book.id) : undefined;
      return {
        state: cupState(book, progress),
        percent: bookPercent(book, progress),
        done: completedChapterCount(progress),
      };
    },
    [bookProgress, hydrated],
  );

  const keep = (book: BibleBook) => {
    if (filter === "all") return true;
    if (filter === "old" || filter === "new") return book.testament === filter;
    return describe(book).state === filter;
  };

  const selected = selectedId === null ? null : [...OLD_TESTAMENT, ...NEW_TESTAMENT].find((b) => b.id === selectedId) ?? null;

  const section = (title: string, books: readonly BibleBook[]) => {
    const visible = books.filter(keep);
    if (visible.length === 0) return null;
    return (
      <section className="mt-8">
        <div className="flex items-baseline justify-between gap-3 border-b border-[var(--border)] pb-2">
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          <span className="text-xs text-[var(--foreground-subtle)]">{visible.length} เล่ม</span>
        </div>
        <ul className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(60px,1fr))] gap-x-2 gap-y-4">
          {visible.map((book) => {
            const { state, percent, done } = describe(book);
            const isSelected = book.id === selectedId;
            const label = [
              book.nameTh,
              book.nameEn,
              `${book.chapterCount} บท`,
              STATE_LABEL[state],
              state === "reading" ? `${done} จาก ${book.chapterCount} บท` : null,
            ]
              .filter(Boolean)
              .join(" · ");

            return (
              <li key={book.id}>
                <button
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={label}
                  onClick={() => setSelectedId(book.id)}
                  className={cn(
                    "flex min-h-11 w-full flex-col items-center gap-1 rounded-xl border border-transparent px-1 py-1.5",
                    "transition-colors hover:border-[var(--border)] hover:bg-[var(--surface-muted)]",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]",
                    isSelected && "border-[var(--accent)] bg-[var(--accent-soft)]",
                  )}
                >
                  <BookCup book={book} state={state} percent={percent} />
                  <span
                    className={cn(
                      "text-[0.68rem] font-semibold tracking-wide",
                      state === "coming-soon" ? "text-[var(--foreground-subtle)]" : "text-[var(--foreground-muted)]",
                      (state === "reading" || state === "completed") && "text-[var(--accent)]",
                    )}
                  >
                    {book.code}
                  </span>
                  <span className="w-full truncate text-center text-[0.62rem] leading-relaxed text-[var(--foreground-subtle)]">
                    {book.nameTh}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    );
  };

  return (
    <div className="pb-40">
      <div className="mt-6 flex gap-2 overflow-x-auto pb-2" role="group" aria-label="กรองรายการ">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "min-h-9 shrink-0 rounded-full border px-4 text-[0.8rem] transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]",
              filter === f.id
                ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                : "border-[var(--border)] text-[var(--foreground-muted)]",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {section("พันธสัญญาเดิม", OLD_TESTAMENT)}
      {section("พันธสัญญาใหม่", NEW_TESTAMENT)}

      {/* Detail strip: the grid stays clean, the detail appears on demand. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--border)] bg-[var(--surface)]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3" role="status">
          {selected === null ? (
            <p className="w-full text-center text-[0.8rem] text-[var(--foreground-subtle)]">
              แตะแก้วเพื่อดูรายละเอียด
            </p>
          ) : (
            <SelectedBook book={selected} {...describe(selected)} />
          )}
        </div>
      </div>
    </div>
  );
}

function SelectedBook({
  book,
  state,
  percent,
  done,
}: {
  book: BibleBook;
  state: CupState;
  percent: number;
  done: number;
}) {
  return (
    <>
      <BookCup book={book} state={state} percent={percent} className="shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-serif text-[0.95rem] font-semibold">
          {book.code} · {book.nameTh}
        </p>
        <p className="truncate text-[0.75rem] text-[var(--foreground-muted)]">
          {book.nameEn} · {book.chapterCount} บท · {STATE_LABEL[state]}
          {state === "reading" ? ` · ${done}/${book.chapterCount}` : ""}
        </p>
      </div>
      {book.lessonStatus === "ready" ? (
        <Link
          href={`/th/books/${book.id}`}
          className="min-h-11 shrink-0 rounded-full bg-[var(--primary)] px-4 py-2.5 text-[0.85rem] font-semibold text-[var(--primary-foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
        >
          {state === "completed" ? "อ่านอีกครั้ง" : state === "reading" ? "อ่านต่อ" : "เริ่มอ่าน"}
        </Link>
      ) : (
        <p className="max-w-[9.5rem] shrink-0 text-right text-[0.72rem] leading-snug text-[var(--foreground-subtle)]">
          แก้วนี้กำลังเตรียมอยู่ เรากำลังเตรียมบทเรียนอย่างตั้งใจ
        </p>
      )}
    </>
  );
}
