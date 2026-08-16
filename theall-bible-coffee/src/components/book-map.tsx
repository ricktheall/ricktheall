"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { BibleBook } from "@/lib/books/canon";
import type { BookContent, Movement } from "@/lib/content/book-schema";
import { useProgress } from "@/lib/progress/provider";
import { cn } from "@/lib/utils";

interface BookMapProps {
  book: BibleBook;
  content: BookContent;
  /** Chapters that actually have prepared lessons. */
  publishedChapters: readonly number[];
}

/**
 * The Book Map replaces a flat wall of chapter numbers as the *default* view.
 *
 * A list of fifty buttons is a database; it tells a reader nothing about where
 * they are in the story. The map answers three questions at a glance — where am
 * I, what have I finished, what comes next — and the full chapter list is still
 * one tap away for anyone who wants it.
 */
export function BookMap({ book, content, publishedChapters }: BookMapProps) {
  const { book: bookProgress, hydrated } = useProgress();
  const [showAllChapters, setShowAllChapters] = useState(false);

  const readChapters = useMemo(
    () => new Set(hydrated ? bookProgress(book.id).completedChapters : []),
    [book.id, bookProgress, hydrated],
  );
  const published = useMemo(() => new Set(publishedChapters), [publishedChapters]);

  const chapterHref = (chapter: number) => `/th/books/${book.id}/${chapter}`;

  return (
    <div className="mt-10 flex flex-col gap-8">
      {content.movements.map((movement) => (
        <MovementBlock
          key={movement.id}
          movement={movement}
          readChapters={readChapters}
          published={published}
          chapterHref={chapterHref}
        />
      ))}

      <div className="border-t border-[var(--border)] pt-5">
        <button
          type="button"
          onClick={() => setShowAllChapters((open) => !open)}
          aria-expanded={showAllChapters}
          className="min-h-11 rounded-full border border-[var(--border)] px-4 text-[0.85rem] text-[var(--foreground-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
        >
          {showAllChapters ? "ซ่อนรายการบท" : `ดูทุกบท 1–${book.chapterCount}`}
        </button>

        {showAllChapters && (
          <ol className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(44px,1fr))] gap-2">
            {Array.from({ length: book.chapterCount }, (_, index) => index + 1).map((chapter) => {
              const isRead = readChapters.has(chapter);
              const isPublished = published.has(chapter);
              const label = `บทที่ ${chapter}${isRead ? " · อ่านแล้ว" : ""}${isPublished ? "" : " · ยังไม่เปิด"}`;
              return (
                <li key={chapter}>
                  {isPublished ? (
                    <Link
                      href={chapterHref(chapter)}
                      aria-label={label}
                      className={cn(
                        "flex min-h-11 items-center justify-center rounded-lg border text-sm tabular-nums",
                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]",
                        isRead
                          ? "border-[var(--accent)] bg-[var(--accent-soft)] font-semibold text-[var(--accent)]"
                          : "border-[var(--border)] text-[var(--foreground-muted)]",
                      )}
                    >
                      {chapter}
                    </Link>
                  ) : (
                    <span
                      aria-label={label}
                      className="flex min-h-11 items-center justify-center rounded-lg border border-dashed border-[var(--border)] text-sm tabular-nums text-[var(--foreground-subtle)] opacity-60"
                    >
                      {chapter}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}

function MovementBlock({
  movement,
  readChapters,
  published,
  chapterHref,
}: {
  movement: Movement;
  readChapters: ReadonlySet<number>;
  published: ReadonlySet<number>;
  chapterHref: (chapter: number) => string;
}) {
  const chapters = Array.from(
    { length: movement.toChapter - movement.fromChapter + 1 },
    (_, index) => movement.fromChapter + index,
  );
  const readCount = chapters.filter((chapter) => readChapters.has(chapter)).length;
  const hasContent = chapters.some((chapter) => published.has(chapter));
  const nextChapter = chapters.find((chapter) => !readChapters.has(chapter) && published.has(chapter));

  return (
    <section aria-labelledby={`${movement.id}-title`} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            Movement {movement.order}
          </p>
          <h2 id={`${movement.id}-title`} className="font-serif text-[1.15rem] font-semibold">
            {movement.title}
          </h2>
          {movement.subtitle !== undefined && (
            <p className="text-[0.85rem] text-[var(--foreground-subtle)]">{movement.subtitle}</p>
          )}
        </div>
        <p className="text-[0.8rem] tabular-nums text-[var(--foreground-muted)]">
          บทที่ {movement.fromChapter}–{movement.toChapter}
          {hasContent ? ` · ${readCount}/${chapters.length}` : ""}
        </p>
      </div>

      {/* Progress reads at a glance, and is never colour-only: every dot is
          labelled for assistive technology and the count is written above. */}
      <ol className="flex flex-wrap gap-1.5" aria-label={`ความคืบหน้าใน ${movement.title}`}>
        {chapters.map((chapter) => {
          const isRead = readChapters.has(chapter);
          const isNext = chapter === nextChapter;
          const isPublished = published.has(chapter);
          const state = isRead ? "อ่านแล้ว" : isNext ? "บทถัดไป" : isPublished ? "ยังไม่ได้อ่าน" : "ยังไม่เปิด";
          const dot = (
            <span
              aria-hidden="true"
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border text-[0.7rem] tabular-nums",
                isRead && "border-[var(--accent)] bg-[var(--accent)] font-bold text-[var(--accent-foreground)]",
                !isRead && isNext && "border-[var(--accent)] text-[var(--accent)]",
                !isRead && !isNext && isPublished && "border-[var(--border-firm)] text-[var(--foreground-subtle)]",
                // A chapter the reader has read is never dimmed, even if its
                // lesson is unpublished — dimming it here would drop the tick
                // to roughly 1.2:1 against the filled circle.
                !isPublished && !isRead && "border-dashed border-[var(--border)] text-[var(--foreground-subtle)] opacity-55",
              )}
            >
              {isRead ? "✓" : chapter}
            </span>
          );
          return (
            <li key={chapter}>
              {isPublished ? (
                <Link
                  href={chapterHref(chapter)}
                  aria-label={`บทที่ ${chapter} · ${state}`}
                  className="block rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
                >
                  {dot}
                </Link>
              ) : (
                <span aria-label={`บทที่ ${chapter} · ${state}`} role="img">
                  {dot}
                </span>
              )}
            </li>
          );
        })}
      </ol>

      {!hasContent && (
        <p className="text-[0.8rem] text-[var(--foreground-subtle)]">
          ส่วนนี้ยังกำลังเตรียมอยู่ — แสดงไว้ให้เห็นภาพรวมของทั้งเล่ม
        </p>
      )}
    </section>
  );
}
