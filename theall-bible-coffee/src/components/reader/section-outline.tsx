"use client";

import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { Section } from "@/lib/content/schema";

interface SectionOutlineProps {
  sections: readonly Section[];
  onNavigate: (id: string) => void;
  checkpointAnchor: string;
}

export function SectionOutline({ sections, onNavigate, checkpointAnchor }: SectionOutlineProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        หัวข้อในบทนี้
      </Button>

      {open ? (
        <nav
          id={panelId}
          aria-label="หัวข้อในบทนี้"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[16rem] rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] p-2 shadow-lg"
        >
          <ul>
            {sections.map((section, index) => (
              <li key={section.id}>
                <button
                  type="button"
                  className="flex w-full items-baseline gap-3 rounded-xl px-3 py-2.5 text-start text-sm hover:bg-[var(--surface-muted)]"
                  onClick={() => {
                    onNavigate(section.id);
                    setOpen(false);
                  }}
                >
                  <span aria-hidden="true" className="text-xs text-[var(--foreground-subtle)]">
                    {index + 1}
                  </span>
                  <span>{section.navLabel}</span>
                </button>
              </li>
            ))}
            <li className="mt-1 border-t border-[var(--border)] pt-1">
              <button
                type="button"
                className="flex w-full items-baseline gap-3 rounded-xl px-3 py-2.5 text-start text-sm hover:bg-[var(--surface-muted)]"
                onClick={() => {
                  onNavigate(checkpointAnchor);
                  setOpen(false);
                }}
              >
                <span aria-hidden="true" className="text-xs text-[var(--foreground-subtle)]">
                  ✓
                </span>
                <span>ทบทวนท้ายบท</span>
              </button>
            </li>
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
