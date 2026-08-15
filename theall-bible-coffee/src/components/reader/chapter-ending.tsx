"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

import { CoffeeCup } from "@/components/coffee-cup";
import { ReflectionForm } from "@/components/reader/reflection-form";
import { ThreeWordsCheck } from "@/components/reader/three-words-check";
import { ValidationFeedback } from "@/components/reader/validation-feedback";
import { Button } from "@/components/ui/button";
import { EPHESIANS_1_CHAPTER_KEY } from "@/lib/content/book";
import type { Chapter } from "@/lib/content/schema";
import { computeCupPercent } from "@/lib/progress/logic";
import { useProgress } from "@/lib/progress/provider";

/**
 * Orchestrates the end of the chapter: checkpoint → reflection → completion →
 * validation feedback. Each step only appears once the previous one is done.
 */
export function ChapterEnding({ chapter }: { chapter: Chapter }) {
  const { chapter: chapterProgress, hydrated, setCheckpointPassed, completeChapter } = useProgress();
  const progress = chapterProgress(EPHESIANS_1_CHAPTER_KEY);
  const [showFeedback, setShowFeedback] = useState(false);
  const reduceMotion = useReducedMotion();

  if (!hydrated) {
    return <div className="mt-16 h-40" aria-hidden="true" />;
  }

  const scrollToExplanation = () => {
    document.getElementById("ephesians-01-explanation")?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  if (!progress.checkpointPassed) {
    return (
      <ThreeWordsCheck
        checkpoint={chapter.checkpoint}
        onPassed={() => setCheckpointPassed(EPHESIANS_1_CHAPTER_KEY)}
        onReview={scrollToExplanation}
      />
    );
  }

  if (!progress.chapterCompleted) {
    return (
      <>
        <section
          aria-labelledby="checkpoint-passed"
          className="mt-16 rounded-2xl border border-[var(--accent)] bg-[var(--accent-soft)] p-5 sm:p-7"
        >
          <h2 id="checkpoint-passed" className="text-lg font-semibold tracking-tight">
            {chapter.checkpoint.successMessage}
          </h2>
          <p className="mt-2 text-sm text-[var(--foreground-muted)]">
            เหลืออีกหนึ่งคำถามให้คุณตอบกับตัวเอง แล้วแก้วกาแฟจะเต็ม
          </p>
        </section>
        <ReflectionForm
          reflection={chapter.reflection}
          onCompleted={() => completeChapter(EPHESIANS_1_CHAPTER_KEY)}
        />
      </>
    );
  }

  const cupPercent = computeCupPercent(progress);

  return (
    <div className="mt-16">
      <motion.section
        aria-labelledby="completion-title"
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.5, ease: "easeOut" }}
        className="rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] p-6 text-center sm:p-9"
      >
        <div className="flex justify-center">
          <CoffeeCup percent={cupPercent} size="large" label="อ่านเอเฟซัสบทที่ 1 แล้ว" />
        </div>

        <p role="status" aria-live="polite" className="sr-only">
          {`คุณอ่านเอเฟซัสบทที่ 1 จบแล้ว ความคืบหน้า ${cupPercent} เปอร์เซ็นต์`}
        </p>

        <h2
          id="completion-title"
          className="mt-6 font-serif text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          {chapter.completion.title}
        </h2>

        <p className="reading-lead mx-auto mt-5 max-w-xl text-[var(--foreground)]">
          {chapter.completion.centralTruth}
        </p>

        <p className="mx-auto mt-5 max-w-xl text-sm text-[var(--foreground-muted)]">
          {chapter.completion.invitation}
        </p>

        {!showFeedback ? (
          <Button type="button" size="lg" className="mt-7" onClick={() => setShowFeedback(true)}>
            ช่วยเราทำบทต่อไปให้ดีขึ้น
          </Button>
        ) : null}
      </motion.section>

      {showFeedback ? <ValidationFeedback /> : null}
    </div>
  );
}
