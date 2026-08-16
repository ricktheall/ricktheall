"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { CoffeeCup } from "@/components/coffee-cup";
import { BlockRenderer } from "@/components/reader/blocks";
import { ChapterEnding } from "@/components/reader/chapter-ending";
import { SectionOutline } from "@/components/reader/section-outline";
import { Button } from "@/components/ui/button";
import { EPHESIANS_1_CHAPTER_KEY } from "@/lib/content/book";
import type { Chapter } from "@/lib/content/schema";
import { computeCupPercent } from "@/lib/progress/logic";
import { useProgress } from "@/lib/progress/provider";
import { MAX_READING_PERCENT } from "@/lib/progress/schema";

const CHECKPOINT_ANCHOR = "ephesians-01-checkpoint";

export function ChapterReader({ chapter }: { chapter: Chapter }) {
  const {
    chapter: chapterProgress,
    entryChapter,
    hydrated,
    reportReadingPercent,
    reportSection,
  } = useProgress();
  const progress = chapterProgress(EPHESIANS_1_CHAPTER_KEY);
  const cupPercent = computeCupPercent(progress);

  const articleRef = useRef<HTMLDivElement>(null);
  const [resumeDismissed, setResumeDismissed] = useState(false);

  // Derived from the progress captured when the page opened, so the offer does
  // not follow the reader down the page.
  const entry = entryChapter(EPHESIANS_1_CHAPTER_KEY);
  const canResume =
    hydrated &&
    !resumeDismissed &&
    !entry.chapterCompleted &&
    entry.maxReadingPercent > 2 &&
    entry.lastSectionId !== null;
  const resumeSection = canResume
    ? chapter.sections.find((section) => section.id === entry.lastSectionId)
    : undefined;

  // Scroll → reading percent (0–90). Reported as whole numbers so storage
  // writes stay rare, and never decreases (enforced in the store logic).
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
      reportReadingPercent(EPHESIANS_1_CHAPTER_KEY, percent);
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
  }, [hydrated, reportReadingPercent]);

  // Track the section currently at the top of the viewport for resume.
  useEffect(() => {
    if (!hydrated || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible?.target.id) reportSection(EPHESIANS_1_CHAPTER_KEY, visible.target.id);
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 },
    );
    for (const section of chapter.sections) {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [chapter.sections, hydrated, reportSection]);

  const scrollToSection = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "start" });
    element.focus({ preventScroll: true });
  }, []);

  return (
    <div className="pb-20">
      {/* Sticky, unobtrusive progress bar */}
      <div className="sticky top-[3.4rem] z-30 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_96%,transparent)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-2">
          <CoffeeCup percent={hydrated ? cupPercent : 0} size="compact" />
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
            href="/th/books/ephesians"
            className="text-[var(--foreground-subtle)] underline underline-offset-4"
          >
            ← กลับไปหน้าภาพรวมเอเฟซัส
          </Link>
        </nav>

        <header className="mt-6">
          <p className="text-sm text-[var(--foreground-subtle)]">เอเฟซัส · บทที่ 1</p>
          <h1 className="mt-2 font-serif text-[1.75rem] font-semibold leading-[1.45] tracking-tight sm:text-4xl">
            {chapter.title}
          </h1>
          <p className="mt-3 text-sm text-[var(--foreground-subtle)]">
            ใช้เวลาอ่านประมาณ {chapter.estimatedMinutes} นาที
          </p>
        </header>

        {chapter.status !== "final" ? (
          <p className="mt-6 rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--foreground-muted)]">
            <strong className="font-semibold">เนื้อหาฉบับร่าง</strong> — บทนี้ยังอยู่ระหว่างการเขียนและตรวจทาน
            บางส่วนเป็นข้อความชั่วคราวเพื่อทดสอบหน้าจอ และยังไม่ควรใช้อ้างอิงในการสอน
          </p>
        ) : null}

        {resumeSection ? (
          <div
            role="status"
            className="mt-6 flex flex-col gap-3 rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] p-4 sm:flex-row sm:items-center sm:justify-between"
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
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setResumeDismissed(true)}
              >
                เริ่มจากต้นบท
              </Button>
            </div>
          </div>
        ) : null}

        <div ref={articleRef} className="mt-10">
          {chapter.sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              tabIndex={-1}
              aria-labelledby={`${section.id}-title`}
              className="scroll-mt-32 border-t border-[var(--border)] pt-10 first:border-t-0 first:pt-0"
            >
              <h2
                id={`${section.id}-title`}
                className="font-serif text-2xl font-semibold tracking-tight"
              >
                {section.title}
              </h2>
              <div className="mt-5">
                {section.blocks.map((block, index) => (
                  <BlockRenderer key={index} block={block} />
                ))}
              </div>
              {section.sourceIds.length > 0 ? (
                <p className="mt-6 text-xs text-[var(--foreground-subtle)]">
                  ที่มาอ้างอิง:{" "}
                  {section.sourceIds
                    .map((id) => chapter.sources.find((source) => source.id === id)?.label ?? id)
                    .join(" · ")}
                </p>
              ) : null}
            </section>
          ))}
        </div>

        <div id={CHECKPOINT_ANCHOR} className="scroll-mt-32">
          <ChapterEnding chapter={chapter} />
        </div>

        {chapter.sources.length > 0 ? (
          <section aria-labelledby="sources" className="mt-16 border-t border-[var(--border)] pt-8">
            <h2 id="sources" className="text-base font-semibold tracking-tight">
              ที่มาและหมายเหตุ
            </h2>
            <ul className="mt-4 space-y-3">
              {chapter.sources.map((source) => (
                <li key={source.id} className="text-sm text-[var(--foreground-muted)]">
                  <span className="font-medium text-[var(--foreground)]">{source.label}</span>
                  {source.status === "unverified" ? (
                    <span className="ms-2 rounded-full border border-[var(--border-strong)] px-2 py-0.5 text-[0.65rem] text-[var(--foreground-subtle)]">
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
