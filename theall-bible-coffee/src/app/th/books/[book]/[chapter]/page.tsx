import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ChapterFlow } from "@/components/reader/chapter-flow";
import { ChapterReader } from "@/components/reader/chapter-reader";
import { findBook } from "@/lib/books/canon";
import { listBooksWithContent, listPublishedChapters } from "@/lib/content/index";
import { loadChapter } from "@/lib/content/loader";

interface RouteParams {
  params: Promise<{ book: string; chapter: string }>;
}

/**
 * Every published chapter becomes a static route. Adding a chapter is
 * therefore a content-only change — no new file in `app/` is ever needed.
 */
export async function generateStaticParams(): Promise<{ book: string; chapter: string }[]> {
  const books = await listBooksWithContent();
  const params: { book: string; chapter: string }[] = [];
  for (const book of books) {
    for (const chapter of await listPublishedChapters(book)) {
      params.push({ book, chapter: String(chapter) });
    }
  }
  return params;
}

async function resolve(params: RouteParams["params"]) {
  const { book: bookId, chapter } = await params;
  const book = findBook(bookId);
  const chapterNumber = Number.parseInt(chapter, 10);
  if (book === undefined || !Number.isInteger(chapterNumber)) return null;
  if (!(await listPublishedChapters(bookId)).includes(chapterNumber)) return null;
  return { book, chapterNumber };
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const resolved = await resolve(params);
  if (resolved === null) return { title: "ไม่พบบทนี้ — TheAll Bible Coffee" };

  const chapter = await loadChapter(resolved.book.id, resolved.chapterNumber);
  return { title: `${chapter.title} — TheAll Bible Coffee`, description: chapter.summary };
}

export default async function ChapterPage({ params }: RouteParams) {
  const resolved = await resolve(params);
  if (resolved === null) notFound();

  const chapter = await loadChapter(resolved.book.id, resolved.chapterNumber);

  /*
   * Chapters written against the Scripture-first model opt in simply by
   * carrying a `scripture` layer. Everything written before it — Ephesians 1 —
   * keeps the reader it was authored for, unchanged.
   */
  if (chapter.scripture === undefined) {
    return <ChapterReader chapter={chapter} />;
  }

  const published = await listPublishedChapters(resolved.book.id);
  const nextChapter = published.find((n) => n > resolved.chapterNumber) ?? null;

  return <ChapterFlow book={resolved.book} chapter={chapter} nextChapter={nextChapter} />;
}
