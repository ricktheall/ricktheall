import type { Metadata } from "next";
import Link from "next/link";

import { HomeContinueCard } from "@/components/home-continue-card";
import { EPHESIANS } from "@/lib/content/book";
import { loadEphesians1 } from "@/lib/content/loader";

export const metadata: Metadata = {
  title: "TheAll Bible Coffee — เริ่มที่เอเฟซัสบทที่ 1",
  description:
    "พระคัมภีร์ที่ลึกพอให้เข้าใจ อบอุ่นพอให้อยากอยู่ และชัดพอให้นำไปใช้จริง",
};

export default async function ThaiHomePage() {
  const chapter = await loadEphesians1();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-10 sm:pt-16">
      <section aria-labelledby="promise">
        <p className="text-sm font-medium tracking-wide text-[var(--accent)]">
          อ่านพระคัมภีร์ช้า ๆ วันละแก้ว
        </p>
        <h1
          id="promise"
          className="mt-3 font-serif text-[1.9rem] font-semibold leading-[1.5] tracking-tight sm:text-[2.4rem]"
        >
          พระคัมภีร์ที่ลึกพอให้เข้าใจ
          <br className="hidden sm:block" /> อบอุ่นพอให้อยากอยู่
          <br className="hidden sm:block" /> และชัดพอให้นำไปใช้จริง
        </h1>
        <p className="reading-lead mt-5 text-[var(--foreground-muted)]">
          TheAll Bible Coffee คือที่ที่คุณนั่งลงกับพระคัมภีร์หนึ่งบท
          แบบไม่ต้องรีบ ไม่ต้องรู้ศัพท์เทววิทยามาก่อน
          และไม่ต้องรู้สึกผิดถ้าคุณหายไปหลายเดือน
        </p>
      </section>

      <section aria-labelledby="how" className="mt-12">
        <h2 id="how" className="text-lg font-semibold tracking-tight">
          หนึ่งบท ใช้เวลาประมาณ {chapter.estimatedMinutes} นาที
        </h2>
        <ol className="mt-4 space-y-3 text-[0.95rem] text-[var(--foreground-muted)]">
          <li className="flex gap-3">
            <span aria-hidden="true" className="font-semibold text-[var(--accent)]">
              1
            </span>
            <span>
              อ่านคำอธิบายที่เริ่มจากชีวิตจริง ต่อด้วยบริบทของยุคนั้น
              แล้วค่อยลงลึกถึงคำในภาษากรีก
            </span>
          </li>
          <li className="flex gap-3">
            <span aria-hidden="true" className="font-semibold text-[var(--accent)]">
              2
            </span>
            <span>แก้วกาแฟด้านบนจะค่อย ๆ เต็มขึ้นตามที่คุณอ่าน และจำไว้ให้เองว่าคุณค้างไว้ตรงไหน</span>
          </li>
          <li className="flex gap-3">
            <span aria-hidden="true" className="font-semibold text-[var(--accent)]">
              3
            </span>
            <span>
              จบด้วยการทบทวนสั้น ๆ สามคำ และคำถามให้คุณตอบกับตัวเองหนึ่งข้อ ไม่มีคะแนน
              ไม่มีการตัดสิน
            </span>
          </li>
        </ol>
      </section>

      <section aria-labelledby="first-book" className="mt-12">
        <h2 id="first-book" className="text-lg font-semibold tracking-tight">
          เล่มแรกที่เปิดให้อ่าน
        </h2>
        <HomeContinueCard
          bookTitle={EPHESIANS.titleTh}
          chapterTitle={chapter.title}
          chapterSummary={chapter.summary}
          estimatedMinutes={chapter.estimatedMinutes}
        />
      </section>

      <section
        aria-labelledby="disclosure"
        className="mt-12 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-5"
      >
        <h2 id="disclosure" className="text-sm font-semibold tracking-tight">
          ก่อนเริ่ม มีสามเรื่องที่เราอยากบอกตรง ๆ
        </h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--foreground-muted)]">
          <li>ความคืบหน้าของคุณถูกเก็บไว้ในเบราว์เซอร์บนเครื่องนี้เท่านั้น ถ้าเปลี่ยนเครื่องจะเริ่มใหม่</li>
          <li>ไม่มีการสมัครสมาชิก ไม่ต้องใช้อีเมล และเราไม่ได้เก็บชื่อของคุณ</li>
          <li>
            คำตอบในส่วนใคร่ครวญเป็นของคุณคนเดียว ไม่ถูกส่งออกไปไหน
            และไม่ถูกบันทึกไว้หลังจากคุณกดส่ง
          </li>
        </ul>
        <p className="mt-4 text-xs text-[var(--foreground-subtle)]">
          นี่คือรุ่นทดสอบทางเทคนิค (Technical Beta) เนื้อหาบทที่ 1 ยังเป็นฉบับร่าง
          และอยู่ระหว่างการตรวจทาน
        </p>
      </section>

      <p className="mt-10 text-center text-sm">
        <Link
          href="/th/books/ephesians"
          className="font-medium text-[var(--accent)] underline underline-offset-4"
        >
          ดูภาพรวมของหนังสือเอเฟซัสก่อน
        </Link>
      </p>
    </div>
  );
}
