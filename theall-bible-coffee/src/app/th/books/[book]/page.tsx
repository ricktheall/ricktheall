import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BookMap } from "@/components/book-map";
import { findBook } from "@/lib/books/canon";
import { loadBookContent } from "@/lib/content/book-loader";
import { listPublishedChapters } from "@/lib/content/index";

interface RouteParams {
  params: Promise<{ book: string }>;
}

/**
 * Book overview driven by `content/books/<id>/th/book.json`.
 *
 * Ephesians keeps its own hand-written page for now — that route is a static
 * segment, so Next serves it in preference to this one and nothing about the
 * existing experience changes.
 */
export async function generateStaticParams(): Promise<{ book: string }[]> {
  // Only books that actually have a map. Everything else keeps the library view.
  return [{ book: "genesis" }];
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { book: bookId } = await params;
  const book = findBook(bookId);
  if (book === undefined) return { title: "ไม่พบเล่มนี้ — TheAll Bible Coffee" };
  return {
    title: `${book.nameTh} — TheAll Bible Coffee`,
    description: `แผนที่ของ${book.nameTh} ${book.chapterCount} บท`,
  };
}

export default async function BookOverviewPage({ params }: RouteParams) {
  const { book: bookId } = await params;
  const book = findBook(bookId);
  if (book === undefined) notFound();

  const content = await loadBookContent(bookId);
  if (content === null) notFound();

  const publishedChapters = await listPublishedChapters(bookId);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-20 pt-10 sm:pt-14">
      <p className="text-sm font-medium tracking-wide text-[var(--accent)]">
        {book.nameEn} · {book.chapterCount} บท
      </p>
      <h1 className="mt-2 font-serif text-[1.9rem] font-semibold leading-[1.4] tracking-tight sm:text-[2.3rem]">
        {book.nameTh}
      </h1>
      <p className="reading-lead mt-4 text-[var(--foreground-muted)]">{content.overview}</p>

      {content.whyItMatters !== undefined && (
        <p className="mt-4 border-l-2 border-[var(--accent)] pl-4 text-[0.95rem] text-[var(--foreground-muted)]">
          {content.whyItMatters}
        </p>
      )}

      {publishedChapters.length === 0 && (
        <p className="mt-6 rounded-lg border border-dashed border-[var(--border)] px-4 py-3 text-[0.85rem] text-[var(--foreground-subtle)]">
          แผนที่ของเล่มนี้พร้อมแล้ว ส่วนบทเรียนรายบทกำลังเตรียมอยู่
        </p>
      )}

      <BookMap book={book} content={content} publishedChapters={publishedChapters} />
    </div>
  );
}
