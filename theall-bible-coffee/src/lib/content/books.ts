/**
 * Book registry for the MVP. Only chapters marked `available` have content
 * files and readable pages; the rest exist so a reader can see the shape of
 * the book without being promised something that is not written yet.
 */

export interface ChapterEntry {
  number: number;
  titleTh: string;
  available: boolean;
}

export interface BookEntry {
  id: string;
  titleTh: string;
  subtitleTh: string;
  /** Shown on the home page as the reason to open this book now. */
  campTitle: string | null;
  overview: string;
  whyItMatters: string;
  chapters: ChapterEntry[];
}

export const BOOKS: BookEntry[] = [
  {
    id: "revelation",
    titleTh: "วิวรณ์",
    subtitleTh: "จะใช้ชีวิตอย่างไรในยุคสุดท้าย",
    campTitle: "ค่ายวิวรณ์ · จะใช้ชีวิตอย่างไรในยุคสุดท้าย",
    overview:
      "วิวรณ์ไม่ใช่รหัสลับสำหรับทำนายวันสิ้นโลก แต่เป็นจดหมายถึงคริสตจักรที่กำลังเหนื่อย เพื่อบอกว่าใครกำลังครองบัลลังก์อยู่จริง ๆ และเรื่องนี้จบอย่างไร",
    whyItMatters:
      "เมื่อข่าวร้ายมาเร็วกว่าที่ใจจะรับไหว คำถามของเราไม่ใช่ “โลกจะจบเมื่อไร” แต่คือ “แล้วฉันจะอยู่อย่างไรในวันจันทร์หน้า” วิวรณ์บทที่ 1 ตอบคำถามนั้นด้วยการเปิดม่านให้เห็นพระเยซูที่ทรงพระชนม์อยู่ก่อน",
    chapters: [
      { number: 1, titleTh: "ผู้ที่ทรงพระชนม์อยู่ ยืนอยู่กลางคริสตจักร", available: true },
      { number: 2, titleTh: "จดหมายถึงคริสตจักร (ตอนที่หนึ่ง)", available: false },
      { number: 3, titleTh: "จดหมายถึงคริสตจักร (ตอนที่สอง)", available: false },
      { number: 4, titleTh: "บัลลังก์ในสวรรค์", available: false },
      { number: 5, titleTh: "พระเมษโปดกผู้ทรงคู่ควร", available: false },
      { number: 21, titleTh: "ฟ้าใหม่และแผ่นดินโลกใหม่", available: false },
    ],
  },
  {
    id: "ephesians",
    titleTh: "เอเฟซัส",
    subtitleTh: "จดหมายถึงคริสตจักรที่อยู่ท่ามกลางอำนาจมากมาย",
    campTitle: null,
    overview:
      "เอเฟซัสเป็นจดหมายสั้น ๆ หกบทที่เปาโลเขียนขณะถูกจองจำ ครึ่งแรกพูดถึงสิ่งที่พระเจ้าทำเสร็จแล้วในพระคริสต์ ครึ่งหลังพูดถึงการใช้ชีวิตที่สอดคล้องกับสิ่งนั้น",
    whyItMatters:
      "หลายคนเหนื่อยกับการพยายามพิสูจน์ว่าตัวเองดีพอ ทั้งกับคนรอบตัวและกับพระเจ้า เอเฟซัสไม่ได้ตอบด้วยการเพิ่มสิ่งที่ต้องทำ แต่ตอบด้วยการบอกว่าอะไรที่ถูกทำเสร็จไปแล้ว และคุณเป็นใครในสายพระเนตรของพระเจ้าตั้งแต่ก่อนคุณเริ่มพยายาม",
    chapters: [
      { number: 1, titleTh: "สิ่งที่พระเจ้าทำเสร็จแล้ว", available: true },
      { number: 2, titleTh: "จากความตายสู่ชีวิต และจากคนแปลกหน้าสู่ครอบครัว", available: false },
      { number: 3, titleTh: "ข้อล้ำลึกที่ถูกเปิดเผย", available: false },
      { number: 4, titleTh: "ชีวิตที่สมกับการทรงเรียก", available: false },
      { number: 5, titleTh: "เดินในความสว่างและความรัก", available: false },
      { number: 6, titleTh: "ยุทธภัณฑ์และการยืนหยัด", available: false },
    ],
  },
];

export function getBook(bookId: string): BookEntry | undefined {
  return BOOKS.find((book) => book.id === bookId);
}

/** Stable per-chapter key used by the progress store. Never rename these. */
export function chapterKey(bookId: string, chapterNumber: number): string {
  return `${bookId}-${String(chapterNumber).padStart(2, "0")}`;
}

export function availableChapters(book: BookEntry): ChapterEntry[] {
  return book.chapters.filter((chapter) => chapter.available);
}
