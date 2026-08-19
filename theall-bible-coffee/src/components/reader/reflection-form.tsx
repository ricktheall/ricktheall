"use client";

import { useId, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import type { Reflection } from "@/lib/content/schema";
import { isReflectionAnswerValid } from "@/lib/progress/logic";

interface ReflectionFormProps {
  reflection: Reflection;
  onCompleted: () => void;
}

/**
 * The answer lives in component state for this session only. It is never sent
 * anywhere and never written to storage — only the completed flag is kept.
 */
export function ReflectionForm({ reflection, onCompleted }: ReflectionFormProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fieldId = useId();
  const errorId = `${fieldId}-error`;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isReflectionAnswerValid(text)) {
      setError("ช่วยเขียนอย่างน้อยหนึ่งประโยคก่อนนะ ไม่มีคำตอบผิด");
      return;
    }
    setError(null);
    setText("");
    onCompleted();
  };

  return (
    <section
      aria-labelledby="reflection-title"
      className="mt-8 rounded-sm border border-[var(--border-strong)] bg-[var(--surface)] p-5 sm:p-7"
    >
      <p className="label">ใคร่ครวญ</p>
      <h2 id="reflection-title" className="font-display mt-3 text-[1.7rem] font-semibold">
        {reflection.question}
      </h2>
      <p className="mt-2 text-sm text-[var(--foreground-muted)]">{reflection.helpText}</p>

      <form onSubmit={submit} className="mt-5" noValidate>
        <label htmlFor={fieldId} className="sr-only">
          {reflection.question}
        </label>
        <textarea
          id={fieldId}
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            if (error) setError(null);
          }}
          maxLength={reflection.maxLength}
          rows={6}
          placeholder={reflection.placeholder}
          aria-invalid={error !== null}
          aria-describedby={error ? errorId : undefined}
          className="reading-text w-full rounded-sm border border-[var(--border-strong)] bg-[var(--background)] p-4 text-[var(--foreground)]"
        />
        <div className="mt-2 flex items-center justify-between text-xs text-[var(--foreground-subtle)]">
          <span>ไม่มีการให้คะแนน</span>
          <span className="tabular-nums">
            {text.length}/{reflection.maxLength}
          </span>
        </div>

        {error ? (
          <p id={errorId} role="alert" className="mt-3 text-sm text-[var(--danger)]">
            {error}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="mt-4">
          ส่งคำตอบและอ่านจบบทนี้
        </Button>
      </form>
    </section>
  );
}
