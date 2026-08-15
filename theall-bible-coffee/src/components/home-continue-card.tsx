"use client";

import Link from "next/link";

import { CoffeeCup } from "@/components/coffee-cup";
import { buttonVariants } from "@/components/ui/button";
import { EPHESIANS_1_CHAPTER_KEY } from "@/lib/content/book";
import { computeCupPercent } from "@/lib/progress/logic";
import { useProgress } from "@/lib/progress/provider";

interface HomeContinueCardProps {
  bookTitle: string;
  chapterTitle: string;
  chapterSummary: string;
  estimatedMinutes: number;
}

export function HomeContinueCard({
  bookTitle,
  chapterTitle,
  chapterSummary,
  estimatedMinutes,
}: HomeContinueCardProps) {
  const { chapter, hydrated } = useProgress();
  const progress = chapter(EPHESIANS_1_CHAPTER_KEY);
  const percent = computeCupPercent(progress);
  const started = hydrated && percent > 0;

  return (
    <div className="mt-4 rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] p-5 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--foreground-subtle)]">{bookTitle} · บทที่ 1</p>
          <h3 className="mt-1 font-serif text-xl font-semibold leading-snug sm:text-2xl">
            {chapterTitle}
          </h3>
        </div>
        {started ? <CoffeeCup percent={percent} size="inline" /> : null}
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
    </div>
  );
}
