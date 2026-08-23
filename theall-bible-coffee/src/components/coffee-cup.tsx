"use client";

import { motion, useReducedMotion } from "motion/react";
import { useId } from "react";

import { cn } from "@/lib/utils";

interface CoffeeCupProps {
  percent: number;
  /** `inline` for page cards, `compact` for the sticky reading header. */
  size?: "compact" | "inline" | "large";
  label?: string;
  className?: string;
}

/**
 * The Coffee Cup is the only progress visualisation in this MVP.
 * Calm, warm, adult. Never colour-only: a numeric percentage is always shown,
 * and screen readers get a full Thai sentence.
 */
export function CoffeeCup({
  percent,
  size = "inline",
  label = "อ่านเอเฟซัสบทที่ 1 แล้ว",
  className,
}: CoffeeCupProps) {
  const clipId = useId();
  const reduceMotion = useReducedMotion();
  const safePercent = Math.max(0, Math.min(100, Math.round(percent)));

  const dimensions = {
    compact: { width: 30, height: 34, text: "text-[0.8rem]" },
    inline: { width: 44, height: 50, text: "text-sm" },
    large: { width: 76, height: 86, text: "text-base" },
  }[size];

  // Liquid rises from the inner bottom (y=62) to the inner top (y=17).
  const innerTop = 17;
  const innerBottom = 62;
  const liquidHeight = ((innerBottom - innerTop) * safePercent) / 100;
  const liquidY = innerBottom - liquidHeight;

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox="0 0 68 78"
        aria-hidden="true"
        focusable="false"
        className="shrink-0 overflow-visible"
      >
        <defs>
          <clipPath id={clipId}>
            {/* Inner cavity of the cup — the liquid can never escape it. */}
            <path d="M11 15 H55 L50 63 A6 6 0 0 1 44 68 H22 A6 6 0 0 1 16 63 Z" />
          </clipPath>
        </defs>

        {/* Saucer */}
        <path
          d="M6 73 H62"
          stroke="var(--cup-outline)"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.55"
        />

        {/* Handle */}
        <path
          d="M55 24 A11 11 0 0 1 53 46"
          fill="none"
          stroke="var(--cup-outline)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Coffee */}
        <g clipPath={`url(#${clipId})`}>
          <motion.rect
            x="8"
            width="52"
            fill="var(--coffee-liquid)"
            initial={false}
            animate={{ y: liquidY, height: liquidHeight }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 90, damping: 20, mass: 0.6 }
            }
          />
          {safePercent > 3 ? (
            <motion.rect
              x="8"
              width="52"
              height="3"
              fill="var(--coffee-crema)"
              initial={false}
              animate={{ y: liquidY }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 90, damping: 20, mass: 0.6 }
              }
            />
          ) : null}
        </g>

        {/* Cup outline drawn over the liquid */}
        <path
          d="M11 15 H55 L50 63 A6 6 0 0 1 44 68 H22 A6 6 0 0 1 16 63 Z"
          fill="none"
          stroke="var(--cup-outline)"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
      </svg>

      <span className={cn("font-medium tabular-nums", dimensions.text)}>
        {safePercent}%
      </span>
      <span className="sr-only">{`${label} ${safePercent} เปอร์เซ็นต์`}</span>
    </div>
  );
}
