import Link from "next/link";
import type { ReactNode } from "react";

import { BetaMenu } from "@/components/beta-menu";
import { ProgressProvider } from "@/lib/progress/provider";

export default function ThaiLayout({ children }: { children: ReactNode }) {
  return (
    <ProgressProvider>
      <a href="#main" className="skip-link">
        ข้ามไปยังเนื้อหาหลัก
      </a>
      <div className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_96%,transparent)] backdrop-blur">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3">
            <Link
              href="/th"
              className="flex items-baseline gap-2 rounded-md text-[0.95rem] font-semibold tracking-tight"
            >
              <span>TheAll Bible Coffee</span>
              <span className="rounded-full border border-[var(--border-strong)] px-2 py-0.5 text-[0.65rem] font-medium text-[var(--foreground-subtle)]">
                Technical Beta
              </span>
            </Link>
            <BetaMenu />
          </div>
        </header>

        <main id="main" className="flex-1">
          {children}
        </main>

        <footer className="border-t border-[var(--border)] px-4 py-8 text-center text-xs leading-relaxed text-[var(--foreground-subtle)]">
          <p>TheAll Bible Coffee — รุ่นทดสอบทางเทคนิค</p>
          <p className="mt-1">ความคืบหน้าถูกเก็บไว้บนเครื่องนี้เท่านั้น ไม่มีการสมัครสมาชิก</p>
        </footer>
      </div>
    </ProgressProvider>
  );
}
