/*
 * lessons.js — TheAll Bible Coffee V2
 * ทะเบียนบทเรียน: บอกว่าเล่มไหน "พร้อมอ่าน" และเก็บเนื้อหาบทเรียนจริง
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  สำคัญ / IMPORTANT
 *  ไฟล์นี้คือ "ช่องเสียบเนื้อหา" (content slot) เท่านั้น
 *  ห้ามสร้างเนื้อหาบทเรียนขึ้นเองเพื่อให้ดูเหมือนครบ — ถ้ายังไม่มีเนื้อหา
 *  ให้เล่มนั้นเป็น coming_soon แล้วแอปจะแสดงสถานะ "กำลังเตรียม" อย่างสวยงาม
 *
 *  This file is a content slot, never a content generator. Never invent
 *  Bible-study material to make the library look complete.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * วิธีเพิ่มเล่มที่พร้อมอ่าน / How to publish a book
 *   1. ใส่รหัสเล่มใน READY_BOOKS
 *   2. (ถ้ามีเนื้อหาบทเรียนจริงแล้ว) ใส่ใน LESSON_CONTENT ตามรูปแบบด้านล่าง
 *
 *   LESSON_CONTENT['GEN'] = {
 *     intro:    { th: '…', en: '…' },        // ไม่บังคับ
 *     chapters: {
 *       1: {
 *         title:  { th: '…', en: '…' },      // ไม่บังคับ
 *         brew:   { th: '…', en: '…' },      // ไม่บังคับ — ช่วง BREW
 *         read:   { th: '…', en: '…' },      // ไม่บังคับ — ช่วง READ
 *         live:   { th: '…', en: '…' },      // ไม่บังคับ — ช่วง LIVE
 *       },
 *     },
 *   };
 *
 * ถ้ายังไม่มีเนื้อหาของบทใด แอปจะแสดง "จังหวะประจำวัน" (BREW → READ → LIVE)
 * ซึ่งเชิญให้อ่านบทนั้นจากพระคัมภีร์ของผู้ใช้เอง แล้วกลับมาบันทึกความคืบหน้า
 * — ไม่มีการแต่งคำอธิบายพระคัมภีร์ขึ้นมาเอง
 */
(function (global) {
  'use strict';

  // เล่มที่เตรียมบทเรียนไว้แล้ว (จาก TheAll Bible Coffee V1)
  const READY_BOOKS = ['GEN', 'EPH', 'REV'];

  // เนื้อหาบทเรียนจริง — เติมเมื่อมีเนื้อหาที่เตรียมไว้แล้วเท่านั้น
  const LESSON_CONTENT = Object.create(null);

  const READY = Object.create(null);
  READY_BOOKS.forEach(function (code) { READY[code] = true; });

  global.Lessons = {
    READY_BOOKS: READY_BOOKS.slice(),

    /** 'ready' | 'coming_soon' — ความพร้อมของบทเรียน (คนละเรื่องกับความคืบหน้าของผู้ใช้) */
    statusFor: function (code) {
      return READY[code] ? 'ready' : 'coming_soon';
    },

    isReady: function (code) { return !!READY[code]; },

    /** เนื้อหาบทเรียนของทั้งเล่ม หรือ null ถ้ายังไม่มี */
    forBook: function (code) { return LESSON_CONTENT[code] || null; },

    /** เนื้อหาบทเรียนของบทหนึ่ง หรือ null ถ้ายังไม่มี (แอปจะ fallback ไปที่จังหวะประจำวัน) */
    forChapter: function (code, chapter) {
      const book = LESSON_CONTENT[code];
      if (!book || !book.chapters) return null;
      return book.chapters[chapter] || null;
    },

    /** เล่มถัดไปที่แนะนำ: เล่มถัดไปตามลำดับพระคัมภีร์ที่พร้อมอ่าน (ตรรกะคงที่ ไม่ใช่ AI) */
    nextReadyAfter: function (code, isCompleted) {
      const books = global.BibleBooks.BOOKS;
      const current = global.BibleBooks.byCode(code);
      if (!current) return null;
      const after = books.filter(function (b) {
        return b.order > current.order && READY[b.code] && !isCompleted(b.code);
      });
      if (after.length) return after[0];
      // ถ้าไม่มีเล่มถัดไป ให้วนกลับไปหาเล่มที่พร้อมอ่านและยังไม่จบ
      const any = books.filter(function (b) {
        return b.code !== code && READY[b.code] && !isCompleted(b.code);
      });
      return any.length ? any[0] : null;
    },
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = global.Lessons;
})(typeof window !== 'undefined' ? window : globalThis);
