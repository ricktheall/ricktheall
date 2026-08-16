import { z } from "zod";

/** Versioned storage key — bump the suffix when the shape changes incompatibly. */
export const STORAGE_KEY = "theall-bible-coffee:mvp:v1";

/** Reading alone can never fill the cup past this. The last 10% is earned. */
export const MAX_READING_PERCENT = 90;
export const COMPLETION_BONUS_PERCENT = 10;

export const themePreferenceSchema = z.enum(["light", "dark", "system"]);
export const fontSizePreferenceSchema = z.enum(["sm", "md", "lg", "xl"]);
export const returnIntentSchema = z.enum(["definitely", "maybe", "not-yet"]);

export const chapterProgressSchema = z.object({
  maxReadingPercent: z.number().min(0).max(MAX_READING_PERCENT).catch(0),
  lastSectionId: z.string().nullable().catch(null),
  checkpointPassed: z.boolean().catch(false),
  reflectionCompleted: z.boolean().catch(false),
  chapterCompleted: z.boolean().catch(false),
  /**
   * "I have read this chapter" — the reader's own declaration, independent of
   * the checkpoint and the reflection. Both of those are optional; reading is
   * not a course to pass.
   *
   * Left optional rather than defaulted so state written before this field
   * existed is not misread as unread — see `isChapterRead`, which falls back to
   * the old `chapterCompleted` flag.
   */
  chapterRead: z.boolean().optional(),
});

/**
 * Book-level progress for the 66-cup journey.
 *
 * Chapter completion remains the single source of truth: the percentage and the
 * "finished" state are always derived from `completedChapters`, never stored.
 */
export const bookProgressSchema = z.object({
  completedChapters: z.array(z.number().int().positive()).catch([]),
  /** Movement ids the reader has walked all the way through. */
  completedMovements: z.array(z.string()).default([]).catch([]),
  startedAt: z.string().nullable().catch(null),
  completedAt: z.string().nullable().catch(null),
  /** The completion moment is shown once, and stays shown-once after an undo. */
  celebrated: z.boolean().catch(false),
});

export const feedbackSchema = z.object({
  understanding: z.number().int().min(1).max(5).nullable(),
  returnIntent: returnIntentSchema.nullable(),
  freeText: z.string().max(2000),
  submitted: z.boolean(),
});

export const progressStateSchema = z.object({
  version: z.literal(1),
  chapters: z.record(z.string(), chapterProgressSchema),
  /**
   * Added after the first readers already had saved state, so it must tolerate
   * being absent: `.default` covers the missing key, `.catch` covers a damaged
   * one. Neither may ever discard the `chapters` a reader has already earned.
   */
  books: z.record(z.string(), bookProgressSchema).default({}).catch({}),
  /**
   * Things the reader has asked for that do not exist yet — currently only
   * "I want to read Abraham next". Recording the request is honest; pretending
   * the content exists is not.
   */
  intents: z.record(z.string(), z.string()).default({}).catch({}),
  preferences: z.object({
    theme: themePreferenceSchema.catch("system"),
    fontSize: fontSizePreferenceSchema.catch("md"),
  }),
  feedback: feedbackSchema.nullable(),
});

export type ThemePreference = z.infer<typeof themePreferenceSchema>;
export type FontSizePreference = z.infer<typeof fontSizePreferenceSchema>;
export type ReturnIntent = z.infer<typeof returnIntentSchema>;
export type ChapterProgress = z.infer<typeof chapterProgressSchema>;
export type BookProgress = z.infer<typeof bookProgressSchema>;
export type Feedback = z.infer<typeof feedbackSchema>;
export type ProgressState = z.infer<typeof progressStateSchema>;

export const emptyChapterProgress: ChapterProgress = {
  maxReadingPercent: 0,
  lastSectionId: null,
  checkpointPassed: false,
  reflectionCompleted: false,
  chapterCompleted: false,
};

export const emptyBookProgress: BookProgress = {
  completedChapters: [],
  completedMovements: [],
  startedAt: null,
  completedAt: null,
  celebrated: false,
};

export function createInitialState(): ProgressState {
  return {
    version: 1,
    chapters: {},
    books: {},
    intents: {},
    preferences: { theme: "system", fontSize: "md" },
    feedback: null,
  };
}
