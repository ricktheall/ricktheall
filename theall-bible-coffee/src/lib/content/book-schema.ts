import { z } from "zod";

import { continuityModeSchema, primaryGenreSchema } from "./genre";

/**
 * Book-level editorial metadata, stored per book at
 * `content/books/<book-id>/th/book.json`.
 *
 * This is deliberately separate from `lib/books/canon.ts`:
 *
 *   canon.ts   canonical facts — order, code, names, chapter count. Client-safe,
 *              never edited by an editor, identical for every publisher.
 *   book.json  editorial experience — overview, movements, story units. Written
 *              by an editor, reviewed, and versioned like any other content.
 *
 * Mixing the two would put editorial prose in the client bundle for all 66
 * books and make canonical facts subject to editorial review.
 */

const line = z.string().trim().min(1);

/** A literary unit inside a movement, e.g. Genesis 6–9, the flood. */
export const storyUnitSchema = z.object({
  id: line,
  title: line,
  /** Inclusive chapter range. */
  fromChapter: z.number().int().positive(),
  toChapter: z.number().int().positive(),
  /** Overrides the book's primaryGenre for these chapters when they differ. */
  continuityMode: continuityModeSchema.optional(),
});

export const movementSchema = z
  .object({
    id: line,
    /** Display order within the book, 1-based. */
    order: z.number().int().positive(),
    title: line,
    subtitle: z.string().trim().optional(),
    fromChapter: z.number().int().positive(),
    toChapter: z.number().int().positive(),
    /**
     * Whether this movement's chapters have prepared lessons. A movement may
     * be listed for orientation while its content is still unwritten — it must
     * never pretend to be ready.
     */
    status: z.enum(["published", "planned"]).default("planned"),
    units: z.array(storyUnitSchema).default([]),
  })
  .superRefine((movement, ctx) => {
    if (movement.toChapter < movement.fromChapter) {
      ctx.addIssue({ code: "custom", message: `${movement.id}: toChapter is before fromChapter` });
    }
    for (const unit of movement.units) {
      if (unit.fromChapter < movement.fromChapter || unit.toChapter > movement.toChapter) {
        ctx.addIssue({ code: "custom", message: `${unit.id}: falls outside its movement` });
      }
    }
  });

export const bookContentSchema = z
  .object({
    schemaVersion: z.literal(1),
    locale: z.literal("th"),
    bookId: line,
    primaryGenre: primaryGenreSchema,
    /** Short orientation shown above the Book Map — not an essay. */
    overview: line,
    whyItMatters: z.string().trim().optional(),
    movements: z.array(movementSchema).default([]),
    sources: z
      .array(z.object({ id: line, label: line, note: z.string().trim().optional() }))
      .default([]),
  })
  .superRefine((book, ctx) => {
    const ids = new Set<string>();
    for (const movement of book.movements) {
      if (ids.has(movement.id)) {
        ctx.addIssue({ code: "custom", message: `Duplicate movement id: ${movement.id}` });
      }
      ids.add(movement.id);
    }
  });

export type StoryUnit = z.infer<typeof storyUnitSchema>;
export type Movement = z.infer<typeof movementSchema>;
export type BookContent = z.infer<typeof bookContentSchema>;

/** The movement a chapter belongs to, or null when the book has no map yet. */
export function movementForChapter(book: BookContent, chapterNumber: number): Movement | null {
  return (
    book.movements.find(
      (movement) => chapterNumber >= movement.fromChapter && chapterNumber <= movement.toChapter,
    ) ?? null
  );
}
