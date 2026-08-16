import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:8123/';
const SHOTS = process.env.SHOTS || new URL('./shots', import.meta.url).pathname;
const results = [];
const errors = [];
function check(name, pass, detail) {
  results.push({ name, pass: !!pass, detail: detail === undefined ? '' : String(detail) });
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

async function noHScroll(label) {
  const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check(`no horizontal scroll · ${label}`, over <= 0, `overflow ${over}px`);
}

/* ── 1. ข้อมูล 66 เล่ม ─────────────────────────────── */
await page.goto(BASE, { waitUntil: 'networkidle' });
const data = await page.evaluate(() => ({
  problems: window.BibleBooks.validate(),
  total: window.BibleBooks.TOTAL_BOOKS,
  ot: window.BibleBooks.OLD_TESTAMENT.length,
  nt: window.BibleBooks.NEW_TESTAMENT.length,
  chapters: window.BibleBooks.TOTAL_CHAPTERS,
  first: window.BibleBooks.BOOKS[0].code,
  last: window.BibleBooks.BOOKS[65].code,
  everyCode: window.BibleBooks.BOOKS.every(b => b.code && b.code.length === 3),
  everyThai: window.BibleBooks.BOOKS.every(b => !!b.thaiName),
  everyEn: window.BibleBooks.BOOKS.every(b => !!b.englishName),
}));
check('dataset validates clean', data.problems.length === 0, data.problems.join('; '));
check('exactly 66 books', data.total === 66, data.total);
check('exactly 39 OT', data.ot === 39, data.ot);
check('exactly 27 NT', data.nt === 27, data.nt);
check('1189 chapters total', data.chapters === 1189, data.chapters);
check('order GEN → REV', data.first === 'GEN' && data.last === 'REV', `${data.first}/${data.last}`);
check('every book has code', data.everyCode);
check('every book has Thai name', data.everyThai);
check('every book has English name', data.everyEn);

/* ── 2. หน้าแรกของผู้ใช้ใหม่ ────────────────────────── */
const heroTxt = await page.textContent('.hero__tagline');
check('home keeps "1 Coffee. 1 Bible. 1 Day."', heroTxt.includes('1 Coffee'), heroTxt);
check('new visitor sees invitation, not empty dashboard',
  (await page.textContent('a.btn--primary')).includes('เริ่มต้นแก้วแรก'));
check('no continue card for brand-new visitor', (await page.locator('.continue-card').count()) === 0);
await noHScroll('home');
await page.screenshot({ path: `${SHOTS}/01-home-new.png` });

/* ── 3. ห้องสมุด 66 แก้ว ───────────────────────────── */
await page.click('a[href="#/library"]');
await page.waitForSelector('.cup-grid');
const cupCount = await page.locator('[data-cup]').count();
check('library renders all 66 cups', cupCount === 66, cupCount);
const comingCount = await page.locator('.cup--coming').count();
const readyCount = await page.locator('.cup--ready').count();
check('63 coming-soon cups shown (not hidden)', comingCount === 63, comingCount);
check('3 ready cups (GEN/EPH/REV)', readyCount === 3, readyCount);
const blurred = await page.$eval('.cup--coming .cup__art', el => getComputedStyle(el).filter);
check('coming-soon cup is blurred', blurred.includes('blur'), blurred);
const tap = await page.$eval('[data-cup="GEN"]', el => { const r = el.getBoundingClientRect(); return { w: r.width, h: r.height }; });
check('cup tap target ≥ 44px tall', tap.h >= 44, `${tap.w.toFixed(0)}x${tap.h.toFixed(0)}`);
await noHScroll('library');
await page.screenshot({ path: `${SHOTS}/02-library.png`, fullPage: true });

/* ── 4. FLOW D — แตะแก้วที่ยังไม่พร้อม ─────────────── */
await page.click('[data-cup="LEV"]');
await page.waitForSelector('.modal');
const csText = await page.textContent('.modal__title');
check('FLOW D: coming-soon modal, no broken route', csText.includes('กำลังเตรียม'), csText);
check('FLOW D: url did not break', page.url().endsWith('#/library'), page.url());
await page.waitForTimeout(600);
await page.screenshot({ path: `${SHOTS}/03-coming-soon.png` });
await page.keyboard.press('Escape');
check('modal closes with Escape', (await page.locator('.modal').count()) === 0);

/* direct URL to a coming-soon book must not 404 */
await page.goto(BASE + '#/book/leviticus', { waitUntil: 'networkidle' });
check('direct coming-soon URL renders a page',
  (await page.textContent('h1')).includes('เลวีนิติ'));

/* ── 5. FLOW A — ผู้ใช้ใหม่อ่านบทแรก ───────────────── */
await page.goto(BASE + '#/library', { waitUntil: 'networkidle' });
await page.click('[data-cup="GEN"]');            // เลือก → แถบรายละเอียด
await page.waitForSelector('.detail-strip__title');
const stripTxt = await page.textContent('.detail-strip');
check('detail strip shows code + Thai + English + chapters',
  stripTxt.includes('GEN') && stripTxt.includes('ปฐมกาล') && stripTxt.includes('Genesis') && stripTxt.includes('50'), stripTxt.trim());
await page.click('[data-cup="GEN"]');            // แตะซ้ำ → เปิดเล่ม
await page.waitForSelector('.chapter-grid');
check('book page opens', page.url().includes('#/book/genesis'));
await page.screenshot({ path: `${SHOTS}/04-book-genesis.png` });

await page.click('[data-start="GEN"]');
await page.waitForSelector('[data-complete]');
check('chapter page reached', page.url().includes('/chapter/1'));
const beforeMark = await page.evaluate(() => window.Progress.completedChapterCount('GEN'));
check('opening a chapter does NOT complete it', beforeMark === 0, beforeMark);
check('starting a book creates progress',
  await page.evaluate(() => window.Progress.bookStatus('GEN')) === 'in_progress');
await page.fill('#note', 'พระเจ้าตรัส แล้วก็เป็นไปตามนั้น');
await page.screenshot({ path: `${SHOTS}/05-chapter.png` });
await page.click('[data-complete]');
await page.waitForSelector('.done-state');
const afterMark = await page.evaluate(() => window.Progress.completedChapterCount('GEN'));
check('marking a chapter records 1/50', afterMark === 1, afterMark);

await page.goto(BASE + '#/book/genesis', { waitUntil: 'networkidle' });
check('book shows 1 / 50', (await page.textContent('.progress-block')).includes('1 / 50'));

/* ── 6. คงอยู่หลังรีเฟรช ───────────────────────────── */
await page.reload({ waitUntil: 'networkidle' });
check('refresh does not erase progress',
  await page.evaluate(() => window.Progress.completedChapterCount('GEN')) === 1);
check('note persisted', (await page.evaluate(() => window.Progress.note('GEN', 1))).length > 0);

/* ── 7. FLOW B — กลับมาแล้วอ่านต่อ ─────────────────── */
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForSelector('.continue-card');
const cont = await page.textContent('.continue-card');
check('FLOW B: home offers Continue Reading', cont.includes('อ่านต่อ') && cont.includes('ปฐมกาล 2'), cont.replace(/\s+/g, ' ').trim());
await page.screenshot({ path: `${SHOTS}/06-home-returning.png` });
await page.click('.continue-card');
await page.waitForSelector('[data-complete]');
check('FLOW B: one tap returns to next chapter', page.url().includes('/chapter/2'));

/* ── 8. เลิกทำเครื่องหมายได้ ───────────────────────── */
await page.click('[data-complete]');
await page.waitForSelector('[data-uncomplete]');
await page.click('[data-uncomplete]');
await page.waitForSelector('[data-complete]');
check('undo an accidental completion works',
  await page.evaluate(() => window.Progress.completedChapterCount('GEN')) === 1);

/* ── 9. FLOW C — อ่านจบทั้งเล่ม ────────────────────── */
await page.goto(BASE + '#/book/revelation', { waitUntil: 'networkidle' });
await page.evaluate(async () => {
  for (let i = 1; i <= 21; i++) await window.Progress.completeChapter('REV', i);
});
await page.goto(BASE + '#/book/revelation/chapter/22', { waitUntil: 'networkidle' });
check('book not complete before final chapter',
  await page.evaluate(() => window.Progress.isBookCompleted('REV')) === false);
await page.click('[data-complete]');
await page.waitForSelector('.modal', { timeout: 5000 });
const doneTxt = await page.textContent('.modal__panel');
check('FLOW C: completion moment appears', doneTxt.includes('วิวรณ์จบแล้ว'), doneTxt.replace(/\s+/g, ' ').slice(0, 90));
check('FLOW C: shows n / 66 เล่ม', doneTxt.includes('/ 66'));
check('FLOW C: suggests a next ready book', doneTxt.includes('อ่านเล่มถัดไป'));
await page.waitForTimeout(600);
await page.screenshot({ path: `${SHOTS}/07-completion.png` });
check('book completion requires all chapters',
  await page.evaluate(() => window.Progress.isBookCompleted('REV')) === true);
check('completion date saved',
  !!(await page.evaluate(() => window.Progress.bookMeta('REV').completedAt)));
await page.keyboard.press('Escape');

/* ── 10. แก้วคว่ำ + เข้าถึงได้ ──────────────────────── */
await page.goto(BASE + '#/library', { waitUntil: 'networkidle' });
const flipped = await page.$eval('[data-cup="REV"] .cup-svg g', el => el.getAttribute('transform'));
check('completed cup is flipped upside down', /scale\(1,-1\)/.test(flipped || ''), flipped);
check('completed cup has visible check mark', (await page.locator('[data-cup="REV"] .cup__check').count()) === 1);
const aria = await page.getAttribute('[data-cup="REV"]', 'aria-label');
check('completed state is also text, not colour/rotation only', aria.includes('อ่านจบแล้ว'), aria);
const genAria = await page.getAttribute('[data-cup="GEN"]', 'aria-label');
check('in-progress cup announces its progress', genAria.includes('1 / 50'), genAria);
check('in-progress cup has a gold ring', (await page.locator('[data-cup="GEN"] .cup__ring').count()) === 1);
await page.screenshot({ path: `${SHOTS}/08-library-states.png`, fullPage: true });

/* completed book can still be re-read */
await page.goto(BASE + '#/book/revelation', { waitUntil: 'networkidle' });
check('completed book is still openable and re-readable',
  (await page.textContent('a.btn--primary')).includes('อ่านทบทวน'));

/* ── 11. แดชบอร์ดการเดินทาง ────────────────────────── */
await page.click('a[href="#/journey"]');
await page.waitForSelector('.stat-grid');
const jr = await page.textContent('.journey-hero');
check('journey hero shows books progress', jr.includes('1 / 66'), jr.replace(/\s+/g, ' ').trim());
check('journey hero shows chapter progress against 1,189', jr.includes('1,189') || jr.includes('1189'), jr.replace(/\s+/g,' ').trim());
check('journey renders all 66 cups', (await page.locator('.cup-grid [data-cup]').count()) === 66);
await noHScroll('journey');
await page.screenshot({ path: `${SHOTS}/09-journey.png`, fullPage: true });

/* ── 12. ภาษา ──────────────────────────────────────── */
await page.click('#langBtn');
await page.waitForTimeout(150);
const enTxt = await page.textContent('.journey-hero');
check('language toggle switches to English', enTxt.includes('Your journey'), enTxt.replace(/\s+/g, ' ').trim());
check('html lang attribute follows', await page.getAttribute('html', 'lang') === 'en');
await page.screenshot({ path: `${SHOTS}/10-journey-en.png` });
await page.click('#langBtn');
await page.waitForTimeout(150);
check('language toggle switches back to Thai', (await page.textContent('.journey-hero')).includes('การเดินทาง'));

/* ── 13. คีย์บอร์ด + โฟกัส ─────────────────────────── */
await page.goto(BASE + '#/library', { waitUntil: 'networkidle' });
await page.keyboard.press('Tab');
await page.keyboard.press('Tab');
const focused = await page.evaluate(() => document.activeElement.tagName + ':' + (document.activeElement.className || ''));
check('keyboard tabbing reaches interactive elements', /A|BUTTON/.test(focused), focused);
const outline = await page.evaluate(() => {
  const b = document.querySelector('[data-cup="GEN"]'); b.focus();
  return getComputedStyle(b).outlineWidth;
});
check('focus state is visible', outline !== '0px', outline);

/* ── 14. เดสก์ท็อป ─────────────────────────────────── */
const desk = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const dp = await desk.newPage();
dp.on('pageerror', (e) => errors.push('desktop pageerror: ' + e.message));
await dp.goto(BASE + '#/library', { waitUntil: 'networkidle' });
check('desktop library renders 66 cups', (await dp.locator('[data-cup]').count()) === 66);
const dOver = await dp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
check('no horizontal scroll · desktop', dOver <= 0, `${dOver}px`);
await dp.screenshot({ path: `${SHOTS}/11-desktop.png`, fullPage: true });

/* ── 15. หน้าจอเล็กสุด 375px ───────────────────────── */
const small = await browser.newContext({ viewport: { width: 375, height: 667 } });
const sp = await small.newPage();
sp.on('pageerror', (e) => errors.push('375 pageerror: ' + e.message));
await sp.goto(BASE + '#/library', { waitUntil: 'networkidle' });
const sOver = await sp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
check('no horizontal scroll · 375px', sOver <= 0, `${sOver}px`);
const clipped = await sp.evaluate(() => {
  let bad = 0;
  document.querySelectorAll('.cup__code, .detail-strip__title, h1, h2').forEach(el => {
    if (el.scrollHeight > el.clientHeight + 2) bad++;
  });
  return bad;
});
check('no Thai text vertically clipped at 375px', clipped === 0, `${clipped} clipped`);
await sp.screenshot({ path: `${SHOTS}/12-375.png`, fullPage: true });

/* ── 16. ข้อมูลไม่หายเมื่อ storage พัง ─────────────── */
const nostore = await browser.newContext({ viewport: { width: 390, height: 844 } });
const np = await nostore.newPage();
np.on('pageerror', (e) => errors.push('nostore pageerror: ' + e.message));
await np.addInitScript(() => {
  Object.defineProperty(window, 'localStorage', {
    get() { throw new Error('storage disabled'); }
  });
});
await np.goto(BASE, { waitUntil: 'networkidle' });
check('app still renders when browser storage is blocked',
  (await np.locator('.hero__tagline').count()) === 1);

/* ── 17. migration ไม่ทำลายข้อมูลเดิม ──────────────── */
const mig = await browser.newContext({ viewport: { width: 390, height: 844 } });
const mp = await mig.newPage();
await mp.addInitScript(() => {
  localStorage.setItem('tbc.progress.v1', JSON.stringify({
    books: { GEN: { chapters: { '1': '2026-01-01T00:00:00.000Z' } } },
    customFutureField: 'keep me',
  }));
});
await mp.goto(BASE, { waitUntil: 'networkidle' });
const migrated = await mp.evaluate(() => ({
  count: window.Progress.completedChapterCount('GEN'),
  kept: window.Progress.raw().customFutureField,
  version: window.Progress.raw().version,
}));
check('legacy/partial state migrates without loss', migrated.count === 1, migrated.count);
check('unknown fields are preserved through migration', migrated.kept === 'keep me', migrated.kept);
check('schema version stamped', migrated.version === 1, migrated.version);

check('no console errors anywhere', errors.length === 0, errors.slice(0, 4).join(' | '));

await browser.close();

const pass = results.filter(r => r.pass).length;
console.log('\n' + results.map(r => `${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.detail && !r.pass ? '  → ' + r.detail : ''}`).join('\n'));
console.log(`\n${pass}/${results.length} checks passed`);
process.exit(pass === results.length ? 0 : 1);
