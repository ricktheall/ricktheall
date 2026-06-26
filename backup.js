/* backup.js — Phase 1: portable, migration-ready backup format for growthCT
 *
 * Why this file exists
 * --------------------
 * Today all data lives only in the browser's localStorage on one device. If
 * that device is lost/cleared, the data is gone. Phase 1 adds a self-describing
 * backup file the user can download and restore.
 *
 * Forward compatibility (the important part)
 * ------------------------------------------
 * The final vision is a shared Supabase database with this hierarchy:
 *   church > campus > group > member, plus attendance, guests, assessments,
 *   care alerts and role-based accounts.
 * So the backup is NOT a raw localStorage dump. It is a normalized, versioned
 * "envelope" where every entity carries a STABLE id and explicit
 * foreign-key-style links (subjectId, memberId, groupId, ...) instead of the
 * fragile "match by name" the app uses today. A future migration script can map
 * this envelope onto Supabase tables row-for-row, without guesswork.
 *
 * Public API (attached to window.GrowthBackup):
 *   FORMAT, SCHEMA_VERSION
 *   build(raw)   -> envelope object  (raw = { profile, history, members, team, lang, appVersion })
 *   parse(env)   -> { ok, error?, data?, summary? }   (data is restore-ready raw shape)
 *   merge(cur, inc) -> raw           (combine two datasets by stable id, dedup-safe)
 */
(function (global) {
  'use strict';

  const FORMAT = 'growthct.backup';
  const SCHEMA_VERSION = 1;

  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const nowMs = () => Date.now();
  const nowISO = () => new Date().toISOString();

  // ---------------------------------------------------------------------------
  // build(): localStorage-shaped data  ->  normalized, migration-ready envelope
  // ---------------------------------------------------------------------------
  function build(raw) {
    raw = raw || {};
    const profile = raw.profile || null;
    const ownerId = (profile && profile.id) || null;

    // Members table (future: members rows). Ensure every member has a stable id.
    const memberIdByName = {};
    const members = (raw.members || []).map((m) => {
      const id = m.id || uid();
      if (m.name) memberIdByName[m.name] = id;
      return {
        id,
        name: m.name || '',
        believeDate: m.believeDate || '',
        createdAt: m.createdAt || nowMs(),
        groupId: m.groupId || null,   // forward-compat: filled in later phases
      };
    });

    // The device owner's own check-ups (future: assessments where subject = the owner).
    const selfAssessments = (raw.history || []).map((h) => ({
      id: h.id || uid(),
      subjectType: 'owner',
      subjectId: ownerId,
      subjectName: profile ? (profile.name || '') : '',
      date: h.date || null,
      at: h.at || null,
      ratings: h.ratings || {},
      note: h.note || '',
    }));

    // Leader-collected / leader-entered check-ups (future: assessments where subject = a member).
    const memberAssessments = (raw.team || []).map((r) => {
      // Resolve a stable member id; if the name was never added as a member,
      // create an "implied" member row so the relational link is never lost.
      let memberId = r.memberId || (r.name ? memberIdByName[r.name] : null) || null;
      if (!memberId && r.name) {
        memberId = uid();
        memberIdByName[r.name] = memberId;
        members.push({
          id: memberId, name: r.name, believeDate: r.believeDate || '',
          createdAt: r.savedAt || nowMs(), groupId: null, implied: true,
        });
      }
      return {
        id: r.id || uid(),
        subjectType: 'member',
        subjectId: memberId,
        subjectName: r.name || '',
        believeDate: r.believeDate || '',
        supervisor: r.supervisor || '',
        date: r.date || null,
        at: r.at || null,
        savedAt: r.savedAt || null,
        ratings: r.ratings || {},
        note: r.note || '',
      };
    });

    return {
      format: FORMAT,
      schemaVersion: SCHEMA_VERSION,
      app: { name: 'growthCT', version: raw.appVersion || null },
      exportedAt: nowISO(),
      exportedAtMs: nowMs(),
      lang: raw.lang || 'th',
      // The owner of this device = a future account / leader row.
      owner: profile ? {
        id: ownerId,
        name: profile.name || '',
        role: profile.role || 'member',
        believeDate: profile.believeDate || '',
        supervisor: profile.supervisor || '',
        supervisorContact: profile.supervisorContact || '',
        createdAt: profile.createdAt || null,
      } : null,
      // The org hierarchy is unknown on-device today, but the keys are declared
      // so the Supabase importer can rely on their shape from day one.
      hierarchy: { churches: [], campuses: [], groups: [] },
      entities: {
        members,
        selfAssessments,
        memberAssessments,
        guests: [],      // future phase (guests & follow-up)
        attendance: [],  // future phase (weekly attendance)
      },
    };
  }

  // ---------------------------------------------------------------------------
  // parse(): envelope -> { ok, data (restore-ready raw shape), summary }
  // ---------------------------------------------------------------------------
  function parse(env) {
    if (!env || typeof env !== 'object') return { ok: false, error: 'invalid' };
    if (env.format !== FORMAT) return { ok: false, error: 'invalid' };
    if (typeof env.schemaVersion !== 'number') return { ok: false, error: 'invalid' };
    if (env.schemaVersion > SCHEMA_VERSION) return { ok: false, error: 'too-new' };

    const e = env.entities || {};
    const owner = env.owner || null;

    const profile = owner ? {
      id: owner.id || uid(),
      name: owner.name || '',
      role: owner.role || 'member',
      believeDate: owner.believeDate || '',
      supervisor: owner.supervisor || '',
      supervisorContact: owner.supervisorContact || '',
      createdAt: owner.createdAt || nowMs(),
    } : null;

    const members = (e.members || []).map((m) => ({
      id: m.id || uid(),
      name: m.name || '',
      believeDate: m.believeDate || '',
      createdAt: m.createdAt || nowMs(),
      groupId: m.groupId || null,
    }));

    const history = (e.selfAssessments || []).map((a) => ({
      id: a.id || uid(),
      date: a.date || null,
      at: a.at || null,
      ratings: a.ratings || {},
      note: a.note || '',
    }));

    const team = (e.memberAssessments || []).map((a) => ({
      id: a.id || uid(),
      memberId: a.subjectId || null,
      name: a.subjectName || '',
      believeDate: a.believeDate || '',
      supervisor: a.supervisor || '',
      date: a.date || null,
      at: a.at || null,
      savedAt: a.savedAt || null,
      ratings: a.ratings || {},
      note: a.note || '',
    }));

    const summary = {
      members: members.length,
      selfAssessments: history.length,
      memberAssessments: team.length,
      exportedAt: env.exportedAt || null,
      owner: profile ? profile.name : null,
    };

    return { ok: true, data: { profile, history, members, team, lang: env.lang || 'th' }, summary };
  }

  // ---------------------------------------------------------------------------
  // merge(): combine current data with incoming data, dedup-safe by stable id
  //   (falls back to composite keys for legacy rows that predate stable ids)
  // ---------------------------------------------------------------------------
  function merge(cur, inc) {
    cur = cur || {}; inc = inc || {};

    const members = (cur.members || []).slice();
    const memIds = new Set(members.map((m) => m.id).filter(Boolean));
    const memNames = new Set(members.map((m) => m.name));
    for (const m of inc.members || []) {
      if (m.id && memIds.has(m.id)) continue;
      if (memNames.has(m.name)) continue; // name is the roster's unique key in this app
      members.push(m);
      if (m.id) memIds.add(m.id);
      memNames.add(m.name);
    }

    const mergeList = (a, b, compositeKey) => {
      const out = (a || []).slice();
      const ids = new Set(out.map((x) => x.id).filter(Boolean));
      const keys = new Set(out.map(compositeKey).filter(Boolean));
      for (const x of b || []) {
        if (x.id && ids.has(x.id)) continue;
        const ck = compositeKey(x);
        if (ck && keys.has(ck)) continue;
        out.push(x);
        if (x.id) ids.add(x.id);
        if (ck) keys.add(ck);
      }
      return out;
    };

    const history = mergeList(cur.history, inc.history, (x) => 'h|' + (x.date || '') + '|' + (x.at || ''));
    const team = mergeList(cur.team, inc.team, (x) => 't|' + (x.name || '') + '|' + (x.date || ''));
    const profile = cur.profile || inc.profile || null;

    return { profile, history, members, team, lang: cur.lang || inc.lang || 'th' };
  }

  global.GrowthBackup = { FORMAT, SCHEMA_VERSION, build, parse, merge };
})(typeof window !== 'undefined' ? window : this);
