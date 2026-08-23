"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CoffeeCup } from "@/components/coffee-cup";
import { BlockRenderer } from "@/components/reader/blocks";
import { ChapterEnding } from "@/components/reader/chapter-ending";
import { ReadAloudBar } from "@/components/reader/read-aloud-bar";
import { SectionOutline } from "@/components/reader/section-outline";
import { Button } from "@/components/ui/button";
import type { BookEntry } from "@/lib/content/books";
import { chapterKey } from "@/lib/content/books";
import type { Chapter } from "@/lib/content/schema";
import { computeCupPercent, computePoints } from "@/lib/progress/logic";
import { useProgress } from "@/lib/progress/provider";
import { MAX_READING_PERCENT } from "@/lib/progress/schema";
import { collectPassages, useReadAloud, type SpeechPassage } from "@/lib/speech/use-read-aloud";

const CHECKPOINT_ANCHOR = "chapter-end";

/** Stable per-block DOM id, used as both scroll and speech anchor. */
function blockAnchor(sectionId: string, index: number): string {
  return `${sectionId}-b${index}`;
}

export function ChapterReader({ chapter, book }: { chapter: Chapter; book: BookEntry }) {
  const key = chapterKey(chapter.bookId, chapter.chapterNumber);
  const {
    chapter: chapterProgress,
    entryChapter,
    hydrated,
    reportReadingPercent,
    reportSection,
    state,
    setSpeechRate,
  } = useProgress();

  const progress = chapterProgress(key);
  const cupPercent = computeCupPercent(progress);
  const points = computePoints(progress);

  const articleRef = useRef<HTMLDivElement>(null);
  const [resumeDismissed, setResumeDismissed] = useState(false);
  const [passages, setPassages] = useState<SpeechPassage[]>([]);

  const entry = entryChapter(key);
  const canResume =
    hydrated &&
    !resumeDismissed &&
    !entry.chapterCompleted &&
    entry.maxReadingPercent > 2 &&
    entry.lastSectionId !== null;
  const resumeSection = canResume
    ? chapter.sections.find((section) => section.id === entry.lastSectionId)
    : undefined;

  const speech = useReadAloud({ passages, rate: state.preferences.speechRate });
  const speakingId = passages[speech.currentIndex]?.elementId ?? null;

  // Gather speech passages once the chapter markup exists.
  useEffect(() => {
    if (!hydrated) return;
    setPassages(collectPassages(articleRef.current));
  }, [chapter.sections, hydrated]);

  // Keep the spoken passage on screen while listening.
  useEffect(() => {
    if (!speakingId || speech.status !== "speaking") return;
    document.getElementById(speakingId)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [speakingId, speech.status]);

  // Scroll → reading percent (0–90), reported as whole numbers.
  useEffect(() => {
    if (!hydrated) return;
    let frame = 0;

    const measure = () => {
      frame = 0;
      const element = articleRef.current;
      if (!element) return;
      const scrollable = element.offsetHeight - window.innerHeight * 0.9;
      const scrolled = window.scrollY - element.offsetTop;
      const ratio = scrollable <= 0 ? 1 : scrolled / scrollable;
      const percent = Math.round(Math.min(Math.max(ratio, 0), 1) * MAX_READING_PERCENT);
      reportReadingPercent(key, percent);
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [hydrated, key, reportReadingPercent]);

  // Track the section at the top of the viewport, for resume.
  useEffect(() => {
    if (!hydrated || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((item) => item.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible?.target.id) reportSection(key, visible.target.id);
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 },
    );
    for (const section of chapter.sections) {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [chapter.sections, hydrated, key, reportSection]);

  const scrollToSection = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "start" });
    element.focus({ preventScroll: true });
  }, []);

  const explanationId = useMemo(
    () => chapter.sections.find((section) => section.kind === "explanation")?.id ?? null,
    [chapter.sections],
  );

  return (
    <div className="pb-24">
      {/* Sticky, unobtrusive progress rail */}
      <div className="sticky top-[3.4rem] z-30 border-b border-[var(--border)] bg-[var(--background)]">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-2">
          <div className="flex items-center gap-4">
            <CoffeeCup percent={hydrated ? cupPercent : 0} size="compact" />
            <span className="text-xs tabular-nums text-[var(--foreground-subtle)]">
              {hydrated ? points : 0} แต้ม
            </span>
          </div>
          <SectionOutline
            sections={chapter.sections}
            onNavigate={scrollToSection}
            checkpointAnchor={CHECKPOINT_ANCHOR}
          />
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl px-4">
        <nav aria-label="เส้นทางหน้า" className="mt-6 text-sm">
          <Link
            href={`/th/books/${book.id}`}
            className="text-[var(--foreground-subtle)] underline underline-offset-4"
          >
            ← กลับไปหน้าภาพรวม{book.titleTh}
          </Link>
        </nav>

        <header className="mt-8">
          <p className="label">
            {book.titleTh} · บทที่ {chapter.chapterNumber}
          </p>
          <h1 className="font-display mt-4 text-[1.75rem] font-semibold leading-[1.4] sm:text-[2.6rem]">
            {chapter.title}
          </h1>
          <p className="mt-4 text-sm text-[var(--foreground-subtle)]">
            ใช้เวลาอ่านประมาณ {chapter.estimatedMinutes} นาที · เก็บได้สูงสุด 100 แต้ม
          </p>
        </header>

        <hr className="rule-gold mt-8" />

        {chapter.status !== "final" ? (
          <p className="mt-6 rounded-sm border border-dashed border-[var(--border-strong)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--foreground-muted)]">
            <strong className="font-semibold">เนื้อหาฉบับร่าง</strong> — บทนี้ยังอยู่ระหว่างการเขียนและตรวจทาน
            บางส่วนเป็นข้อความชั่วคราวเพื่อทดสอบหน้าจอ และยังไม่ควรใช้อ้างอิงในการสอน
          </p>
        ) : null}

        <ReadAloudBar
          status={speech.status}
          rate={state.preferences.speechRate}
          onStart={() => speech.start(0)}
          onPause={speech.pause}
          onResume={speech.resume}
          onStop={speech.stop}
          onNext={speech.next}
          onPrevious={speech.previous}
          onRateChange={setSpeechRate}
        />

        {resumeSection ? (
          <div
            role="status"
            className="mt-6 flex flex-col gap-3 rounded-sm border border-[var(--border-strong)] bg-[var(--surface)] p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="text-sm text-[var(--foreground-muted)]">
              คุณอ่านค้างไว้ที่ “{resumeSection.title}”
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  scrollToSection(resumeSection.id);
                  setResumeDismissed(true);
                }}
              >
                อ่านต่อจากเดิม
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setResumeDismissed(true)}>
                เริ่มจากต้นบท
              </Button>
            </div>
          </div>
        ) : null}

        <div ref={articleRef} className="mt-12">
          {chapter.sections.map((section, sectionIndex) => (
            <section
              key={section.id}
              id={section.id}
              tabIndex={-1}
              aria-labelledby={`${section.id}-title`}
              className="scroll-mt-36 pt-12 first:pt-0"
            >
              {sectionIndex > 0 ? <hr className="rule-gold mb-12" /> : null}
              <h2
                id={`${section.id}-title`}
                className="font-display px-1 text-[1.7rem] font-semibold sm:text-[2rem]"
              >
                {section.title}
              </h2>
              <div className="mt-7">
                {section.blocks.map((block, index) => (
                  <BlockRenderer
                    key={index}
                    block={block}
                    blockId={blockAnchor(section.id, index)}
                    leading={index === 0 && block.type === "paragraph"}
                    speakingId={speakingId}
                  />
                ))}
              </div>
              {section.sourceIds.length > 0 ? (
                <p className="mt-8 px-1 text-xs text-[var(--foreground-subtle)]">
                  ที่มาอ้างอิง:{" "}
                  {section.sourceIds
                    .map((id) => chapter.sources.find((source) => source.id === id)?.label ?? id)
                    .join(" · ")}
                </p>
              ) : null}
            </section>
          ))}
        </div>

        <div id={CHECKPOINT_ANCHOR} className="scroll-mt-36">
          <ChapterEnding
            chapter={chapter}
            chapterKey={key}
            explanationId={explanationId}
            bookTitle={book.titleTh}
          />
        </div>

        {chapter.sources.length > 0 ? (
          <section aria-labelledby="sources" className="mt-20">
            <hr className="rule-gold mb-8" />
            <h2 id="sources" className="label">
              ที่มาและหมายเหตุ
            </h2>
            <ul className="mt-5 space-y-4">
              {chapter.sources.map((source) => (
                <li key={source.id} className="text-sm text-[var(--foreground-muted)]">
                  <span className="font-medium text-[var(--foreground)]">{source.label}</span>
                  {source.status === "unverified" ? (
                    <span className="ms-2 border border-[var(--border-strong)] px-2 py-0.5 text-[0.65rem] text-[var(--foreground-subtle)]">
                      รอการตรวจสอบ
                    </span>
                  ) : null}
                  <span className="mt-1 block">{source.detail}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
