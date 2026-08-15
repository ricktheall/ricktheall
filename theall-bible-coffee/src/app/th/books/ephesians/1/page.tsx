import type { Metadata } from "next";

import { ChapterReader } from "@/components/reader/chapter-reader";
import { loadEphesians1 } from "@/lib/content/loader";

export async function generateMetadata(): Promise<Metadata> {
  const chapter = await loadEphesians1();
  return {
    title: `${chapter.title} — TheAll Bible Coffee`,
    description: chapter.summary,
  };
}

export default async function EphesiansChapterOnePage() {
  const chapter = await loadEphesians1();
  return <ChapterReader chapter={chapter} />;
}
