/* app.js — theAll Life Check 1.0
 * ทำงานแบบออฟไลน์เต็มรูปแบบ เก็บผลไว้ใน localStorage ของเครื่องผู้ใช้เท่านั้น
 */
(function () {
  'use strict';

  // ---------- ที่เก็บข้อมูล ----------
  const KEY_HISTORY = 'lc.history';
  const store = {
    get(k, def) { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } },
    set(k, v) { localStorage.setItem(k, JSON.stringify(v)); },
  };
  const getHistory = () => store.get(KEY_HISTORY, []);
  const setHistory = (h) => store.set(KEY_HISTORY, h);

  // ---------- ตัวช่วยสร้าง DOM ----------
  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v === undefined || v === null || v === false) continue;
        if (k === 'class') node.className = v;
        else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
        else node.setAttribute(k, v);
      }
    }
    for (const c of children.flat(Infinity)) {
      if (c === null || c === undefined || c === false) continue;
      node.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(c) : c);
    }
    return node;
  }
  const header = (title, sub) => el('div', { class: 'page-head' },
    el('h1', {}, title),
    sub ? el('p', { class: 'muted' }, sub) : null);

  const fmtDateTime = (iso) => {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) +
      ' · ' + d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
  };

  function ringSvg(pct) {
    const r = 52, c = 2 * Math.PI * r;
    const off = c - (Math.max(0, Math.min(100, pct)) / 100) * c;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'ring');
    svg.setAttribute('viewBox', '0 0 124 124');
    svg.innerHTML =
      `<circle class="ring-bg" cx="62" cy="62" r="${r}" fill="none" stroke-width="10"/>` +
      `<circle class="ring-fg" cx="62" cy="62" r="${r}" fill="none" stroke-width="10" stroke-linecap="round"
         stroke-dasharray="${c}" stroke-dashoffset="${off}"/>` +
      `<text class="ring-text" x="62" y="64">${pct}%</text>`;
    return svg;
  }

  let toastEl = null;
  let toastTimer = null;
  function toast(msg) {
    if (!toastEl) { toastEl = el('div', { class: 'toast' }); document.body.appendChild(toastEl); }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
  }

  // ---------- คะแนน ----------
  function computeScore(answers) {
    const byCat = {};
    CATEGORIES.forEach((c) => { byCat[c.id] = { score: 0, max: 0, pct: 0 }; });
    let total = 0;
    QUESTIONS.forEach((q) => {
      const v = Number(answers[q.n]) || 0;
      total += v;
      byCat[q.cat].score += v;
      byCat[q.cat].max += 3;
    });
    Object.values(byCat).forEach((b) => { b.pct = b.max ? Math.round((b.score / b.max) * 100) : 0; });
    return { total, pct: Math.round((total / TOTAL_MAX) * 100), byCat };
  }

  function copySummary(rec, sc, sortedCats) {
    const overall = overallOf(sc.pct);
    const lines = [];
    lines.push('theAll Life Check 1.0 — ผลการวิเคราะห์');
    lines.push(fmtDateTime(rec.date));
    lines.push('');
    lines.push(`คะแนนรวม: ${sc.total}/${TOTAL_MAX} (${sc.pct}%)`);
    lines.push(`${overall.title} — ${overall.text}`);
    lines.push('');
    lines.push('รายกลุ่มรูปแบบหัวใจ:');
    sortedCats.forEach((c) => {
      const p = sc.byCat[c.id].pct;
      lines.push(`- ${c.icon} ${c.title}: ${p}% (${tierOf(p).label})`);
    });
    const focus = sortedCats.filter((c) => sc.byCat[c.id].pct > 25).slice(0, 4);
    if (focus.length) {
      lines.push('');
      lines.push('จุดที่ควรเสริมกำลัง:');
      focus.forEach((c) => {
        lines.push('');
        lines.push(`${c.icon} ${c.title}`);
        lines.push(c.blurb);
        c.steps.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
      });
    }
    const text = lines.join('\n');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => toast('คัดลอกสรุปผลแล้ว')).catch(() => toast('คัดลอกไม่สำเร็จ ลองอีกครั้ง'));
    } else {
      toast('เบราว์เซอร์นี้ไม่รองรับการคัดลอกอัตโนมัติ');
    }
  }

  function focusCard(c) {
    const fc = el('div', { class: 'lc-focus-card' });
    fc.appendChild(el('div', { class: 'lc-focus-head' },
      el('span', { class: 'lc-focus-icon' }, c.icon),
      el('span', { class: 'lc-focus-title' }, c.title)));
    fc.appendChild(el('div', { class: 'lc-focus-blurb' }, c.blurb));
    fc.appendChild(el('div', { class: 'lc-focus-steps-h' }, 'แนวทางเสริมกำลัง'));
    const ul = el('ul', { class: 'lc-focus-steps' });
    c.steps.forEach((s) => ul.appendChild(el('li', {}, s)));
    fc.appendChild(ul);
    return fc;
  }

  // ---------- เส้นทาง (routes) ----------
  const routes = {};
  function route(name, fn) { routes[name] = fn; }
  function go(name, params) { location.hash = '#' + name + (params ? '?' + new URLSearchParams(params) : ''); }
  function render() {
    const app = document.getElementById('app');
    app.innerHTML = '';
    const raw = location.hash.replace(/^#/, '') || 'intro';
    const [name, qs] = raw.split('?');
    const params = Object.fromEntries(new URLSearchParams(qs || ''));
    const fn = routes[name] || routes.intro;
    app.appendChild(fn(params));
    window.scrollTo(0, 0);
  }

  // ---------- หน้า: เริ่มต้น ----------
  route('intro', () => {
    const wrap = el('div', { class: 'page' });
    wrap.appendChild(el('div', { class: 'lc-intro-icon' }, '🪞'));
    wrap.appendChild(el('h1', { class: 'center' }, 'theAll Life Check 1.0'));
    wrap.appendChild(el('p', { class: 'lc-sub' }, 'กระจก 30 ข้อ · สำรวจรูปแบบหัวใจใต้ความกดดัน'));
    wrap.appendChild(el('p', { class: 'lc-timeframe' }, '⏳ ช่วงเวลา: พฤติกรรมจริงในช่วง 4 สัปดาห์ที่ผ่านมา'));

    const scaleCard = el('div', { class: 'card' });
    scaleCard.appendChild(el('h3', { class: 'card-h' }, 'การให้คะแนน'));
    const scaleList = el('div', { class: 'lc-scale-list' });
    SCALE.forEach((s) => scaleList.appendChild(el('div', { class: 'lc-scale-row' },
      el('span', { class: 'lc-scale-num' }, String(s.v)),
      el('span', { class: 'lc-scale-desc' }, s.desc))));
    scaleCard.appendChild(scaleList);
    wrap.appendChild(scaleCard);

    wrap.appendChild(el('div', { class: 'card note' },
      'ตอบตามความจริงในชีวิต ไม่ใช่ตามที่ควรจะเป็น ผลลัพธ์นี้เก็บอยู่ในเครื่องของคุณเท่านั้น ไม่มีการส่งข้อมูลออกไปที่ใด'));

    wrap.appendChild(el('button', { class: 'btn primary', onclick: () => go('assess') }, 'เริ่มทำแบบสำรวจ'));

    const hist = getHistory();
    if (hist.length) {
      wrap.appendChild(el('div', { class: 'action-row' },
        el('button', { class: 'btn', onclick: () => go('result', { i: 0 }) }, 'ดูผลล่าสุด'),
        el('button', { class: 'btn', onclick: () => go('history') }, `ประวัติ (${hist.length})`)));
    }
    return wrap;
  });

  // ---------- หน้า: ทำแบบสำรวจ ----------
  route('assess', () => {
    const draft = {};
    const wrap = el('div', { class: 'page' });
    wrap.appendChild(header('กระจก 30 ข้อ', 'ทำเครื่องหมายพฤติกรรมจริงในช่วง 4 สัปดาห์ที่ผ่านมา'));

    const barFill = el('div', { class: 'bar-fill lk', style: 'width:0%' });
    const progressText = el('span', {}, `0/${QUESTIONS.length} ข้อที่ตอบแล้ว`);
    wrap.appendChild(el('div', { class: 'sticky-progress' }, el('div', { class: 'bar' }, barFill), progressText));

    function updateProgress() {
      const n = Object.keys(draft).length;
      barFill.style.width = Math.round((n / QUESTIONS.length) * 100) + '%';
      progressText.textContent = `${n}/${QUESTIONS.length} ข้อที่ตอบแล้ว`;
    }

    const cards = [];
    QUESTIONS.forEach((q) => {
      const card = el('div', { class: 'lc-q-card unanswered' });
      card.appendChild(el('div', { class: 'lc-q-num' }, `ข้อ ${q.n}`));
      card.appendChild(el('div', { class: 'lc-q-text' }, q.text));
      const choices = el('div', { class: 'lc-choices' });
      SCALE.forEach((s) => {
        const btn = el('button', {
          class: 'lc-choice', type: 'button',
          onclick: () => {
            draft[q.n] = s.v;
            card.classList.remove('unanswered');
            Array.from(choices.children).forEach((c) => c.classList.remove('active'));
            btn.classList.add('active');
            updateProgress();
          },
        }, el('b', {}, String(s.v)), s.label);
        choices.appendChild(btn);
      });
      card.appendChild(choices);
      cards[q.n] = card;
      wrap.appendChild(card);
    });

    wrap.appendChild(el('div', { class: 'action-row' },
      el('button', {
        class: 'btn primary',
        onclick: () => {
          const missing = QUESTIONS.find((q) => draft[q.n] === undefined);
          if (missing) {
            cards[missing.n].scrollIntoView({ behavior: 'smooth', block: 'center' });
            toast('กรุณาตอบให้ครบทุกข้อก่อนดูผล');
            return;
          }
          const hist = getHistory();
          hist.unshift({ date: new Date().toISOString(), answers: draft });
          setHistory(hist);
          go('result', { i: 0 });
        },
      }, 'ดูผลวิเคราะห์')));
    return wrap;
  });

  // ---------- หน้า: ผลวิเคราะห์ ----------
  route('result', (params) => {
    const hist = getHistory();
    const i = parseInt(params.i || '0', 10) || 0;
    const rec = hist[i];
    if (!rec) { go('intro'); return el('div'); }
    const sc = computeScore(rec.answers);
    const overall = overallOf(sc.pct);
    const sortedCats = [...CATEGORIES].sort((a, b) => sc.byCat[b.id].pct - sc.byCat[a.id].pct);

    const wrap = el('div', { class: 'page' });
    wrap.appendChild(header('ผลการวิเคราะห์', fmtDateTime(rec.date)));

    const topCard = el('div', { class: 'card center' });
    topCard.appendChild(ringSvg(sc.pct));
    topCard.appendChild(el('div', { class: 'lc-overall-title' }, overall.title));
    topCard.appendChild(el('div', { class: 'lc-overall-text' }, overall.text));
    wrap.appendChild(topCard);

    const breakdown = el('div', { class: 'card' });
    breakdown.appendChild(el('h3', { class: 'card-h' }, 'รายกลุ่มรูปแบบหัวใจ'));
    sortedCats.forEach((c) => {
      const p = sc.byCat[c.id].pct;
      const tier = tierOf(p);
      const row = el('div', { class: 'lc-cat-row' });
      row.appendChild(el('div', { class: 'lc-cat-head' },
        el('span', { class: 'lc-cat-icon' }, c.icon),
        el('span', { class: 'lc-cat-title' }, c.title),
        el('span', { class: 'lc-cat-badge', style: `background:${tier.color}26;color:${tier.color}` }, tier.label),
        el('span', { class: 'lc-cat-pct', style: `color:${tier.color}` }, p + '%')));
      row.appendChild(el('div', { class: 'bar' }, el('div', { class: 'bar-fill', style: `width:${p}%;background:${tier.color}` })));
      breakdown.appendChild(row);
    });
    wrap.appendChild(breakdown);

    const focus = sortedCats.filter((c) => sc.byCat[c.id].pct > 25);
    const focusList = focus.length ? focus.slice(0, 4) : [];
    wrap.appendChild(el('h3', { class: 'section-h' }, 'จุดที่ควรเสริมกำลัง'));
    if (!focusList.length) {
      wrap.appendChild(el('div', { class: 'card note' }, 'ยังไม่พบรูปแบบที่ต้องเป็นห่วงเป็นพิเศษในตอนนี้ — รักษาความมั่นคงนี้ไว้ต่อไป'));
    } else {
      focusList.forEach((c) => wrap.appendChild(focusCard(c)));
    }

    const remaining = sortedCats.filter((c) => !focusList.includes(c));
    if (remaining.length) {
      const det = el('details', { class: 'lc-more-cats' });
      det.appendChild(el('summary', {}, `ดูอีก ${remaining.length} กลุ่มที่เหลือ`));
      remaining.forEach((c) => det.appendChild(focusCard(c)));
      wrap.appendChild(det);
    }

    wrap.appendChild(el('div', { class: 'action-row col' },
      el('button', { class: 'btn primary', onclick: () => go('assess') }, '＋ ทำแบบประเมินใหม่'),
      el('button', { class: 'btn', onclick: () => copySummary(rec, sc, sortedCats) }, '📋 คัดลอกสรุปผล'),
      el('button', { class: 'btn', onclick: () => go('intro') }, 'กลับหน้าแรก')));
    return wrap;
  });

  // ---------- หน้า: ประวัติ ----------
  route('history', () => {
    const hist = getHistory();
    const wrap = el('div', { class: 'page' });
    wrap.appendChild(header('ประวัติการประเมิน'));
    if (!hist.length) {
      wrap.appendChild(el('div', { class: 'lc-empty-hist' }, 'ยังไม่มีประวัติการประเมิน'));
    } else {
      const list = el('div', { class: 'list' });
      hist.forEach((rec, i) => {
        const sc = computeScore(rec.answers);
        list.appendChild(el('button', { class: 'list-item', onclick: () => go('result', { i }) },
          el('span', { class: 'li-date' }, fmtDateTime(rec.date)),
          el('span', { class: 'li-pct' }, sc.pct + '%'),
          el('span', { class: 'li-go' }, '›')));
      });
      wrap.appendChild(list);
    }
    wrap.appendChild(el('div', { class: 'action-row' }, el('button', { class: 'btn', onclick: () => go('intro') }, 'กลับหน้าแรก')));
    return wrap;
  });

  window.addEventListener('hashchange', render);
  window.addEventListener('DOMContentLoaded', render);
})();
