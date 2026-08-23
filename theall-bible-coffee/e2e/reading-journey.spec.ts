import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";

import type { Chapter } from "../src/lib/content/schema";

const here = path.dirname(fileURLToPath(import.meta.url));

function loadChapter(bookId: string): Chapter {
  return JSON.parse(
    readFileSync(path.join(here, `../content/books/${bookId}/th/chapter-01.json`), "utf8"),
  ) as Chapter;
}

function correctWordsOf(chapter: Chapter): string[] {
  return chapter.checkpoint.correctOptionIds.map((id) => {
    const option = chapter.checkpoint.options.find((item) => item.id === id);
    if (!option) throw new Error(`missing checkpoint option ${id}`);
    return option.word;
  });
}

test("a reader can go from the homepage to a copied piece of feedback", async ({ page }) => {
  const chapter = loadChapter("revelation");
  const correctWords = correctWordsOf(chapter);

  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  // 1. Homepage
  await page.goto("/th");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("พระคัมภีร์ที่ลึกพอให้เข้าใจ");

  // 2. Book overview
  await page.getByRole("link", { name: "ดูภาพรวมของค่ายวิวรณ์ก่อน" }).click();
  await expect(page).toHaveURL(/\/th\/books\/revelation$/);
  await expect(page.getByRole("heading", { level: 1, name: "วิวรณ์" })).toBeVisible();

  // 3. Chapter 1
  await page.getByRole("link", { name: "เริ่มอ่านบทที่ 1" }).first().click();
  await expect(page).toHaveURL(/\/th\/books\/revelation\/1$/);

  // 4. Read-aloud is offered on the chapter page.
  await expect(page.getByRole("button", { name: "อ่านออกเสียง" })).toBeVisible();

  // 5. Reading fills the cup.
  await page.getByRole("heading", { name: /ภาพเปรียบ/ }).scrollIntoViewIfNeeded();
  await expect
    .poll(async () => {
      const text = await page.locator(".sticky").last().innerText();
      const match = /(\d+)%/.exec(text);
      return match ? Number(match[1]) : 0;
    })
    .toBeGreaterThan(0);

  // 6–7. Checkpoint with the correct three words
  await page.getByRole("button", { name: "หัวข้อในบทนี้" }).click();
  await page.getByRole("button", { name: "ทบทวนท้ายบท" }).click();
  for (const word of correctWords) {
    await page.getByRole("checkbox", { name: word }).check();
  }
  await page.getByRole("button", { name: "ตรวจคำตอบ" }).click();
  await expect(page.getByText(chapter.checkpoint.successMessage).first()).toBeVisible();

  // 8. Reflection
  await page.getByRole("textbox").fill("ตอนนี้กำลังรอเรื่องงานอยู่");
  await page.getByRole("button", { name: "ส่งคำตอบและอ่านจบบทนี้" }).click();

  // 9. Completion at 100%, with points awarded
  await expect(page.getByRole("heading", { name: chapter.completion.title })).toBeVisible();
  await expect(page.getByText("100%").first()).toBeVisible();
  await expect(page.getByText("เต็มทุกส่วนของบทนี้")).toBeVisible();

  // 10. Validation feedback
  await page.getByRole("button", { name: "ช่วยเราทำบทต่อไปให้ดีขึ้น" }).click();
  // The rating inputs are visually hidden inside their labels, so tap the label.
  await page.locator('label:has(input[name="understanding"][value="4"])').click();
  await page.getByRole("radio", { name: "อยากอ่านแน่นอน" }).check();
  await page
    .getByLabel("3. อะไรคือสิ่งที่ช่วยคุณมากที่สุด หรือเกือบทำให้คุณหยุดอ่าน?")
    .fill("ภาพกุญแจช่วยมากที่สุด");
  await page.getByRole("button", { name: "บันทึกคำตอบ" }).click();

  // 11. Copyable summary
  await expect(page.getByText("ความเข้าใจวิวรณ์ 1: 4/5")).toBeVisible();
  await page.getByRole("button", { name: "คัดลอกผลตอบกลับ" }).click();
  await expect(page.getByText("คัดลอกเรียบร้อยแล้ว")).toBeVisible();

  // Progress survives a reload on the same device.
  await page.reload();
  await expect(page.getByRole("heading", { name: chapter.completion.title })).toBeVisible();
  await expect(page.getByText("100%").first()).toBeVisible();

  expect(consoleErrors).toEqual([]);
});

test("the second book is still reachable and scores separately", async ({ page }) => {
  const chapter = loadChapter("ephesians");

  await page.goto("/th/books/ephesians/1");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "สิ่งที่พระเจ้าทำเสร็จแล้ว",
  );
  await expect(page.getByRole("button", { name: "อ่านออกเสียง" })).toBeVisible();

  // A wrong answer costs points but never progress.
  const wrong = chapter.checkpoint.options
    .filter((option) => !chapter.checkpoint.correctOptionIds.includes(option.id))
    .slice(0, 3);
  await page.getByRole("button", { name: "หัวข้อในบทนี้" }).click();
  await page.getByRole("button", { name: "ทบทวนท้ายบท" }).click();
  for (const option of wrong) {
    await page.getByRole("checkbox", { name: option.word }).check();
  }
  await page.getByRole("button", { name: "ตรวจคำตอบ" }).click();
  await expect(page.getByText(chapter.checkpoint.retryMessage)).toBeVisible();
  await expect(page.getByRole("heading", { name: chapter.completion.title })).toHaveCount(0);
});
