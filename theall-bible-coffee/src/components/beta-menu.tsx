"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { useProgress } from "@/lib/progress/provider";
import type { FontSizePreference, ThemePreference } from "@/lib/progress/schema";
import { cn } from "@/lib/utils";

const THEMES: ReadonlyArray<{ value: ThemePreference; label: string }> = [
  { value: "light", label: "สว่าง" },
  { value: "dark", label: "มืด" },
  { value: "system", label: "ตามระบบ" },
];

const FONT_SIZES: ReadonlyArray<{ value: FontSizePreference; label: string }> = [
  { value: "sm", label: "เล็ก" },
  { value: "md", label: "ปกติ" },
  { value: "lg", label: "ใหญ่" },
  { value: "xl", label: "ใหญ่มาก" },
];

export function BetaMenu() {
  const { state, hydrated, setTheme, setFontSize, resetAll } = useProgress();
  const [open, setOpen] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const panelId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  // Closing always returns the panel to its resting state.
  const close = useCallback(() => {
    setOpen(false);
    setConfirmingReset(false);
    setResetDone(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const onClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [close, open]);

  const theme = state.preferences.theme;
  const fontSize = state.preferences.fontSize;

  return (
    <div className="relative" ref={containerRef}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => (open ? close() : setOpen(true))}
      >
        การแสดงผล
      </Button>

      {open ? (
        <div
          id={panelId}
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[17.5rem] rounded-sm border border-[var(--border-strong)] bg-[var(--surface)] p-4 shadow-[var(--shadow-deep)]"
        >
          <fieldset className="border-0 p-0">
            <legend className="mb-2 text-xs font-semibold text-[var(--foreground-subtle)]">
              ธีมสี
            </legend>
            <div className="flex gap-2">
              {THEMES.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "flex min-h-[2.75rem] flex-1 cursor-pointer items-center justify-center rounded-sm border px-2 text-sm",
                    hydrated && theme === option.value
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] font-semibold"
                      : "border-[var(--border)]",
                  )}
                >
                  <input
                    type="radio"
                    name="theme"
                    value={option.value}
                    checked={hydrated && theme === option.value}
                    onChange={() => setTheme(option.value)}
                    className="sr-only"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-4 border-0 p-0">
            <legend className="mb-2 text-xs font-semibold text-[var(--foreground-subtle)]">
              ขนาดตัวอักษร
            </legend>
            <div className="grid grid-cols-4 gap-2">
              {FONT_SIZES.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "flex min-h-[2.75rem] cursor-pointer items-center justify-center rounded-sm border px-1 text-[0.8rem]",
                    hydrated && fontSize === option.value
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] font-semibold"
                      : "border-[var(--border)]",
                  )}
                >
                  <input
                    type="radio"
                    name="fontSize"
                    value={option.value}
                    checked={hydrated && fontSize === option.value}
                    onChange={() => setFontSize(option.value)}
                    className="sr-only"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-5 border-t border-[var(--border)] pt-4">
            {resetDone ? (
              <p role="status" className="text-sm text-[var(--foreground-muted)]">
                ลบข้อมูลทดสอบบนเครื่องนี้เรียบร้อยแล้ว
              </p>
            ) : confirmingReset ? (
              <div>
                <p className="text-sm text-[var(--foreground-muted)]">
                  การรีเซ็ตจะลบความคืบหน้า การตั้งค่า และคำตอบแบบสอบถามบนเครื่องนี้ทั้งหมด
                  และไม่สามารถกู้คืนได้
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmingReset(false)}
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      resetAll();
                      setConfirmingReset(false);
                      setResetDone(true);
                    }}
                  >
                    ยืนยันการรีเซ็ต
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                block
                onClick={() => setConfirmingReset(true)}
              >
                รีเซ็ตข้อมูลทดสอบบนเครื่องนี้
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
