import type { Metadata } from "next";
import Link from "next/link";

import { ChapterOneCallToAction } from "@/components/chapter-one-cta";
import { EPHESIANS } from "@/lib/content/book";
import { loadEphesians1 } from "@/lib/content/loader";

export const metadata: Metadata = {
  title: "เอเฟซัส — TheAll Bible Coffee",
  description: EPHESIANS.overview,
};

export default async function EphesiansOverviewPage() {
  const chapter = await loadEphesians1();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-8 sm:pt-12">
      <nav aria-label="เส้นทางหน้า" className="text-sm">
        <Link href="/th" className="text-[var(--foreground-subtle)] underline underline-offset-4">
          ← หน้าแรก
        </Link>
      </nav>

      <header className="mt-6">
        <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
          {EPHESIANS.titleTh}
        </h1>
        <p className="mt-2 text-[var(--foreground-subtle)]">{EPHESIANS.subtitleTh}</p>
      </header>

      <section aria-labelledby="overview" className="mt-8">
        <h2 id="overview" className="text-lg font-semibold tracking-tight">
          หนังสือเล่มนี้พูดเรื่องอะไร
        </h2>
        <p className="reading-text mt-3 text-[var(--foreground-muted)]">{EPHESIANS.overview}</p>
      </section>

      <section aria-labelledby="why" className="mt-8">
        <h2 id="why" className="text-lg font-semibold tracking-tight">
          ทำไมเอเฟซัสจึงสำคัญกับคริสเตียนธรรมดาในวันนี้
        </h2>
        <p className="reading-text mt-3 text-[var(--foreground-muted)]">
          {EPHESIANS.whyItMatters}
        </p>
      </section>

      <ChapterOneCallToAction
        chapterTitle={chapter.title}
        chapterSummary={chapter.summary}
        estimatedMinutes={chapter.estimatedMinutes}
      />

      <section aria-labelledby="outline" className="mt-12">
        <h2 id="outline" className="text-lg font-semibold tracking-tight">
          โครงของทั้งหกบท
        </h2>
        <p className="mt-2 text-sm text-[var(--foreground-subtle)]">
          ในรุ่นทดสอบนี้ เปิดให้อ่านเฉพาะบทที่ 1 บทอื่นแสดงไว้เพื่อให้เห็นภาพรวมเท่านั้น
          และยังเขียนไม่เสร็จ
        </p>

        <ol className="mt-5 space-y-px">
          {EPHESIANS.chapters.map((item) => (
            <li key={item.number}>
              {item.available ? (
                <Link
                  href="/th/books/ephesians/1"
                  className="flex items-baseline gap-4 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-4"
                >
                  <span className="font-serif text-lg font-semibold text-[var(--accent)]">
                    {item.number}
                  </span>
                  <span className="flex-1">
                    <span className="block font-medium">{item.titleTh}</span>
                    <span className="mt-0.5 block text-sm text-[var(--foreground-subtle)]">
                      เปิดให้อ่านแล้ว
                    </span>
                  </span>
                </Link>
              ) : (
                <div className="flex items-baseline gap-4 px-4 py-3.5 opacity-70">
                  <span className="font-serif text-lg text-[var(--foreground-subtle)]">
                    {item.number}
                  </span>
                  <span className="flex-1">
                    <span className="block text-[var(--foreground-muted)]">{item.titleTh}</span>
                    <span className="mt-0.5 block text-sm text-[var(--foreground-subtle)]">
                      ยังไม่เปิดให้อ่าน
                    </span>
                  </span>
                </div>
              )}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
