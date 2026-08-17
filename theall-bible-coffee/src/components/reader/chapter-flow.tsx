"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ScripturePanel } from "@/components/reader/scripture-panel";
import { chapterKeyFor, type BibleBook } from "@/lib/books/canon";
import { track } from "@/lib/analytics/events";
import { CONTINUITY_FIELDS, CONTINUITY_LABELS_TH, type Continuity } from "@/lib/content/genre";
import type { Chapter } from "@/lib/content/schema";
import { isChapterRead } from "@/lib/progress/logic";
import { useProgress } from "@/lib/progress/provider";

interface ChapterFlowProps {
  book: BibleBook;
  chapter: Chapter;
  nextChapter: number | null;
}

/**
 * The Scripture-first chapter experience.
 *
 * Order matters and is the whole point: Scripture, then a short orientation,
 * then where this sits in the story, then one small response, then continue.
 * Deep Brew is depth for whoever wants it — never a gate in front of the text.
 */
export function ChapterFlow({ book, chapter, nextChapter }: ChapterFlowProps) {
  const chapterKey = chapterKeyFor(book.id, chapter.chapterNumber);
  const { chapter: chapterProgress, markChapterRead, hydrated } = useProgress();
  const [deepBrewOpen, setDeepBrewOpen] = useState(false);

  const read = hydrated && isChapterRead(chapterProgress(chapterKey));

  useEffect(() => {
    track({ name: "chapter_started", bookId: book.id, chapter: chapter.chapterNumber });
    track({ name: "scripture_reached", bookId: book.id, chapter: chapter.chapterNumber });
  }, [book.id, chapter.chapterNumber]);

  const onRead = () => {
    markChapterRead(chapterKey);
    track({ name: "chapter_read", bookId: book.id, chapter: chapter.chapterNumber });
  };

  return (
    <article className="mx-auto w-full max-w-2xl px-4 pb-20 pt-8">
      <p className="text-[0.75rem] font-medium tracking-wide text-[var(--accent)]">
        {book.nameTh} · บทที่ {chapter.chapterNumber} / {book.chapterCount}
      </p>
      <h1 className="mt-2 font-serif text-[1.55rem] font-semibold leading-[1.45] tracking-tight">
        {chapter.title}
      </h1>
      {chapter.chapterOrientation !== undefined && (
        <p className="mt-3 text-[0.95rem] text-[var(--foreground-muted)]">
          {chapter.chapterOrientation}
        </p>
      )}

      {/* 1 · Scripture */}
      {chapter.scripture !== undefined && <ScripturePanel scripture={chapter.scripture} />}

      {/* 2 · Sixty seconds */}
      {chapter.sixtySecondSummary !== undefined && (
        <section aria-labelledby="summary-heading" className="mt-10">
          <h2 id="summary-heading" className="font-serif text-[1.15rem] font-semibold">
            บทนี้ใน 60 วินาที
          </h2>
          <dl className="mt-4 flex flex-col gap-4">
            <SummaryRow label="เกิดอะไรขึ้น" value={chapter.sixtySecondSummary.whatHappened} />
            <SummaryRow label="ใจความใหญ่คืออะไร" value={chapter.sixtySecondSummary.bigIdea} />
            <SummaryRow
              label="เราเห็นอะไรเกี่ยวกับพระเจ้า"
              value={chapter.sixtySecondSummary.whatWeSeeAboutGod}
            />
            <SummaryRow
              label="เรื่องใหญ่กำลังไปทางไหน"
              value={chapter.sixtySecondSummary.wholeBibleDirection}
            />
          </dl>
        </section>
      )}

      {/* 3 · Where this sits in the story, in the shape its genre calls for */}
      {chapter.continuity !== undefined && <ContinuityPanel continuity={chapter.continuity} />}

      {/* 4 · One small response */}
      {chapter.response !== undefined && (
        <MicroResponse
          bookId={book.id}
          chapterNumber={chapter.chapterNumber}
          prompt={chapter.response.prompt}
          options={chapter.response.options}
        />
      )}

      {/* 5 · Read — no quiz, no reflection required */}
      <section className="mt-10 border-t border-[var(--border)] pt-6">
        {read ? (
          <p className="flex items-center gap-2 text-[0.95rem] font-medium text-[var(--accent)]">
            <span aria-hidden="true">✓</span> คุณอ่านบทนี้จบแล้ว
          </p>
        ) : (
          <button
            type="button"
            onClick={onRead}
            className="flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--primary)] px-6 text-[0.95rem] font-semibold text-[var(--primary-foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
          >
            ฉันอ่านบทนี้จบแล้ว
          </button>
        )}

        {/* 6 · Continue — never a dead end */}
        <div className="mt-4 flex flex-wrap items-center gap-4">
          {nextChapter !== null ? (
            <Link
              href={`/th/books/${book.id}/${nextChapter}`}
              prefetch
              onClick={() =>
                track({
                  name: "next_chapter_clicked",
                  bookId: book.id,
                  fromChapter: chapter.chapterNumber,
                  toChapter: nextChapter,
                })
              }
              className="flex min-h-12 flex-1 items-center justify-center rounded-full border border-[var(--accent)] px-6 text-[0.95rem] font-semibold text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
            >
              อ่านบทต่อไป →
            </Link>
          ) : null}
          <Link
            href={`/th/books/${book.id}`}
            className="text-[0.88rem] text-[var(--foreground-muted)] underline underline-offset-4 hover:text-[var(--accent)]"
          >
            กลับไปดูแผนที่ของเล่ม
          </Link>
        </div>
      </section>

      {/* 7 · Deep Brew — optional depth, behind the reader's own choice */}
      {chapter.sections.length > 0 && (
        <section className="mt-10">
          <button
            type="button"
            aria-expanded={deepBrewOpen}
            onClick={() => {
              const next = !deepBrewOpen;
              setDeepBrewOpen(next);
              if (next) {
                track({ name: "deep_brew_opened", bookId: book.id, chapter: chapter.chapterNumber });
              }
            }}
            className="min-h-11 rounded-full border border-[var(--border)] px-5 text-[0.88rem] text-[var(--foreground-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
          >
            {deepBrewOpen ? "ปิดชงเข้ม" : "☕ ชงเข้ม — อยากลงลึกกว่านี้"}
          </button>
          {deepBrewOpen && (
            <div className="mt-5 flex flex-col gap-6 border-l-2 border-[var(--accent)] pl-5">
              {chapter.sections.map((section) => (
                <div key={section.id}>
                  <h3 className="font-serif text-[1.05rem] font-semibold">{section.title}</h3>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </article>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
        {label}
      </dt>
      <dd className="mt-1 text-[0.95rem] leading-relaxed text-[var(--foreground-muted)]">{value}</dd>
    </div>
  );
}

/**
 * Renders whatever shape the chapter's genre actually uses. The field list
 * comes from the schema, so a psalm renders voice/turn/response and a genealogy
 * renders its own three — no component here knows about before/now/next.
 */
function ContinuityPanel({ continuity }: { continuity: Continuity }) {
  const fields = CONTINUITY_FIELDS[continuity.mode];
  const values = continuity as unknown as Record<string, string>;

  return (
    <section aria-labelledby="continuity-heading" className="mt-10">
      <h2 id="continuity-heading" className="sr-only">
        เรื่องนี้อยู่ตรงไหน
      </h2>
      <ol className="flex flex-col gap-5">
        {fields.map((field) => (
          <li key={field} className="border-l-2 border-[var(--accent-soft)] pl-4">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
              {CONTINUITY_LABELS_TH[field] ?? field}
            </p>
            <p className="mt-1 text-[0.95rem] leading-relaxed">{values[field]}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function MicroResponse({
  bookId,
  chapterNumber,
  prompt,
  options,
}: {
  bookId: string;
  chapterNumber: number;
  prompt: string;
  options: readonly { id: string; label: string }[];
}) {
  const [chosen, setChosen] = useState<string | null>(null);

  return (
    <section aria-labelledby="response-heading" className="mt-10 rounded-xl bg-[var(--surface-muted)] p-5">
      <h2 id="response-heading" className="font-serif text-[1.05rem] font-semibold">
        {prompt}
      </h2>
      <ul className="mt-4 flex flex-wrap gap-2">
        {options.map((option) => (
          <li key={option.id}>
            <button
              type="button"
              aria-pressed={chosen === option.id}
              onClick={() => {
                setChosen(option.id);
                track({ name: "response_completed", bookId, chapter: chapterNumber, optionId: option.id });
              }}
              className={
                chosen === option.id
                  ? "min-h-11 rounded-full border border-[var(--accent)] bg-[var(--accent)] px-5 text-[0.9rem] font-semibold text-[var(--accent-foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
                  : "min-h-11 rounded-full border border-[var(--border-strong)] px-5 text-[0.9rem] text-[var(--foreground-muted)] hover:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
              }
            >
              {option.label}
            </button>
          </li>
        ))}
      </ul>
      {chosen !== null && (
        <p role="status" className="mt-4 text-[0.85rem] text-[var(--foreground-subtle)]">
          บันทึกไว้แล้ว — ไม่มีคะแนน ไม่มีการตัดสิน
        </p>
      )}
    </section>
  );
}
