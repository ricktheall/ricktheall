import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ChapterCallToAction } from "@/components/chapter-cta";
import { BOOKS, availableChapters, getBook } from "@/lib/content/books";
import { loadChapter } from "@/lib/content/loader";

interface BookPageProps {
  params: Promise<{ bookId: string }>;
}

export function generateStaticParams() {
  return BOOKS.map((book) => ({ bookId: book.id }));
}

export async function generateMetadata({ params }: BookPageProps): Promise<Metadata> {
  const { bookId } = await params;
  const book = getBook(bookId);
  if (!book) return {};
  return { title: `${book.titleTh} — TheAll Bible Coffee`, description: book.overview };
}

export default async function BookOverviewPage({ params }: BookPageProps) {
  const { bookId } = await params;
  const book = getBook(bookId);
  if (!book) notFound();

  const firstChapter = availableChapters(book)[0];
  if (!firstChapter) notFound();
  const chapter = await loadChapter(book.id, firstChapter.number);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-20 pt-8 sm:pt-12">
      <nav aria-label="เส้นทางหน้า" className="text-sm">
        <Link href="/th" className="text-[var(--foreground-subtle)] underline underline-offset-4">
          ← หน้าแรก
        </Link>
      </nav>

      <header className="mt-8">
        {book.campTitle ? <p className="label">{book.campTitle}</p> : null}
        <h1 className="font-display mt-3 text-4xl font-semibold sm:text-5xl">{book.titleTh}</h1>
        <p className="mt-3 text-[var(--foreground-subtle)]">{book.subtitleTh}</p>
      </header>

      <hr className="rule-gold my-10" />

      <section aria-labelledby="overview">
        <h2 id="overview" className="label">
          หนังสือเล่มนี้พูดเรื่องอะไร
        </h2>
        <p className="reading-text mt-3 text-[var(--foreground-muted)]">{book.overview}</p>
      </section>

      <section aria-labelledby="why" className="mt-10">
        <h2 id="why" className="label">
          ทำไมจึงสำคัญกับเราวันนี้
        </h2>
        <p className="reading-text mt-3 text-[var(--foreground-muted)]">{book.whyItMatters}</p>
      </section>

      <ChapterCallToAction
        bookId={book.id}
        chapterNumber={firstChapter.number}
        chapterTitle={chapter.title}
        chapterSummary={chapter.summary}
        estimatedMinutes={chapter.estimatedMinutes}
      />

      <section aria-labelledby="outline" className="mt-14">
        <h2 id="outline" className="label">
          โครงของหนังสือ
        </h2>
        <p className="mt-2 text-sm text-[var(--foreground-subtle)]">
          ในรุ่นทดสอบนี้ เปิดให้อ่านเฉพาะบทที่มีเครื่องหมายว่าพร้อมแล้ว
          บทอื่นแสดงไว้เพื่อให้เห็นภาพรวมเท่านั้น และยังเขียนไม่เสร็จ
        </p>

        <ol className="mt-6">
          {book.chapters.map((item) => (
            <li key={item.number} className="border-t border-[var(--border)] last:border-b">
              {item.available ? (
                <Link
                  href={`/th/books/${book.id}/${item.number}`}
                  className="flex items-baseline gap-5 px-1 py-5 transition-colors hover:bg-[var(--surface-muted)]"
                >
                  <span className="font-display w-8 shrink-0 text-xl font-semibold text-[var(--accent)]">
                    {item.number}
                  </span>
                  <span className="flex-1">
                    <span className="block font-medium">{item.titleTh}</span>
                    <span className="mt-1 block text-sm text-[var(--accent)]">เปิดให้อ่านแล้ว</span>
                  </span>
                </Link>
              ) : (
                <div className="flex items-baseline gap-5 px-1 py-5 opacity-55">
                  <span className="font-display w-8 shrink-0 text-xl text-[var(--foreground-subtle)]">
                    {item.number}
                  </span>
                  <span className="flex-1">
                    <span className="block text-[var(--foreground-muted)]">{item.titleTh}</span>
                    <span className="mt-1 block text-sm text-[var(--foreground-subtle)]">
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
