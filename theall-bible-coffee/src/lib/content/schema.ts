import { z } from "zod";

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
    checkpoint: checkpointSchema,
    reflection: reflectionSchema,
    completion: completionSchema,
    sources: z.array(sourceSchema).default([]),
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
