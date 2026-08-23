import { describe, expect, it } from "vitest";

import {
  computePoints,
  computeCupPercent,
  isCheckpointCorrect,
  isChapterComplete,
  isReflectionAnswerValid,
  mergeReadingPercent,
  withChapterCompleted,
} from "./logic";
import { MAX_READING_PERCENT, POINTS, emptyChapterProgress, type ChapterProgress } from "./schema";

const CORRECT = ["eph-01-word-chosen", "eph-01-word-inheritance", "eph-01-word-deposit"] as const;

function progress(overrides: Partial<ChapterProgress> = {}): ChapterProgress {
  return { ...emptyChapterProgress, ...overrides };
}

describe("reading progress", () => {
  it("never decreases when the reader scrolls back up", () => {
    let max = mergeReadingPercent(0, 40);
    expect(max).toBe(40);
    max = mergeReadingPercent(max, 12);
    expect(max).toBe(40);
    max = mergeReadingPercent(max, 55);
    expect(max).toBe(55);
    max = mergeReadingPercent(max, 0);
    expect(max).toBe(55);
  });

  it("cannot exceed 90% from reading alone", () => {
    expect(mergeReadingPercent(0, 100)).toBe(MAX_READING_PERCENT);
    expect(mergeReadingPercent(85, 999)).toBe(MAX_READING_PERCENT);
    expect(computeCupPercent(progress({ maxReadingPercent: MAX_READING_PERCENT }))).toBe(90);
  });

  it("ignores negative and non-finite observations", () => {
    expect(mergeReadingPercent(30, -20)).toBe(30);
    expect(mergeReadingPercent(30, Number.NaN)).toBe(30);
    expect(mergeReadingPercent(Number.NaN, 20)).toBe(20);
  });
});

describe("cup percentage", () => {
  it("stays at the reading value until both final steps are done", () => {
    expect(computeCupPercent(progress({ maxReadingPercent: 90, checkpointPassed: true }))).toBe(90);
    expect(computeCupPercent(progress({ maxReadingPercent: 90, reflectionCompleted: true }))).toBe(90);
  });

  it("reaches exactly 100% after checkpoint plus reflection", () => {
    const completed = withChapterCompleted(progress({ maxReadingPercent: 42 }));
    expect(completed.chapterCompleted).toBe(true);
    expect(computeCupPercent(completed)).toBe(100);
  });

  it("never exceeds 100%", () => {
    expect(
      computeCupPercent(
        progress({ maxReadingPercent: 90, checkpointPassed: true, reflectionCompleted: true }),
      ),
    ).toBe(100);
  });
});

describe("chapter completion", () => {
  it("requires the checkpoint", () => {
    expect(isChapterComplete(progress({ reflectionCompleted: true }))).toBe(false);
  });

  it("requires the reflection", () => {
    expect(isChapterComplete(progress({ checkpointPassed: true }))).toBe(false);
  });

  it("is true only when both are done", () => {
    expect(
      isChapterComplete(progress({ checkpointPassed: true, reflectionCompleted: true })),
    ).toBe(true);
  });
});

describe("3 Words Check", () => {
  it("passes for exactly the three correct ids in any order", () => {
    expect(isCheckpointCorrect([...CORRECT].reverse(), CORRECT)).toBe(true);
  });

  it("fails when a distractor is chosen", () => {
    expect(
      isCheckpointCorrect(
        ["eph-01-word-chosen", "eph-01-word-inheritance", "eph-01-word-sabbath"],
        CORRECT,
      ),
    ).toBe(false);
  });

  it("fails for too few, too many, or duplicated selections", () => {
    expect(isCheckpointCorrect(["eph-01-word-chosen"], CORRECT)).toBe(false);
    expect(isCheckpointCorrect([...CORRECT, "eph-01-word-tithe"], CORRECT)).toBe(false);
    expect(
      isCheckpointCorrect(
        ["eph-01-word-chosen", "eph-01-word-chosen", "eph-01-word-chosen"],
        CORRECT,
      ),
    ).toBe(false);
  });

  it("does not complete the chapter on an incorrect answer", () => {
    const attempted = progress({ maxReadingPercent: 90 });
    expect(isCheckpointCorrect(["eph-01-word-tithe"], CORRECT)).toBe(false);
    expect(computeCupPercent(attempted)).toBe(90);
    expect(isChapterComplete(attempted)).toBe(false);
  });
});

describe("reflection", () => {
  it("rejects empty and whitespace-only answers", () => {
    expect(isReflectionAnswerValid("")).toBe(false);
    expect(isReflectionAnswerValid("   \n\t ")).toBe(false);
  });

  it("accepts any real answer without grading it", () => {
    expect(isReflectionAnswerValid("เรื่องงาน")).toBe(true);
  });
});

describe("points", () => {
  it("gives nothing before the chapter text is finished", () => {
    expect(computePoints(progress({ maxReadingPercent: 89 }))).toBe(0);
  });

  it("pays for reading only once the text is fully read", () => {
    expect(computePoints(progress({ maxReadingPercent: MAX_READING_PERCENT }))).toBe(POINTS.reading);
  });

  it("pays the full checkpoint bonus on a first-try pass", () => {
    const scored = progress({
      maxReadingPercent: MAX_READING_PERCENT,
      checkpointPassed: true,
      checkpointMisses: 0,
    });
    expect(computePoints(scored)).toBe(POINTS.reading + POINTS.checkpointFirstTry);
  });

  it("pays less after a wrong attempt, but never zero", () => {
    const scored = progress({
      maxReadingPercent: MAX_READING_PERCENT,
      checkpointPassed: true,
      checkpointMisses: 2,
    });
    expect(computePoints(scored)).toBe(POINTS.reading + POINTS.checkpointRetry);
  });

  it("totals exactly 100 for a clean run", () => {
    expect(
      computePoints(
        progress({
          maxReadingPercent: MAX_READING_PERCENT,
          checkpointPassed: true,
          checkpointMisses: 0,
          reflectionCompleted: true,
        }),
      ),
    ).toBe(100);
  });

  it("never exceeds 100", () => {
    const scored = computePoints(
      progress({
        maxReadingPercent: MAX_READING_PERCENT,
        checkpointPassed: true,
        checkpointMisses: 0,
        reflectionCompleted: true,
        chapterCompleted: true,
      }),
    );
    expect(scored).toBeLessThanOrEqual(100);
  });
});
