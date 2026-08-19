import type { Metadata } from "next";
import Link from "next/link";

import { BookShelf } from "@/components/book-shelf";
import { BOOKS, availableChapters } from "@/lib/content/books";
import { loadChapter } from "@/lib/content/loader";

export const metadata: Metadata = {
  title: "TheAll Bible Coffee — เริ่มที่ค่ายวิวรณ์",
  description: "พระคัมภีร์ที่ลึกพอให้เข้าใจ อบอุ่นพอให้อยากอยู่ และชัดพอให้นำไปใช้จริง",
};

export default async function ThaiHomePage() {
  const shelf = await Promise.all(
    BOOKS.map(async (book) => {
      const first = availableChapters(book)[0];
      if (!first) return null;
      const chapter = await loadChapter(book.id, first.number);
      return {
        bookId: book.id,
        titleTh: book.titleTh,
        campTitle: book.campTitle,
        chapterNumber: first.number,
        chapterTitle: chapter.title,
        chapterSummary: chapter.summary,
        estimatedMinutes: chapter.estimatedMinutes,
      };
    }),
  );

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-20 pt-12 sm:pt-20">
      <section aria-labelledby="promise">
        <p className="label">หนึ่งแก้ว · หนึ่งบท · หนึ่งวัน</p>
        <h1
          id="promise"
          className="font-display mt-6 text-[1.85rem] font-semibold leading-[1.4] sm:text-[2.9rem]"
        >
          พระคัมภีร์ที่ลึกพอให้เข้าใจ
          <br />
          อบอุ่นพอให้อยากอยู่
          <br />
          และชัดพอให้นำไปใช้จริง
        </h1>
        <p className="reading-lead mt-7 text-[var(--foreground-muted)]">
          TheAll Bible Coffee คือที่ที่คุณนั่งลงกับพระคัมภีร์หนึ่งบท แบบไม่ต้องรีบ
          ไม่ต้องรู้ศัพท์เทววิทยามาก่อน และไม่ต้องรู้สึกผิดถ้าคุณหายไปหลายเดือน
        </p>
      </section>

      <hr className="rule-gold my-14" />

      <section aria-labelledby="how">
        <h2 id="how" className="label">
          หนึ่งบททำงานอย่างไร
        </h2>
        <ol className="mt-6 space-y-5">
          <li className="flex gap-5">
            <span aria-hidden="true" className="font-display text-lg text-[var(--accent)]">
              01
            </span>
            <span className="text-[0.95rem] text-[var(--foreground-muted)]">
              เริ่มจากเรื่องของคนจริง ต่อด้วยบริบทของยุคนั้น แล้วค่อยลงลึกถึงคำในภาษากรีก
            </span>
          </li>
          <li className="flex gap-5">
            <span aria-hidden="true" className="font-display text-lg text-[var(--accent)]">
              02
            </span>
            <span className="text-[0.95rem] text-[var(--foreground-muted)]">
              อ่านเองหรือกดให้อ่านออกเสียงก็ได้ เหมาะกับตอนขับรถหรือเดินทาง
            </span>
          </li>
          <li className="flex gap-5">
            <span aria-hidden="true" className="font-display text-lg text-[var(--accent)]">
              03
            </span>
            <span className="text-[0.95rem] text-[var(--foreground-muted)]">
              จบด้วยการทบทวนสั้น ๆ สามคำ และคำถามให้คุณตอบกับตัวเองหนึ่งข้อ เก็บแต้มได้ 100
              แต้มต่อบท
            </span>
          </li>
        </ol>
      </section>

      <hr className="rule-gold my-14" />

      <BookShelf items={shelf.filter((item) => item !== null)} />

      <section
        aria-labelledby="disclosure"
        className="mt-16 border border-[var(--border)] bg-[var(--surface-muted)] p-5 sm:p-6"
      >
        <h2 id="disclosure" className="label text-[var(--foreground-subtle)]">
          ก่อนเริ่ม มีสามเรื่องที่เราอยากบอกตรง ๆ
        </h2>
        <ul className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--foreground-muted)]">
          <li>ความคืบหน้าและแต้มของคุณถูกเก็บไว้ในเบราว์เซอร์บนเครื่องนี้เท่านั้น ถ้าเปลี่ยนเครื่องจะเริ่มใหม่</li>
          <li>ไม่มีการสมัครสมาชิก ไม่ต้องใช้อีเมล และเราไม่ได้เก็บชื่อของคุณ</li>
          <li>
            คำตอบในส่วนใคร่ครวญเป็นของคุณคนเดียว ไม่ถูกส่งออกไปไหน และไม่ถูกบันทึกไว้หลังจากคุณกดส่ง
          </li>
        </ul>
        <p className="mt-5 text-xs text-[var(--foreground-subtle)]">
          นี่คือรุ่นทดสอบทางเทคนิค (Technical Beta) เนื้อหายังเป็นฉบับร่างและอยู่ระหว่างการตรวจทาน
        </p>
      </section>

      <p className="mt-12 text-center text-sm">
        <Link
          href="/th/books/revelation"
          className="font-medium text-[var(--accent)] underline underline-offset-4"
        >
          ดูภาพรวมของค่ายวิวรณ์ก่อน
        </Link>
      </p>
    </div>
  );
}
