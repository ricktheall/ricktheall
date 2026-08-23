"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

import { CoffeeCup } from "@/components/coffee-cup";
import { ReflectionForm } from "@/components/reader/reflection-form";
import { ThreeWordsCheck } from "@/components/reader/three-words-check";
import { ValidationFeedback } from "@/components/reader/validation-feedback";
import { Button } from "@/components/ui/button";
import type { Chapter } from "@/lib/content/schema";
import { computeCupPercent, computePoints } from "@/lib/progress/logic";
import { useProgress } from "@/lib/progress/provider";
import { POINTS } from "@/lib/progress/schema";

/**
 * Orchestrates the end of the chapter: checkpoint → reflection → completion →
 * validation feedback. Each step only appears once the previous one is done.
 */
export function ChapterEnding({
  chapter,
  chapterKey,
  explanationId,
  bookTitle,
}: {
  chapter: Chapter;
  chapterKey: string;
  explanationId: string | null;
  bookTitle: string;
}) {
  const {
    chapter: chapterProgress,
    hydrated,
    setCheckpointPassed,
    recordCheckpointMiss,
    completeChapter,
  } = useProgress();
  const progress = chapterProgress(chapterKey);
  const [showFeedback, setShowFeedback] = useState(false);
  const reduceMotion = useReducedMotion();

  if (!hydrated) {
    return <div className="mt-20 h-40" aria-hidden="true" />;
  }

  const scrollToExplanation = () => {
    if (!explanationId) return;
    document.getElementById(explanationId)?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  if (!progress.checkpointPassed) {
    return (
      <ThreeWordsCheck
        checkpoint={chapter.checkpoint}
        onPassed={() => setCheckpointPassed(chapterKey)}
        onMissed={() => recordCheckpointMiss(chapterKey)}
        onReview={scrollToExplanation}
      />
    );
  }

  if (!progress.chapterCompleted) {
    return (
      <>
        <section
          aria-labelledby="checkpoint-passed"
          className="mt-20 rounded-sm border border-[var(--accent)] bg-[var(--accent-soft)] p-5 sm:p-7"
        >
          <h2 id="checkpoint-passed" className="font-display text-xl font-semibold">
            {chapter.checkpoint.successMessage}
          </h2>
          <p className="mt-2 text-sm text-[var(--foreground-muted)]">
            เหลืออีกหนึ่งคำถามให้คุณตอบกับตัวเอง แล้วแก้วกาแฟจะเต็ม
          </p>
        </section>
        <ReflectionForm
          reflection={chapter.reflection}
          onCompleted={() => completeChapter(chapterKey)}
        />
      </>
    );
  }

  const cupPercent = computeCupPercent(progress);
  const points = computePoints(progress);
  const perfect = points === POINTS.reading + POINTS.checkpointFirstTry + POINTS.reflection;

  return (
    <div className="mt-20">
      <motion.section
        aria-labelledby="completion-title"
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-sm border border-[var(--border-strong)] bg-[var(--surface)] p-6 text-center sm:p-10"
      >
        <div className="flex justify-center">
          <CoffeeCup percent={cupPercent} size="large" label="อ่านบทนี้แล้ว" />
        </div>

        <p role="status" aria-live="polite" className="sr-only">
          {`คุณอ่านบทนี้จบแล้ว ความคืบหน้า ${cupPercent} เปอร์เซ็นต์ ได้ ${points} แต้ม`}
        </p>

        {/* Medallion, not a scoreboard: one number, stated plainly. */}
        <div className="mt-7 flex justify-center">
          <div className="flex size-24 flex-col items-center justify-center rounded-full border border-[var(--accent)] text-[var(--accent)]">
            <span className="font-display text-2xl font-semibold tabular-nums">{points}</span>
            <span className="text-[0.65rem] tracking-widest">แต้ม</span>
          </div>
        </div>
        <p className="mt-3 text-sm text-[var(--foreground-subtle)]">
          {perfect ? "เต็มทุกส่วนของบทนี้" : `จาก 100 แต้มของบทนี้`}
        </p>

        <hr className="rule-gold my-8" />

        <h2 id="completion-title" className="font-display text-2xl font-semibold sm:text-3xl">
          {chapter.completion.title}
        </h2>

        <p className="reading-lead mx-auto mt-6 max-w-xl text-[var(--foreground)]">
          {chapter.completion.centralTruth}
        </p>

        <p className="mx-auto mt-6 max-w-xl text-sm text-[var(--foreground-muted)]">
          {chapter.completion.invitation}
        </p>

        {!showFeedback ? (
          <Button type="button" size="lg" className="mt-8" onClick={() => setShowFeedback(true)}>
            ช่วยเราทำบทต่อไปให้ดีขึ้น
          </Button>
        ) : null}
      </motion.section>

      {showFeedback ? (
        <ValidationFeedback
          chapterLabel={`${bookTitle} ${chapter.chapterNumber}`}
          nextLabel={`บทที่ ${chapter.chapterNumber + 1}`}
        />
      ) : null}
    </div>
  );
}
