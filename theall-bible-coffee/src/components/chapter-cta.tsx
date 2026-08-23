"use client";

import Link from "next/link";

import { CoffeeCup } from "@/components/coffee-cup";
import { buttonVariants } from "@/components/ui/button";
import { chapterKey } from "@/lib/content/books";
import { computeCupPercent, computePoints } from "@/lib/progress/logic";
import { useProgress } from "@/lib/progress/provider";

interface ChapterCallToActionProps {
  bookId: string;
  chapterNumber: number;
  chapterTitle: string;
  chapterSummary: string;
  estimatedMinutes: number;
}

export function ChapterCallToAction({
  bookId,
  chapterNumber,
  chapterTitle,
  chapterSummary,
  estimatedMinutes,
}: ChapterCallToActionProps) {
  const { chapter, hydrated } = useProgress();
  const progress = chapter(chapterKey(bookId, chapterNumber));
  const percent = computeCupPercent(progress);
  const points = computePoints(progress);
  const started = hydrated && percent > 0;

  return (
    <section
      aria-labelledby="chapter-cta"
      className="mt-12 border border-[var(--border-strong)] bg-[var(--surface)] p-5 sm:p-8"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="label">บทที่ {chapterNumber}</p>
          <h2 id="chapter-cta" className="font-display mt-3 text-2xl font-semibold sm:text-3xl">
            {chapterTitle}
          </h2>
        </div>
        <div className="text-end">
          <CoffeeCup percent={hydrated ? percent : 0} size="inline" />
          <p className="mt-1 text-xs tabular-nums text-[var(--foreground-subtle)]">
            {progress.chapterCompleted ? `อ่านจบแล้ว · ${points} แต้ม` : "ความคืบหน้า"}
          </p>
        </div>
      </div>

      <p className="reading-text mt-5 text-[var(--foreground-muted)]">{chapterSummary}</p>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link
          href={`/th/books/${bookId}/${chapterNumber}`}
          className={buttonVariants({ variant: "primary", size: "lg" })}
        >
          {started ? "อ่านต่อจากเดิม" : `เริ่มอ่านบทที่ ${chapterNumber}`}
        </Link>
        <span className="text-sm text-[var(--foreground-subtle)]">
          ประมาณ {estimatedMinutes} นาที · เก็บได้ 100 แต้ม
        </span>
      </div>
    </section>
  );
}
