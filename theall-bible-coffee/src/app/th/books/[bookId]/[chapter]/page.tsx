import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ChapterReader } from "@/components/reader/chapter-reader";
import { BOOKS, availableChapters, getBook } from "@/lib/content/books";
import { loadChapter } from "@/lib/content/loader";

interface ChapterPageProps {
  params: Promise<{ bookId: string; chapter: string }>;
}

export function generateStaticParams() {
  return BOOKS.flatMap((book) =>
    availableChapters(book).map((entry) => ({
      bookId: book.id,
      chapter: String(entry.number),
    })),
  );
}

async function resolve(params: ChapterPageProps["params"]) {
  const { bookId, chapter } = await params;
  const book = getBook(bookId);
  const chapterNumber = Number(chapter);
  if (!book || !Number.isInteger(chapterNumber)) return null;
  const entry = book.chapters.find((item) => item.number === chapterNumber && item.available);
  if (!entry) return null;
  return { book, chapterNumber };
}

export async function generateMetadata({ params }: ChapterPageProps): Promise<Metadata> {
  const resolved = await resolve(params);
  if (!resolved) return {};
  const chapter = await loadChapter(resolved.book.id, resolved.chapterNumber);
  return { title: `${chapter.title} — TheAll Bible Coffee`, description: chapter.summary };
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  const resolved = await resolve(params);
  if (!resolved) notFound();

  const chapter = await loadChapter(resolved.book.id, resolved.chapterNumber);
  return <ChapterReader chapter={chapter} book={resolved.book} />;
}
