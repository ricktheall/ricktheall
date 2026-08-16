import { chromium } from 'playwright';
const BASE = 'http://127.0.0.1:8123/';
const SHOTS = process.env.SHOTS || new URL('./shots', import.meta.url).pathname;
const results = []; const errors = [];
const check = (n, p, d) => results.push({ n, p: !!p, d: d === undefined ? '' : String(d) });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));

/* ── self-guided: ปลดล็อกทั้ง 66 เล่ม ───────────────── */
await page.goto(BASE + '#/library', { waitUntil: 'networkidle' });
await page.click('[data-cup="JON"]');
await page.waitForSelector('.modal');
check('coming-soon modal still appears first', await page.locator('.modal__title').textContent().then(t => t.includes('กำลังเตรียม')));
check('modal offers a self-guided path', (await page.locator('[data-selfguided]').count()) > 0);
await page.click('[data-selfguided]');
await page.waitForSelector('.chapter-grid', { timeout: 5000 });
check('self-guided book opens instead of dead-ending', page.url().includes('#/book/jonah'), page.url());
check('self-guided book is labelled as such', (await page.textContent('.book-head__meta')).includes('อ่านด้วยตัวเอง'));
check('self-guided book counts as in progress',
  await page.evaluate(() => window.Progress.bookStatus('JON')) === 'in_progress');

/* อ่านโยนาห์จบทั้ง 4 บท → แก้วต้องคว่ำ */
for (let i = 1; i <= 4; i++) {
  await page.goto(BASE + `#/book/jonah/chapter/${i}`, { waitUntil: 'networkidle' });
  await page.click('[data-complete]');
  await page.waitForTimeout(120);
}
check('a book with no lesson can still be completed',
  await page.evaluate(() => window.Progress.isBookCompleted('JON')) === true);
await page.waitForSelector('.modal', { timeout: 4000 }).catch(() => {});
check('completing a self-guided book still celebrates',
  (await page.locator('.modal__panel').count()) === 1);
await page.keyboard.press('Escape');
await page.goto(BASE + '#/library', { waitUntil: 'networkidle' });
const flip = await page.$eval('[data-cup="JON"] .cup-svg g', el => el.getAttribute('transform'));
check('self-guided completed cup turns upside down too', /scale\(1,-1\)/.test(flip || ''), flip);

/* ── แก้ววันนี้ ─────────────────────────────────────── */
await page.goto(BASE, { waitUntil: 'networkidle' });
const todayTxt = await page.textContent('.today');
check("home shows today's cup as done after reading", todayTxt.includes('วันนี้คุณได้อยู่กับพระคำแล้ว'), todayTxt.replace(/\s+/g,' ').trim());
await page.screenshot({ path: `${SHOTS}/13-home-today.png` });

/* ── สำรอง/กู้คืน ───────────────────────────────────── */
await page.goto(BASE + '#/journey', { waitUntil: 'networkidle' });
check('backup section exists', (await page.locator('[data-export]').count()) === 1);
const dl = page.waitForEvent('download', { timeout: 8000 });
await page.click('[data-export]');
const download = await dl;
const path = await download.path();
check('export produces a downloadable file', !!path, download.suggestedFilename());
await page.screenshot({ path: `${SHOTS}/14-journey-backup.png`, fullPage: true });

/* กู้คืนบนเครื่องเปล่า → ต้องได้ความคืบหน้ากลับมาครบ */
const fresh = await browser.newContext({ viewport: { width: 390, height: 844 } });
const fp = await fresh.newPage();
fp.on('pageerror', e => errors.push('restore pageerror: ' + e.message));
await fp.goto(BASE + '#/journey', { waitUntil: 'networkidle' });
check('fresh device starts empty', await fp.evaluate(() => window.Progress.summary().completedChapters) === 0);
await fp.setInputFiles('#importFile', path);
await fp.waitForTimeout(600);
const restored = await fp.evaluate(() => window.Progress.summary());
check('restore brings the journey back', restored.completedChapters >= 4, restored.completedChapters);
check('restore brings completed books back', restored.completedBooks >= 1, restored.completedBooks);

/* กู้คืนต้องรวม ไม่ทับ */
await fp.evaluate(() => window.Progress.completeChapter('PSA', 1));
const before = await fp.evaluate(() => window.Progress.summary().completedChapters);
await fp.setInputFiles('#importFile', path);
await fp.waitForTimeout(600);
const after = await fp.evaluate(() => window.Progress.summary().completedChapters);
check('re-importing merges and never loses local progress', after >= before, `${before} → ${after}`);

/* ── focus trap ─────────────────────────────────────── */
await page.goto(BASE + '#/library', { waitUntil: 'networkidle' });
await page.click('[data-cup="AMO"]');
await page.waitForSelector('.modal');
for (let i = 0; i < 8; i++) await page.keyboard.press('Tab');
const inModal = await page.evaluate(() => !!document.activeElement.closest('.modal'));
check('focus stays trapped inside the modal', inModal);

check('no console errors', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
const pass = results.filter(r => r.p).length;
console.log('\n' + results.map(r => `${r.p ? 'PASS' : 'FAIL'}  ${r.n}${r.d && !r.p ? '  → ' + r.d : ''}`).join('\n'));
console.log(`\n${pass}/${results.length} new-feature checks passed`);
process.exit(pass === results.length ? 0 : 1);
