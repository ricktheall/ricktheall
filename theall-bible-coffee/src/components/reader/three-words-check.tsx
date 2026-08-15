"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import type { Checkpoint, CheckpointOption } from "@/lib/content/schema";
import { isCheckpointCorrect, shuffle } from "@/lib/progress/logic";
import { cn } from "@/lib/utils";

interface ThreeWordsCheckProps {
  checkpoint: Checkpoint;
  onPassed: () => void;
  onReview: () => void;
}

export function ThreeWordsCheck({ checkpoint, onPassed, onReview }: ThreeWordsCheckProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<"idle" | "correct" | "incorrect">("idle");
  // This component only mounts after hydration, so shuffling here is safe:
  // no server markup exists to mismatch against.
  const [options] = useState<CheckpointOption[]>(() => shuffle(checkpoint.options));

  const required = checkpoint.requiredSelections;
  const canSubmit = selected.length === required;

  const toggle = (id: string) => {
    setResult("idle");
    setSelected((current) => {
      if (current.includes(id)) return current.filter((value) => value !== id);
      if (current.length >= required) return current;
      return [...current, id];
    });
  };

  const remaining = useMemo(() => required - selected.length, [required, selected.length]);

  const submit = () => {
    if (!canSubmit) return;
    if (isCheckpointCorrect(selected, checkpoint.correctOptionIds)) {
      setResult("correct");
      onPassed();
    } else {
      setResult("incorrect");
    }
  };

  return (
    <section
      aria-labelledby="checkpoint-title"
      className="mt-16 rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] p-5 sm:p-7"
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        ทบทวนท้ายบท
      </p>
      <h2 id="checkpoint-title" className="mt-2 font-serif text-2xl font-semibold tracking-tight">
        {checkpoint.prompt}
      </h2>
      <p className="mt-2 text-sm text-[var(--foreground-muted)]">{checkpoint.helpText}</p>

      <fieldset className="mt-6 border-0 p-0">
        <legend className="sr-only">{checkpoint.prompt}</legend>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {options.map((option) => {
            const isSelected = selected.includes(option.id);
            const atLimit = !isSelected && selected.length >= required;
            return (
              <label
                key={option.id}
                className={cn(
                  "flex min-h-[3.25rem] cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-[0.95rem] transition-colors",
                  isSelected
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] font-semibold"
                    : "border-[var(--border)] hover:bg-[var(--surface-muted)]",
                  atLimit && "opacity-60",
                )}
              >
                <input
                  type="checkbox"
                  className="size-5 accent-[var(--accent)]"
                  checked={isSelected}
                  disabled={atLimit}
                  onChange={() => toggle(option.id)}
                />
                <span>{option.word}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <p className="mt-4 text-sm text-[var(--foreground-subtle)]" aria-live="polite">
        {remaining > 0
          ? `เลือกอีก ${remaining} คำ`
          : `เลือกครบ ${required} คำแล้ว`}
      </p>

      <div className="mt-4">
        <Button type="button" size="lg" disabled={!canSubmit} onClick={submit}>
          ตรวจคำตอบ
        </Button>
      </div>

      <div role="status" aria-live="polite" className="mt-5">
        {result === "correct" ? (
          <p className="rounded-xl border border-[var(--accent)] bg-[var(--accent-soft)] p-4 text-[0.95rem]">
            {checkpoint.successMessage}
          </p>
        ) : null}
        {result === "incorrect" ? (
          <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--surface-muted)] p-4">
            <p className="text-[0.95rem] text-[var(--foreground-muted)]">
              {checkpoint.retryMessage}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onReview}>
                กลับไปทบทวน
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setSelected([]);
                  setResult("idle");
                }}
              >
                ลองอีกครั้ง
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
