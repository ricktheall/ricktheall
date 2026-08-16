/*
 * progress.js — TheAll Bible Coffee V2
 * ชั้นเก็บความคืบหน้าส่วนบุคคล (local-first) + เครื่องยนต์คำนวณสถานะ
 *
 * สถาปัตยกรรม / Architecture
 *   ProgressRepository  — อินเทอร์เฟซกลาง (load/save) เปลี่ยนไปใช้คลาวด์ได้ภายหลัง
 *   LocalStorageAdapter — ตัวเก็บข้อมูลในเครื่อง (ค่าเริ่มต้นของ V2)
 *   Progress            — API ที่ UI เรียกใช้ (อ่านแบบ sync, เขียนแล้ว save แบบ async)
 *
 * หลักการ
 *   • ไม่เก็บ "เปอร์เซ็นต์" เป็นแหล่งความจริง — คำนวณจากบทที่อ่านจบเสมอ
 *   • ไม่ทำลายข้อมูลเดิมของผู้ใช้ มี version + migration
 *   • ถ้าบันทึกไม่สำเร็จ ต้องไม่บอกผู้ใช้ว่าบันทึกแล้ว
 */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'tbc.progress.v1';
  const SCHEMA_VERSION = 1;

  /* ── สถานะ ──────────────────────────────────────────────── */
  const STATUS = {
    NOT_STARTED: 'not_started',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
  };

  /* ── รูปแบบข้อมูลเริ่มต้น ───────────────────────────────── */
  function emptyState() {
    return {
      version: SCHEMA_VERSION,
      userId: 'local',          // ภายหลังใช้ id ของบัญชีสมาชิกได้
      books: {},                // code -> { startedAt, completedAt, firstCompletedAt, lastOpenedAt, currentChapter, chapters: { "1": iso } }
      notes: {},                // "CODE:chapter" -> string
      lastOpened: null,         // { bookCode, chapter, at }
      activity: {},             // "YYYY-MM-DD" -> true  (ใช้คำนวณความต่อเนื่อง)
      celebrated: {},           // code -> true (แสดงช่วงเวลาอ่านจบครั้งเดียว)
      updatedAt: null,
    };
  }

  /* ── Migration ──────────────────────────────────────────────
   * เพิ่มฟังก์ชันใหม่เมื่อขึ้น SCHEMA_VERSION ถัดไป โดยห้ามลบข้อมูลผู้ใช้
   * MIGRATIONS[n] แปลงข้อมูลจาก version n ไปเป็น version n+1
   */
  const MIGRATIONS = {
    // 1: function (s) { …; s.version = 2; return s; },
  };

  function migrate(raw) {
    if (!raw || typeof raw !== 'object') return emptyState();
    let state = raw;
    if (typeof state.version !== 'number') state.version = 1;

    // ข้อมูลจากแอปเวอร์ชันใหม่กว่า: เก็บไว้อย่างที่เป็น ไม่เขียนทับ ไม่ตัดฟิลด์ที่ไม่รู้จัก
    while (state.version < SCHEMA_VERSION && MIGRATIONS[state.version]) {
      state = MIGRATIONS[state.version](state);
    }

    // เติมฟิลด์ที่หายไปโดยไม่แตะข้อมูลเดิม
    const base = emptyState();
    Object.keys(base).forEach(function (k) {
      if (state[k] == null) state[k] = base[k];
    });
    return state;
  }

  /* ── Adapter: localStorage ──────────────────────────────── */
  function LocalStorageAdapter(key) {
    this.key = key || STORAGE_KEY;
  }
  LocalStorageAdapter.prototype.load = function () {
    try {
      const raw = global.localStorage.getItem(this.key);
      return Promise.resolve(raw ? JSON.parse(raw) : null);
    } catch (e) {
      return Promise.resolve(null);
    }
  };
  LocalStorageAdapter.prototype.save = function (state) {
    try {
      global.localStorage.setItem(this.key, JSON.stringify(state));
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  };

  /* ── Adapter สำรอง: หน่วยความจำ (เมื่อเบราว์เซอร์ปิด storage) ── */
  function MemoryAdapter() { this._data = null; }
  MemoryAdapter.prototype.load = function () { return Promise.resolve(this._data); };
  MemoryAdapter.prototype.save = function (state) { this._data = state; return Promise.resolve(); };

  /* ── Repository ─────────────────────────────────────────── */
  function ProgressRepository(adapter) {
    this.adapter = adapter || new LocalStorageAdapter();
    this.state = emptyState();
    this.loaded = false;
    this.listeners = [];
    this.onSaveError = null;
    this._pending = null;
  }

  ProgressRepository.prototype.load = function () {
    const self = this;
    return this.adapter.load().then(function (raw) {
      self.state = migrate(raw);
      self.loaded = true;
      return self.state;
    });
  };

  ProgressRepository.prototype.subscribe = function (fn) {
    this.listeners.push(fn);
    const self = this;
    return function () {
      self.listeners = self.listeners.filter(function (f) { return f !== fn; });
    };
  };

  ProgressRepository.prototype._emit = function () {
    const self = this;
    this.listeners.slice().forEach(function (fn) { fn(self.state); });
  };

  /** เขียนแล้วบันทึก — คืน Promise เพื่อให้ UI รู้ผลจริง ไม่แจ้งว่าสำเร็จถ้าไม่สำเร็จ */
  ProgressRepository.prototype.commit = function (mutator) {
    const self = this;
    mutator(this.state);
    this.state.updatedAt = new Date().toISOString();
    this._emit();
    return this.adapter.save(this.state).catch(function (err) {
      if (self.onSaveError) self.onSaveError(err);
      throw err;
    });
  };

  /* ── ตัวช่วย ────────────────────────────────────────────── */
  function todayKey(d) {
    const dt = d || new Date();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return dt.getFullYear() + '-' + m + '-' + day;
  }

  function bookEntry(state, code) {
    if (!state.books[code]) {
      state.books[code] = {
        startedAt: null,
        completedAt: null,
        firstCompletedAt: null,
        lastOpenedAt: null,
        currentChapter: 1,
        chapters: {},
      };
    }
    if (!state.books[code].chapters) state.books[code].chapters = {};
    return state.books[code];
  }

  /* ── API ที่ UI ใช้ ─────────────────────────────────────── */
  const repo = new ProgressRepository();

  const Progress = {
    STATUS: STATUS,
    repository: repo,
    ProgressRepository: ProgressRepository,
    LocalStorageAdapter: LocalStorageAdapter,
    MemoryAdapter: MemoryAdapter,

    init: function () {
      return repo.load().catch(function () {
        repo.state = emptyState();
        repo.loaded = true;
        return repo.state;
      });
    },

    subscribe: function (fn) { return repo.subscribe(fn); },
    onSaveError: function (fn) { repo.onSaveError = fn; },
    raw: function () { return repo.state; },

    /* ── อ่านสถานะ ───────────────────────────────────────── */

    /** จำนวนบทที่อ่านจบของเล่มนี้ */
    completedChapterCount: function (code) {
      const b = repo.state.books[code];
      if (!b || !b.chapters) return 0;
      return Object.keys(b.chapters).length;
    },

    isChapterCompleted: function (code, chapter) {
      const b = repo.state.books[code];
      return !!(b && b.chapters && b.chapters[String(chapter)]);
    },

    chapterCompletedAt: function (code, chapter) {
      const b = repo.state.books[code];
      return (b && b.chapters && b.chapters[String(chapter)]) || null;
    },

    /** สถานะความคืบหน้าของผู้ใช้ต่อเล่ม (คนละเรื่องกับความพร้อมของบทเรียน) */
    bookStatus: function (code) {
      const book = global.BibleBooks.byCode(code);
      if (!book) return STATUS.NOT_STARTED;
      const done = Progress.completedChapterCount(code);
      if (done >= book.chapterCount) return STATUS.COMPLETED;
      const b = repo.state.books[code];
      if (done > 0 || (b && b.startedAt)) return STATUS.IN_PROGRESS;
      return STATUS.NOT_STARTED;
    },

    isBookCompleted: function (code) {
      return Progress.bookStatus(code) === STATUS.COMPLETED;
    },

    /** เปอร์เซ็นต์ — คำนวณเสมอ ไม่เคยเก็บไว้ */
    bookPercent: function (code) {
      const book = global.BibleBooks.byCode(code);
      if (!book) return 0;
      return Math.round((Progress.completedChapterCount(code) / book.chapterCount) * 100);
    },

    bookMeta: function (code) {
      const b = repo.state.books[code] || {};
      return {
        startedAt: b.startedAt || null,
        completedAt: b.completedAt || null,
        firstCompletedAt: b.firstCompletedAt || null,
        lastOpenedAt: b.lastOpenedAt || null,
      };
    },

    /** บทถัดไปที่ยังไม่ได้อ่าน (สำหรับปุ่ม "อ่านต่อ") */
    nextChapter: function (code) {
      const book = global.BibleBooks.byCode(code);
      if (!book) return 1;
      for (let i = 1; i <= book.chapterCount; i++) {
        if (!Progress.isChapterCompleted(code, i)) return i;
      }
      return book.chapterCount; // อ่านจบแล้ว — ให้กลับไปทบทวนบทสุดท้าย
    },

    lastOpened: function () { return repo.state.lastOpened || null; },

    note: function (code, chapter) {
      return repo.state.notes[code + ':' + chapter] || '';
    },

    hasCelebrated: function (code) { return !!repo.state.celebrated[code]; },

    /** สรุปภาพรวมสำหรับแดชบอร์ด */
    summary: function () {
      const books = global.BibleBooks.BOOKS;
      let completedBooks = 0, readingBooks = 0, completedChapters = 0;
      books.forEach(function (b) {
        const done = Progress.completedChapterCount(b.code);
        completedChapters += done;
        const st = Progress.bookStatus(b.code);
        if (st === STATUS.COMPLETED) completedBooks++;
        else if (st === STATUS.IN_PROGRESS) readingBooks++;
      });
      return {
        completedBooks: completedBooks,
        readingBooks: readingBooks,
        completedChapters: completedChapters,
        totalBooks: global.BibleBooks.TOTAL_BOOKS,
        totalChapters: global.BibleBooks.TOTAL_CHAPTERS,
        hasAnyProgress: completedChapters > 0 || readingBooks > 0 || completedBooks > 0,
        streak: Progress.streak(),
      };
    },

    /** วันต่อเนื่องที่กลับมาหาพระคำ — เป็นกำลังใจ ไม่ใช่การกดดัน */
    streak: function () {
      const days = repo.state.activity || {};
      let n = 0;
      const cursor = new Date();
      // ยังไม่ได้อ่านวันนี้ก็ไม่ถือว่าขาด — เริ่มนับจากเมื่อวานได้
      if (!days[todayKey(cursor)]) cursor.setDate(cursor.getDate() - 1);
      while (days[todayKey(cursor)]) {
        n++;
        cursor.setDate(cursor.getDate() - 1);
      }
      return n;
    },

    /* ── เขียนสถานะ ──────────────────────────────────────── */

    /** บันทึกว่าเปิดเล่มนี้ (ไม่ถือว่าเริ่มอ่าน) */
    touchBook: function (code) {
      return repo.commit(function (s) {
        bookEntry(s, code).lastOpenedAt = new Date().toISOString();
      });
    },

    /** เริ่มอ่านเล่มนี้ — สร้างความคืบหน้าจริง */
    startBook: function (code, chapter) {
      const ch = chapter || Progress.nextChapter(code);
      return repo.commit(function (s) {
        const b = bookEntry(s, code);
        const now = new Date().toISOString();
        if (!b.startedAt) b.startedAt = now;
        b.lastOpenedAt = now;
        b.currentChapter = ch;
        s.lastOpened = { bookCode: code, chapter: ch, at: now };
      });
    },

    /** เปิดบท — บันทึกตำแหน่งล่าสุด แต่ "เปิด" ไม่เท่ากับ "อ่านจบ" */
    openChapter: function (code, chapter) {
      return repo.commit(function (s) {
        const b = bookEntry(s, code);
        const now = new Date().toISOString();
        if (!b.startedAt) b.startedAt = now;
        b.lastOpenedAt = now;
        b.currentChapter = chapter;
        s.lastOpened = { bookCode: code, chapter: chapter, at: now };
      });
    },

    /** ผู้ใช้กด "อ่านบทนี้จบแล้ว" */
    completeChapter: function (code, chapter) {
      return repo.commit(function (s) {
        const b = bookEntry(s, code);
        const now = new Date().toISOString();
        b.chapters[String(chapter)] = now;
        if (!b.startedAt) b.startedAt = now;
        b.lastOpenedAt = now;
        s.activity[todayKey()] = true;
        s.lastOpened = { bookCode: code, chapter: chapter, at: now };

        // เล่มจบเมื่อครบทุกบท — ไม่ต้องให้ผู้ใช้กดซ้ำอีก
        const book = global.BibleBooks.byCode(code);
        if (book && Object.keys(b.chapters).length >= book.chapterCount) {
          b.completedAt = now;
          if (!b.firstCompletedAt) b.firstCompletedAt = now;
        }
      });
    },

    /** ยกเลิกการทำเครื่องหมาย (กดพลาดได้เสมอ) */
    uncompleteChapter: function (code, chapter) {
      return repo.commit(function (s) {
        const b = bookEntry(s, code);
        delete b.chapters[String(chapter)];
        b.completedAt = null;   // firstCompletedAt คงไว้ ไม่ลบประวัติการอ่านจบครั้งแรก
      });
    },

    saveNote: function (code, chapter, text) {
      return repo.commit(function (s) {
        const key = code + ':' + chapter;
        if (text && text.trim()) s.notes[key] = text;
        else delete s.notes[key];
      });
    },

    markCelebrated: function (code) {
      return repo.commit(function (s) { s.celebrated[code] = true; });
    },

    /** ล้างข้อมูลทั้งหมด (ใช้ในการทดสอบ) */
    reset: function () {
      return repo.commit(function (s) {
        const fresh = emptyState();
        Object.keys(fresh).forEach(function (k) { s[k] = fresh[k]; });
      });
    },

    _internals: { emptyState: emptyState, migrate: migrate, todayKey: todayKey, STORAGE_KEY: STORAGE_KEY },
  };

  global.Progress = Progress;
  if (typeof module !== 'undefined' && module.exports) module.exports = Progress;
})(typeof window !== 'undefined' ? window : globalThis);
