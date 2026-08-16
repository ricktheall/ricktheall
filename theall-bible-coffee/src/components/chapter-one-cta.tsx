"use client";

import Link from "next/link";

import { CoffeeCup } from "@/components/coffee-cup";
import { buttonVariants } from "@/components/ui/button";
import { EPHESIANS_1_CHAPTER_KEY } from "@/lib/content/book";
import { computeCupPercent } from "@/lib/progress/logic";
import { useProgress } from "@/lib/progress/provider";

interface ChapterOneCallToActionProps {
  chapterTitle: string;
  chapterSummary: string;
  estimatedMinutes: number;
}

export function ChapterOneCallToAction({
  chapterTitle,
  chapterSummary,
  estimatedMinutes,
}: ChapterOneCallToActionProps) {
  const { chapter, hydrated } = useProgress();
  const progress = chapter(EPHESIANS_1_CHAPTER_KEY);
  const percent = computeCupPercent(progress);
  const started = hydrated && percent > 0;

  return (
    <section
      aria-labelledby="chapter-one"
      className="mt-10 rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] p-5 sm:p-7"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--foreground-subtle)]">บทที่ 1</p>
          <h2 id="chapter-one" className="mt-1 font-serif text-xl font-semibold leading-snug sm:text-2xl">
            {chapterTitle}
          </h2>
        </div>
        <div className="text-right">
          <CoffeeCup percent={hydrated ? percent : 0} size="inline" />
          <p className="mt-1 text-xs text-[var(--foreground-subtle)]">
            {progress.chapterCompleted ? "อ่านจบแล้ว" : "ความคืบหน้า"}
          </p>
        </div>
      </div>

      <p className="reading-text mt-4 text-[var(--foreground-muted)]">{chapterSummary}</p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link
          href="/th/books/ephesians/1"
          className={buttonVariants({ variant: "primary", size: "lg" })}
        >
          {started ? "อ่านต่อจากเดิม" : "เริ่มอ่านบทที่ 1"}
        </Link>
        <span className="text-sm text-[var(--foreground-subtle)]">
          ประมาณ {estimatedMinutes} นาที
        </span>
      </div>
    </section>
  );
}
