import { z } from "zod";

import { continuitySchema } from "./genre";

/**
 * Minimal content schema for the TheAll Bible Coffee validation MVP.
 *
 * Deliberately small: it covers only the block types Ephesians 1 actually uses.
 * The three future-safe foundations kept here are stable content IDs,
 * `schemaVersion`, and a discriminated-union block structure that can be
 * extended later without rewriting the reader.
 */

const nonEmpty = z.string().trim().min(1);

/** Inline text is plain text only — the renderer never injects raw HTML. */
const stableId = z
  .string()
  .regex(/^[a-z0-9-]+$/, "IDs must be lowercase, digits and hyphens only");

export const paragraphBlockSchema = z.object({
  type: z.literal("paragraph"),
  text: nonEmpty,
  /** Optional visual emphasis for a single load-bearing sentence. */
  emphasis: z.boolean().optional(),
});

export const headingBlockSchema = z.object({
  type: z.literal("heading"),
  text: nonEmpty,
  /** Sub-heading level inside a section (section titles are h2). */
  level: z.union([z.literal(3), z.literal(4)]),
});

export const listBlockSchema = z.object({
  type: z.literal("list"),
  ordered: z.boolean().default(false),
  items: z.array(nonEmpty).min(1),
});

export const calloutBlockSchema = z.object({
  type: z.literal("callout"),
  tone: z.enum(["note", "truth", "draft"]),
  title: nonEmpty.optional(),
  text: nonEmpty,
});

export const scriptureReferenceBlockSchema = z.object({
  type: z.literal("scriptureReference"),
  reference: nonEmpty,
  /** Null until a translation and its permitted use are explicitly supplied. */
  text: z.string().nullable().default(null),
  translationId: z.string().nullable().default(null),
  rightsStatus: z.enum(["reference-only", "licensed"]),
  attribution: z.string().nullable().default(null),
  note: z.string().nullable().default(null),
});

export const greekTermBlockSchema = z.object({
  type: z.literal("greekTerm"),
  greek: nonEmpty,
  transliteration: nonEmpty,
  gloss: nonEmpty,
  explanation: nonEmpty,
  sourceId: stableId.optional(),
});

export const applicationBlockSchema = z.object({
  type: z.literal("application"),
  stage: z.enum(["knowing", "doing", "sharing"]),
  title: nonEmpty,
  text: nonEmpty,
  prompts: z.array(nonEmpty).min(1),
});

export const blockSchema = z.discriminatedUnion("type", [
  paragraphBlockSchema,
  headingBlockSchema,
  listBlockSchema,
  calloutBlockSchema,
  scriptureReferenceBlockSchema,
  greekTermBlockSchema,
  applicationBlockSchema,
]);

export const sectionSchema = z.object({
  id: stableId,
  /** Short label used by the reading outline / section navigation. */
  navLabel: nonEmpty,
  title: nonEmpty,
  kind: z.enum([
    "main-verse",
    "story",
    "context",
    "outline",
    "explanation",
    "metaphor",
    "connections",
    "application",
    // Kinds introduced by the Scripture-first model
    "research",
    "teaching",
    "christ",
    "eternal",
    "share",
  ]),
  blocks: z.array(blockSchema).min(1),
  sourceIds: z.array(stableId).default([]),
});

export const checkpointOptionSchema = z.object({
  id: stableId,
  word: nonEmpty,
});

export const checkpointSchema = z.object({
  id: stableId,
  prompt: nonEmpty,
  helpText: nonEmpty,
  requiredSelections: z.literal(3),
  options: z.array(checkpointOptionSchema).min(6),
  /** Exactly three IDs; every correct word must appear in the visible chapter text. */
  correctOptionIds: z.array(stableId).length(3),
  successMessage: nonEmpty,
  retryMessage: nonEmpty,
});

export const reflectionSchema = z.object({
  id: stableId,
  question: nonEmpty,
  helpText: nonEmpty,
  placeholder: nonEmpty,
  maxLength: z.number().int().min(200).max(4000),
});

export const sourceSchema = z.object({
  id: stableId,
  label: nonEmpty,
  detail: nonEmpty,
  /** `verified` = checked by a human reviewer; `unverified` = still draft. */
  status: z.enum(["verified", "unverified"]),
});

export const completionSchema = z.object({
  title: nonEmpty,
  centralTruth: nonEmpty,
  invitation: nonEmpty,
});

/**
 * The 60-second orientation shown immediately after Scripture.
 *
 * Four questions, not five: the section's name is a promise to the reader, and
 * five answers of one to two sentences no longer fits in sixty seconds.
 * "What do we see about humanity" belongs in Deep Brew.
 */
export const sixtySecondSummarySchema = z.object({
  whatHappened: nonEmpty,
  bigIdea: nonEmpty,
  whatWeSeeAboutGod: nonEmpty,
  wholeBibleDirection: nonEmpty,
});

/**
 * One lightweight response per ordinary chapter — ten to thirty seconds.
 * Three questions every chapter turns a coffee rhythm into homework.
 */
export const microResponseSchema = z.object({
  prompt: nonEmpty,
  options: z
    .array(z.object({ id: stableId, label: nonEmpty }))
    .min(2)
    .max(6),
  allowNote: z.boolean().default(false),
});

/**
 * Scripture layer. Kept structurally apart from Bible Coffee's editorial words
 * so rights, attribution and licence travel with the text they belong to — and
 * so a future translation swap never touches a lesson.
 *
 * `text` may only be present when `rightsStatus` is "licensed", and licensed
 * text must carry its translation id, attribution and licence.
 */
export const scriptureLayerSchema = z
  .object({
    reference: nonEmpty,
    translationId: z.string().nullable(),
    text: z.string().nullable(),
    rightsStatus: z.enum(["reference-only", "licensed"]),
    attribution: z.string().nullable(),
    license: z.string().nullable(),
    copyrightNotice: z.string().nullable(),
  })
  .superRefine((scripture, ctx) => {
    if (scripture.rightsStatus === "reference-only" && scripture.text !== null) {
      ctx.addIssue({
        code: "custom",
        message: "reference-only scripture must not carry text",
      });
    }
    if (scripture.rightsStatus === "licensed") {
      const missing = (["text", "translationId", "attribution", "license"] as const).filter(
        (key) => scripture[key] === null,
      );
      if (missing.length > 0) {
        ctx.addIssue({
          code: "custom",
          message: `licensed scripture requires ${missing.join(", ")}`,
        });
      }
    }
  });

export const chapterSchema = z
  .object({
    schemaVersion: z.literal(1),
    status: z.enum(["draft", "review", "final"]),
    locale: z.literal("th"),
    bookId: stableId,
    chapterNumber: z.number().int().positive(),
    title: nonEmpty,
    summary: nonEmpty,
    estimatedMinutes: z.number().int().min(1).max(120),
    mainVerse: z.object({
      reference: nonEmpty,
      text: z.string().nullable(),
      translationId: z.string().nullable(),
      rightsStatus: z.enum(["reference-only", "licensed"]),
      attribution: z.string().nullable(),
    }),
    sections: z.array(sectionSchema).min(1),
    /*
     * Optional since the checkpoint moved to the end of a movement rather than
     * the end of every chapter. Reading a chapter is a declaration, not a
     * course to pass, so an ordinary chapter carries none of these three.
     */
    checkpoint: checkpointSchema.nullable().default(null),
    reflection: reflectionSchema.nullable().default(null),
    completion: completionSchema.nullable().default(null),
    sources: z.array(sourceSchema).default([]),

    /* ── Editorial layer (all optional so existing chapters stay valid) ──
     * These are Bible Coffee's own words. They are deliberately kept apart
     * from `scripture` below, which carries someone else's licensed text. */
    contentVersion: z.number().int().positive().default(1),
    chapterOrientation: z.string().trim().optional(),
    sixtySecondSummary: sixtySecondSummarySchema.optional(),
    continuity: continuitySchema.optional(),
    response: microResponseSchema.optional(),

    /** Scripture layer — rights-bearing text, never merged with the editorial layer. */
    scripture: scriptureLayerSchema.optional(),
  })
  .superRefine((chapter, ctx) => {
    const sectionIds = new Set<string>();
    for (const section of chapter.sections) {
      if (sectionIds.has(section.id)) {
        ctx.addIssue({ code: "custom", message: `Duplicate section id: ${section.id}` });
      }
      sectionIds.add(section.id);
    }

    const sourceIds = new Set(chapter.sources.map((source) => source.id));
    for (const section of chapter.sections) {
      for (const sourceId of section.sourceIds) {
        if (!sourceIds.has(sourceId)) {
          ctx.addIssue({ code: "custom", message: `Unknown sourceId "${sourceId}" in ${section.id}` });
        }
      }
      for (const block of section.blocks) {
        if (block.type === "greekTerm" && block.sourceId && !sourceIds.has(block.sourceId)) {
          ctx.addIssue({ code: "custom", message: `Unknown sourceId "${block.sourceId}" in ${section.id}` });
        }
      }
    }

    // Checkpoints now belong to the end of a movement, so most chapters have none.
    if (chapter.checkpoint !== null) {
      const optionIds = new Set(chapter.checkpoint.options.map((option) => option.id));
      if (optionIds.size !== chapter.checkpoint.options.length) {
        ctx.addIssue({ code: "custom", message: "Checkpoint option ids must be unique" });
      }
      for (const correctId of chapter.checkpoint.correctOptionIds) {
        if (!optionIds.has(correctId)) {
          ctx.addIssue({ code: "custom", message: `correctOptionIds references unknown option "${correctId}"` });
        }
      }
      if (new Set(chapter.checkpoint.correctOptionIds).size !== 3) {
        ctx.addIssue({ code: "custom", message: "correctOptionIds must contain three distinct ids" });
      }
    }

    if (chapter.mainVerse.rightsStatus === "reference-only") {
      if (chapter.mainVerse.text !== null) {
        ctx.addIssue({
          code: "custom",
          message: "reference-only main verse must not carry Bible text",
        });
      }
      if (chapter.mainVerse.attribution !== null) {
        ctx.addIssue({
          code: "custom",
          message: "reference-only main verse must not claim an attribution",
        });
      }
    }
    if (chapter.mainVerse.rightsStatus === "licensed") {
      if (!chapter.mainVerse.text || !chapter.mainVerse.translationId || !chapter.mainVerse.attribution) {
        ctx.addIssue({
          code: "custom",
          message: "licensed main verse requires text, translationId and attribution",
        });
      }
    }
  });

export type Block = z.infer<typeof blockSchema>;
export type Section = z.infer<typeof sectionSchema>;
export type Checkpoint = z.infer<typeof checkpointSchema>;
export type CheckpointOption = z.infer<typeof checkpointOptionSchema>;
export type Reflection = z.infer<typeof reflectionSchema>;
export type Source = z.infer<typeof sourceSchema>;
export type Chapter = z.infer<typeof chapterSchema>;
