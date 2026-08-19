import { z } from "zod";

/** Versioned storage key — bump the suffix when the shape changes incompatibly. */
export const STORAGE_KEY = "theall-bible-coffee:mvp:v1";

/** Reading alone can never fill the cup past this. The last 10% is earned. */
export const MAX_READING_PERCENT = 90;
export const COMPLETION_BONUS_PERCENT = 10;

/** Points awarded per chapter. They total 100 for a clean first-attempt run. */
export const POINTS = {
  reading: 40,
  checkpointFirstTry: 40,
  checkpointRetry: 25,
  reflection: 20,
} as const;

export const themePreferenceSchema = z.enum(["light", "dark", "system"]);
export const fontSizePreferenceSchema = z.enum(["sm", "md", "lg", "xl"]);
export const returnIntentSchema = z.enum(["definitely", "maybe", "not-yet"]);

export const chapterProgressSchema = z.object({
  maxReadingPercent: z.number().min(0).max(MAX_READING_PERCENT).catch(0),
  lastSectionId: z.string().nullable().catch(null),
  checkpointPassed: z.boolean().catch(false),
  /** Wrong attempts before passing — drives the first-try points bonus. */
  checkpointMisses: z.number().int().min(0).catch(0),
  reflectionCompleted: z.boolean().catch(false),
  chapterCompleted: z.boolean().catch(false),
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
  preferences: z.object({
    theme: themePreferenceSchema.catch("dark"),
    fontSize: fontSizePreferenceSchema.catch("md"),
    /** Read-aloud playback speed. */
    speechRate: z.number().min(0.5).max(2).catch(1),
  }),
  feedback: feedbackSchema.nullable(),
});

export type ThemePreference = z.infer<typeof themePreferenceSchema>;
export type FontSizePreference = z.infer<typeof fontSizePreferenceSchema>;
export type ReturnIntent = z.infer<typeof returnIntentSchema>;
export type ChapterProgress = z.infer<typeof chapterProgressSchema>;
export type Feedback = z.infer<typeof feedbackSchema>;
export type ProgressState = z.infer<typeof progressStateSchema>;

export const emptyChapterProgress: ChapterProgress = {
  maxReadingPercent: 0,
  lastSectionId: null,
  checkpointPassed: false,
  checkpointMisses: 0,
  reflectionCompleted: false,
  chapterCompleted: false,
};

export function createInitialState(): ProgressState {
  return {
    version: 1,
    chapters: {},
    preferences: { theme: "dark", fontSize: "md", speechRate: 1 },
    feedback: null,
  };
}
