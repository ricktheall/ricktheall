import { cn } from "@/lib/utils";
import type { BibleBook } from "@/lib/books/canon";
import type { CupState } from "@/lib/progress/book-logic";

interface BookCupProps {
  book: BibleBook;
  state: CupState;
  percent: number;
  size?: "grid" | "detail";
  className?: string;
}

/**
 * One book, one cup. Shares the geometry of {@link CoffeeCup} so the library
 * and the reading header feel like the same object at different scales.
 *
 * The four states are never signalled by colour alone — the caller always
 * renders an accessible label alongside, and a finished cup carries a tick as
 * well as being turned over.
 */
export function BookCup({ book, state, percent, size = "grid", className }: BookCupProps) {
  const clipId = `cup-${book.id}`;
  const safePercent = Math.max(0, Math.min(100, Math.round(percent)));

  const innerTop = 17;
  const innerBottom = 62;
  const liquidHeight = ((innerBottom - innerTop) * safePercent) / 100;
  const liquidY = innerBottom - liquidHeight;

  const finished = state === "completed";
  const dimension = size === "grid" ? 44 : 76;

  return (
    <svg
      width={dimension}
      height={dimension * (78 / 68)}
      viewBox="0 0 68 78"
      aria-hidden="true"
      focusable="false"
      className={cn(
        "shrink-0 overflow-visible transition-opacity",
        // Coming soon: still clearly a real cup, just not yet yours.
        state === "coming-soon" && "opacity-45 blur-[1.6px]",
        className,
      )}
    >
      <defs>
        <clipPath id={clipId}>
          <path d="M11 15 H55 L50 63 A6 6 0 0 1 44 68 H22 A6 6 0 0 1 16 63 Z" />
        </clipPath>
      </defs>

      {/* The saucer stays upright even when the cup is turned over. */}
      <path
        d="M6 73 H62"
        stroke="var(--cup-outline)"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.55"
      />

      {/*
        Finishing a book turns the cup upside down — the signature moment.
        Only the cup is mirrored, about its own middle, so it comes to rest on
        its rim on the same saucer. The card, label and shadow never move.
      */}
      <g transform={finished ? "translate(0,83) scale(1,-1)" : undefined}>
        <path
          d="M55 24 H59 A8 8 0 0 1 59 42 H52"
          fill="none"
          stroke="var(--cup-outline)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M11 15 H55 L50 63 A6 6 0 0 1 44 68 H22 A6 6 0 0 1 16 63 Z"
          fill="var(--surface)"
          stroke="var(--cup-outline)"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {!finished && safePercent > 0 && (
          <g clipPath={`url(#${clipId})`}>
            <rect x="8" y={liquidY} width="52" height={liquidHeight + 8} fill="var(--coffee-liquid)" />
            <rect x="8" y={liquidY} width="52" height="2.5" fill="var(--coffee-crema)" />
          </g>
        )}
        <path d="M11 15 H55" stroke="var(--cup-outline)" strokeWidth="3" strokeLinecap="round" />
      </g>

      {finished && (
        <g>
          <circle cx="55" cy="60" r="9" fill="var(--accent)" />
          <path
            d="M50.5 60 L54 63.5 L60 56.5"
            fill="none"
            stroke="var(--accent-foreground)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}

      {state === "ready" && <circle cx="58" cy="12" r="4" fill="var(--accent)" />}
    </svg>
  );
}
