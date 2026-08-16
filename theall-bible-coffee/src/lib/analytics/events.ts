/**
 * Validation events.
 *
 * No external analytics dependency in this phase — this is the interface the
 * pilot needs, with a sink that can later be pointed at whatever we choose.
 *
 * What we are trying to learn is **qualified voluntary continuation**: of the
 * readers who finish a chapter, how many choose the next one. Not DAU, not
 * time-in-app, not streak length.
 *
 * Events that record where a reader *stopped* matter as much as the ones that
 * record progress: in a pilot of 10–20 people, the readers who do not finish
 * are the larger and more informative group.
 *
 * Nothing here may carry the reader's own words — no prayer, reflection or
 * note text ever becomes an event property.
 */

export type BibleCoffeeEvent =
  | { name: "chapter_started"; bookId: string; chapter: number }
  | { name: "scripture_reached"; bookId: string; chapter: number }
  | { name: "summary_reached"; bookId: string; chapter: number }
  | { name: "deep_brew_opened"; bookId: string; chapter: number }
  | { name: "response_completed"; bookId: string; chapter: number; optionId: string }
  | { name: "chapter_read"; bookId: string; chapter: number }
  | { name: "chapter_completed"; bookId: string; chapter: number }
  | {
      name: "chapter_abandoned";
      bookId: string;
      chapter: number;
      /** How far the reader got before leaving. */
      stage: "before_scripture" | "scripture" | "summary" | "continuity" | "response";
    }
  | { name: "next_chapter_clicked"; bookId: string; fromChapter: number; toChapter: number }
  | { name: "next_chapter_started"; bookId: string; chapter: number }
  | { name: "movement_completed"; bookId: string; movementId: string }
  | { name: "movement_abandoned"; bookId: string; movementId: string; lastChapter: number }
  | { name: "movement_2_requested"; bookId: string; movementId: string }
  | { name: "book_opened"; bookId: string }
  | { name: "movement_opened"; bookId: string; movementId: string }
  | { name: "return_session"; daysSinceLast: number };

export type EventSink = (event: BibleCoffeeEvent) => void;

/** Discards everything. The default, so no build depends on a provider. */
const noopSink: EventSink = () => {};

let sink: EventSink = noopSink;

/** Point events at a real destination. Called once, at app start. */
export function setEventSink(next: EventSink | null): void {
  sink = next ?? noopSink;
}

export function track(event: BibleCoffeeEvent): void {
  try {
    sink(event);
  } catch {
    // Measurement must never break reading.
  }
}
