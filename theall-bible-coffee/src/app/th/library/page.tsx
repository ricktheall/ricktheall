import type { Metadata } from "next";

import { LibraryGrid } from "@/components/library-grid";
import { TOTAL_CHAPTERS } from "@/lib/books/canon";

export const metadata: Metadata = {
  title: "66 แก้ว — TheAll Bible Coffee",
  description: "พระคัมภีร์ 66 เล่ม คือกาแฟ 66 แก้ว แก้วที่คว่ำแล้วคือเล่มที่คุณอ่านจบ",
};

export default function LibraryPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-10 sm:pt-14">
      <p className="text-sm font-medium tracking-wide text-[var(--accent)]">
        66 แก้ว · 66 เล่ม · เรื่องเดียว
      </p>
      <h1 className="mt-3 font-serif text-[1.7rem] font-semibold leading-[1.5] tracking-tight sm:text-[2.1rem]">
        ห้องสมุดกาแฟ
      </h1>
      <p className="reading-lead mt-4 text-[var(--foreground-muted)]">
        พระคัมภีร์ทั้ง {TOTAL_CHAPTERS.toLocaleString("th-TH")} บท อยู่ในแก้ว 66 ใบนี้
        แก้วที่ยังเบลอคือเล่มที่เรากำลังเตรียมบทเรียนอยู่ และแก้วที่คว่ำแล้ว
        คือเล่มที่คุณอ่านจบไปแล้ว
      </p>

      <LibraryGrid />
    </div>
  );
}
