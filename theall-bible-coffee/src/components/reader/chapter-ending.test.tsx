import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import chapterJson from "../../../content/books/ephesians/th/chapter-01.json";
import { ChapterEnding } from "./chapter-ending";
import { chapterSchema } from "@/lib/content/schema";
import { ProgressProvider } from "@/lib/progress/provider";

const chapter = chapterSchema.parse(chapterJson);

const { checkpoint, completion } = chapter;
if (checkpoint === null || completion === null || chapter.reflection === null) {
  throw new Error("The Ephesians 1 fixture must keep its checkpoint, reflection and completion");
}

const wordFor = (optionId: string): string => {
  const option = checkpoint.options.find((item) => item.id === optionId);
  if (!option) throw new Error(`missing option ${optionId}`);
  return option.word;
};

const correctWords = checkpoint.correctOptionIds.map(wordFor);
const distractorWord = wordFor(
  checkpoint.options.find(
    (option) => !checkpoint.correctOptionIds.includes(option.id),
  )!.id,
);

function renderEnding() {
  return render(
    <ProgressProvider>
      <ChapterEnding chapter={chapter} />
    </ProgressProvider>,
  );
}

const check = (word: string) => screen.getByRole("checkbox", { name: word });

describe("chapter ending flow", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("keeps the submit button disabled until exactly three words are chosen", async () => {
    const user = userEvent.setup();
    renderEnding();

    const submit = await screen.findByRole("button", { name: "ตรวจคำตอบ" });
    expect(submit).toBeDisabled();

    await user.click(check(correctWords[0]!));
    await user.click(check(correctWords[1]!));
    expect(submit).toBeDisabled();

    await user.click(check(correctWords[2]!));
    expect(submit).toBeEnabled();
  });

  it("does not complete the chapter when the answer is wrong", async () => {
    const user = userEvent.setup();
    renderEnding();

    await user.click(check(correctWords[0]!));
    await user.click(check(correctWords[1]!));
    await user.click(check(distractorWord));
    await user.click(await screen.findByRole("button", { name: "ตรวจคำตอบ" }));

    expect(screen.getByText(checkpoint.retryMessage)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "กลับไปทบทวน" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ลองอีกครั้ง" })).toBeInTheDocument();
    expect(screen.queryByText(completion.title)).not.toBeInTheDocument();
  });

  it("requires a reflection answer before the chapter completes", async () => {
    const user = userEvent.setup();
    renderEnding();

    for (const word of correctWords) await user.click(check(word));
    await user.click(await screen.findByRole("button", { name: "ตรวจคำตอบ" }));

    const submitReflection = await screen.findByRole("button", {
      name: "ส่งคำตอบและอ่านจบบทนี้",
    });
    await user.click(submitReflection);

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText(completion.title)).not.toBeInTheDocument();
  });

  it("fills the cup to 100% after the checkpoint and the reflection", async () => {
    const user = userEvent.setup();
    renderEnding();

    for (const word of correctWords) await user.click(check(word));
    await user.click(await screen.findByRole("button", { name: "ตรวจคำตอบ" }));

    await user.type(
      await screen.findByRole("textbox"),
      "เรื่องงานที่ยังพยายามพิสูจน์ตัวเองอยู่",
    );
    await user.click(screen.getByRole("button", { name: "ส่งคำตอบและอ่านจบบทนี้" }));

    expect(await screen.findByText(completion.title)).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(
      screen.getByText("คุณอ่านเอเฟซัสบทที่ 1 จบแล้ว ความคืบหน้า 100 เปอร์เซ็นต์"),
    ).toBeInTheDocument();
  });

  it("opens the three validation questions and offers a copyable summary", async () => {
    const user = userEvent.setup();
    renderEnding();

    for (const word of correctWords) await user.click(check(word));
    await user.click(await screen.findByRole("button", { name: "ตรวจคำตอบ" }));
    await user.type(await screen.findByRole("textbox"), "ภาพเงินมัดจำช่วยมากที่สุด");
    await user.click(screen.getByRole("button", { name: "ส่งคำตอบและอ่านจบบทนี้" }));

    await user.click(
      await screen.findByRole("button", { name: "ช่วยเราทำบทต่อไปให้ดีขึ้น" }),
    );

    await user.click(await screen.findByRole("radio", { name: "4 คะแนน จาก 5" }));
    await user.click(screen.getByRole("radio", { name: "อยากอ่านแน่นอน" }));
    await user.type(
      screen.getByLabelText("3. อะไรคือสิ่งที่ช่วยคุณมากที่สุด หรือเกือบทำให้คุณหยุดอ่าน?"),
      "ภาพเงินมัดจำ",
    );
    await user.click(screen.getByRole("button", { name: "บันทึกคำตอบ" }));

    expect(await screen.findByRole("button", { name: "คัดลอกผลตอบกลับ" })).toBeInTheDocument();
    expect(screen.getByText(/ความเข้าใจเอเฟซัส 1: 4\/5/)).toBeInTheDocument();
    expect(screen.getByText(/ความอยากอ่านบทที่ 2: อยากอ่านแน่นอน/)).toBeInTheDocument();
  });
});
