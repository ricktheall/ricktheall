/**
 * Book-level metadata for the single book available in this MVP.
 * Chapters 2–6 are listed for orientation only — they are not readable content.
 */
export const EPHESIANS = {
  id: "ephesians",
  titleTh: "เอเฟซัส",
  subtitleTh: "จดหมายถึงคริสตจักรที่อยู่ท่ามกลางอำนาจมากมาย",
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
} as const;

export const EPHESIANS_1_CHAPTER_KEY = "ephesians-01";
