import type { z } from "zod";

import type { scriptureLayerSchema } from "@/lib/content/schema";

type Scripture = z.infer<typeof scriptureLayerSchema>;

/**
 * Scripture, first and without ceremony.
 *
 * Nothing unnecessary stands between tapping a chapter and reading the text —
 * no modal, no lesson gate, no "opening the Word…" screen over an empty page.
 *
 * Two honest states:
 *   licensed        the text itself, with its attribution and licence
 *   reference-only  the address of the passage and a plain invitation to open
 *                   your own Bible, with the reason we are not printing it
 *
 * The second is not a placeholder to be quietly upgraded. Printing text we do
 * not have the right to print would be worse than asking the reader to open a
 * Bible, so this state is designed to be read, not to be apologised for.
 */
export function ScripturePanel({ scripture }: { scripture: Scripture }) {
  const licensed = scripture.rightsStatus === "licensed" && scripture.text !== null;

  return (
    <section aria-labelledby="scripture-heading" className="mt-6">
      <h2
        id="scripture-heading"
        className="font-serif text-[1.3rem] font-semibold tracking-tight sm:text-[1.5rem]"
      >
        {scripture.reference}
      </h2>

      {licensed ? (
        <>
          <div className="reading-text mt-4 whitespace-pre-line text-[var(--foreground)]">
            {scripture.text}
          </div>
          <p className="mt-4 border-t border-[var(--border)] pt-3 text-[0.72rem] leading-relaxed text-[var(--foreground-subtle)]">
            {scripture.attribution}
            {scripture.license !== null && <> · {scripture.license}</>}
            {scripture.copyrightNotice !== null && (
              <>
                <br />
                {scripture.copyrightNotice}
              </>
            )}
          </p>
        </>
      ) : (
        <div className="mt-4 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] p-5">
          <p className="reading-text text-[var(--foreground)]">
            เปิดพระคัมภีร์ของคุณที่ <strong>{scripture.reference}</strong> แล้วอ่านช้า ๆ หนึ่งรอบ
            ก่อนไปต่อ
          </p>
          <p className="mt-3 text-[0.8rem] leading-relaxed text-[var(--foreground-subtle)]">
            เรายังไม่ได้พิมพ์ตัวบทไว้ตรงนี้ เพราะยังไม่ได้ยืนยันสิทธิ์การใช้ฉบับแปลอย่างครบถ้วน
            เมื่อยืนยันแล้ว ตัวบทเต็มจะปรากฏที่นี่พร้อมเครดิตฉบับแปล
          </p>
        </div>
      )}
    </section>
  );
}
