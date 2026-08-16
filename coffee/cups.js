/*
 * cups.js — TheAll Bible Coffee V2
 * ตัวเรนเดอร์ "แก้วกาแฟ" ของพระคัมภีร์แต่ละเล่ม
 *
 * ลำดับการเลือกภาพแก้ว
 *   1. ถ้ามีรูปถ่ายแก้วจริงของเล่มนั้น (อยู่ใน CUP_PHOTOS) → ใช้รูปจริง
 *   2. ถ้ายังไม่มี → วาดแก้วเซรามิกด้วย SVG โดยสุ่มลักษณะจากรหัสเล่มแบบคงที่
 *      (แต่ละเล่มได้ทรง/สี/หูจับของตัวเอง และจะเหมือนเดิมทุกครั้ง)
 *
 * การเพิ่มรูปแก้วจริง / Adding real cup photos
 *   • วางไฟล์ที่ coffee/cups/<code ตัวเล็ก>.webp เช่น coffee/cups/gen.webp
 *   • เพิ่มรหัสเล่มลงใน CUP_PHOTOS ด้านล่าง
 *   • สัดส่วนภาพ 1:1 พื้นหลังโปร่ง ให้ปากแก้วอยู่ราว 30% จากขอบบน
 *     เพื่อให้ขนาดและเส้นฐานของทุกแก้วดูเสมอกัน
 *
 * แก้วที่ "อ่านจบแล้ว" จะถูกคว่ำลง — คว่ำเฉพาะตัวแก้ว ไม่ใช่คว่ำทั้งการ์ด
 */
(function (global) {
  'use strict';

  // รหัสเล่มที่มีรูปถ่ายแก้วจริงแล้ว (ยังไม่มีรูปในรีโปนี้ — ดูหมายเหตุด้านบน)
  const CUP_PHOTOS = Object.create(null);

  // จานรองและตัวแก้ว — โทนอบอุ่น หลากหลาย ไม่ใช่ไอคอนเดียวกันทั้ง 66 ใบ
  const CERAMICS = [
    { body: '#f3ece1', shade: '#d8cdbc', rim: '#fffaf2' }, // ครีม
    { body: '#e8e0d3', shade: '#c9bda9', rim: '#f7f1e6' }, // งาช้าง
    { body: '#3c3733', shade: '#2a2624', rim: '#5b534c' }, // ดำด้าน
    { body: '#c98b5e', shade: '#a26a44', rim: '#e0a878' }, // ดินเผา
    { body: '#8d8377', shade: '#6d6459', rim: '#a89d90' }, // หินอ่อนอุ่น
    { body: '#6b4b3a', shade: '#503628', rim: '#8a6550' }, // ไม้เข้ม
    { body: '#dfd3c3', shade: '#bfae9a', rim: '#efe7db' }, // ทราย
    { body: '#4a5750', shade: '#333d38', rim: '#66756c' }, // เขียวป่า
  ];

  const BREWS = [
    { coffee: '#2a170f', crema: '#a8703c' },
    { coffee: '#33200f', crema: '#c08a4a' },
    { coffee: '#1e120b', crema: '#8d5a2f' },
    { coffee: '#3a2413', crema: '#b87f42' },
  ];

  /** แฮชคงที่จากรหัสเล่ม → แก้วใบเดิมทุกครั้ง */
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return Math.abs(h);
  }

  function traitsFor(code) {
    const h = hash(code);
    return {
      ceramic: CERAMICS[h % CERAMICS.length],
      brew: BREWS[(h >> 3) % BREWS.length],
      shape: (h >> 6) % 3,          // 0 = สอบเข้า, 1 = ทรงตรง, 2 = ป่อง
      handleRight: ((h >> 9) % 2) === 0,
      saucer: ((h >> 11) % 2) === 0,
      width: 40 + ((h >> 13) % 5),  // ความกว้างปากแก้ว 40–44
    };
  }

  /** เส้นขอบตัวแก้ว: ปากอยู่ y=34, ก้นอยู่ y=80 */
  function bodyPath(t) {
    const topHalf = t.width / 2;
    const bottomHalf = t.shape === 0 ? topHalf - 6 : (t.shape === 1 ? topHalf - 2 : topHalf - 4);
    const bulge = t.shape === 2 ? 4 : 0;
    const lx = 50 - topHalf, rx = 50 + topHalf;
    const lbx = 50 - bottomHalf, rbx = 50 + bottomHalf;
    return 'M' + lx + ' 34' +
      ' C' + (lx - bulge) + ' 56,' + (lbx - 1) + ' 68,' + lbx + ' 76' +
      ' Q' + lbx + ' 80,' + (lbx + 4) + ' 80' +
      ' L' + (rbx - 4) + ' 80' +
      ' Q' + rbx + ' 80,' + rbx + ' 76' +
      ' C' + (rbx + 1) + ' 68,' + (rx + bulge) + ' 56,' + rx + ' 34' +
      ' Z';
  }

  function handlePath(t) {
    const topHalf = t.width / 2;
    if (t.handleRight) {
      const x = 50 + topHalf - 1;
      return 'M' + x + ' 44 C' + (x + 15) + ' 44,' + (x + 15) + ' 66,' + (x - 4) + ' 65';
    }
    const x = 50 - topHalf + 1;
    return 'M' + x + ' 44 C' + (x - 15) + ' 44,' + (x - 15) + ' 66,' + (x + 4) + ' 65';
  }

  /**
   * สร้าง SVG ของแก้วหนึ่งใบ
   * @param {object} book  ข้อมูลเล่มจาก books.js
   * @param {object} opts  { flipped: boolean, dim: boolean }
   */
  function cupSvg(book, opts) {
    const o = opts || {};
    const t = traitsFor(book.code);
    const id = 'c' + book.code.replace(/[^A-Za-z0-9]/g, '');
    const topHalf = t.width / 2;
    // คว่ำแก้ว: สะท้อนเฉพาะตัวแก้วรอบกึ่งกลางลำตัว (y=57) ปากแก้วจึงลงมาแตะจานพอดี
    const flipT = o.flipped ? ' transform="translate(0,114) scale(1,-1)"' : '';

    return '' +
    '<svg class="cup-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' +
      '<defs>' +
        '<linearGradient id="' + id + 'b" x1="0" y1="0" x2="1" y2="0">' +
          '<stop offset="0%" stop-color="' + t.ceramic.shade + '"/>' +
          '<stop offset="38%" stop-color="' + t.ceramic.body + '"/>' +
          '<stop offset="72%" stop-color="' + t.ceramic.body + '"/>' +
          '<stop offset="100%" stop-color="' + t.ceramic.shade + '"/>' +
        '</linearGradient>' +
        '<radialGradient id="' + id + 'c" cx="0.4" cy="0.35" r="0.8">' +
          '<stop offset="0%" stop-color="' + t.brew.crema + '"/>' +
          '<stop offset="60%" stop-color="' + t.brew.coffee + '"/>' +
          '<stop offset="100%" stop-color="' + t.brew.coffee + '"/>' +
        '</radialGradient>' +
      '</defs>' +
      // เงาตกกระทบ
      '<ellipse cx="50" cy="86" rx="' + (topHalf + 6) + '" ry="5" fill="rgba(0,0,0,.45)"/>' +
      (t.saucer
        ? '<ellipse cx="50" cy="83" rx="' + (topHalf + 12) + '" ry="7.5" fill="' + t.ceramic.shade + '"/>' +
          '<ellipse cx="50" cy="81.5" rx="' + (topHalf + 11) + '" ry="6.5" fill="' + t.ceramic.body + '"/>'
        : '') +
      '<g' + flipT + '>' +
        '<path d="' + handlePath(t) + '" fill="none" stroke="' + t.ceramic.shade + '" stroke-width="5.5" stroke-linecap="round"/>' +
        '<path d="' + bodyPath(t) + '" fill="url(#' + id + 'b)"/>' +
        '<ellipse cx="50" cy="34" rx="' + topHalf + '" ry="' + (topHalf * 0.26) + '" fill="' + t.ceramic.rim + '"/>' +
        (o.flipped
          ? ''
          : '<ellipse cx="50" cy="35.4" rx="' + (topHalf - 3) + '" ry="' + ((topHalf - 3) * 0.26) + '" fill="url(#' + id + 'c)"/>') +
        '<path d="M' + (50 - topHalf + 4) + ' 40 C' + (50 - topHalf + 2) + ' 55,' + (50 - topHalf + 5) + ' 66,' + (50 - topHalf + 8) + ' 74"' +
          ' fill="none" stroke="rgba(255,255,255,.22)" stroke-width="2.5" stroke-linecap="round"/>' +
      '</g>' +
    '</svg>';
  }

  /**
   * HTML ของภาพแก้ว (รูปจริงถ้ามี ไม่งั้นเป็น SVG)
   * @param {object} book
   * @param {object} opts { flipped, eager }
   */
  function cupMedia(book, opts) {
    const o = opts || {};
    if (CUP_PHOTOS[book.code]) {
      return '<img class="cup-photo" src="' + book.cupImage + '" alt="" aria-hidden="true" width="200" height="200" ' +
        'loading="' + (o.eager ? 'eager' : 'lazy') + '" decoding="async"/>';
    }
    return cupSvg(book, o);
  }

  global.Cups = {
    cupSvg: cupSvg,
    cupMedia: cupMedia,
    traitsFor: traitsFor,
    CUP_PHOTOS: CUP_PHOTOS,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = global.Cups;
})(typeof window !== 'undefined' ? window : globalThis);
