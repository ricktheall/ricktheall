"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { BlockRenderer } from "@/components/reader/blocks";
import { ReflectionForm } from "@/components/reader/reflection-form";
import { ScripturePanel } from "@/components/reader/scripture-panel";
import { ThreeWordsCheck } from "@/components/reader/three-words-check";
import { chapterKeyFor, type BibleBook } from "@/lib/books/canon";
import { track } from "@/lib/analytics/events";
import { CONTINUITY_FIELDS, CONTINUITY_LABELS_TH, type Continuity } from "@/lib/content/genre";
import { buildChapterPages, type ChapterPage } from "@/lib/content/pages";
import type { Chapter } from "@/lib/content/schema";
import { isChapterRead } from "@/lib/progress/logic";
import { useProgress } from "@/lib/progress/provider";

interface ChapterFlowProps {
  book: BibleBook;
  chapter: Chapter;
  nextChapter: number | null;
}

/**
 * One chapter, read as a short sequence of pages.
 *
 * Two rules govern everything here, and both are deliberate refusals:
 *
 *   Scripture is never behind a page turn. The text is page one, and its
 *   reference stays beside the reader on every page after that.
 *
 *   Nothing is scored. There is no point value, no mastery percentage and no
 *   streak — reading a chapter is a declaration, not an exam. Progress is
 *   shown as pages visited, and the cup turning over when the chapter is done.
 */
export function ChapterFlow({ book, chapter, nextChapter }: ChapterFlowProps) {
  const chapterKey = chapterKeyFor(book.id, chapter.chapterNumber);
  const { chapter: chapterProgress, markChapterRead, hydrated } = useProgress();

  const pages = useMemo(() => buildChapterPages(chapter), [chapter]);
  const [step, setStep] = useState(1);
  const [furthest, setFurthest] = useState(1);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const movedRef = useRef(false);

  const page = pages[step - 1] ?? pages[0];
  const read = hydrated && isChapterRead(chapterProgress(chapterKey));
  const last = step === pages.length;

  useEffect(() => {
    track({ name: "chapter_started", bookId: book.id, chapter: chapter.chapterNumber });
    track({ name: "scripture_reached", bookId: book.id, chapter: chapter.chapterNumber });
  }, [book.id, chapter.chapterNumber]);

  /* Focus the new page's heading, but only after a real page turn — moving
   * focus on first paint would steal it from the reader before they began. */
  useEffect(() => {
    if (!movedRef.current) return;
    headingRef.current?.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const goTo = (next: number) => {
    if (next < 1 || next > pages.length) return;
    movedRef.current = true;
    setStep(next);
    setFurthest((current) => Math.max(current, next));
  };

  const finish = () => {
    markChapterRead(chapterKey);
    track({ name: "chapter_read", bookId: book.id, chapter: chapter.chapterNumber });
  };

  if (page === undefined) return null;

  return (
    <article className="mx-auto w-full max-w-3xl px-4 pb-28 pt-6">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <Link
          href={`/th/books/${book.id}`}
          className="text-[0.85rem] text-[var(--foreground-muted)] underline-offset-4 hover:text-[var(--accent)] hover:underline"
        >
          ← {book.nameTh}
        </Link>
        <p className="text-[0.75rem] text-[var(--foreground-subtle)]">
          บทที่ {chapter.chapterNumber} / {book.chapterCount} · {pages.length} หน้า
        </p>
      </header>

      <section
        aria-labelledby="page-title"
        className="mt-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-8"
      >
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          {String(page.step).padStart(2, "0")} · {page.label}
        </p>
        <h1
          id="page-title"
          ref={headingRef}
          tabIndex={-1}
          className="mt-3 font-serif text-[1.6rem] font-semibold leading-[1.35] tracking-tight outline-none sm:text-[2rem]"
        >
          {page.id === "scripture" ? chapter.title : page.title}
        </h1>
        <p className="mt-2 text-[0.92rem] leading-relaxed text-[var(--foreground-muted)]">
          {page.id === "scripture" ? chapter.summary : page.lead}
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-4">
            {page.tldr !== null && (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-5">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[var(--foreground-subtle)]">
                  TL;DR · แก่นหน้านี้
                </p>
                <p className="reading-text mt-2 font-medium text-[var(--foreground)]">{page.tldr}</p>
              </div>
            )}
            <PageBody
              book={book}
              chapter={chapter}
              page={page}
              onFinish={finish}
              read={read}
              nextChapter={nextChapter}
            />
          </div>

          <aside className="flex flex-col gap-4">
            <ScriptureCard chapter={chapter} onOpen={() => goTo(1)} atScripture={page.id === "scripture"} />
            {page.pause !== null && (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-5">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
                  หยุดคิด
                </p>
                <p className="mt-2 text-[0.88rem] leading-relaxed text-[var(--foreground-muted)]">
                  {page.pause}
                </p>
              </div>
            )}
          </aside>
        </div>

        {!last && (
          <button
            type="button"
            onClick={() => goTo(step + 1)}
            className="mt-7 flex min-h-13 w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 text-[0.95rem] font-semibold text-[var(--accent-foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
          >
            ดื่มหน้านี้แล้ว · ไปต่อ <span aria-hidden="true">→</span>
          </button>
        )}
      </section>

      <PageDots pages={pages} step={step} furthest={furthest} onGo={goTo} />

      {chapter.sources.length > 0 && (
        <details className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-5">
          <summary className="cursor-pointer text-[0.88rem] font-semibold">
            แหล่งอ้างอิงและการตรวจสอบ
          </summary>
          <ul className="mt-4 flex flex-col gap-3">
            {chapter.sources.map((source) => (
              <li key={source.id} className="text-[0.82rem] leading-relaxed">
                <p className="font-medium">{source.label}</p>
                <p className="text-[var(--foreground-muted)]">{source.detail}</p>
                <p className="mt-1 text-[var(--foreground-subtle)]">
                  {source.status === "verified"
                    ? "✓ ตรวจสอบแหล่งที่มาแล้ว"
                    : "⚠ ยังไม่ได้ตรวจสอบแหล่งที่มา — ยังไม่ควรเผยแพร่"}
                </p>
              </li>
            ))}
          </ul>
        </details>
      )}
    </article>
  );
}

/** The body of one page. Only `close` is special; the rest render their sections. */
function PageBody({
  book,
  chapter,
  page,
  read,
  onFinish,
  nextChapter,
}: {
  book: BibleBook;
  chapter: Chapter;
  page: ChapterPage;
  read: boolean;
  onFinish: () => void;
  nextChapter: number | null;
}) {
  if (page.id === "scripture") {
    return (
      <div className="flex flex-col gap-6">
        {chapter.scripture !== undefined && <ScripturePanel scripture={chapter.scripture} />}
        {chapter.continuity !== undefined && <ContinuityPanel continuity={chapter.continuity} />}
      </div>
    );
  }

  if (page.id === "close") {
    return (
      <ClosingPage
        book={book}
        chapter={chapter}
        read={read}
        onFinish={onFinish}
        nextChapter={nextChapter}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionStack page={page} />
      {page.id === "live" && chapter.response !== undefined && (
        <MicroResponse
          bookId={book.id}
          chapterNumber={chapter.chapterNumber}
          prompt={chapter.response.prompt}
          options={chapter.response.options}
        />
      )}
    </div>
  );
}

/** One tap, ten seconds, no score. Three questions a chapter is homework. */
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
    <section
      aria-labelledby="response-heading"
      className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-5"
    >
      <h2 id="response-heading" className="font-serif text-[1.02rem] font-semibold">
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
                track({
                  name: "response_completed",
                  bookId,
                  chapter: chapterNumber,
                  optionId: option.id,
                });
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
        <p role="status" className="mt-4 text-[0.82rem] text-[var(--foreground-subtle)]">
          บันทึกไว้แล้ว — ไม่มีคะแนน ไม่มีการตัดสิน
        </p>
      )}
    </section>
  );
}

/**
 * Full text, opened in place rather than in a modal — a reader who wants the
 * whole thing should not have to fight a dialog to keep it open.
 */
function SectionStack({ page }: { page: ChapterPage }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="min-h-11 rounded-full border border-[var(--border-strong)] px-5 text-[0.88rem] font-medium hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
      >
        {open ? "ย่อกลับ" : "อ่านฉบับเต็มของหน้านี้"}
      </button>

      {open && (
        <div className="mt-5 flex flex-col gap-8 border-l-2 border-[var(--accent-soft)] pl-5">
          {page.sections.map((section) => (
            <section key={section.id} aria-labelledby={section.id}>
              <h2 id={section.id} className="font-serif text-[1.1rem] font-semibold tracking-tight">
                {section.title}
              </h2>
              <div className="mt-3">
                {section.blocks.map((block, index) => (
                  <BlockRenderer key={index} block={block} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function ClosingPage({
  book,
  chapter,
  read,
  onFinish,
  nextChapter,
}: {
  book: BibleBook;
  chapter: Chapter;
  read: boolean;
  onFinish: () => void;
  nextChapter: number | null;
}) {
  const { checkpoint, reflection, completion } = chapter;

  return (
    <div className="flex flex-col gap-6">
      {/* Practice, never a gate: the three words can be skipped, getting them
       * wrong costs nothing, and neither outcome unlocks or blocks anything.
       * Reading the chapter is the thing recorded — hence the empty handlers. */}
      {checkpoint !== null && (
        <ThreeWordsCheck checkpoint={checkpoint} onPassed={() => {}} onReview={() => {}} />
      )}

      {reflection !== null && <ReflectionForm reflection={reflection} onCompleted={onFinish} />}

      {read ? (
        <div className="rounded-2xl border border-[var(--accent)] bg-[var(--surface-muted)] p-6 text-center">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            ถ้วยหมดแล้ว · ใจเต็มแล้ว
          </p>
          <h2 className="mt-2 font-serif text-[1.25rem] font-semibold leading-snug">
            {completion?.title ?? `ชง${book.nameTh} ${chapter.chapterNumber} เสร็จแล้ว`}
          </h2>
          {completion !== null && (
            <p className="reading-text mt-3 text-[var(--foreground-muted)]">
              {completion.centralTruth}
            </p>
          )}
          <p className="mt-4 flex items-center justify-center gap-2 text-[0.9rem] font-medium text-[var(--accent)]">
            <span aria-hidden="true">✓</span> บันทึกไว้ในการเดินทางของคุณแล้ว
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={onFinish}
          className="flex min-h-13 w-full items-center justify-center rounded-full bg-[var(--primary)] px-6 text-[0.95rem] font-semibold text-[var(--primary-foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
        >
          ฉันอ่านบทนี้จบแล้ว
        </button>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {nextChapter !== null && (
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
            className="flex min-h-12 flex-1 items-center justify-center rounded-full border border-[var(--accent)] px-6 text-[0.92rem] font-semibold text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
          >
            ชงบทที่ {nextChapter} ต่อ →
          </Link>
        )}
        <Link
          href={`/th/books/${book.id}`}
          className="text-[0.85rem] text-[var(--foreground-muted)] underline underline-offset-4 hover:text-[var(--accent)]"
        >
          กลับไปดูแผนที่ของเล่ม
        </Link>
      </div>
    </div>
  );
}

/** Scripture stays one tap away from every page, never buried. */
function ScriptureCard({
  chapter,
  onOpen,
  atScripture,
}: {
  chapter: Chapter;
  onOpen: () => void;
  atScripture: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[var(--accent)] bg-[var(--accent-soft)] p-5">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
        พระคัมภีร์ · แตะอ่านได้เลย
      </p>
      <p className="mt-2 font-serif text-[1.05rem] font-semibold">
        {chapter.mainVerse.reference}
      </p>
      {!atScripture && (
        <button
          type="button"
          onClick={onOpen}
          className="mt-2 text-[0.82rem] font-medium text-[var(--accent)] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
        >
          กลับไปอ่านพระคำ ↑
        </button>
      )}
    </div>
  );
}

/**
 * Progress, without a score.
 *
 * A dot's state is carried by its glyph and its accessible name as well as by
 * colour, so "อ่านแล้ว" survives greyscale, low contrast and a screen reader.
 */
function PageDots({
  pages,
  step,
  furthest,
  onGo,
}: {
  pages: readonly ChapterPage[];
  step: number;
  furthest: number;
  onGo: (next: number) => void;
}) {
  return (
    <nav aria-label="หน้าในบทนี้" className="mt-6">
      <ol className="flex flex-wrap items-center justify-center gap-2">
        {pages.map((page) => {
          const done = page.step < furthest;
          const current = page.step === step;
          return (
            <li key={page.id}>
              <button
                type="button"
                onClick={() => onGo(page.step)}
                aria-current={current ? "step" : undefined}
                aria-label={`หน้า ${page.step} · ${page.title}${done ? " · อ่านแล้ว" : ""}`}
                className={
                  current
                    ? "flex size-10 items-center justify-center rounded-full bg-[var(--accent)] text-[0.85rem] font-semibold text-[var(--accent-foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
                    : done
                      ? "flex size-10 items-center justify-center rounded-full border border-[var(--accent)] text-[0.85rem] font-semibold text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
                      : "flex size-10 items-center justify-center rounded-full border border-[var(--border-strong)] text-[0.85rem] text-[var(--foreground-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
                }
              >
                <span aria-hidden="true">{done ? "✓" : page.step}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-center text-[0.78rem] text-[var(--foreground-subtle)]">
        ไม่มีคะแนน ไม่มีการจับเวลา — อ่านตามจังหวะของคุณ
      </p>
    </nav>
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
    <section aria-labelledby="continuity-heading">
      <h2 id="continuity-heading" className="sr-only">
        เรื่องนี้อยู่ตรงไหน
      </h2>
      <ol className="flex flex-col gap-5">
        {fields.map((field) => (
          <li key={field} className="border-l-2 border-[var(--accent-soft)] pl-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              {CONTINUITY_LABELS_TH[field] ?? field}
            </p>
            <p className="mt-1 text-[0.9rem] leading-relaxed">{values[field]}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
