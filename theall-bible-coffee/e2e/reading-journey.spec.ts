import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";

import type { Chapter } from "../src/lib/content/schema";

const here = path.dirname(fileURLToPath(import.meta.url));
const chapter = JSON.parse(
  readFileSync(path.join(here, "../content/books/ephesians/th/chapter-01.json"), "utf8"),
) as Chapter;

if (chapter.checkpoint === null || chapter.completion === null) {
  throw new Error("Ephesians 1 must keep its checkpoint and completion");
}
const { checkpoint, completion } = chapter;

const correctWords = checkpoint.correctOptionIds.map((id) => {
  const option = checkpoint.options.find((item) => item.id === id);
  if (!option) throw new Error(`missing checkpoint option ${id}`);
  return option.word;
});

test("a reader can go from the homepage to a copied piece of feedback", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  // 1. Homepage
  await page.goto("/th");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("พระคัมภีร์ที่ลึกพอให้เข้าใจ");

  // 2. Ephesians overview
  await page.getByRole("link", { name: "ดูภาพรวมของหนังสือเอเฟซัสก่อน" }).click();
  await expect(page).toHaveURL(/\/th\/books\/ephesians$/);
  await expect(page.getByRole("heading", { level: 1, name: "เอเฟซัส" })).toBeVisible();

  // 3. Chapter 1
  await page.getByRole("link", { name: "เริ่มอ่านบทที่ 1" }).first().click();
  await expect(page).toHaveURL(/\/th\/books\/ephesians\/1$/);

  // 4. Read through: the cup fills as the reader moves down the chapter.
  await page.getByRole("heading", { name: "ภาพเปรียบ — เงินมัดจำที่วางไว้แล้ว" }).scrollIntoViewIfNeeded();
  await expect
    .poll(async () => {
      const text = await page.locator("header ~ div, body").first().innerText();
      const match = /(\d+)%/.exec(text);
      return match ? Number(match[1]) : 0;
    })
    .toBeGreaterThan(0);

  // 5–6. Checkpoint with the correct three words
  await page.getByRole("button", { name: "หัวข้อในบทนี้" }).click();
  await page.getByRole("button", { name: "ทบทวนท้ายบท" }).click();
  for (const word of correctWords) {
    await page.getByRole("checkbox", { name: word }).check();
  }
  await page.getByRole("button", { name: "ตรวจคำตอบ" }).click();
  await expect(page.getByText(checkpoint.successMessage).first()).toBeVisible();

  // 7. Reflection
  await page.getByRole("textbox").fill("ตอนนี้กำลังพยายามพิสูจน์ตัวเองเรื่องงาน");
  await page.getByRole("button", { name: "ส่งคำตอบและอ่านจบบทนี้" }).click();

  // 8. Completion at 100%
  await expect(page.getByRole("heading", { name: completion.title })).toBeVisible();
  await expect(page.getByText("100%").first()).toBeVisible();

  // 9. Validation feedback
  await page.getByRole("button", { name: "ช่วยเราทำบทต่อไปให้ดีขึ้น" }).click();
  // The rating inputs are visually hidden inside their labels, so tap the label.
  await page.locator('label:has(input[name="understanding"][value="4"])').click();
  await page.getByRole("radio", { name: "อยากอ่านแน่นอน" }).check();
  await page
    .getByLabel("3. อะไรคือสิ่งที่ช่วยคุณมากที่สุด หรือเกือบทำให้คุณหยุดอ่าน?")
    .fill("ภาพเงินมัดจำช่วยมากที่สุด");
  await page.getByRole("button", { name: "บันทึกคำตอบ" }).click();

  // 10. Copyable summary
  await expect(page.getByText("ความเข้าใจเอเฟซัส 1: 4/5")).toBeVisible();
  await page.getByRole("button", { name: "คัดลอกผลตอบกลับ" }).click();
  await expect(page.getByText("คัดลอกเรียบร้อยแล้ว")).toBeVisible();

  // Progress survives a reload on the same device.
  await page.reload();
  await expect(page.getByRole("heading", { name: completion.title })).toBeVisible();
  await expect(page.getByText("100%").first()).toBeVisible();

  expect(consoleErrors).toEqual([]);
});
