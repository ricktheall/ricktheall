"use client";

import { useId, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { useProgress } from "@/lib/progress/provider";
import type { Feedback, ReturnIntent } from "@/lib/progress/schema";
import { cn } from "@/lib/utils";

const RETURN_INTENT_LABELS: ReadonlyArray<{ value: ReturnIntent; label: string }> = [
  { value: "definitely", label: "อยากอ่านแน่นอน" },
  { value: "maybe", label: "อาจจะอ่าน" },
  { value: "not-yet", label: "ยังไม่อยากอ่าน" },
];

const RATINGS = [1, 2, 3, 4, 5] as const;

export function buildFeedbackSummary(feedback: Feedback, chapterLabel: string, nextLabel: string): string {
  const intent = RETURN_INTENT_LABELS.find((item) => item.value === feedback.returnIntent);
  return [
    "TheAll Bible Coffee — MVP Feedback",
    "",
    `ความเข้าใจ${chapterLabel}: ${feedback.understanding ?? "-"}/5`,
    `ความอยากอ่าน${nextLabel}: ${intent?.label ?? "-"}`,
    "",
    "สิ่งที่ช่วยมากที่สุดหรือเกือบทำให้หยุด:",
    feedback.freeText.trim(),
    "",
  ].join("\n");
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the manual path */
  }
  return false;
}

interface ValidationFeedbackProps {
  /** e.g. "เอเฟซัส 1" — used verbatim in the copied summary. */
  chapterLabel: string;
  /** e.g. "บทที่ 2" */
  nextLabel: string;
}

export function ValidationFeedback({ chapterLabel, nextLabel }: ValidationFeedbackProps) {
  const { state, saveFeedback } = useProgress();
  const stored = state.feedback;

  const [understanding, setUnderstanding] = useState<number | null>(stored?.understanding ?? null);
  const [returnIntent, setReturnIntent] = useState<ReturnIntent | null>(stored?.returnIntent ?? null);
  const [freeText, setFreeText] = useState(stored?.freeText ?? "");
  const [submitted, setSubmitted] = useState(stored?.submitted ?? false);
  const [error, setError] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "manual">("idle");

  const freeTextId = useId();
  const errorId = `${freeTextId}-error`;

  const summary = buildFeedbackSummary(
    { understanding, returnIntent, freeText, submitted: true },
    chapterLabel,
    nextLabel,
  );

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (understanding === null || returnIntent === null || freeText.trim().length === 0) {
      setError("ช่วยตอบให้ครบทั้งสามข้อก่อนนะ");
      return;
    }
    setError(null);
    const feedback: Feedback = {
      understanding,
      returnIntent,
      freeText: freeText.trim().slice(0, 2000),
      submitted: true,
    };
    saveFeedback(feedback);
    setSubmitted(true);
  };

  return (
    <section
      aria-labelledby="feedback-title"
      className="mt-8 rounded-sm border border-[var(--border-strong)] bg-[var(--surface)] p-5 sm:p-7"
    >
      <h2 id="feedback-title" className="font-display text-[1.7rem] font-semibold">
        ช่วยเราทำบทต่อไปให้ดีขึ้น
      </h2>
      <p className="mt-2 text-sm text-[var(--foreground-muted)]">
        สามคำถามสั้น ๆ คำตอบถูกเก็บไว้บนเครื่องนี้เท่านั้น ไม่มีชื่อ ไม่มีอีเมล
        และไม่ถูกส่งออกโดยอัตโนมัติ
      </p>

      <form onSubmit={submit} className="mt-6" noValidate>
        <fieldset className="border-0 p-0">
          <legend className="text-[0.95rem] font-medium">
{`1. หลังอ่านจบ คุณเข้าใจ${chapterLabel} มากขึ้นแค่ไหน?`}
          </legend>
          <p className="mt-1 text-xs text-[var(--foreground-subtle)]">
            1 คือเข้าใจน้อยที่สุด 5 คือเข้าใจมากที่สุด
          </p>
          <div className="mt-3 flex gap-2">
            {RATINGS.map((value) => (
              <label
                key={value}
                className={cn(
                  "flex min-h-[3rem] flex-1 cursor-pointer items-center justify-center rounded-sm border text-base tabular-nums",
                  understanding === value
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] font-semibold"
                    : "border-[var(--border)] hover:bg-[var(--surface-muted)]",
                )}
              >
                <input
                  type="radio"
                  name="understanding"
                  value={value}
                  checked={understanding === value}
                  onChange={() => {
                    setUnderstanding(value);
                    setError(null);
                  }}
                  className="sr-only"
                />
                <span aria-hidden="true">{value}</span>
                <span className="sr-only">{`${value} คะแนน จาก 5`}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-7 border-0 p-0">
          <legend className="text-[0.95rem] font-medium">
{`2. ถ้า${nextLabel}พร้อมพรุ่งนี้ คุณอยากกลับมาอ่านต่อแค่ไหน?`}
          </legend>
          <div className="mt-3 grid gap-2.5">
            {RETURN_INTENT_LABELS.map((option) => (
              <label
                key={option.value}
                className={cn(
                  "flex min-h-[3rem] cursor-pointer items-center gap-3 rounded-sm border px-4 text-[0.95rem]",
                  returnIntent === option.value
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] font-semibold"
                    : "border-[var(--border)] hover:bg-[var(--surface-muted)]",
                )}
              >
                <input
                  type="radio"
                  name="returnIntent"
                  value={option.value}
                  checked={returnIntent === option.value}
                  onChange={() => {
                    setReturnIntent(option.value);
                    setError(null);
                  }}
                  className="size-5 accent-[var(--accent)]"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-7">
          <label htmlFor={freeTextId} className="block text-[0.95rem] font-medium">
            3. อะไรคือสิ่งที่ช่วยคุณมากที่สุด หรือเกือบทำให้คุณหยุดอ่าน?
          </label>
          <textarea
            id={freeTextId}
            value={freeText}
            onChange={(event) => {
              setFreeText(event.target.value);
              setError(null);
            }}
            rows={4}
            maxLength={2000}
            placeholder="เขียนสั้น ๆ ตามที่รู้สึกจริง ๆ"
            aria-invalid={error !== null}
            aria-describedby={error ? errorId : undefined}
            className="reading-text mt-2 w-full rounded-sm border border-[var(--border-strong)] bg-[var(--background)] p-4"
          />
        </div>

        {error ? (
          <p id={errorId} role="alert" className="mt-3 text-sm text-[var(--danger)]">
            {error}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="mt-5">
          {submitted ? "บันทึกคำตอบอีกครั้ง" : "บันทึกคำตอบ"}
        </Button>
      </form>

      {submitted ? (
        <div className="mt-8 border-t border-[var(--border)] pt-6">
          <div role="status" aria-live="polite">
            <p className="text-[0.95rem] font-medium">ขอบคุณมากจริง ๆ</p>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">
              คัดลอกข้อความด้านล่างแล้วส่งกลับมาทาง LINE หรือแอปแชตที่คุณสะดวก
              ข้อความนี้ไม่มีชื่อ ไม่มีอีเมล และไม่มีรหัสประจำเครื่อง
            </p>
            {copyState === "copied" ? (
              <p className="mt-3 rounded-sm border border-[var(--accent)] bg-[var(--accent-soft)] p-3 text-sm">
                คัดลอกเรียบร้อยแล้ว
              </p>
            ) : null}
            {copyState === "manual" ? (
              <p className="mt-3 rounded-sm border border-[var(--border-strong)] bg-[var(--surface-muted)] p-3 text-sm">
                เบราว์เซอร์นี้ไม่อนุญาตให้คัดลอกอัตโนมัติ กรุณาเลือกข้อความด้านล่างแล้วคัดลอกเอง
              </p>
            ) : null}
          </div>

          <pre className="mt-4 max-h-64 overflow-auto whitespace-pre-wrap rounded-sm border border-[var(--border)] bg-[var(--surface-muted)] p-4 font-sans text-sm">
            {summary}
          </pre>

          <Button
            type="button"
            variant="accent"
            size="lg"
            className="mt-4"
            onClick={async () => {
              const ok = await copyText(summary);
              setCopyState(ok ? "copied" : "manual");
            }}
          >
            คัดลอกผลตอบกลับ
          </Button>
        </div>
      ) : null}
    </section>
  );
}
