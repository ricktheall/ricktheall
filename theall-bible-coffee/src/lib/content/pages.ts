import type { Chapter, Section } from "./schema";

/**
 * A chapter is read as a short sequence of pages rather than one long scroll.
 *
 * The sequence is *derived* from the section kinds a chapter already declares —
 * there is no page list in the content files. Two consequences follow, and both
 * are the reason it is built this way:
 *
 *   1. Adding a chapter never means describing its pages. Write the sections,
 *      and the shape appears.
 *   2. A chapter that has nothing to say in a stage simply has no page for it,
 *      instead of an empty page with a heading over it.
 */

export type PageId = "scripture" | "story" | "brew" | "big" | "live" | "close";

interface PageDefinition {
  id: PageId;
  /** Roman-numbered label shown above the title, e.g. "02 · STORY + CONTEXT". */
  label: string;
  title: string;
  lead: string;
  kinds: readonly Section["kind"][];
}

const PAGE_DEFINITIONS: readonly PageDefinition[] = [
  {
    id: "scripture",
    label: "SCRIPTURE FIRST",
    title: "พระคำมาก่อน",
    lead: "อ่านตัวบทก่อน แล้วค่อยฟังคำอธิบาย",
    kinds: ["main-verse"],
  },
  {
    id: "story",
    label: "STORY + CONTEXT",
    title: "เรื่องจริงในโลกของพระคำ",
    lead: "ฟังคำถามของวันนี้ แล้วกลับไปฟังโลกที่ได้ยินเรื่องนี้ครั้งแรก",
    kinds: ["story", "research", "context"],
  },
  {
    id: "brew",
    label: "DEEP BREW",
    title: "ชงเข้ม แก่นของบท",
    lead: "บทนี้กำลังพูดอะไร และพูดอย่างไร",
    kinds: ["outline", "explanation", "metaphor", "teaching"],
  },
  {
    id: "big",
    label: "BIG STORY",
    title: "ภาพใหญ่ทั้งพระคัมภีร์",
    lead: "ตอนนี้อยู่ตรงไหนของเรื่องที่เดินจากปฐมกาลถึงวิวรณ์",
    kinds: ["christ", "eternal", "connections"],
  },
  {
    id: "live",
    label: "LIVE IT",
    title: "จากความรู้ สู่ชีวิต",
    lead: "รู้แล้วให้ลงมือ และลงมือแล้วให้ส่งต่อ",
    kinds: ["application", "share"],
  },
  {
    id: "close",
    label: "COFFEE CHECK",
    title: "ปิดถ้วยนี้",
    lead: "จับแก่นให้ได้ ไม่ใช่จำทุกคำ",
    kinds: [],
  },
];

export interface ChapterPage {
  id: PageId;
  /** 1-based position in the sequence this chapter actually produced. */
  step: number;
  label: string;
  title: string;
  lead: string;
  sections: readonly Section[];
  /** One line that carries the page on its own, for readers who stop here. */
  tldr: string | null;
  /** The one sentence worth sitting with — shown beside the page as "หยุดคิด". */
  pause: string | null;
}

/** First paragraph or list item on the page, used when nothing better exists. */
function firstProse(sections: readonly Section[]): string | null {
  for (const section of sections) {
    for (const block of section.blocks) {
      if (block.type === "paragraph") return block.text;
      if (block.type === "list" && block.items[0] !== undefined) return block.items[0];
      if (block.type === "callout") return block.text;
    }
  }
  return null;
}

/**
 * The sentence the page wants the reader to sit with: an author-marked
 * emphasis paragraph if there is one, otherwise a callout.
 */
function pauseLine(sections: readonly Section[]): string | null {
  for (const section of sections) {
    for (const block of section.blocks) {
      if (block.type === "paragraph" && block.emphasis === true) return block.text;
    }
  }
  for (const section of sections) {
    for (const block of section.blocks) {
      if (block.type === "callout") return block.text;
    }
  }
  return null;
}

function tldrFor(page: PageDefinition, chapter: Chapter, sections: readonly Section[]): string | null {
  const summary = chapter.sixtySecondSummary;
  switch (page.id) {
    case "scripture":
      return summary?.whatHappened ?? chapter.summary;
    case "brew":
      return summary?.bigIdea ?? firstProse(sections);
    case "big":
      return summary?.wholeBibleDirection ?? firstProse(sections);
    case "close":
      return chapter.completion?.centralTruth ?? summary?.whatWeSeeAboutGod ?? null;
    default:
      return firstProse(sections);
  }
}

/**
 * Builds the pages this chapter actually has.
 *
 * `close` is always present — a chapter must have an ending even when it
 * carries no checkpoint, because finishing is the thing being recorded.
 */
export function buildChapterPages(chapter: Chapter): ChapterPage[] {
  const pages: ChapterPage[] = [];
  const claimed = new Set(PAGE_DEFINITIONS.flatMap((page) => page.kinds));

  for (const definition of PAGE_DEFINITIONS) {
    const sections = chapter.sections.filter(
      (section) =>
        definition.kinds.includes(section.kind) ||
        // A kind no page claims still has to be read somewhere, and Deep Brew
        // is where explanation belongs. Content never disappears silently.
        (definition.id === "brew" && !claimed.has(section.kind)),
    );

    const hasOwnContent =
      definition.id === "close" ||
      (definition.id === "scripture" && chapter.scripture !== undefined) ||
      sections.length > 0;

    if (!hasOwnContent) continue;

    pages.push({
      id: definition.id,
      step: pages.length + 1,
      label: definition.label,
      title: definition.title,
      lead: definition.lead,
      sections,
      tldr: tldrFor(definition, chapter, sections),
      pause: definition.id === "scripture"
        ? chapter.chapterOrientation ?? pauseLine(sections)
        : pauseLine(sections),
    });
  }

  return pages;
}
