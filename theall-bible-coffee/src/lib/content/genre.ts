import { z } from "zod";

/**
 * Genre architecture — two levels.
 *
 *   primaryGenre   lives on the book and supplies the default reading model
 *   continuityMode lives on the movement / literary unit / chapter and decides
 *                  what is actually rendered
 *
 * Two levels are necessary because biblical books mix literary forms: Genesis
 * carries narrative, genealogy and poetry inside one book, so a single
 * book-level label would force the wrong shape onto whole chapters.
 *
 * `continuity` is a discriminated union so the content validator rejects a
 * structurally inappropriate shape — a psalm cannot ship `before/now/next` —
 * before it ever reaches a screen.
 */

export const primaryGenreSchema = z.enum([
  "narrative",
  "argument",
  "poetry",
  "wisdom",
  "prophecy",
  "law",
  "apocalyptic",
  "genealogy",
]);

export type PrimaryGenre = z.infer<typeof primaryGenreSchema>;

/** A unit may override its book's genre; the modes are the same vocabulary. */
export const continuityModeSchema = primaryGenreSchema;

const line = z.string().trim().min(1);

/** Narrative: where the story came from, what changed, what is unresolved. */
const narrativeContinuity = z.object({
  mode: z.literal("narrative"),
  before: line,
  now: line,
  next: line,
});

/** Epistle / argument: a claim standing on the previous one. */
const argumentContinuity = z.object({
  mode: z.literal("argument"),
  previousArgument: line,
  presentClaim: line,
  therefore: line,
});

/** Poetry: whose voice, where it turns, what it asks of the reader. */
const poetryContinuity = z.object({
  mode: z.literal("poetry"),
  voice: line,
  turn: line,
  response: line,
});

const wisdomContinuity = z.object({
  mode: z.literal("wisdom"),
  observation: line,
  tension: line,
  practice: line,
});

const prophecyContinuity = z.object({
  mode: z.literal("prophecy"),
  context: line,
  warningOrPromise: line,
  hope: line,
});

const lawContinuity = z.object({
  mode: z.literal("law"),
  covenantContext: line,
  command: line,
  purpose: line,
});

const apocalypticContinuity = z.object({
  mode: z.literal("apocalyptic"),
  vision: line,
  symbolicMovement: line,
  hopeOrWarning: line,
});

/**
 * Genealogy deliberately has no before/now/next. A list of names is not a
 * scene, and pretending otherwise is exactly the narrative-forcing this union
 * exists to prevent.
 */
const genealogyContinuity = z.object({
  mode: z.literal("genealogy"),
  whoIsListed: line,
  whyItMatters: line,
  whereItPoints: line,
});

export const continuitySchema = z.discriminatedUnion("mode", [
  narrativeContinuity,
  argumentContinuity,
  poetryContinuity,
  wisdomContinuity,
  prophecyContinuity,
  lawContinuity,
  apocalypticContinuity,
  genealogyContinuity,
]);

export type Continuity = z.infer<typeof continuitySchema>;
export type ContinuityMode = Continuity["mode"];

/** Field order for rendering, so the UI never hard-codes a mode's shape. */
export const CONTINUITY_FIELDS: Record<ContinuityMode, readonly string[]> = {
  narrative: ["before", "now", "next"],
  argument: ["previousArgument", "presentClaim", "therefore"],
  poetry: ["voice", "turn", "response"],
  wisdom: ["observation", "tension", "practice"],
  prophecy: ["context", "warningOrPromise", "hope"],
  law: ["covenantContext", "command", "purpose"],
  apocalyptic: ["vision", "symbolicMovement", "hopeOrWarning"],
  genealogy: ["whoIsListed", "whyItMatters", "whereItPoints"],
};

/** Thai labels for each continuity slot. */
export const CONTINUITY_LABELS_TH: Record<string, string> = {
  before: "ก่อนหน้า",
  now: "ตอนนี้",
  next: "ต่อไป",
  previousArgument: "เหตุผลก่อนหน้า",
  presentClaim: "ประเด็นตอนนี้",
  therefore: "ดังนั้น",
  voice: "เสียงของผู้เขียน",
  turn: "จุดเปลี่ยน",
  response: "การตอบสนอง",
  observation: "ข้อสังเกต",
  tension: "ความตึงเครียด",
  practice: "การปฏิบัติ",
  context: "บริบท",
  warningOrPromise: "คำเตือน / พระสัญญา",
  hope: "ความหวัง",
  covenantContext: "บริบทพันธสัญญา",
  command: "พระบัญชา",
  purpose: "จุดประสงค์",
  vision: "นิมิต",
  symbolicMovement: "การเคลื่อนเชิงสัญลักษณ์",
  hopeOrWarning: "ความหวัง / คำเตือน",
  whoIsListed: "รายชื่อนี้คือใคร",
  whyItMatters: "ทำไมจึงสำคัญ",
  whereItPoints: "ชี้ไปที่ไหน",
};

/** The continuity mode a book's genre implies when a unit does not override it. */
export function defaultContinuityMode(genre: PrimaryGenre): ContinuityMode {
  return genre;
}
