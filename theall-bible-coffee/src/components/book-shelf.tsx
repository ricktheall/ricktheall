"use client";

import Link from "next/link";

import { CoffeeCup } from "@/components/coffee-cup";
import { buttonVariants } from "@/components/ui/button";
import { chapterKey } from "@/lib/content/books";
import { computeCupPercent } from "@/lib/progress/logic";
import { useProgress } from "@/lib/progress/provider";

export interface ShelfItem {
  bookId: string;
  titleTh: string;
  campTitle: string | null;
  chapterNumber: number;
  chapterTitle: string;
  chapterSummary: string;
  estimatedMinutes: number;
}

/** The books actually open for reading. No cards for books that do not exist. */
export function BookShelf({ items }: { items: readonly ShelfItem[] }) {
  const { chapter, hydrated } = useProgress();

  return (
    <section aria-labelledby="shelf">
      <h2 id="shelf" className="label">
        เปิดให้อ่านแล้ว
      </h2>

      <div className="mt-6 grid gap-5">
        {items.map((item) => {
          const progress = chapter(chapterKey(item.bookId, item.chapterNumber));
          const percent = computeCupPercent(progress);
          const started = hydrated && percent > 0;

          return (
            <article
              key={item.bookId}
              className="border border-[var(--border-strong)] bg-[var(--surface)] p-5 transition-colors hover:border-[var(--accent)] sm:p-7"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  {item.campTitle ? (
                    <p className="label">{item.campTitle}</p>
                  ) : (
                    <p className="label text-[var(--foreground-subtle)]">{item.titleTh}</p>
                  )}
                  <h3 className="font-display mt-3 text-xl font-semibold sm:text-2xl">
                    {item.chapterTitle}
                  </h3>
                </div>
                {started ? <CoffeeCup percent={percent} size="inline" /> : null}
              </div>

              <p className="reading-text mt-4 text-[var(--foreground-muted)]">
                {item.chapterSummary}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-4">
                <Link
                  href={`/th/books/${item.bookId}/${item.chapterNumber}`}
                  className={buttonVariants({ variant: "primary", size: "lg" })}
                >
                  {started ? "อ่านต่อจากเดิม" : `เริ่มอ่าน${item.titleTh} บทที่ ${item.chapterNumber}`}
                </Link>
                <Link
                  href={`/th/books/${item.bookId}`}
                  className="text-sm text-[var(--foreground-subtle)] underline underline-offset-4"
                >
                  ดูภาพรวมทั้งเล่ม
                </Link>
                <span className="text-sm text-[var(--foreground-subtle)]">
                  ประมาณ {item.estimatedMinutes} นาที
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
