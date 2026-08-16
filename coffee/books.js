/*
 * books.js — TheAll Bible Coffee V2
 * แหล่งข้อมูลเดียวของพระคัมภีร์ 66 เล่ม (single source of truth)
 * 66 แก้ว · 66 เล่ม · เรื่องเดียว
 *
 * อย่าทำซ้ำข้อมูลนี้ในคอมโพเนนต์อื่น — ให้ import จากที่นี่เท่านั้น
 * Do not duplicate this metadata anywhere else in the app.
 */
(function (global) {
  'use strict';

  // [order, code, thaiName, englishName, chapterCount, slug]
  const OT = [
    [1, 'GEN', 'ปฐมกาล', 'Genesis', 50, 'genesis'],
    [2, 'EXO', 'อพยพ', 'Exodus', 40, 'exodus'],
    [3, 'LEV', 'เลวีนิติ', 'Leviticus', 27, 'leviticus'],
    [4, 'NUM', 'กันดารวิถี', 'Numbers', 36, 'numbers'],
    [5, 'DEU', 'เฉลยธรรมบัญญัติ', 'Deuteronomy', 34, 'deuteronomy'],
    [6, 'JOS', 'โยชูวา', 'Joshua', 24, 'joshua'],
    [7, 'JDG', 'ผู้วินิจฉัย', 'Judges', 21, 'judges'],
    [8, 'RUT', 'รูธ', 'Ruth', 4, 'ruth'],
    [9, '1SA', '1 ซามูเอล', '1 Samuel', 31, '1-samuel'],
    [10, '2SA', '2 ซามูเอล', '2 Samuel', 24, '2-samuel'],
    [11, '1KI', '1 พงศ์กษัตริย์', '1 Kings', 22, '1-kings'],
    [12, '2KI', '2 พงศ์กษัตริย์', '2 Kings', 25, '2-kings'],
    [13, '1CH', '1 พงศาวดาร', '1 Chronicles', 29, '1-chronicles'],
    [14, '2CH', '2 พงศาวดาร', '2 Chronicles', 36, '2-chronicles'],
    [15, 'EZR', 'เอสรา', 'Ezra', 10, 'ezra'],
    [16, 'NEH', 'เนหะมีย์', 'Nehemiah', 13, 'nehemiah'],
    [17, 'EST', 'เอสเธอร์', 'Esther', 10, 'esther'],
    [18, 'JOB', 'โยบ', 'Job', 42, 'job'],
    [19, 'PSA', 'สดุดี', 'Psalms', 150, 'psalms'],
    [20, 'PRO', 'สุภาษิต', 'Proverbs', 31, 'proverbs'],
    [21, 'ECC', 'ปัญญาจารย์', 'Ecclesiastes', 12, 'ecclesiastes'],
    [22, 'SNG', 'เพลงซาโลมอน', 'Song of Songs', 8, 'song-of-songs'],
    [23, 'ISA', 'อิสยาห์', 'Isaiah', 66, 'isaiah'],
    [24, 'JER', 'เยเรมีย์', 'Jeremiah', 52, 'jeremiah'],
    [25, 'LAM', 'เพลงคร่ำครวญ', 'Lamentations', 5, 'lamentations'],
    [26, 'EZK', 'เอเสเคียล', 'Ezekiel', 48, 'ezekiel'],
    [27, 'DAN', 'ดาเนียล', 'Daniel', 12, 'daniel'],
    [28, 'HOS', 'โฮเชยา', 'Hosea', 14, 'hosea'],
    [29, 'JOL', 'โยเอล', 'Joel', 3, 'joel'],
    [30, 'AMO', 'อาโมส', 'Amos', 9, 'amos'],
    [31, 'OBA', 'โอบาดีย์', 'Obadiah', 1, 'obadiah'],
    [32, 'JON', 'โยนาห์', 'Jonah', 4, 'jonah'],
    [33, 'MIC', 'มีคาห์', 'Micah', 7, 'micah'],
    [34, 'NAM', 'นาฮูม', 'Nahum', 3, 'nahum'],
    [35, 'HAB', 'ฮาบากุก', 'Habakkuk', 3, 'habakkuk'],
    [36, 'ZEP', 'เศฟันยาห์', 'Zephaniah', 3, 'zephaniah'],
    [37, 'HAG', 'ฮักกัย', 'Haggai', 2, 'haggai'],
    [38, 'ZEC', 'เศคาริยาห์', 'Zechariah', 14, 'zechariah'],
    [39, 'MAL', 'มาลาคี', 'Malachi', 4, 'malachi'],
  ];

  const NT = [
    [40, 'MAT', 'มัทธิว', 'Matthew', 28, 'matthew'],
    [41, 'MRK', 'มาระโก', 'Mark', 16, 'mark'],
    [42, 'LUK', 'ลูกา', 'Luke', 24, 'luke'],
    [43, 'JHN', 'ยอห์น', 'John', 21, 'john'],
    [44, 'ACT', 'กิจการของอัครทูต', 'Acts', 28, 'acts'],
    [45, 'ROM', 'โรม', 'Romans', 16, 'romans'],
    [46, '1CO', '1 โครินธ์', '1 Corinthians', 16, '1-corinthians'],
    [47, '2CO', '2 โครินธ์', '2 Corinthians', 13, '2-corinthians'],
    [48, 'GAL', 'กาลาเทีย', 'Galatians', 6, 'galatians'],
    [49, 'EPH', 'เอเฟซัส', 'Ephesians', 6, 'ephesians'],
    [50, 'PHP', 'ฟีลิปปี', 'Philippians', 4, 'philippians'],
    [51, 'COL', 'โคโลสี', 'Colossians', 4, 'colossians'],
    [52, '1TH', '1 เธสะโลนิกา', '1 Thessalonians', 5, '1-thessalonians'],
    [53, '2TH', '2 เธสะโลนิกา', '2 Thessalonians', 3, '2-thessalonians'],
    [54, '1TI', '1 ทิโมธี', '1 Timothy', 6, '1-timothy'],
    [55, '2TI', '2 ทิโมธี', '2 Timothy', 4, '2-timothy'],
    [56, 'TIT', 'ทิตัส', 'Titus', 3, 'titus'],
    [57, 'PHM', 'ฟีเลโมน', 'Philemon', 1, 'philemon'],
    [58, 'HEB', 'ฮีบรู', 'Hebrews', 13, 'hebrews'],
    [59, 'JAS', 'ยากอบ', 'James', 5, 'james'],
    [60, '1PE', '1 เปโตร', '1 Peter', 5, '1-peter'],
    [61, '2PE', '2 เปโตร', '2 Peter', 3, '2-peter'],
    [62, '1JN', '1 ยอห์น', '1 John', 5, '1-john'],
    [63, '2JN', '2 ยอห์น', '2 John', 1, '2-john'],
    [64, '3JN', '3 ยอห์น', '3 John', 1, '3-john'],
    [65, 'JUD', 'ยูดา', 'Jude', 1, 'jude'],
    [66, 'REV', 'วิวรณ์', 'Revelation', 22, 'revelation'],
  ];

  function build(rows, testament) {
    return rows.map(function (r) {
      return {
        id: r[1],            // code doubles as stable id
        order: r[0],
        code: r[1],
        thaiName: r[2],
        englishName: r[3],
        testament: testament, // 'old' | 'new'
        chapterCount: r[4],
        slug: r[5],
        // Real cup photo, when one has been added to coffee/cups/<code>.webp.
        // When absent the renderer draws a generated cup (see cups.js).
        cupImage: 'cups/' + r[1].toLowerCase() + '.webp',
      };
    });
  }

  const BOOKS = build(OT, 'old').concat(build(NT, 'new'));

  const BY_CODE = Object.create(null);
  const BY_SLUG = Object.create(null);
  BOOKS.forEach(function (b) {
    BY_CODE[b.code] = b;
    BY_SLUG[b.slug] = b;
  });

  const TOTAL_BOOKS = BOOKS.length;                       // 66
  const TOTAL_CHAPTERS = BOOKS.reduce(function (n, b) {   // 1189
    return n + b.chapterCount;
  }, 0);

  global.BibleBooks = {
    BOOKS: BOOKS,
    OLD_TESTAMENT: BOOKS.filter(function (b) { return b.testament === 'old'; }),
    NEW_TESTAMENT: BOOKS.filter(function (b) { return b.testament === 'new'; }),
    TOTAL_BOOKS: TOTAL_BOOKS,
    TOTAL_CHAPTERS: TOTAL_CHAPTERS,
    byCode: function (code) { return BY_CODE[code] || null; },
    bySlug: function (slug) { return BY_SLUG[slug] || null; },
    // ตรวจความถูกต้องของชุดข้อมูล — ใช้ในชุดทดสอบ
    validate: function () {
      const problems = [];
      if (BOOKS.length !== 66) problems.push('expected 66 books, got ' + BOOKS.length);
      const ot = BOOKS.filter(function (b) { return b.testament === 'old'; }).length;
      const nt = BOOKS.filter(function (b) { return b.testament === 'new'; }).length;
      if (ot !== 39) problems.push('expected 39 OT books, got ' + ot);
      if (nt !== 27) problems.push('expected 27 NT books, got ' + nt);
      if (TOTAL_CHAPTERS !== 1189) problems.push('expected 1189 chapters, got ' + TOTAL_CHAPTERS);
      const seenCode = Object.create(null);
      const seenSlug = Object.create(null);
      BOOKS.forEach(function (b, i) {
        if (b.order !== i + 1) problems.push(b.code + ': order ' + b.order + ' at index ' + i);
        if (seenCode[b.code]) problems.push('duplicate code ' + b.code);
        if (seenSlug[b.slug]) problems.push('duplicate slug ' + b.slug);
        seenCode[b.code] = seenSlug[b.slug] = true;
        if (!b.thaiName) problems.push(b.code + ': missing thaiName');
        if (!b.englishName) problems.push(b.code + ': missing englishName');
        if (!(b.chapterCount > 0)) problems.push(b.code + ': bad chapterCount');
      });
      return problems;
    },
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = global.BibleBooks;
})(typeof window !== 'undefined' ? window : globalThis);
