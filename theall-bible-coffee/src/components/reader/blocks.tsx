"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import type { Block } from "@/lib/content/schema";
import { cn } from "@/lib/utils";

/**
 * Renders content blocks as plain React elements. Content is never injected as
 * raw HTML — every field is rendered as text.
 *
 * Blocks carry `data-speak` and a stable id so read-aloud can walk them in
 * order and highlight whichever passage is being spoken.
 */

/** A restrained rise-and-fade as each block enters the viewport. */
function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

interface BlockRendererProps {
  block: Block;
  /** Stable id, used as the speech anchor. */
  blockId: string;
  /** True for the first paragraph of a section, which gets the drop cap. */
  leading?: boolean;
  speakingId: string | null;
}

export function BlockRenderer({ block, blockId, leading, speakingId }: BlockRendererProps) {
  const spoken = speakingId === blockId;
  const speakProps = { id: blockId, "data-speak": true } as const;

  switch (block.type) {
    case "paragraph":
      return (
        <Reveal>
          <p
            {...speakProps}
            className={cn(
              "reading-text mt-6 scroll-mt-40 px-1 transition-colors first:mt-0",
              leading && "dropcap",
              block.emphasis
                ? "font-medium text-[var(--foreground)]"
                : "text-[var(--foreground-muted)]",
              spoken && "speaking",
            )}
          >
            {block.text}
          </p>
        </Reveal>
      );

    case "heading":
      return (
        <Reveal>
          {block.level === 3 ? (
            <h3
              {...speakProps}
              className={cn(
                "font-display mt-12 scroll-mt-40 px-1 text-[1.3rem] font-semibold first:mt-0",
                spoken && "speaking",
              )}
            >
              {block.text}
            </h3>
          ) : (
            <h4
              {...speakProps}
              className={cn(
                "font-display mt-9 scroll-mt-40 px-1 text-lg font-semibold first:mt-0",
                spoken && "speaking",
              )}
            >
              {block.text}
            </h4>
          )}
        </Reveal>
      );

    case "list": {
      const items = block.items.map((item, index) => (
        <li key={index} className="reading-text text-[var(--foreground-muted)]">
          {item}
        </li>
      ));
      return (
        <Reveal>
          <div {...speakProps} className={cn("mt-6 scroll-mt-40 px-1", spoken && "speaking")}>
            {block.ordered ? (
              <ol className="list-decimal space-y-3 ps-6 marker:font-medium marker:text-[var(--accent)]">
                {items}
              </ol>
            ) : (
              <ul className="list-disc space-y-3 ps-6 marker:text-[var(--accent)]">{items}</ul>
            )}
          </div>
        </Reveal>
      );
    }

    case "callout": {
      const tones = {
        note: "border-[var(--border-strong)] bg-[var(--surface-muted)]",
        truth: "border-[var(--accent)] bg-[var(--accent-soft)]",
        draft: "border-dashed border-[var(--border-strong)] bg-[var(--surface-muted)]",
      } as const;
      return (
        <Reveal>
          <aside
            {...speakProps}
            className={cn("mt-8 scroll-mt-40 rounded-sm border p-5", tones[block.tone], spoken && "speaking")}
          >
            {block.title ? (
              <p className="label text-[var(--foreground-subtle)]">
                {block.tone === "draft" ? "ฉบับร่าง · " : ""}
                {block.title}
              </p>
            ) : null}
            <p className="reading-text mt-2 text-[var(--foreground-muted)]">{block.text}</p>
          </aside>
        </Reveal>
      );
    }

    case "scriptureReference":
      return (
        <Reveal>
          <figure
            {...speakProps}
            className={cn(
              "mt-8 scroll-mt-40 border-y border-[var(--border-strong)] px-2 py-9 text-center",
              spoken && "speaking",
            )}
          >
            <p className="font-display text-[1.9rem] font-semibold leading-tight sm:text-[2.4rem]">
              {block.reference}
            </p>
            {block.text ? (
              <blockquote className="reading-lead mt-5 text-start text-[var(--foreground)]">
                {block.text}
              </blockquote>
            ) : null}
            {block.note ? (
              <figcaption className="mt-4 text-sm text-[var(--foreground-subtle)]">
                {block.note}
              </figcaption>
            ) : null}
            {block.attribution ? (
              <figcaption className="mt-2 text-xs text-[var(--foreground-subtle)]">
                {block.attribution}
              </figcaption>
            ) : null}
          </figure>
        </Reveal>
      );

    case "greekTerm":
      return (
        <Reveal>
          <div
            {...speakProps}
            className={cn(
              "mt-7 scroll-mt-40 border-s-2 border-[var(--accent)] bg-[var(--surface)] p-5",
              spoken && "speaking",
            )}
          >
            <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span lang="grc" className="font-display text-2xl font-semibold">
                {block.greek}
              </span>
              <span className="text-sm italic text-[var(--foreground-subtle)]">
                {block.transliteration}
              </span>
            </p>
            <p className="mt-1 text-sm font-medium text-[var(--accent)]">{block.gloss}</p>
            <p className="reading-text mt-3 text-[var(--foreground-muted)]">{block.explanation}</p>
          </div>
        </Reveal>
      );

    case "quotation":
      return (
        <Reveal>
          <figure
            {...speakProps}
            className={cn("mt-8 scroll-mt-40 px-2 text-center", spoken && "speaking")}
          >
            <blockquote className="font-display text-[1.35rem] font-semibold leading-relaxed sm:text-[1.6rem]">
              “{block.text}”
            </blockquote>
            <figcaption className="mt-3 text-sm text-[var(--foreground-subtle)]">
              — {block.author}
              {block.attribution ? `, ${block.attribution}` : ""}
            </figcaption>
          </figure>
        </Reveal>
      );

    case "caseStudy":
      return (
        <Reveal>
          <article
            {...speakProps}
            className={cn(
              "mt-8 scroll-mt-40 rounded-sm border border-[var(--border-strong)] bg-[var(--surface)] p-5 sm:p-6",
              spoken && "speaking",
            )}
          >
            <p className="label">เรื่องจริง</p>
            <h4 className="font-display mt-2 text-xl font-semibold">{block.title}</h4>
            <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-[var(--foreground-subtle)]">
              <div className="flex gap-2">
                <dt>ใคร</dt>
                <dd className="text-[var(--foreground-muted)]">{block.person}</dd>
              </div>
              <div className="flex gap-2">
                <dt>ที่ไหน</dt>
                <dd className="text-[var(--foreground-muted)]">{block.place}</dd>
              </div>
              <div className="flex gap-2">
                <dt>เมื่อไร</dt>
                <dd className="text-[var(--foreground-muted)]">{block.when}</dd>
              </div>
            </dl>
            {block.paragraphs.map((paragraph, index) => (
              <p key={index} className="reading-text mt-4 text-[var(--foreground-muted)]">
                {paragraph}
              </p>
            ))}
            {block.verified ? null : (
              <p className="mt-4 border-t border-dashed border-[var(--border-strong)] pt-3 text-xs text-[var(--foreground-subtle)]">
                ฉบับร่าง — ยังรอเรื่องจริงที่ได้รับอนุญาตและตรวจสอบแล้ว
              </p>
            )}
          </article>
        </Reveal>
      );

    case "research":
      return (
        <Reveal>
          <div
            {...speakProps}
            className={cn(
              "mt-8 scroll-mt-40 rounded-sm border border-[var(--border)] bg-[var(--surface-muted)] p-5",
              spoken && "speaking",
            )}
          >
            <p className="label text-[var(--foreground-subtle)]">งานวิจัยที่เกี่ยวข้อง</p>
            <p className="reading-text mt-2 text-[var(--foreground-muted)]">{block.finding}</p>
            <p className="mt-3 text-xs text-[var(--foreground-subtle)]">{block.citation}</p>
          </div>
        </Reveal>
      );

    case "application": {
      const stageLabels = { knowing: "รู้", doing: "ทำ", sharing: "บอกต่อ" } as const;
      return (
        <Reveal>
          <div
            {...speakProps}
            className={cn(
              "mt-7 scroll-mt-40 rounded-sm border border-[var(--border)] bg-[var(--surface)] p-5",
              spoken && "speaking",
            )}
          >
            <p className="label">{stageLabels[block.stage]}</p>
            <h4 className="font-display mt-2 text-xl font-semibold">{block.title}</h4>
            <p className="reading-text mt-2 text-[var(--foreground-muted)]">{block.text}</p>
            <ul className="mt-5 space-y-3 border-t border-[var(--border)] pt-4">
              {block.prompts.map((prompt, index) => (
                <li key={index} className="reading-text flex gap-3 text-[var(--foreground-muted)]">
                  <span aria-hidden="true" className="text-[var(--accent)]">
                    —
                  </span>
                  <span>{prompt}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      );
    }
  }
}
