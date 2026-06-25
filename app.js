/* app.js — ตรรกะหลักของแอปเช็คการพัฒนาชีวิตคริสเตียน
 * ทำงานแบบออฟไลน์เต็มรูปแบบ เก็บข้อมูลใน localStorage
 * การส่งรายงาน/รวมสถิติใช้ลิงก์ที่ฝังข้อมูล (ไม่ต้องมีเซิร์ฟเวอร์)
 */
(function () {
  'use strict';

  // ---------- ที่เก็บข้อมูล ----------
  const KEY_PROFILE = 'dt.profile';      // โปรไฟล์ผู้ใช้
  const KEY_HISTORY = 'dt.history';      // ประวัติการประเมินของตัวเอง
  const KEY_TEAM    = 'dt.team';         // รายงาน/ผลประเมินของสมาชิก (สำหรับผู้ดูแล)
  const KEY_MEMBERS = 'dt.members';      // รายชื่อสมาชิกที่ผู้ดูแลเพิ่มเอง (รวมคนที่ยังไม่ประเมิน)

  const store = {
    get(k, def) { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } },
    set(k, v) { localStorage.setItem(k, JSON.stringify(v)); },
  };

  const getProfile = () => store.get(KEY_PROFILE, null);
  const setProfile = (p) => store.set(KEY_PROFILE, p);
  const getHistory = () => store.get(KEY_HISTORY, []);
  const setHistory = (h) => store.set(KEY_HISTORY, h);
  const getTeam = () => store.get(KEY_TEAM, []);
  const setTeam = (t) => store.set(KEY_TEAM, t);
  const getMembers = () => store.get(KEY_MEMBERS, []);
  const setMembers = (m) => store.set(KEY_MEMBERS, m);

  // ---------- ยูทิลิตี้ ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') n.className = v;
      else if (k === 'html') n.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
      else if (v !== null && v !== undefined) n.setAttribute(k, v);
    }
    for (const kid of kids) {
      if (kid == null) continue;
      n.appendChild(typeof kid === 'string' ? document.createTextNode(kid) : kid);
    }
    return n;
  };
  const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
  const todayISO = () => new Date().toISOString().slice(0, 10);
  const fmtDate = (iso) => {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // ---------- โมเดลคะแนน ----------
  // สร้างชุดข้อมูลว่างสำหรับการประเมิน 1 ครั้ง: { areaId: [ [know,do,share], ... ] }
  function emptyRatings() {
    const r = {};
    for (const a of AREAS) r[a.id] = a.verses.map(() => [false, false, false]);
    return r;
  }

  // นับคะแนนรวมจาก ratings -> { total, score, byArea: {id:{know,do,share,items,score,pct}} }
  function score(ratings) {
    const W = { 0: 1, 1: 2, 2: 3 }; // รู้=1 กระทำ=2 แบ่งปัน=3
    let totalScore = 0, maxScore = 0;
    const byArea = {};
    for (const a of AREAS) {
      const rows = ratings[a.id] || [];
      let know = 0, doc = 0, share = 0, s = 0;
      for (const row of rows) {
        if (row[0]) { know++; s += W[0]; }
        if (row[1]) { doc++;  s += W[1]; }
        if (row[2]) { share++; s += W[2]; }
      }
      const max = rows.length * (W[0] + W[1] + W[2]);
      byArea[a.id] = { know, do: doc, share, items: rows.length, score: s, max, pct: max ? Math.round((s / max) * 100) : 0 };
      totalScore += s; maxScore += max;
    }
    return { score: totalScore, max: maxScore, pct: maxScore ? Math.round((totalScore / maxScore) * 100) : 0, byArea };
  }

  // ---------- เข้ารหัส/ถอดรหัสรายงาน (บีบให้สั้นเป็น base64url ของบิต) ----------
  function ratingsToBits(ratings) {
    const bits = [];
    for (const a of AREAS) {
      const rows = ratings[a.id] || [];
      for (let i = 0; i < a.verses.length; i++) {
        const row = rows[i] || [false, false, false];
        bits.push(row[0] ? 1 : 0, row[1] ? 1 : 0, row[2] ? 1 : 0);
      }
    }
    return bits; // length = TOTAL_BITS
  }
  function bitsToRatings(bits) {
    const r = emptyRatings();
    let idx = 0;
    for (const a of AREAS) {
      for (let i = 0; i < a.verses.length; i++) {
        r[a.id][i] = [!!bits[idx], !!bits[idx + 1], !!bits[idx + 2]];
        idx += 3;
      }
    }
    return r;
  }
  const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  function bitsToB64(bits) {
    let out = '';
    for (let i = 0; i < bits.length; i += 6) {
      let v = 0;
      for (let j = 0; j < 6; j++) v = (v << 1) | (bits[i + j] || 0);
      out += B64[v];
    }
    return out;
  }
  function b64ToBits(str, len) {
    const bits = [];
    for (const ch of str) {
      const v = B64.indexOf(ch);
      if (v < 0) continue;
      for (let j = 5; j >= 0; j--) bits.push((v >> j) & 1);
    }
    return bits.slice(0, len);
  }

  // สร้าง payload รายงาน (ออบเจ็กต์เล็ก) -> string สำหรับใส่ใน URL
  function encodeReport(rec, profile) {
    const payload = {
      v: 1,
      n: profile.name || '',
      bd: profile.believeDate || '',
      sv: profile.supervisor || '',
      d: rec.date,
      b: bitsToB64(ratingsToBits(rec.ratings)),
    };
    return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  }
  function decodeReport(s) {
    try {
      const payload = JSON.parse(decodeURIComponent(escape(atob(s))));
      if (!payload || payload.v !== 1) return null;
      const bits = b64ToBits(payload.b || '', TOTAL_BITS);
      return {
        name: payload.n || 'ไม่ระบุชื่อ',
        believeDate: payload.bd || '',
        supervisor: payload.sv || '',
        date: payload.d || todayISO(),
        ratings: bitsToRatings(bits),
      };
    } catch { return null; }
  }

  // ---------- เราเตอร์อย่างง่าย ----------
  const routes = {};
  function route(name, fn) { routes[name] = fn; }
  function go(name, params) { location.hash = '#' + name + (params ? '?' + new URLSearchParams(params) : ''); }
  function render() {
    const root = $('#app');
    const raw = location.hash.replace(/^#/, '') || 'home';
    const [name, qs] = raw.split('?');
    const params = Object.fromEntries(new URLSearchParams(qs || ''));
    const fn = routes[name] || routes['home'];
    root.innerHTML = '';
    root.appendChild(fn(params));
    updateNav(name);
    window.scrollTo(0, 0);
  }

  // ---------- ส่วนประกอบ UI ที่ใช้ซ้ำ ----------
  function header(title, subtitle, backTo) {
    return el('div', { class: 'page-head' },
      backTo ? el('button', { class: 'back', onclick: () => go(backTo) }, '‹') : null,
      el('div', {},
        el('h1', {}, title),
        subtitle ? el('p', { class: 'muted' }, subtitle) : null,
      ),
    );
  }

  function ringSvg(pct, size = 120) {
    const r = (size - 16) / 2, c = 2 * Math.PI * r, off = c * (1 - pct / 100);
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    svg.setAttribute('class', 'ring');
    const mk = (cls, dash) => {
      const ci = document.createElementNS(ns, 'circle');
      ci.setAttribute('cx', size / 2); ci.setAttribute('cy', size / 2); ci.setAttribute('r', r);
      ci.setAttribute('fill', 'none'); ci.setAttribute('stroke-width', 12); ci.setAttribute('class', cls);
      if (dash != null) { ci.setAttribute('stroke-dasharray', c); ci.setAttribute('stroke-dashoffset', dash); ci.setAttribute('stroke-linecap', 'round'); }
      return ci;
    };
    svg.appendChild(mk('ring-bg'));
    svg.appendChild(mk('ring-fg', off));
    const t = document.createElementNS(ns, 'text');
    t.setAttribute('x', size / 2); t.setAttribute('y', size / 2); t.setAttribute('class', 'ring-text');
    t.textContent = pct + '%';
    svg.appendChild(t);
    return svg;
  }

  // แถบความก้าวหน้าแยกระดับ รู้/กระทำ/แบ่งปัน
  function levelBar(byArea) {
    let know = 0, doc = 0, share = 0, items = 0;
    for (const a of AREAS) { const s = byArea[a.id]; know += s.know; doc += s.do; share += s.share; items += s.items; }
    const wrap = el('div', { class: 'levels' });
    [['รู้', know, 'lk'], ['กระทำ', doc, 'ld'], ['แบ่งปัน', share, 'ls']].forEach(([label, n, cls]) => {
      const pct = items ? Math.round((n / items) * 100) : 0;
      wrap.appendChild(el('div', { class: 'level-row' },
        el('span', { class: 'level-label' }, label),
        el('div', { class: 'bar' }, el('div', { class: 'bar-fill ' + cls, style: `width:${pct}%` })),
        el('span', { class: 'level-num' }, `${n}/${items}`),
      ));
    });
    return wrap;
  }

  // ---------- หน้า: ลงทะเบียน ----------
  route('register', () => {
    const p = getProfile() || {};
    const wrap = el('div', { class: 'page' });
    wrap.appendChild(el('div', { class: 'brand' },
      el('div', { class: 'logo' }, '✝'),
      el('h1', {}, 'เส้นทางสาวก'),
      el('p', { class: 'muted' }, 'เครื่องมือเช็คการเติบโตฝ่ายวิญญาณ 9 ด้าน'),
    ));

    const f = el('form', { class: 'card form', onsubmit: (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(f).entries());
      if (!data.name.trim()) return;
      setProfile({
        id: p.id || uid(),
        name: data.name.trim(),
        role: data.role,
        believeDate: data.believeDate || '',
        supervisor: data.supervisor.trim(),
        supervisorContact: data.supervisorContact.trim(),
        createdAt: p.createdAt || Date.now(),
      });
      go('home');
    } });

    f.appendChild(field('ชื่อของคุณ', el('input', { name: 'name', value: p.name || '', placeholder: 'ชื่อ-นามสกุล', required: 'true' })));
    f.appendChild(field('บทบาท', selectEl('role', [
      ['member', 'ผู้เชื่อใหม่ / สาวก'],
      ['leader', 'ผู้ดูแล / ผู้นำกลุ่ม'],
    ], p.role || 'member')));
    f.appendChild(field('วันที่รับเชื่อ (ถ้ามี)', el('input', { name: 'believeDate', type: 'date', value: p.believeDate || '' })));
    f.appendChild(field('ชื่อผู้ดูแล/พี่เลี้ยง', el('input', { name: 'supervisor', value: p.supervisor || '', placeholder: 'เช่น พี่สมชาย' })));
    f.appendChild(field('ช่องทางติดต่อผู้ดูแล (LINE/เบอร์)', el('input', { name: 'supervisorContact', value: p.supervisorContact || '', placeholder: 'ไว้ใช้ส่งรายงาน' })));
    f.appendChild(el('button', { class: 'btn primary', type: 'submit' }, 'เริ่มใช้งาน'));
    wrap.appendChild(f);
    return wrap;
  });

  function field(label, input) {
    return el('label', { class: 'field' }, el('span', {}, label), input);
  }

  // สร้างลิงก์เชิญสมาชิกให้กรอกเอง (ฝังชื่อ + ผู้นำ)
  function inviteLink(name) {
    const p = getProfile() || {};
    const qs = new URLSearchParams({ n: name, by: p.name || '', c: p.supervisorContact || '' });
    return location.origin + location.pathname + '#invite?' + qs.toString();
  }

  // ---------- หน้า: รับคำเชิญ (สมาชิกเปิดลิงก์จากผู้นำ) ----------
  route('invite', (params) => {
    const name = (params.n || '').trim();
    const by = (params.by || '').trim();
    const contact = (params.c || '').trim();
    const existing = getProfile();
    const wrap = el('div', { class: 'page' });

    if (!name) { go(existing ? 'home' : 'register'); return wrap; }

    wrap.appendChild(el('div', { class: 'brand' },
      el('div', { class: 'logo' }, '✝'),
      el('h1', {}, 'สวัสดี ' + name + ' 🙏'),
      el('p', { class: 'muted' }, (by ? by + ' ' : '') + 'เชิญคุณเช็คสุขภาพฝ่ายวิญญาณ 9 ด้าน'),
    ));
    wrap.appendChild(el('div', { class: 'card' },
      el('p', {}, 'แอปนี้เป็นของคุณคนเดียว — ', el('b', {}, 'ข้อมูลเก็บในเครื่องคุณ เห็นเฉพาะของคุณ'), ' เมื่อประเมินเสร็จ เพียงกด "ส่งให้ผู้นำ" ผลของคุณก็จะไปรวมในภาพรวมของผู้นำ'),
      (existing && existing.name !== name)
        ? el('p', { class: 'muted small' }, '* เครื่องนี้เคยตั้งค่าเป็น "' + existing.name + '" มาก่อน หากดำเนินต่อจะเปลี่ยนเป็น "' + name + '"')
        : null,
    ));
    wrap.appendChild(el('div', { class: 'action-row col' },
      el('button', { class: 'btn primary', onclick: () => {
        setProfile({
          id: (existing && existing.name === name) ? existing.id : uid(),
          name, role: 'member',
          believeDate: (existing && existing.name === name) ? existing.believeDate : '',
          supervisor: by, supervisorContact: contact, createdAt: Date.now(),
        });
        go('assess');
      } }, 'เริ่มประเมินของฉัน'),
    ));
    return wrap;
  });

  function selectEl(name, opts, val) {
    const s = el('select', { name });
    for (const [v, t] of opts) {
      const o = el('option', { value: v }, t);
      if (v === val) o.selected = true;
      s.appendChild(o);
    }
    return s;
  }

  // ---------- หน้า: หน้าหลัก / แดชบอร์ดส่วนตัว ----------
  route('home', () => {
    const p = getProfile();
    if (!p) { go('register'); return el('div'); }
    const hist = getHistory();
    const latest = hist[0];
    const wrap = el('div', { class: 'page' });

    wrap.appendChild(el('div', { class: 'topbar' },
      el('div', {}, el('div', { class: 'hello' }, 'สวัสดี', ), el('div', { class: 'name' }, p.name)),
      el('button', { class: 'icon-btn', title: 'แก้ไขโปรไฟล์', onclick: () => go('register') }, '⚙'),
    ));

    if (!latest) {
      wrap.appendChild(el('div', { class: 'card empty' },
        el('div', { class: 'emoji' }, '🌱'),
        el('h3', {}, 'ยังไม่มีการประเมิน'),
        el('p', { class: 'muted' }, 'เริ่มเช็คสุขภาพฝ่ายวิญญาณของคุณครั้งแรกได้เลย'),
        el('button', { class: 'btn primary', onclick: () => go('assess') }, 'เริ่มประเมินครั้งแรก'),
      ));
    } else {
      const sc = score(latest.ratings);
      const card = el('div', { class: 'card center' });
      card.appendChild(ringSvg(sc.pct));
      card.appendChild(el('p', { class: 'muted' }, 'ภาพรวมล่าสุด • ' + fmtDate(latest.date)));
      card.appendChild(levelBar(sc.byArea));
      wrap.appendChild(card);

      // เปรียบเทียบกับครั้งก่อน
      if (hist[1]) {
        const prev = score(hist[1].ratings);
        const diff = sc.pct - prev.pct;
        wrap.appendChild(el('div', { class: 'trend ' + (diff >= 0 ? 'up' : 'down') },
          (diff >= 0 ? '▲ ' : '▼ ') + Math.abs(diff) + '% เทียบกับครั้งก่อน (' + fmtDate(hist[1].date) + ')'));
      }

      // สรุปรายด้าน
      const grid = el('div', { class: 'area-grid' });
      for (const a of AREAS) {
        const s = sc.byArea[a.id];
        grid.appendChild(el('div', { class: 'area-chip' },
          el('span', { class: 'area-icon' }, a.icon),
          el('span', { class: 'area-name' }, a.title),
          el('span', { class: 'area-pct' }, s.pct + '%'),
        ));
      }
      wrap.appendChild(el('h3', { class: 'section-h' }, 'ความก้าวหน้ารายด้าน'));
      wrap.appendChild(grid);
    }

    const actions = el('div', { class: 'action-row' },
      el('button', { class: 'btn primary', onclick: () => go('assess') }, '＋ ประเมินรอบใหม่'),
    );
    if (latest) actions.appendChild(el('button', { class: 'btn', onclick: () => go('share') }, '📤 ส่งรายงาน'));
    wrap.appendChild(actions);

    if (hist.length) {
      wrap.appendChild(el('h3', { class: 'section-h' }, 'ประวัติย้อนหลัง'));
      const list = el('div', { class: 'list' });
      hist.forEach((rec, i) => {
        const sc = score(rec.ratings);
        list.appendChild(el('button', { class: 'list-item', onclick: () => go('result', { i }) },
          el('span', { class: 'li-date' }, fmtDate(rec.date)),
          el('span', { class: 'li-pct' }, sc.pct + '%'),
          el('span', { class: 'li-go' }, '›'),
        ));
      });
      wrap.appendChild(list);
    }
    return wrap;
  });

  // ---------- หน้า: ทำแบบประเมิน ----------
  // params.for = ชื่อสมาชิก -> ผู้ดูแลประเมินแทนสมาชิกคนนั้น (เก็บเข้าทีม)
  route('assess', (params) => {
    const p = getProfile();
    if (!p) { go('register'); return el('div'); }
    const forName = params.for || '';
    const backTo = forName ? 'member?name=' + encodeURIComponent(forName) : 'home';
    const ratings = emptyRatings();
    const wrap = el('div', { class: 'page' });
    wrap.appendChild(header(
      forName ? 'ประเมินให้: ' + forName : 'แบบประเมินสุขภาพฝ่ายวิญญาณ',
      'ทำเครื่องหมายในระดับที่ไปถึงของแต่ละข้อ', backTo));

    // คำอธิบายสเกล
    const legend = el('div', { class: 'legend' });
    LEVELS.forEach((l, i) => legend.appendChild(el('span', { class: 'legend-item lv' + i }, el('b', {}, l.label), ' = ' + l.desc)));
    wrap.appendChild(legend);

    const progressTop = el('div', { class: 'sticky-progress' }, el('div', { class: 'bar' }, el('div', { class: 'bar-fill lk', style: 'width:0%' })), el('span', {}, '0/' + TOTAL_ITEMS + ' ด้านที่แตะแล้ว'));
    const updateTop = () => {
      let touched = 0;
      for (const a of AREAS) for (const row of ratings[a.id]) if (row.some(Boolean)) touched++;
      const pct = Math.round((touched / TOTAL_ITEMS) * 100);
      $('.bar-fill', progressTop).style.width = pct + '%';
      $('span', progressTop).textContent = `${touched}/${TOTAL_ITEMS} ข้อที่ตอบแล้ว`;
    };
    wrap.appendChild(progressTop);

    for (const a of AREAS) {
      const sec = el('section', { class: 'assess-area' });
      sec.appendChild(el('div', { class: 'aa-head' }, el('span', { class: 'aa-icon' }, a.icon), el('h3', {}, a.title)));
      const table = el('div', { class: 'aa-table' });
      table.appendChild(el('div', { class: 'aa-row aa-header' },
        el('span', { class: 'aa-verse' }, 'ข้อพระคัมภีร์'),
        ...LEVELS.map((l) => el('span', { class: 'aa-cell' }, l.label)),
      ));
      a.verses.forEach((v, vi) => {
        const row = el('div', { class: 'aa-row' },
          el('button', { class: 'aa-verse verse-link', type: 'button', onclick: () => showVerse(v) }, v, el('span', { class: 'verse-ico' }, '📖')));
        LEVELS.forEach((l, li) => {
          const box = el('input', { type: 'checkbox', class: 'chk lv' + li });
          box.addEventListener('change', () => {
            ratings[a.id][vi][li] = box.checked;
            // บังคับลำดับ: ติ๊กระดับสูงต้องมีระดับล่างด้วย
            if (box.checked) for (let k = 0; k < li; k++) { ratings[a.id][vi][k] = true; row.querySelectorAll('.chk')[k].checked = true; }
            else for (let k = li + 1; k < LEVELS.length; k++) { ratings[a.id][vi][k] = false; row.querySelectorAll('.chk')[k].checked = false; }
            updateTop();
          });
          row.appendChild(el('label', { class: 'aa-cell' }, box));
        });
        table.appendChild(row);
      });
      sec.appendChild(table);
      wrap.appendChild(sec);
    }

    const noteWrap = field('บันทึก/คำอธิษฐาน (ไม่บังคับ)', el('textarea', { name: 'note', rows: '3', placeholder: 'สิ่งที่พระเจ้าตรัส, เป้าหมายที่อยากเติบโต...' }));
    noteWrap.classList.add('card');
    wrap.appendChild(noteWrap);

    wrap.appendChild(el('div', { class: 'action-row' },
      el('button', { class: 'btn primary', onclick: () => {
        const note = $('textarea', noteWrap).value.trim();
        if (forName) {
          // ผู้ดูแลประเมินแทนสมาชิก -> เก็บเข้าทีม
          const m = getMembers().find((x) => x.name === forName);
          const team = getTeam();
          team.unshift({ name: forName, believeDate: m ? m.believeDate : '', supervisor: p.name, date: todayISO(), ratings, note, savedAt: Date.now() });
          setTeam(team);
          go('member', { name: forName });
        } else {
          const rec = { id: uid(), date: todayISO(), ratings, note };
          const hist = getHistory();
          hist.unshift(rec);
          setHistory(hist);
          go('result', { i: 0 });
        }
      } }, 'บันทึกผลการประเมิน'),
      el('button', { class: 'btn', onclick: () => go(backTo) }, 'ยกเลิก'),
    ));
    return wrap;
  });

  // ---------- หน้า: ผลการประเมิน 1 ครั้ง ----------
  route('result', (params) => {
    const p = getProfile();
    const hist = getHistory();
    const i = parseInt(params.i || '0', 10);
    const rec = hist[i];
    if (!rec) { go('home'); return el('div'); }
    const sc = score(rec.ratings);
    const wrap = el('div', { class: 'page' });
    wrap.appendChild(header('ผลการประเมิน', fmtDate(rec.date), 'home'));

    const card = el('div', { class: 'card center' });
    card.appendChild(ringSvg(sc.pct));
    card.appendChild(levelBar(sc.byArea));
    wrap.appendChild(card);

    for (const a of AREAS) {
      const s = sc.byArea[a.id];
      wrap.appendChild(el('div', { class: 'res-area' },
        el('div', { class: 'res-head' }, el('span', { class: 'aa-icon' }, a.icon), el('b', {}, a.title), el('span', { class: 'res-pct' }, s.pct + '%')),
        el('div', { class: 'bar' }, el('div', { class: 'bar-fill ls', style: `width:${s.pct}%` })),
        el('div', { class: 'res-mini' }, `รู้ ${s.know} · กระทำ ${s.do} · แบ่งปัน ${s.share} (จาก ${s.items} ข้อ)`),
      ));
    }

    if (rec.note) wrap.appendChild(el('div', { class: 'card note' }, el('b', {}, 'บันทึก: '), rec.note));

    wrap.appendChild(el('div', { class: 'action-row' },
      el('button', { class: 'btn primary', onclick: () => go('share', { i }) }, '📤 ส่งรายงานให้ผู้ดูแล'),
      el('button', { class: 'btn danger', onclick: () => {
        if (!confirm('ลบผลการประเมินนี้?')) return;
        hist.splice(i, 1); setHistory(hist); go('home');
      } }, 'ลบ'),
    ));
    return wrap;
  });

  // ---------- หน้า: ส่งรายงาน ----------
  route('share', (params) => {
    const p = getProfile();
    const hist = getHistory();
    const i = parseInt(params.i || '0', 10);
    const rec = hist[i];
    if (!p || !rec) { go('home'); return el('div'); }
    const sc = score(rec.ratings);
    const code = encodeReport(rec, p);
    const link = location.origin + location.pathname + '#import?r=' + encodeURIComponent(code);

    const summaryLines = AREAS.map((a) => `${a.icon} ${a.title}: ${sc.byArea[a.id].pct}%`).join('\n');
    const text =
      `รายงานการเติบโตฝ่ายวิญญาณ\n` +
      `ชื่อ: ${p.name}\n` +
      `วันที่: ${fmtDate(rec.date)}\n` +
      `ภาพรวม: ${sc.pct}%\n\n` +
      summaryLines +
      `\n\nดูรายละเอียด/รวมสถิติ:\n${link}`;

    const wrap = el('div', { class: 'page' });
    wrap.appendChild(header('ส่งรายงานให้ผู้ดูแล', p.supervisor ? 'ถึง: ' + p.supervisor : null, 'home'));
    wrap.appendChild(el('div', { class: 'card' },
      el('p', {}, 'ส่งสรุปผลให้พี่เลี้ยง/ผู้ดูแลของคุณ เพื่อหนุนใจและติดตามการเติบโต'),
      el('pre', { class: 'report-preview' }, text),
    ));

    const actions = el('div', { class: 'action-row col' });
    actions.appendChild(el('button', { class: 'btn primary', onclick: async () => {
      if (navigator.share) { try { await navigator.share({ title: 'รายงานการเติบโต', text }); return; } catch {} }
      copy(text);
    } }, '📲 ส่ง/แชร์ (LINE, ข้อความ ฯลฯ)'));
    actions.appendChild(el('button', { class: 'btn', onclick: () => copy(text) }, '📋 คัดลอกข้อความรายงาน'));
    actions.appendChild(el('button', { class: 'btn', onclick: () => copy(link) }, '🔗 คัดลอกลิงก์รายงาน'));
    if (p.supervisorContact) actions.appendChild(el('p', { class: 'muted center' }, 'ช่องทางผู้ดูแล: ' + p.supervisorContact));
    wrap.appendChild(actions);
    return wrap;
  });

  function copy(text) {
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => toast('คัดลอกแล้ว ✓'), () => toast('คัดลอกไม่สำเร็จ'));
    else { const t = el('textarea', {}); t.value = text; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); toast('คัดลอกแล้ว ✓'); } catch { toast('คัดลอกไม่สำเร็จ'); } t.remove(); }
  }

  // ---------- หน้า: รับรายงาน (เปิดจากลิงก์) ----------
  route('import', (params) => {
    const code = params.r ? decodeURIComponent(params.r) : '';
    const rep = decodeReport(code);
    const wrap = el('div', { class: 'page' });
    wrap.appendChild(header('รับรายงานจากสมาชิก', null, 'team'));
    if (!rep) {
      wrap.appendChild(el('div', { class: 'card' }, el('p', {}, 'ลิงก์รายงานไม่ถูกต้องหรือเสียหาย')));
      return wrap;
    }
    const sc = score(rep.ratings);
    wrap.appendChild(el('div', { class: 'card center' },
      el('h3', {}, rep.name),
      el('p', { class: 'muted' }, 'ประเมินวันที่ ' + fmtDate(rep.date)),
      ringSvg(sc.pct),
      levelBar(sc.byArea),
    ));
    wrap.appendChild(el('div', { class: 'action-row col' },
      el('button', { class: 'btn primary', onclick: () => {
        const team = getTeam();
        // อัปเดตถ้ามีรายงานของคนนี้วันเดียวกันแล้ว
        const k = (r) => r.name + '|' + r.date;
        const idx = team.findIndex((r) => k(r) === k(rep));
        const entry = { ...rep, savedAt: Date.now() };
        if (idx >= 0) team[idx] = entry; else team.unshift(entry);
        setTeam(team);
        toast('บันทึกเข้าทีมแล้ว ✓');
        go('team');
      } }, 'บันทึกเข้ารายชื่อทีม'),
      el('button', { class: 'btn', onclick: () => go('team') }, 'ยกเลิก'),
    ));
    return wrap;
  });

  // ---------- หน้า: ทีม / สถิติรวม (สำหรับผู้ดูแล) ----------
  route('team', () => {
    const p = getProfile();
    if (!p) { go('register'); return el('div'); }
    const team = getTeam();
    const members = getMembers();

    // รายงานล่าสุดต่อคน + จำนวนการประเมินต่อคน
    const latestByPerson = {};
    const countByPerson = {};
    for (const r of team) {
      countByPerson[r.name] = (countByPerson[r.name] || 0) + 1;
      if (!latestByPerson[r.name] || r.date > latestByPerson[r.name].date) latestByPerson[r.name] = r;
    }
    // รวมรายชื่อทั้งหมด: คนที่ผู้ดูแลเพิ่ม + คนที่มีผลประเมินแล้ว
    const allNames = Array.from(new Set([...members.map((m) => m.name), ...Object.keys(latestByPerson)]));
    const assessed = Object.values(latestByPerson); // เฉพาะคนที่มีผลประเมิน (ใช้คิดค่าเฉลี่ย)

    const wrap = el('div', { class: 'page' });
    wrap.appendChild(header('ทีม & สถิติรวม', allNames.length + ' สมาชิก · ' + assessed.length + ' คนประเมินแล้ว', 'home'));

    // (1) ช่องเพิ่มสมาชิกใหม่
    const addCard = el('div', { class: 'card' });
    addCard.appendChild(el('h3', { class: 'card-h' }, '➕ เพิ่มสมาชิกใหม่'));
    const nameInput = el('input', { id: 'newm', placeholder: 'ชื่อสมาชิก เช่น มานะ' });
    addCard.appendChild(el('div', { class: 'add-row' },
      nameInput,
      el('button', { class: 'btn primary add-btn', onclick: () => {
        const nm = nameInput.value.trim();
        if (!nm) { toast('กรุณาใส่ชื่อ'); return; }
        if (allNames.includes(nm)) { toast('มีสมาชิกชื่อนี้แล้ว'); return; }
        const ms = getMembers(); ms.push({ name: nm, believeDate: '', createdAt: Date.now() }); setMembers(ms);
        toast('เพิ่ม ' + nm + ' แล้ว ✓');
        go('member', { name: nm });
      } }, 'เพิ่ม'),
    ));
    addCard.appendChild(el('p', { class: 'muted small' }, 'เพิ่มแล้วแตะที่ชื่อเพื่อทำแบบประเมินให้สมาชิกได้เลย'));
    wrap.appendChild(addCard);

    // ว่างเปล่า
    if (!allNames.length) {
      wrap.appendChild(el('div', { class: 'card empty' }, el('div', { class: 'emoji' }, '👥'),
        el('p', { class: 'muted' }, 'ยังไม่มีสมาชิก — เพิ่มสมาชิกคนแรกด้านบน หรือรับรายงานจากลิงก์ที่สมาชิกส่งมา')));
    }

    // (2) ค่าเฉลี่ยรวมของสมาชิกทั้งหมด
    if (assessed.length) {
      let sumPct = 0; const areaSum = {}; AREAS.forEach((a) => areaSum[a.id] = 0);
      assessed.forEach((r) => { const s = score(r.ratings); sumPct += s.pct; AREAS.forEach((a) => areaSum[a.id] += s.byArea[a.id].pct); });
      const avg = Math.round(sumPct / assessed.length);
      wrap.appendChild(el('div', { class: 'card center' },
        ringSvg(avg),
        el('p', { class: 'muted' }, 'ค่าเฉลี่ยการเติบโตของทีม (จาก ' + assessed.length + ' คนที่ประเมินแล้ว)'),
      ));
      const areaAvgs = AREAS.map((a) => ({ a, v: Math.round(areaSum[a.id] / assessed.length) })).sort((x, y) => x.v - y.v);
      const areaCard = el('div', { class: 'card' }, el('h3', { class: 'section-h' }, 'เฉลี่ยรายด้านของทีม'));
      areaAvgs.forEach(({ a, v }) => {
        areaCard.appendChild(el('div', { class: 'res-area' },
          el('div', { class: 'res-head' }, el('span', { class: 'aa-icon' }, a.icon), el('b', {}, a.title), el('span', { class: 'res-pct' }, v + '%')),
          el('div', { class: 'bar' }, el('div', { class: 'bar-fill ' + (v < 40 ? 'lk' : v < 70 ? 'ld' : 'ls'), style: `width:${v}%` })),
        ));
      });
      wrap.appendChild(areaCard);
    }

    // (3) รายชื่อสมาชิก (แตะเพื่อดู/ประเมินรายบุคคล)
    if (allNames.length) {
      wrap.appendChild(el('h3', { class: 'section-h' }, 'สมาชิกในทีม (แตะเพื่อดู/ประเมิน)'));
      const list = el('div', { class: 'list' });
      // เรียง: คนที่ % ต่ำสุดก่อน, คนที่ยังไม่ประเมินไว้ท้ายสุด
      allNames.map((nm) => ({ nm, r: latestByPerson[nm] }))
        .sort((x, y) => (x.r ? score(x.r.ratings).pct : 999) - (y.r ? score(y.r.ratings).pct : 999))
        .forEach(({ nm, r }) => {
          const pct = r ? score(r.ratings).pct + '%' : '—';
          const sub = r ? ('ล่าสุด ' + fmtDate(r.date) + ' · ' + countByPerson[nm] + ' ครั้ง') : 'ยังไม่ประเมิน';
          list.appendChild(el('button', { class: 'list-item person', onclick: () => go('member', { name: nm }) },
            el('span', { class: 'li-avatar' + (r ? '' : ' pending') }, (nm || '?').trim().charAt(0)),
            el('span', { class: 'li-col' },
              el('span', { class: 'li-name' }, nm),
              el('span', { class: 'li-date muted' }, sub),
            ),
            el('span', { class: 'li-pct' }, pct),
            el('span', { class: 'li-go' }, '›'),
          ));
        });
      wrap.appendChild(list);
    }

    // รับรายงานจากลิงก์ (ทางเลือก สำหรับสมาชิกที่ประเมินเองในเครื่องตัวเอง)
    const impDetails = el('details', { class: 'card details' },
      el('summary', {}, '🔗 รับรายงานจากลิงก์ที่สมาชิกส่งมา'),
      el('p', { class: 'muted small' }, 'ใช้กรณีสมาชิกประเมินในเครื่องตัวเองแล้วส่งลิงก์มา'),
      el('textarea', { id: 'imp', rows: '2', placeholder: 'วางลิงก์ #import?r=... หรือโค้ดที่นี่' }),
      el('button', { class: 'btn', onclick: () => {
        let s = $('#imp').value.trim();
        const m = s.match(/[?&]r=([^&\s]+)/);
        if (m) s = decodeURIComponent(m[1]);
        if (decodeReport(s)) go('import', { r: s });
        else toast('อ่านรายงานไม่ได้ ตรวจสอบลิงก์/โค้ด');
      } }, 'เปิดรายงาน'),
    );
    wrap.appendChild(impDetails);

    if (assessed.length) {
      wrap.appendChild(el('div', { class: 'action-row' },
        el('button', { class: 'btn', onclick: () => exportTeamSummary(assessed) }, '📋 คัดลอกสรุปทั้งทีม'),
      ));
    }
    return wrap;
  });

  // คัดลอกสรุปสถิติทั้งทีมเป็นข้อความ
  function exportTeamSummary(people) {
    let sumPct = 0; const areaSum = {}; AREAS.forEach((a) => areaSum[a.id] = 0);
    people.forEach((r) => { const s = score(r.ratings); sumPct += s.pct; AREAS.forEach((a) => areaSum[a.id] += s.byArea[a.id].pct); });
    const avg = Math.round(sumPct / people.length);
    const lines = [];
    lines.push('สรุปสถิติทีม (' + people.length + ' คน)');
    lines.push('ค่าเฉลี่ยการเติบโต: ' + avg + '%');
    lines.push('');
    lines.push('เฉลี่ยรายด้าน:');
    AREAS.map((a) => ({ a, v: Math.round(areaSum[a.id] / people.length) })).sort((x, y) => x.v - y.v)
      .forEach(({ a, v }) => lines.push('• ' + a.title + ': ' + v + '%'));
    lines.push('');
    lines.push('รายบุคคล:');
    people.slice().sort((x, y) => score(y.ratings).pct - score(x.ratings).pct)
      .forEach((r) => lines.push('• ' + r.name + ': ' + score(r.ratings).pct + '% (' + fmtDate(r.date) + ')'));
    copy(lines.join('\n'));
  }

  // ---------- หน้า: รายละเอียดสมาชิกรายบุคคล ----------
  route('member', (params) => {
    const name = params.name;
    const reports = getTeam().filter((r) => r.name === name).sort((a, b) => (b.date > a.date ? 1 : -1));
    const member = getMembers().find((m) => m.name === name);
    const wrap = el('div', { class: 'page' });
    if (!reports.length && !member) { go('team'); return wrap; }

    const assessBtn = el('button', { class: 'btn primary', onclick: () => go('assess', { for: name }) },
      reports.length ? '✅ ประเมินรอบใหม่ให้ ' + name : '✅ เริ่มประเมินให้ ' + name);
    const inviteBtn = el('button', { class: 'btn', onclick: async () => {
      const link = inviteLink(name);
      const msg = (getProfile().name || 'ผู้นำ') + ' เชิญ ' + name + ' เช็คสุขภาพฝ่ายวิญญาณ\nเปิดลิงก์นี้เพื่อประเมินด้วยตัวเอง:\n' + link;
      if (navigator.share) { try { await navigator.share({ title: 'ลิงก์ประเมินสำหรับ ' + name, text: msg }); return; } catch {} }
      copy(msg);
    } }, '🔗 ส่งลิงก์ให้ ' + name + ' กรอกเอง');

    // ยังไม่มีผลประเมิน
    if (!reports.length) {
      wrap.appendChild(header(name, 'ยังไม่มีผลประเมิน', 'team'));
      wrap.appendChild(el('div', { class: 'card empty' },
        el('div', { class: 'emoji' }, '📝'),
        el('p', { class: 'muted' }, 'ยังไม่ได้ประเมิน ' + name + ' — เริ่มทำแบบประเมินให้สมาชิกคนนี้ได้เลย'),
      ));
      wrap.appendChild(el('div', { class: 'action-row col' },
        assessBtn,
        inviteBtn,
        el('button', { class: 'btn danger', onclick: () => {
          if (!confirm('ลบสมาชิก ' + name + '?')) return;
          setMembers(getMembers().filter((m) => m.name !== name));
          go('team');
        } }, 'ลบสมาชิกนี้'),
      ));
      return wrap;
    }

    const latest = reports[0];
    const sc = score(latest.ratings);
    wrap.appendChild(header(name, (latest.believeDate ? 'รับเชื่อ ' + fmtDate(latest.believeDate) + ' · ' : '') + reports.length + ' รายงาน', 'team'));

    const card = el('div', { class: 'card center' });
    card.appendChild(ringSvg(sc.pct));
    card.appendChild(el('p', { class: 'muted' }, 'ประเมินล่าสุด ' + fmtDate(latest.date)));
    card.appendChild(levelBar(sc.byArea));
    wrap.appendChild(card);

    wrap.appendChild(el('div', { class: 'action-row col' }, assessBtn, inviteBtn));

    // แนวโน้มเทียบรายงานก่อนหน้า
    if (reports[1]) {
      const diff = sc.pct - score(reports[1].ratings).pct;
      wrap.appendChild(el('div', { class: 'trend ' + (diff >= 0 ? 'up' : 'down') },
        (diff >= 0 ? '▲ ' : '▼ ') + Math.abs(diff) + '% จากรายงานก่อน (' + fmtDate(reports[1].date) + ')'));
    }

    // รายด้านของรายงานล่าสุด
    wrap.appendChild(el('h3', { class: 'section-h' }, 'รายด้าน (ล่าสุด)'));
    for (const a of AREAS) {
      const s = sc.byArea[a.id];
      wrap.appendChild(el('div', { class: 'res-area' },
        el('div', { class: 'res-head' }, el('span', { class: 'aa-icon' }, a.icon), el('b', {}, a.title), el('span', { class: 'res-pct' }, s.pct + '%')),
        el('div', { class: 'bar' }, el('div', { class: 'bar-fill ls', style: `width:${s.pct}%` })),
        el('div', { class: 'res-mini' }, `รู้ ${s.know} · กระทำ ${s.do} · แบ่งปัน ${s.share} (จาก ${s.items} ข้อ)`),
      ));
    }

    // ประวัติรายงานของคนนี้
    if (reports.length > 1) {
      wrap.appendChild(el('h3', { class: 'section-h' }, 'ประวัติรายงาน'));
      const list = el('div', { class: 'list' });
      reports.forEach((r) => {
        const s = score(r.ratings);
        list.appendChild(el('div', { class: 'list-item' },
          el('span', { class: 'li-date' }, fmtDate(r.date)),
          el('span', { class: 'li-pct' }, s.pct + '%'),
        ));
      });
      wrap.appendChild(list);
    }

    wrap.appendChild(el('div', { class: 'action-row' },
      el('button', { class: 'btn danger', onclick: () => {
        if (!confirm('ลบสมาชิก ' + name + ' และผลประเมินทั้งหมด?')) return;
        setTeam(getTeam().filter((x) => x.name !== name));
        setMembers(getMembers().filter((m) => m.name !== name));
        go('team');
      } }, 'ลบสมาชิกนี้'),
    ));
    return wrap;
  });

  // ---------- แถบนำทางล่าง ----------
  function navBar() {
    const p = getProfile();
    const items = [
      ['home', '🏠', 'หน้าหลัก'],
      ['assess', '✅', 'ประเมิน'],
    ];
    items.push(['team', '👥', 'ทีม']);
    const nav = el('nav', { class: 'tabbar', id: 'tabbar' });
    items.forEach(([r, icon, label]) => {
      nav.appendChild(el('button', { class: 'tab', 'data-route': r, onclick: () => go(r) },
        el('span', { class: 'tab-ico' }, icon), el('span', { class: 'tab-label' }, label)));
    });
    return nav;
  }
  function updateNav(active) {
    const nav = $('#tabbar');
    if (!nav) return;
    const show = !!getProfile() && active !== 'register';
    nav.style.display = show ? '' : 'none';
    nav.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.route === active));
  }

  // ---------- toast ----------
  let toastTimer;
  function toast(msg) {
    let t = $('#toast');
    if (!t) { t = el('div', { id: 'toast', class: 'toast' }); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  // ---------- ป๊อบอัพข้อพระคัมภีร์ ----------
  function showVerse(ref) {
    const data = (typeof BIBLE !== 'undefined') ? BIBLE[ref] : null;
    const overlay = el('div', { class: 'modal-overlay', onclick: (e) => { if (e.target === overlay) close(); } });
    function close() { overlay.classList.remove('show'); setTimeout(() => overlay.remove(), 200); }
    const sheet = el('div', { class: 'modal-sheet' });
    sheet.appendChild(el('div', { class: 'modal-head' },
      el('h3', {}, ref),
      el('button', { class: 'modal-x', onclick: close }, '✕'),
    ));
    const body = el('div', { class: 'modal-body' });
    if (data && data.length) {
      data.forEach((row) => {
        body.appendChild(el('p', { class: 'verse-p' },
          el('sup', { class: 'verse-n' }, String(row.n)), ' ', row.t));
      });
    } else {
      body.appendChild(el('p', { class: 'muted' }, 'ไม่พบข้อความสำหรับข้ออ้างอิงนี้'));
    }
    sheet.appendChild(body);
    sheet.appendChild(el('div', { class: 'modal-foot' }, (typeof BIBLE_VERSION !== 'undefined' ? BIBLE_VERSION : 'พระคัมภีร์')));
    overlay.appendChild(sheet);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));
  }

  // ---------- บูต ----------
  function boot() {
    document.body.appendChild(navBar());
    // ถ้ามาจากลิงก์รายงานแต่ยังไม่มีโปรไฟล์ ให้ลงทะเบียนก่อนแล้วค่อยกลับ
    if (!getProfile() && !location.hash.startsWith('#import') && !location.hash.startsWith('#invite')) location.hash = '#register';
    window.addEventListener('hashchange', render);
    render();
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  document.addEventListener('DOMContentLoaded', boot);
})();
