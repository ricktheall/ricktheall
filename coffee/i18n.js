/*
 * i18n.js — TheAll Bible Coffee V2
 * พจนานุกรมข้อความทั้งหมด · ภาษาไทยเป็นภาษาหลัก ไม่ใช่ของแถม
 * Thai is a first-class language, not an afterthought.
 *
 * ห้าม hard-code ข้อความที่ผู้ใช้เห็นในคอมโพเนนต์ — เพิ่มคีย์ที่นี่เสมอ
 */
(function (global) {
  'use strict';

  const STRINGS = {
    // ── แบรนด์ ──────────────────────────────────────────────
    brand:            { th: 'TheAll Bible Coffee', en: 'TheAll Bible Coffee' },
    tagline:          { th: '1 Coffee. 1 Bible. 1 Day.', en: '1 Coffee. 1 Bible. 1 Day.' },
    taglineSub:       { th: 'หนึ่งถ้วย · หนึ่งบท · หนึ่งวันที่ถูกจัดใหม่',
                        en: 'One cup · one chapter · one day set right' },
    sixtySix:         { th: '66 แก้ว · 66 เล่ม · เรื่องเดียว', en: '66 cups · 66 books · one story' },
    oneJourney:       { th: '66 แก้ว · การเดินทางหนึ่งชีวิต', en: '66 Cups. One Journey.' },

    // ── นำทาง ───────────────────────────────────────────────
    navHome:          { th: 'หน้าแรก', en: 'Home' },
    navLibrary:       { th: '66 แก้ว', en: '66 Cups' },
    navJourney:       { th: 'การเดินทางของฉัน', en: 'My Journey' },
    navLanguage:      { th: 'ภาษา', en: 'Language' },
    skipToContent:    { th: 'ข้ามไปยังเนื้อหา', en: 'Skip to content' },

    // ── จังหวะประจำวัน ──────────────────────────────────────
    brew:             { th: 'ชง', en: 'Brew' },
    read:             { th: 'อ่าน', en: 'Read' },
    live:             { th: 'ใช้ชีวิต', en: 'Live' },

    // ── สถานะ ───────────────────────────────────────────────
    statusReady:      { th: 'พร้อมอ่าน', en: 'Ready' },
    statusInProgress: { th: 'กำลังอ่าน', en: 'In progress' },
    statusCompleted:  { th: 'อ่านจบแล้ว', en: 'Completed' },
    statusComingSoon: { th: 'กำลังเตรียม', en: 'Coming soon' },

    // ── ปุ่ม ────────────────────────────────────────────────
    start:            { th: 'เริ่มอ่าน', en: 'Start reading' },
    continueReading:  { th: 'อ่านต่อ', en: 'Continue' },
    reread:           { th: 'อ่านทบทวนอีกครั้ง', en: 'Read again' },
    openLibrary:      { th: 'เปิดห้องสมุดกาแฟ', en: 'Open the Coffee Library' },
    startFirstCup:    { th: 'เริ่มต้นแก้วแรกของคุณ', en: 'Start your first cup' },
    markChapterDone:  { th: 'อ่านบทนี้จบแล้ว', en: "I've finished this chapter" },
    undoChapterDone:  { th: 'ยกเลิกการทำเครื่องหมาย', en: 'Undo' },
    nextChapter:      { th: 'บทถัดไป', en: 'Next chapter' },
    prevChapter:      { th: 'บทก่อนหน้า', en: 'Previous chapter' },
    backToBook:       { th: 'กลับไปหน้าเล่ม', en: 'Back to book' },
    readNextBook:     { th: 'อ่านเล่มถัดไป', en: 'Read the next book' },
    close:            { th: 'ปิด', en: 'Close' },
    chooseReadyCup:   { th: 'เลือกแก้วที่พร้อมอ่าน', en: 'Choose a ready cup' },

    // ── ห้องสมุดกาแฟ ────────────────────────────────────────
    libraryTitle:     { th: 'ห้องสมุดกาแฟ', en: 'Coffee Library' },
    libraryLead:      { th: 'พระคัมภีร์ 66 เล่ม คือกาแฟ 66 แก้ว — แก้วที่คว่ำแล้วคือเล่มที่คุณอ่านจบ',
                        en: '66 Bible books, 66 cups — an upside-down cup is a book you finished' },
    oldTestament:     { th: 'พันธสัญญาเดิม', en: 'Old Testament' },
    newTestament:     { th: 'พันธสัญญาใหม่', en: 'New Testament' },
    filterAll:        { th: 'ทั้งหมด', en: 'All' },
    booksCount:       { th: '{n} เล่ม', en: '{n} books' },
    chaptersShort:    { th: '{n} บท', en: '{n} ch.' },
    chaptersLong:     { th: '{n} บท', en: '{n} chapters' },
    chapterN:         { th: 'บทที่ {n}', en: 'Chapter {n}' },
    tapCupHint:       { th: 'แตะแก้วเพื่อดูรายละเอียด', en: 'Tap a cup for details' },

    // ── หน้าเล่ม ────────────────────────────────────────────
    yourProgress:     { th: 'ความคืบหน้าของคุณ', en: 'Your progress' },
    progressOf:       { th: '{done} / {total} บท', en: '{done} / {total} chapters' },
    continueAt:       { th: 'อ่านต่อ — {book} {chapter}', en: 'Continue — {book} {chapter}' },
    chaptersHeading:  { th: 'บททั้งหมด', en: 'All chapters' },
    completedOn:      { th: 'อ่านจบเมื่อ {date}', en: 'Completed {date}' },
    startedOn:        { th: 'เริ่มอ่านเมื่อ {date}', en: 'Started {date}' },

    // ── หน้าบท ──────────────────────────────────────────────
    brewLine:         { th: 'ชงกาแฟหนึ่งแก้ว หายใจช้าลง แล้วให้เวลานี้เป็นของพระเจ้า',
                        en: 'Brew a cup, slow your breathing, and give this moment to God.' },
    readLine:         { th: 'อ่าน {book} {chapter} จากพระคัมภีร์ของคุณอย่างไม่รีบร้อน',
                        en: 'Read {book} {chapter} from your own Bible, unhurried.' },
    liveLine:         { th: 'วันนี้คุณจะเชื่อฟังสิ่งที่ได้อ่านอย่างไร — เลือกหนึ่งอย่างแล้วลงมือทำ',
                        en: 'How will you obey what you read today? Choose one thing and do it.' },
    lessonPending:    { th: 'บทเรียนฉบับเต็มของบทนี้กำลังถูกเตรียมอยู่ ระหว่างนี้ใช้จังหวะประจำวันด้านบนได้เลย',
                        en: 'The full lesson for this chapter is being prepared. Use the daily rhythm above in the meantime.' },
    reflection:       { th: 'บันทึกของคุณ', en: 'Your note' },
    reflectionHint:   { th: 'พระเจ้าตรัสอะไรกับคุณในบทนี้ (บันทึกไว้ในเครื่องของคุณเท่านั้น)',
                        en: 'What did God say to you here? (Saved on your device only)' },
    chapterDoneNote:  { th: 'บันทึกแล้ว — บทนี้อ่านจบแล้ว', en: 'Saved — chapter completed' },

    // ── กำลังเตรียม ─────────────────────────────────────────
    comingSoonTitle:  { th: 'แก้วนี้กำลังเตรียมอยู่', en: 'This cup is still being prepared' },
    comingSoonBody:   { th: 'เรากำลังเตรียมบทเรียนของพระคัมภีร์เล่มนี้อย่างตั้งใจ\nระหว่างนี้ เลือกแก้วที่พร้อมอ่านได้เลย',
                        en: 'We are carefully preparing the lesson for this book.\nIn the meantime, choose a cup that is ready.' },
    selfGuidedStart:  { th: 'หรือเริ่มอ่านเล่มนี้ด้วยตัวเอง', en: 'Or start reading it on your own' },
    selfGuidedNote:   { th: 'เล่มนี้ยังไม่มีบทเรียน คุณกำลังอ่านจากพระคัมภีร์ของคุณเอง — ความคืบหน้าถูกบันทึกตามปกติ',
                        en: 'No lesson for this book yet — you are reading from your own Bible. Your progress is saved as usual.' },
    selfGuidedBadge:  { th: 'อ่านด้วยตัวเอง', en: 'Self-guided' },

    // ── การเดินทางของฉัน ────────────────────────────────────
    journeyTitle:     { th: 'การเดินทางของฉัน', en: 'My Journey' },
    journeyHero:      { th: 'การเดินทางผ่านพระคัมภีร์ของคุณ', en: 'Your journey through the Bible' },
    booksProgress:    { th: '{done} / {total} เล่ม', en: '{done} / {total} books' },
    chaptersProgress: { th: '{done} / {total} บท', en: '{done} / {total} chapters' },
    statCompleted:    { th: 'อ่านจบแล้ว', en: 'Completed' },
    statReading:      { th: 'กำลังอ่าน', en: 'Reading' },
    statChapters:     { th: 'บททั้งหมด', en: 'Chapters' },
    statRecent:       { th: 'ล่าสุด', en: 'Recent' },
    journeyEmpty:     { th: 'การเดินทางของคุณยังไม่เริ่ม — ชงแก้วแรกวันนี้ได้เลย',
                        en: 'Your journey has not started yet — brew your first cup today.' },
    allCups:          { th: '66 แก้วของฉัน', en: 'My 66 cups' },
    legendComingSoon: { th: 'กำลังเตรียม', en: 'Coming soon' },
    legendReady:      { th: 'พร้อมอ่าน', en: 'Ready' },
    legendReading:    { th: 'กำลังอ่าน', en: 'Reading' },
    legendDone:       { th: 'คว่ำแก้วแล้ว', en: 'Cup turned over' },
    streak:           { th: 'กลับมาหาพระคำต่อเนื่อง {n} วัน', en: 'Back in the Word {n} days running' },

    // ── แก้ววันนี้ ──────────────────────────────────────────
    todayLabel:       { th: 'แก้ววันนี้', en: "Today's cup" },
    todayInvite:      { th: 'วันนี้ยังไม่ได้ชง — ให้เวลาสักครู่กับพระคำ',
                        en: 'Not brewed yet today — give the Word a few quiet minutes' },
    todayDone:        { th: 'วันนี้คุณได้อยู่กับพระคำแล้ว', en: 'You have been with the Word today' },
    todayFirst:       { th: 'ชงแก้วแรกของคุณวันนี้', en: 'Brew your first cup today' },

    // ── หน้าแรก ─────────────────────────────────────────────
    yourJourney:      { th: 'การเดินทางของคุณ', en: 'Your journey' },
    homeInvite:       { th: 'พระคัมภีร์ 66 เล่ม คือกาแฟ 66 แก้ว ที่รอคุณอยู่',
                        en: '66 Bible books are 66 cups of coffee waiting for you' },
    homeRhythm:       { th: 'ชง → อ่าน → ใช้ชีวิต', en: 'Brew → Read → Live' },

    // ── ช่วงเวลาอ่านจบ ──────────────────────────────────────
    bookDoneTitle:    { th: 'คุณอ่าน{book}จบแล้ว', en: 'You finished {book}' },
    bookDoneSub:      { th: 'พระคำอีกหนึ่งเล่มได้เดินทางผ่านชีวิตคุณแล้ว',
                        en: "Another book of God's Word has travelled through your life." },
    bookDoneCount:    { th: '{done} / 66 เล่ม', en: '{done} / 66 books' },
    nextSuggestion:   { th: 'เล่มถัดไปที่พร้อมอ่าน', en: 'Next book ready for you' },

    // ── สำรองข้อมูล ─────────────────────────────────────────
    backupTitle:      { th: 'สำรองการเดินทางของคุณ', en: 'Back up your journey' },
    backupBody:       { th: 'ความคืบหน้าเก็บอยู่ในเครื่องนี้เท่านั้น บันทึกไฟล์สำรองไว้ ' +
                            'เพื่อย้ายไปเครื่องใหม่ หรือกันไว้เผื่อล้างข้อมูลเบราว์เซอร์',
                        en: 'Your progress lives only on this device. Save a backup file to move to a new ' +
                            'device, or to be safe if you ever clear your browser.' },
    exportBtn:        { th: 'บันทึกไฟล์สำรอง', en: 'Save backup file' },
    importBtn:        { th: 'นำไฟล์สำรองเข้า', en: 'Restore from backup' },
    importDone:       { th: 'รวมข้อมูลแล้ว — เพิ่มขึ้น {n} บท', en: 'Merged — {n} chapters added' },
    importNothing:    { th: 'ไฟล์นี้ไม่มีอะไรใหม่ ข้อมูลเดิมของคุณยังอยู่ครบ',
                        en: 'Nothing new in that file — your progress is untouched.' },
    importFailed:     { th: 'อ่านไฟล์นี้ไม่ได้ ข้อมูลเดิมของคุณยังอยู่ครบ',
                        en: "Couldn't read that file — your progress is untouched." },

    // ── ระบบ ────────────────────────────────────────────────
    savedLocally:     { th: 'บันทึกไว้ในเครื่องแล้ว ระบบจะซิงก์อีกครั้งเมื่อพร้อม',
                        en: 'Saved on this device. It will sync when syncing is available.' },
    saveFailed:       { th: 'ยังบันทึกไม่สำเร็จ พื้นที่จัดเก็บของเบราว์เซอร์อาจถูกปิดอยู่ ลองอีกครั้งได้',
                        en: 'Not saved yet — browser storage may be turned off. You can try again.' },
    langToggleLabel:  { th: 'เปลี่ยนเป็นภาษาอังกฤษ', en: 'Switch to Thai' },
    notFound:         { th: 'ไม่พบหน้านี้', en: 'Page not found' },
    backHome:         { th: 'กลับหน้าแรก', en: 'Back home' },
  };

  let current = 'th';

  function detect() {
    try {
      const saved = localStorage.getItem('tbc.lang');
      if (saved === 'th' || saved === 'en') return saved;
    } catch (e) { /* storage disabled — fall through */ }
    // ค่าเริ่มต้นคือภาษาไทยเสมอ — นี่คือภาษาหลักของผู้ใช้กลุ่มนี้
    // ผู้ที่ต้องการภาษาอังกฤษกดสลับได้หนึ่งครั้ง แล้วระบบจะจำไว้
    return 'th';
  }

  const I18n = {
    get lang() { return current; },

    init: function () { current = detect(); I18n.applyDocumentLang(); return current; },

    set: function (lang) {
      current = (lang === 'en') ? 'en' : 'th';
      try { localStorage.setItem('tbc.lang', current); } catch (e) { /* non-fatal */ }
      I18n.applyDocumentLang();
      return current;
    },

    toggle: function () { return I18n.set(current === 'th' ? 'en' : 'th'); },

    applyDocumentLang: function () {
      if (typeof document !== 'undefined') {
        document.documentElement.lang = current;
        document.documentElement.setAttribute('data-lang', current);
      }
    },

    /** t('progressOf', { done: 18, total: 50 }) */
    t: function (key, vars) {
      const entry = STRINGS[key];
      if (!entry) return key;
      let s = entry[current] != null ? entry[current] : entry.th;
      if (vars) {
        Object.keys(vars).forEach(function (k) {
          s = s.split('{' + k + '}').join(String(vars[k]));
        });
      }
      return s;
    },

    /** ชื่อเล่มตามภาษาปัจจุบัน */
    bookName: function (book) {
      return current === 'en' ? book.englishName : book.thaiName;
    },

    /** ชื่อรอง (อีกภาษาหนึ่ง) */
    bookNameAlt: function (book) {
      return current === 'en' ? book.thaiName : book.englishName;
    },

    number: function (n) {
      try { return Number(n).toLocaleString(current === 'en' ? 'en-US' : 'th-TH'); }
      catch (e) { return String(n); }
    },

    date: function (iso) {
      if (!iso) return '';
      try {
        return new Date(iso).toLocaleDateString(current === 'en' ? 'en-GB' : 'th-TH',
          { year: 'numeric', month: 'short', day: 'numeric' });
      } catch (e) { return String(iso).slice(0, 10); }
    },

    STRINGS: STRINGS,
  };

  global.I18n = I18n;
  if (typeof module !== 'undefined' && module.exports) module.exports = I18n;
})(typeof window !== 'undefined' ? window : globalThis);
