"use client";

import { Button } from "@/components/ui/button";
import type { ReadAloudStatus } from "@/lib/speech/use-read-aloud";
import { cn } from "@/lib/utils";

const RATES = [0.8, 1, 1.2, 1.5] as const;

interface ReadAloudBarProps {
  status: ReadAloudStatus;
  rate: number;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onRateChange: (rate: number) => void;
}

/**
 * Playback controls for listening instead of reading — built for a phone in a
 * car cradle, so every target is large and the state is stated in words.
 */
export function ReadAloudBar({
  status,
  rate,
  onStart,
  onPause,
  onResume,
  onStop,
  onNext,
  onPrevious,
  onRateChange,
}: ReadAloudBarProps) {
  if (status === "unsupported") {
    return (
      <p className="mt-6 rounded-sm border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--foreground-muted)]">
        เบราว์เซอร์นี้ยังไม่รองรับการอ่านออกเสียง ลองเปิดด้วย Chrome หรือ Safari รุ่นใหม่
      </p>
    );
  }

  const running = status === "speaking" || status === "paused";

  return (
    <section
      aria-labelledby="read-aloud-title"
      className="mt-6 rounded-sm border border-[var(--border-strong)] bg-[var(--surface)] p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="read-aloud-title" className="label">
            ฟังแทนการอ่าน
          </h2>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            {status === "speaking"
              ? "กำลังอ่านออกเสียง"
              : status === "paused"
                ? "หยุดไว้ชั่วคราว"
                : "เหมาะสำหรับตอนขับรถหรือเดินทาง"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!running ? (
            <Button type="button" size="md" onClick={onStart}>
              อ่านออกเสียง
            </Button>
          ) : null}

          {status === "speaking" ? (
            <Button type="button" variant="outline" size="md" onClick={onPause}>
              หยุดชั่วคราว
            </Button>
          ) : null}

          {status === "paused" ? (
            <Button type="button" size="md" onClick={onResume}>
              อ่านต่อ
            </Button>
          ) : null}

          {running ? (
            <>
              <Button type="button" variant="outline" size="md" onClick={onPrevious}>
                ย่อหน้าก่อน
              </Button>
              <Button type="button" variant="outline" size="md" onClick={onNext}>
                ย่อหน้าถัดไป
              </Button>
              <Button type="button" variant="ghost" size="md" onClick={onStop}>
                หยุด
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <fieldset className="mt-4 border-0 p-0">
        <legend className="text-xs font-medium text-[var(--foreground-subtle)]">ความเร็วเสียง</legend>
        <div className="mt-2 flex gap-2">
          {RATES.map((option) => (
            <label
              key={option}
              className={cn(
                "flex min-h-[2.75rem] flex-1 cursor-pointer items-center justify-center rounded-sm border text-sm tabular-nums",
                rate === option
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] font-semibold text-[var(--foreground)]"
                  : "border-[var(--border)] text-[var(--foreground-muted)]",
              )}
            >
              <input
                type="radio"
                name="speechRate"
                value={option}
                checked={rate === option}
                onChange={() => onRateChange(option)}
                className="sr-only"
              />
              {option}×
            </label>
          ))}
        </div>
      </fieldset>

      <p role="status" aria-live="polite" className="sr-only">
        {status === "speaking"
          ? "กำลังอ่านออกเสียง"
          : status === "paused"
            ? "หยุดอ่านออกเสียงชั่วคราว"
            : "หยุดอ่านออกเสียงแล้ว"}
      </p>
    </section>
  );
}
