/*
 * app.js — TheAll Bible Coffee V2
 * เราเตอร์ + หน้าจอทั้งหมด: หน้าแรก · ห้องสมุด 66 แก้ว · หน้าเล่ม · หน้าบท · การเดินทางของฉัน
 */
(function (global) {
  'use strict';

  const B = global.BibleBooks;
  const L = global.Lessons;
  const P = global.Progress;
  const T = function (k, v) { return global.I18n.t(k, v); };
  const Cups = global.Cups;

  const app = function () { return document.getElementById('app'); };

  /* ── ตัวช่วย ────────────────────────────────────────────── */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /** เหตุการณ์เชิงพฤติกรรม — ไม่เก็บข้อมูลส่วนบุคคล ไม่มีการติดตามข้ามเว็บ */
  function track(event, props) {
    if (global.dataLayer && typeof global.dataLayer.push === 'function') {
      global.dataLayer.push(Object.assign({ event: event }, props || {}));
    }
  }

  let toastTimer = null;
  function toast(msg) {
    const old = document.querySelector('.toast');
    if (old) old.remove();
    const n = document.createElement('div');
    n.className = 'toast';
    n.setAttribute('role', 'status');
    n.textContent = msg;
    document.body.appendChild(n);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { n.remove(); }, 3200);
  }

  /* ── สถานะรวมของแก้วหนึ่งใบ ─────────────────────────────
   * ความพร้อมของบทเรียน (lessonStatus) แยกจากความคืบหน้าของผู้ใช้ (userStatus)
   * แล้วรวมเป็นสถานะภาพเดียวสำหรับการแสดงผล 4 แบบ
   */
  function cupState(book) {
    const lessonStatus = L.statusFor(book.code);
    const userStatus = P.bookStatus(book.code);
    const done = P.completedChapterCount(book.code);
    let visual;
    if (userStatus === P.STATUS.COMPLETED) visual = 'done';           // คว่ำแก้ว — ชนะทุกสถานะ
    else if (userStatus === P.STATUS.IN_PROGRESS) visual = 'reading';
    else if (lessonStatus === 'ready') visual = 'ready';
    else visual = 'coming';
    return {
      lessonStatus: lessonStatus,
      userStatus: userStatus,
      visual: visual,
      completedChapters: done,
      percent: P.bookPercent(book.code),
    };
  }

  function statusLabel(state) {
    if (state.visual === 'done') return T('statusCompleted');
    if (state.visual === 'reading') return T('statusInProgress');
    if (state.visual === 'ready') return T('statusReady');
    return T('statusComingSoon');
  }

  function badgeFor(state) {
    const mod = { done: 'done', reading: 'reading', ready: 'ready', coming: 'coming' }[state.visual];
    return '<span class="badge badge--' + mod + '">' + esc(statusLabel(state)) + '</span>';
  }

  /* ── การ์ดแก้วในตาราง ───────────────────────────────────── */
  function cupCard(book, opts) {
    const o = opts || {};
    const st = cupState(book);
    const name = global.I18n.bookName(book);
    const parts = [name, book.englishName, T('chaptersLong', { n: book.chapterCount }), statusLabel(st)];
    if (st.visual === 'reading') parts.push(T('progressOf', { done: st.completedChapters, total: book.chapterCount }));
    const label = parts.join(' · ');

    let ring = '';
    if (st.visual === 'reading') {
      const c = 2 * Math.PI * 47;
      const off = c * (1 - st.percent / 100);
      ring = '<svg class="cup__ring" viewBox="0 0 100 100" aria-hidden="true">' +
        '<circle class="track" cx="50" cy="50" r="47"/>' +
        '<circle class="value" cx="50" cy="50" r="47" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"/>' +
        '</svg>';
    }
    const check = st.visual === 'done' ? '<span class="cup__check" aria-hidden="true">✓</span>' : '';

    return '<button type="button" class="cup cup--' + st.visual + '" data-cup="' + esc(book.code) + '"' +
      (o.pressed ? ' aria-pressed="true"' : ' aria-pressed="false"') +
      ' aria-label="' + esc(label) + '">' +
      '<span class="cup__art">' + Cups.cupMedia(book, { flipped: st.visual === 'done', eager: !!o.eager }) + ring + check + '</span>' +
      '<span class="cup__code">' + esc(book.code) + '</span>' +
      (o.showName === false ? '' : '<span class="cup__name">' + esc(name) + '</span>') +
      '<span class="sr-only">' + esc(statusLabel(st)) + '</span>' +
      '</button>';
  }

  function cupArt(book, flipped) {
    return Cups.cupMedia(book, { flipped: flipped, eager: true });
  }

  /* ── โครงหน้า ───────────────────────────────────────────── */
  function chrome(activeRoute) {
    const items = [
      { href: '#/', icon: '☕', label: T('navHome'), key: 'home' },
      { href: '#/library', icon: '⌗', label: T('navLibrary'), key: 'library' },
      { href: '#/journey', icon: '✦', label: T('navJourney'), key: 'journey' },
    ];
    document.getElementById('tabbar').innerHTML = items.map(function (i) {
      return '<a href="' + i.href + '"' + (i.key === activeRoute ? ' aria-current="page"' : '') + '>' +
        '<span class="tabbar__icon" aria-hidden="true">' + i.icon + '</span>' +
        '<span>' + esc(i.label) + '</span></a>';
    }).join('');

    const langBtn = document.getElementById('langBtn');
    langBtn.textContent = global.I18n.lang === 'th' ? 'EN' : 'ไทย';
    langBtn.setAttribute('aria-label', T('langToggleLabel'));
    document.getElementById('brandName').textContent = T('brand');
    document.getElementById('skipLink').textContent = T('skipToContent');
  }

  /* ── หน้าแรก ────────────────────────────────────────────── */
  function viewHome() {
    const s = P.summary();
    const last = P.lastOpened();
    let personal = '';

    if (s.hasAnyProgress && last) {
      const book = B.byCode(last.bookCode);
      if (book) {
        const ch = P.isBookCompleted(book.code) ? last.chapter : P.nextChapter(book.code);
        personal =
          '<a class="continue-card" href="#/book/' + book.slug + '/chapter/' + ch + '" data-continue="1">' +
            '<span class="continue-card__label">' + esc(T('continueReading')) + '</span>' +
            '<span class="continue-card__main">' +
              '<span class="continue-card__cup">' + cupArt(book, P.isBookCompleted(book.code)) + '</span>' +
              '<span>' +
                '<span class="continue-card__title">' + esc(global.I18n.bookName(book)) + ' ' + ch + '</span><br>' +
                '<span class="continue-card__meta">' +
                  esc(T('booksProgress', { done: s.completedBooks, total: 66 })) + ' · ' +
                  esc(T('chaptersShort', { n: global.I18n.number(s.completedChapters) })) +
                '</span>' +
              '</span>' +
            '</span>' +
          '</a>';
      }
    } else if (s.hasAnyProgress) {
      personal = '<div class="card mini-progress" style="margin-bottom:18px">' +
        '<strong>' + esc(T('booksProgress', { done: s.completedBooks, total: 66 })) + '</strong>' +
        '<span>' + esc(T('chaptersProgress', { done: global.I18n.number(s.completedChapters), total: global.I18n.number(1189) })) + '</span></div>';
    }

    app().innerHTML =
      '<section class="hero">' +
        '<p class="eyebrow">' + esc(T('sixtySix')) + '</p>' +
        '<h1 class="hero__tagline">' + esc(T('tagline')) + '</h1>' +
        '<p class="hero__sub">' + esc(T('taglineSub')) + '</p>' +
        '<p class="rhythm"><span>' + esc(T('brew')) + '</span><span>' + esc(T('read')) + '</span><span>' + esc(T('live')) + '</span></p>' +
      '</section>' +
      personal +
      '<a class="btn btn--primary btn--block" href="#/library">' +
        esc(s.hasAnyProgress ? T('openLibrary') : T('startFirstCup')) + '</a>' +
      '<p style="text-align:center;color:var(--cream-dim);font-size:14px;margin-top:16px">' + esc(T('homeInvite')) + '</p>';

    chrome('home');
  }

  /* ── ห้องสมุดกาแฟ ───────────────────────────────────────── */
  let libraryFilter = 'all';
  let selectedCode = null;

  function filterBooks(books) {
    return books.filter(function (b) {
      const st = cupState(b);
      switch (libraryFilter) {
        case 'old': return b.testament === 'old';
        case 'new': return b.testament === 'new';
        case 'ready': return st.visual === 'ready';
        case 'reading': return st.visual === 'reading';
        case 'done': return st.visual === 'done';
        default: return true;
      }
    });
  }

  function detailStrip() {
    if (!selectedCode) {
      return '<p class="detail-strip" style="justify-content:center;color:var(--cream-dim);font-size:13px">' +
        esc(T('tapCupHint')) + '</p>';
    }
    const book = B.byCode(selectedCode);
    const st = cupState(book);
    const cta = st.visual === 'coming'
      ? '<button type="button" class="btn btn--ghost" data-coming="' + esc(book.code) + '">' + esc(T('statusComingSoon')) + '</button>'
      : '<a class="btn btn--primary" href="#/book/' + book.slug + '">' +
          esc(st.visual === 'done' ? T('reread') : (st.visual === 'reading' ? T('continueReading') : T('start'))) + '</a>';

    const meta = [
      global.I18n.bookNameAlt(book),
      T('chaptersLong', { n: book.chapterCount }),
    ].join(' · ');
    const prog = st.visual === 'reading'
      ? ' · ' + T('progressOf', { done: st.completedChapters, total: book.chapterCount })
      : '';

    return '<div class="detail-strip" role="status">' +
      '<span class="detail-strip__cup">' + cupArt(book, st.visual === 'done') + '</span>' +
      '<span class="detail-strip__body">' +
        '<span class="detail-strip__title">' + esc(book.code) + ' · ' + esc(global.I18n.bookName(book)) + '</span><br>' +
        '<span class="detail-strip__meta">' + esc(meta + prog) + '</span> ' + badgeFor(st) +
      '</span>' + cta + '</div>';
  }

  function viewLibrary() {
    const ot = filterBooks(B.OLD_TESTAMENT);
    const nt = filterBooks(B.NEW_TESTAMENT);
    const filters = [
      ['all', T('filterAll')], ['old', T('oldTestament')], ['new', T('newTestament')],
      ['ready', T('statusReady')], ['reading', T('statusInProgress')], ['done', T('statusCompleted')],
    ];

    function section(title, list, eagerCount) {
      if (!list.length) return '';
      return '<div class="section-head"><h2>' + esc(title) + '</h2>' +
        '<span>' + esc(T('booksCount', { n: list.length })) + '</span></div>' +
        '<div class="cup-grid">' + list.map(function (b, i) {
          return cupCard(b, { pressed: b.code === selectedCode, eager: i < eagerCount });
        }).join('') + '</div>';
    }

    app().innerHTML =
      '<section style="padding-top:22px">' +
        '<p class="eyebrow">' + esc(T('oneJourney')) + '</p>' +
        '<h1 style="font-size:26px;margin-bottom:6px">' + esc(T('libraryTitle')) + '</h1>' +
        '<p style="color:var(--cream-2);font-size:14px">' + esc(T('libraryLead')) + '</p>' +
      '</section>' +
      '<div class="filters" role="group">' + filters.map(function (f) {
        return '<button type="button" class="filter" data-filter="' + f[0] + '" aria-pressed="' +
          (libraryFilter === f[0]) + '">' + esc(f[1]) + '</button>';
      }).join('') + '</div>' +
      section(T('oldTestament'), ot, 12) +
      section(T('newTestament'), nt, 0) +
      detailStrip();

    chrome('library');
    track('library_opened', { filter: libraryFilter });
  }

  function refreshStrip() {
    const strip = document.querySelector('.detail-strip');
    if (strip) strip.outerHTML = detailStrip();
  }

  /* ── หน้าเล่ม ───────────────────────────────────────────── */
  function viewBook(slug) {
    const book = B.bySlug(slug);
    if (!book) return viewNotFound();

    if (!L.isReady(book.code) && !P.completedChapterCount(book.code)) {
      return viewComingSoonPage(book);
    }

    P.touchBook(book.code);
    const st = cupState(book);
    const next = P.nextChapter(book.code);
    const meta = P.bookMeta(book.code);

    const ctaLabel = st.userStatus === P.STATUS.COMPLETED ? T('reread')
      : (st.userStatus === P.STATUS.IN_PROGRESS ? T('continueReading') : T('start'));

    let dates = '';
    if (meta.completedAt) dates = T('completedOn', { date: global.I18n.date(meta.completedAt) });
    else if (meta.startedAt) dates = T('startedOn', { date: global.I18n.date(meta.startedAt) });

    const cells = [];
    for (let i = 1; i <= book.chapterCount; i++) {
      const done = P.isChapterCompleted(book.code, i);
      cells.push('<a class="chapter-cell' + (done ? ' chapter-cell--done' : '') +
        (i === next && !done ? ' chapter-cell--current' : '') + '"' +
        ' href="#/book/' + book.slug + '/chapter/' + i + '"' +
        ' aria-label="' + esc(T('chapterN', { n: i }) + (done ? ' · ' + T('statusCompleted') : '')) + '">' +
        i + (done ? '<span class="sr-only"> ' + esc(T('statusCompleted')) + '</span>' : '') + '</a>');
    }

    app().innerHTML =
      '<div class="book-head">' +
        '<span class="book-head__cup">' + cupArt(book, st.visual === 'done') + '</span>' +
        '<div>' +
          '<h1>' + esc(global.I18n.bookName(book)) + '</h1>' +
          '<div class="book-head__en">' + esc(global.I18n.bookNameAlt(book)) + '</div>' +
          '<div class="book-head__meta">' + esc(T('chaptersLong', { n: book.chapterCount })) + ' · ' + badgeFor(st) + '</div>' +
        '</div>' +
      '</div>' +
      '<section class="progress-block" aria-label="' + esc(T('yourProgress')) + '">' +
        '<div class="progress-block__label"><span>' + esc(T('yourProgress')) + '</span>' +
          '<span>' + esc(T('progressOf', { done: st.completedChapters, total: book.chapterCount })) + ' · ' + st.percent + '%</span></div>' +
        '<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + book.chapterCount + '"' +
          ' aria-valuenow="' + st.completedChapters + '"' +
          ' aria-valuetext="' + esc(T('progressOf', { done: st.completedChapters, total: book.chapterCount })) + '">' +
          '<div class="bar__fill" style="width:' + st.percent + '%"></div></div>' +
        (dates ? '<p style="font-size:12px;color:var(--cream-dim);margin:8px 0 0">' + esc(dates) + '</p>' : '') +
      '</section>' +
      '<a class="btn btn--primary btn--block" href="#/book/' + book.slug + '/chapter/' + next + '" data-start="' + esc(book.code) + '">' +
        esc(ctaLabel) + ' — ' + esc(T('chapterN', { n: next })) + '</a>' +
      '<div class="section-head" style="margin-top:26px"><h2>' + esc(T('chaptersHeading')) + '</h2>' +
        '<span>' + esc(T('progressOf', { done: st.completedChapters, total: book.chapterCount })) + '</span></div>' +
      '<div class="chapter-grid">' + cells.join('') + '</div>';

    chrome('library');
    track('book_opened', { book: book.code });
  }

  /* ── หน้า "กำลังเตรียม" (เข้าตรงจาก URL ก็ไม่พัง) ───────── */
  function viewComingSoonPage(book) {
    app().innerHTML =
      '<div class="book-head">' +
        '<span class="book-head__cup" style="filter:blur(2.4px) saturate(.55);opacity:.5">' + cupArt(book, false) + '</span>' +
        '<div>' +
          '<h1>' + esc(global.I18n.bookName(book)) + '</h1>' +
          '<div class="book-head__en">' + esc(global.I18n.bookNameAlt(book)) + '</div>' +
          '<div class="book-head__meta">' + esc(T('chaptersLong', { n: book.chapterCount })) + ' · ' +
            '<span class="badge badge--coming">' + esc(T('statusComingSoon')) + '</span></div>' +
        '</div>' +
      '</div>' +
      '<div class="card">' +
        '<h2 style="font-size:19px">' + esc(T('comingSoonTitle')) + '</h2>' +
        '<p style="white-space:pre-line;color:var(--cream-2)">' + esc(T('comingSoonBody')) + '</p>' +
        '<a class="btn btn--primary btn--block" href="#/library">' + esc(T('chooseReadyCup')) + '</a>' +
      '</div>';
    chrome('library');
    track('coming_soon_book_clicked', { book: book.code });
  }

  /* ── หน้าบท ─────────────────────────────────────────────── */
  function viewChapter(slug, chapterNum) {
    const book = B.bySlug(slug);
    if (!book) return viewNotFound();
    const n = Math.max(1, Math.min(book.chapterCount, parseInt(chapterNum, 10) || 1));

    if (!L.isReady(book.code) && !P.completedChapterCount(book.code)) {
      return viewComingSoonPage(book);
    }

    P.openChapter(book.code, n);
    const done = P.isChapterCompleted(book.code, n);
    const lesson = L.forChapter(book.code, n);
    const lang = global.I18n.lang;
    const pick = function (v) { return v ? (v[lang] || v.th || '') : ''; };

    // มีเนื้อหาบทเรียนจริง → แสดงเนื้อหานั้น
    // ยังไม่มี → แสดงจังหวะประจำวัน (ชง → อ่าน → ใช้ชีวิต) โดยไม่แต่งคำอธิบายพระคัมภีร์ขึ้นเอง
    const brewText = lesson && lesson.brew ? pick(lesson.brew) : T('brewLine');
    const readText = lesson && lesson.read ? pick(lesson.read)
      : T('readLine', { book: global.I18n.bookName(book), chapter: n });
    const liveText = lesson && lesson.live ? pick(lesson.live) : T('liveLine');
    const heading = lesson && lesson.title ? pick(lesson.title) : T('chapterN', { n: n });

    app().innerHTML =
      '<div class="chapter-head">' +
        '<a class="chapter-head__book" href="#/book/' + book.slug + '">' +
          esc(book.code) + ' · ' + esc(global.I18n.bookName(book)) + '</a>' +
        '<h1>' + esc(heading) + '</h1>' +
      '</div>' +
      '<section aria-label="' + esc(T('homeRhythm')) + '">' +
        '<div class="rhythm-step"><h3>' + esc(T('brew')) + '</h3><p>' + esc(brewText) + '</p></div>' +
        '<div class="rhythm-step"><h3>' + esc(T('read')) + '</h3><p>' + esc(readText) + '</p></div>' +
        '<div class="rhythm-step"><h3>' + esc(T('live')) + '</h3><p>' + esc(liveText) + '</p></div>' +
      '</section>' +
      (lesson ? '' : '<p class="pending-note">' + esc(T('lessonPending')) + '</p>') +
      '<label class="sr-only" for="note">' + esc(T('reflection')) + '</label>' +
      '<p style="font-size:12px;color:var(--cream-dim);margin-bottom:6px">' + esc(T('reflectionHint')) + '</p>' +
      '<textarea id="note" class="note-field" data-note="' + esc(book.code) + ':' + n + '">' +
        esc(P.note(book.code, n)) + '</textarea>' +
      '<div class="chapter-actions">' +
        (done
          ? '<div class="done-state"><span aria-hidden="true">✓</span><span>' + esc(T('chapterDoneNote')) + '</span></div>' +
            '<button type="button" class="btn btn--quiet" data-uncomplete="' + n + '">' + esc(T('undoChapterDone')) + '</button>'
          : '<button type="button" class="btn btn--primary btn--block" data-complete="' + n + '">' +
            esc(T('markChapterDone')) + '</button>') +
      '</div>' +
      '<div class="chapter-nav">' +
        (n > 1 ? '<a class="btn btn--ghost" href="#/book/' + book.slug + '/chapter/' + (n - 1) + '">' + esc(T('prevChapter')) + '</a>' : '<span></span>') +
        '<a class="btn btn--quiet" href="#/book/' + book.slug + '">' + esc(T('backToBook')) + '</a>' +
        (n < book.chapterCount ? '<a class="btn btn--ghost" href="#/book/' + book.slug + '/chapter/' + (n + 1) + '">' + esc(T('nextChapter')) + '</a>' : '<span></span>') +
      '</div>';

    chrome('library');
    track('chapter_started', { book: book.code, chapter: n });
    global.__ctx = { book: book, chapter: n };
  }

  /* ── การเดินทางของฉัน ───────────────────────────────────── */
  function viewJourney() {
    const s = P.summary();
    const last = P.lastOpened();
    const lastBook = last ? B.byCode(last.bookCode) : null;

    const cups = B.BOOKS.map(function (b, i) {
      return cupCard(b, { showName: false, eager: i < 12 });
    }).join('');

    let continueCta = '';
    if (lastBook) {
      const ch = P.isBookCompleted(lastBook.code) ? last.chapter : P.nextChapter(lastBook.code);
      continueCta = '<a class="btn btn--primary btn--block" href="#/book/' + lastBook.slug + '/chapter/' + ch + '" data-continue="1">' +
        esc(T('continueAt', { book: global.I18n.bookName(lastBook), chapter: ch })) + '</a>';
    } else {
      continueCta = '<a class="btn btn--primary btn--block" href="#/library">' + esc(T('startFirstCup')) + '</a>';
    }

    app().innerHTML =
      '<section class="journey-hero">' +
        '<p class="eyebrow">' + esc(T('oneJourney')) + '</p>' +
        '<h1>' + esc(T('journeyHero')) + '</h1>' +
        '<p class="journey-hero__big">' + esc(T('booksProgress', { done: s.completedBooks, total: 66 })) + '</p>' +
        '<p class="journey-hero__sub">' + esc(T('chaptersProgress', {
            done: global.I18n.number(s.completedChapters), total: global.I18n.number(s.totalChapters) })) + '</p>' +
        (s.streak > 1 ? '<p class="streak-line">' + esc(T('streak', { n: s.streak })) + '</p>' : '') +
      '</section>' +
      (s.hasAnyProgress ? '' : '<p style="text-align:center;color:var(--cream-dim);font-size:14px">' + esc(T('journeyEmpty')) + '</p>') +
      '<div class="stat-grid">' +
        '<div class="stat"><div class="stat__value">' + s.completedBooks + '</div><div class="stat__label">' + esc(T('statCompleted')) + '</div></div>' +
        '<div class="stat"><div class="stat__value">' + s.readingBooks + '</div><div class="stat__label">' + esc(T('statReading')) + '</div></div>' +
        '<div class="stat"><div class="stat__value">' + esc(global.I18n.number(s.completedChapters)) + '</div><div class="stat__label">' + esc(T('statChapters')) + '</div></div>' +
        '<div class="stat"><div class="stat__value" style="font-size:17px">' +
          esc(lastBook ? global.I18n.bookName(lastBook) + ' ' + last.chapter : '—') +
          '</div><div class="stat__label">' + esc(T('statRecent')) + '</div></div>' +
      '</div>' +
      continueCta +
      '<div class="section-head" style="margin-top:28px"><h2>' + esc(T('allCups')) + '</h2>' +
        '<span>' + esc(T('booksProgress', { done: s.completedBooks, total: 66 })) + '</span></div>' +
      '<div class="legend">' +
        '<span><i class="l-coming"></i>' + esc(T('legendComingSoon')) + '</span>' +
        '<span><i class="l-ready"></i>' + esc(T('legendReady')) + '</span>' +
        '<span><i class="l-reading"></i>' + esc(T('legendReading')) + '</span>' +
        '<span><i class="l-done"></i>' + esc(T('legendDone')) + '</span>' +
      '</div>' +
      '<div class="cup-grid">' + cups + '</div>';

    chrome('journey');
    track('journey_dashboard_opened', {});
  }

  function viewNotFound() {
    app().innerHTML = '<div class="card" style="margin-top:40px;text-align:center">' +
      '<h1 style="font-size:20px">' + esc(T('notFound')) + '</h1>' +
      '<a class="btn btn--primary btn--block" href="#/">' + esc(T('backHome')) + '</a></div>';
    chrome('home');
  }

  /* ── โมดัล ──────────────────────────────────────────────── */
  let lastFocus = null;

  function closeModal() {
    const m = document.querySelector('.modal');
    if (m) m.remove();
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    lastFocus = null;
  }

  function openModal(html) {
    closeModal();
    lastFocus = document.activeElement;
    const wrap = document.createElement('div');
    wrap.className = 'modal';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.innerHTML = '<div class="modal__panel" tabindex="-1">' + html + '</div>';
    wrap.addEventListener('click', function (e) { if (e.target === wrap) closeModal(); });
    document.body.appendChild(wrap);
    wrap.querySelector('.modal__panel').focus();
  }

  function comingSoonModal(book) {
    openModal(
      '<div class="modal__cup" style="filter:blur(2.6px) saturate(.55);opacity:.55">' + cupArt(book, false) + '</div>' +
      '<h2 class="modal__title">' + esc(T('comingSoonTitle')) + '</h2>' +
      '<p class="modal__body">' + esc(T('comingSoonBody')) + '</p>' +
      '<p style="font-size:13px;color:var(--cream-dim);margin-bottom:16px">' +
        esc(book.code + ' · ' + global.I18n.bookName(book) + ' · ' + T('chaptersLong', { n: book.chapterCount })) + '</p>' +
      '<div class="modal__actions">' +
        '<a class="btn btn--primary" href="#/library" data-close="1">' + esc(T('chooseReadyCup')) + '</a>' +
        '<button type="button" class="btn btn--quiet" data-close="1">' + esc(T('close')) + '</button>' +
      '</div>');
    track('coming_soon_book_clicked', { book: book.code });
  }

  /** ช่วงเวลาอ่านจบ — เงียบ งาม และเกิดขึ้นครั้งเดียวต่อเล่ม */
  function completionModal(book) {
    const s = P.summary();
    const next = L.nextReadyAfter(book.code, function (code) { return P.isBookCompleted(code); });
    openModal(
      '<div class="modal__cup">' + cupArt(book, true) + '</div>' +
      '<h2 class="modal__title">' + esc(T('bookDoneTitle', { book: global.I18n.bookName(book) })) + '</h2>' +
      '<p class="modal__body">' + esc(T('bookDoneSub')) + '</p>' +
      '<p class="modal__count">' + esc(T('bookDoneCount', { done: s.completedBooks })) + '</p>' +
      '<div class="modal__actions">' +
        (next
          ? '<a class="btn btn--primary" href="#/book/' + next.slug + '" data-close="1">' +
              esc(T('readNextBook')) + ' — ' + esc(global.I18n.bookName(next)) + '</a>'
          : '<a class="btn btn--primary" href="#/library" data-close="1">' + esc(T('openLibrary')) + '</a>') +
        '<a class="btn btn--ghost" href="#/journey" data-close="1">' + esc(T('navJourney')) + '</a>' +
        '<button type="button" class="btn btn--quiet" data-close="1">' + esc(T('close')) + '</button>' +
      '</div>');
    track('book_completed', { book: book.code, completedBooks: s.completedBooks });
  }

  /* ── เราเตอร์ ───────────────────────────────────────────── */
  function route() {
    const hash = (location.hash || '#/').replace(/^#/, '');
    const parts = hash.split('/').filter(Boolean);
    closeModal();

    if (!parts.length) return viewHome();
    if (parts[0] === 'library') return viewLibrary();
    if (parts[0] === 'journey') return viewJourney();
    if (parts[0] === 'book' && parts[1]) {
      if (parts[2] === 'chapter' && parts[3]) return viewChapter(parts[1], parts[3]);
      return viewBook(parts[1]);
    }
    return viewNotFound();
  }

  function navigate() {
    route();
    if (!location.hash || location.hash === '#/') window.scrollTo(0, 0);
    else window.scrollTo({ top: 0, behavior: 'auto' });
  }

  /* ── การโต้ตอบ (event delegation) ───────────────────────── */
  function onClick(e) {
    const closeBtn = e.target.closest('[data-close]');
    if (closeBtn) {
      closeModal();
      if (closeBtn.tagName !== 'A') return;
    }

    const cup = e.target.closest('[data-cup]');
    if (cup) {
      const book = B.byCode(cup.getAttribute('data-cup'));
      const st = cupState(book);
      // ในแดชบอร์ด: แตะแล้วไปที่เล่มเลย · ในห้องสมุด: แตะเพื่อเลือก แล้วจึงเปิด
      const inLibrary = !!document.querySelector('.detail-strip');
      if (st.visual === 'coming') { comingSoonModal(book); return; }
      if (!inLibrary || selectedCode === book.code) { location.hash = '#/book/' + book.slug; return; }
      selectedCode = book.code;
      document.querySelectorAll('[data-cup]').forEach(function (n) {
        n.setAttribute('aria-pressed', String(n.getAttribute('data-cup') === selectedCode));
      });
      refreshStrip();
      return;
    }

    const comingBtn = e.target.closest('[data-coming]');
    if (comingBtn) { comingSoonModal(B.byCode(comingBtn.getAttribute('data-coming'))); return; }

    const filter = e.target.closest('[data-filter]');
    if (filter) {
      libraryFilter = filter.getAttribute('data-filter');
      viewLibrary();
      return;
    }

    const startLink = e.target.closest('[data-start]');
    if (startLink) {
      P.startBook(startLink.getAttribute('data-start'));
      return; // ปล่อยให้ลิงก์ทำงานต่อ
    }

    if (e.target.closest('[data-continue]')) {
      track('continue_reading_clicked', {});
      return;
    }

    const complete = e.target.closest('[data-complete]');
    if (complete) {
      const ctx = global.__ctx;
      if (!ctx) return;
      flushNote();
      const wasCompleted = P.isBookCompleted(ctx.book.code);
      P.completeChapter(ctx.book.code, ctx.chapter)
        .then(function () {
          track('chapter_completed', { book: ctx.book.code, chapter: ctx.chapter });
          const nowCompleted = P.isBookCompleted(ctx.book.code);
          viewChapter(ctx.book.slug, ctx.chapter);
          if (nowCompleted && !wasCompleted && !P.hasCelebrated(ctx.book.code)) {
            P.markCelebrated(ctx.book.code);
            completionModal(ctx.book);
          }
        })
        .catch(function () { toast(T('saveFailed')); });
      return;
    }

    const uncomplete = e.target.closest('[data-uncomplete]');
    if (uncomplete) {
      const ctx = global.__ctx;
      if (!ctx) return;
      flushNote();
      P.uncompleteChapter(ctx.book.code, ctx.chapter)
        .then(function () { viewChapter(ctx.book.slug, ctx.chapter); })
        .catch(function () { toast(T('saveFailed')); });
      return;
    }
  }

  /* บันทึกของผู้ใช้: พิมพ์แล้วบันทึกอัตโนมัติ และต้องไม่หายเมื่อออกจากหน้าเร็ว */
  let noteTimer = null;
  let pendingNote = null;   // { code, chapter, text }

  function flushNote() {
    clearTimeout(noteTimer);
    if (!pendingNote) return Promise.resolve();
    const n = pendingNote;
    pendingNote = null;
    return P.saveNote(n.code, n.chapter, n.text).catch(function () { toast(T('saveFailed')); });
  }

  function onInput(e) {
    const field = e.target.closest('[data-note]');
    if (!field) return;
    const parts = field.getAttribute('data-note').split(':');
    pendingNote = { code: parts[0], chapter: parts[1], text: field.value };
    clearTimeout(noteTimer);
    noteTimer = setTimeout(flushNote, 600);
  }

  function onKey(e) {
    if (e.key === 'Escape') closeModal();
  }

  /* ── เริ่มทำงาน ─────────────────────────────────────────── */
  function boot() {
    global.I18n.init();
    P.onSaveError(function () { /* จัดการที่จุดเรียกใช้ เพื่อไม่ให้ข้อความซ้ำ */ });

    P.init().then(function () {
      const problems = B.validate();
      if (problems.length) console.error('[books.js] ' + problems.join('; '));

      document.addEventListener('click', onClick);
      document.addEventListener('input', onInput);
      document.addEventListener('change', flushNote);   // ออกจากช่องพิมพ์ = บันทึกทันที
      document.addEventListener('keydown', onKey);
      window.addEventListener('pagehide', flushNote);   // ปิดแท็บ/ออกจากหน้าแล้วบันทึกไม่หาย
      window.addEventListener('hashchange', function () { flushNote(); navigate(); });

      document.getElementById('langBtn').addEventListener('click', function () {
        global.I18n.toggle();
        route();
      });

      navigate();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  // เปิดให้ชุดทดสอบเข้าถึงได้
  global.TBC = { cupState: cupState, route: route, track: track };
})(typeof window !== 'undefined' ? window : globalThis);
