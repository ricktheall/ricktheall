import type { Block } from "@/lib/content/schema";
import { cn } from "@/lib/utils";

/**
 * Renders content blocks as plain React elements. Content is never injected as
 * raw HTML — every field is rendered as text.
 */
export function BlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    case "paragraph":
      return (
        <p
          className={cn(
            "reading-text mt-5 first:mt-0",
            block.emphasis
              ? "font-medium text-[var(--foreground)]"
              : "text-[var(--foreground-muted)]",
          )}
        >
          {block.text}
        </p>
      );

    case "heading":
      return block.level === 3 ? (
        <h3 className="mt-10 text-[1.15rem] font-semibold tracking-tight first:mt-0">
          {block.text}
        </h3>
      ) : (
        <h4 className="mt-8 text-base font-semibold tracking-tight first:mt-0">{block.text}</h4>
      );

    case "list": {
      const items = block.items.map((item, index) => (
        <li key={index} className="reading-text text-[var(--foreground-muted)]">
          {item}
        </li>
      ));
      return block.ordered ? (
        <ol className="mt-5 list-decimal space-y-2.5 ps-6 marker:text-[var(--accent)]">{items}</ol>
      ) : (
        <ul className="mt-5 list-disc space-y-2.5 ps-6 marker:text-[var(--accent)]">{items}</ul>
      );
    }

    case "callout": {
      const tones = {
        note: "border-[var(--border-strong)] bg-[var(--surface-muted)]",
        truth: "border-[var(--accent)] bg-[var(--accent-soft)]",
        draft: "border-dashed border-[var(--border-strong)] bg-[var(--surface-muted)]",
      } as const;
      return (
        <aside className={cn("mt-7 rounded-2xl border p-5", tones[block.tone])}>
          {block.title ? (
            <p className="text-sm font-semibold tracking-tight">
              {block.tone === "draft" ? "ฉบับร่าง · " : ""}
              {block.title}
            </p>
          ) : null}
          <p className="reading-text mt-2 text-[var(--foreground-muted)]">{block.text}</p>
        </aside>
      );
    }

    case "scriptureReference":
      return (
        <figure className="mt-6 rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-muted)] p-6 text-center">
          <p className="font-serif text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
            {block.reference}
          </p>
          {block.text ? (
            <blockquote className="reading-lead mt-4 text-start text-[var(--foreground)]">
              {block.text}
            </blockquote>
          ) : null}
          {block.note ? (
            <figcaption className="mt-3 text-sm text-[var(--foreground-subtle)]">
              {block.note}
            </figcaption>
          ) : null}
          {block.attribution ? (
            <figcaption className="mt-2 text-xs text-[var(--foreground-subtle)]">
              {block.attribution}
            </figcaption>
          ) : null}
        </figure>
      );

    case "greekTerm":
      return (
        <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span lang="grc" className="font-serif text-xl font-semibold">
              {block.greek}
            </span>
            <span className="text-sm italic text-[var(--foreground-subtle)]">
              {block.transliteration}
            </span>
          </p>
          <p className="mt-1 text-sm font-medium text-[var(--accent)]">{block.gloss}</p>
          <p className="reading-text mt-3 text-[var(--foreground-muted)]">{block.explanation}</p>
        </div>
      );

    case "application": {
      const stageLabels = { knowing: "รู้", doing: "ทำ", sharing: "บอกต่อ" } as const;
      return (
        <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
            {stageLabels[block.stage]}
          </p>
          <h4 className="mt-1 text-lg font-semibold tracking-tight">{block.title}</h4>
          <p className="reading-text mt-2 text-[var(--foreground-muted)]">{block.text}</p>
          <ul className="mt-4 space-y-2.5 border-t border-[var(--border)] pt-4">
            {block.prompts.map((prompt, index) => (
              <li key={index} className="reading-text flex gap-3 text-[var(--foreground-muted)]">
                <span aria-hidden="true" className="text-[var(--accent)]">
                  ·
                </span>
                <span>{prompt}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    }
  }
}
