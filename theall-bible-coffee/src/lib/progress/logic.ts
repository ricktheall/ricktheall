import {
  COMPLETION_BONUS_PERCENT,
  MAX_READING_PERCENT,
  emptyChapterProgress,
  type ChapterProgress,
} from "./schema";

/**
 * Pure progress rules. Kept free of React and storage so they can be tested
 * directly — these are the rules the validation experiment depends on.
 */

/** Reading progress is monotonic and capped at 90%. Scrolling back never costs anything. */
export function mergeReadingPercent(previousMax: number, observed: number): number {
  const safeObserved = Number.isFinite(observed) ? observed : 0;
  const clamped = Math.min(Math.max(safeObserved, 0), MAX_READING_PERCENT);
  const safePrevious = Number.isFinite(previousMax) ? Math.max(previousMax, 0) : 0;
  return Math.max(Math.min(safePrevious, MAX_READING_PERCENT), clamped);
}

/** The cup total: reading (0–90) plus the final 10 earned by checkpoint + reflection. */
export function computeCupPercent(progress: ChapterProgress): number {
  const reading = Math.min(Math.max(progress.maxReadingPercent, 0), MAX_READING_PERCENT);
  const earned = progress.checkpointPassed && progress.reflectionCompleted ? COMPLETION_BONUS_PERCENT : 0;
  return Math.round(Math.min(reading + earned, 100));
}

/** A chapter is complete only when both the checkpoint and the reflection are done. */
export function isChapterComplete(progress: ChapterProgress): boolean {
  return progress.checkpointPassed && progress.reflectionCompleted;
}

/**
 * Applies a completed chapter: reading is topped up to 90 so the cup reads a
 * true 100%, and the completion flags are set.
 */
export function withChapterCompleted(progress: ChapterProgress): ChapterProgress {
  return {
    ...progress,
    maxReadingPercent: MAX_READING_PERCENT,
    checkpointPassed: true,
    reflectionCompleted: true,
    chapterCompleted: true,
  };
}

export function isCheckpointCorrect(selectedIds: readonly string[], correctIds: readonly string[]): boolean {
  if (selectedIds.length !== correctIds.length) return false;
  const selected = new Set(selectedIds);
  if (selected.size !== correctIds.length) return false;
  return correctIds.every((id) => selected.has(id));
}

/** Reflection answers must contain something real, but are never graded. */
export function isReflectionAnswerValid(text: string): boolean {
  return text.trim().length > 0;
}

export function chapterProgressOrEmpty(progress: ChapterProgress | undefined): ChapterProgress {
  return progress ?? emptyChapterProgress;
}

/**
 * Deterministic shuffle so option order varies per reader without needing a
 * seeded RNG library. Used client-side only.
 */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const a = result[i] as T;
    const b = result[j] as T;
    result[i] = b;
    result[j] = a;
  }
  return result;
}
