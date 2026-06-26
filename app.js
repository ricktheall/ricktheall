/* app.js — ตรรกะหลักของแอปเช็คการพัฒนาชีวิตคริสเตียน
 * ทำงานแบบออฟไลน์เต็มรูปแบบ เก็บข้อมูลใน localStorage
 * การส่งรายงาน/รวมสถิติใช้ลิงก์ที่ฝังข้อมูล (ไม่ต้องมีเซิร์ฟเวอร์)
 */
(function () {
  'use strict';

  const APP_VERSION = '1.1.0'; // Phase 1: backup & restore

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
  const KEY_LANG = 'dt.lang';
  const getLang = () => store.get(KEY_LANG, 'th');
  const setLang = (l) => store.set(KEY_LANG, l);

  // ---------- ระบบ 2 ภาษา (i18n) ----------
  // ค่าเป็น string หรือ function(...args) ก็ได้
  const STR = {
    brand: { th: 'growthCT', en: 'growthCT' },
    tagline: { th: 'เครื่องมือเช็คการเติบโตฝ่ายวิญญาณ 9 ด้าน', en: 'A 9-area spiritual growth check-up' },
    // ลงทะเบียน
    yourName: { th: 'ชื่อของคุณ', en: 'Your name' },
    namePh: { th: 'ชื่อ-นามสกุล', en: 'Full name' },
    role: { th: 'บทบาท', en: 'Role' },
    roleMember: { th: 'ผู้เชื่อใหม่ / สาวก', en: 'New believer / Disciple' },
    roleLeader: { th: 'ผู้ดูแล / ผู้นำกลุ่ม', en: 'Leader / Group leader' },
    believeDate: { th: 'วันที่รับเชื่อ (ถ้ามี)', en: 'Date you believed (optional)' },
    supName: { th: 'ชื่อผู้ดูแล/พี่เลี้ยง', en: 'Mentor / leader name' },
    supNamePh: { th: 'เช่น พี่สมชาย', en: 'e.g. John' },
    supContact: { th: 'ช่องทางติดต่อผู้ดูแล (LINE/เบอร์)', en: 'Mentor contact (LINE/phone)' },
    supContactPh: { th: 'ไว้ใช้ส่งรายงาน', en: 'For sending reports' },
    start: { th: 'เริ่มใช้งาน', en: 'Get started' },
    // คำเชิญ
    inviteHi: { th: (n) => 'สวัสดี ' + n + ' 🙏', en: (n) => 'Hi ' + n + ' 🙏' },
    inviteSub: { th: (by) => (by ? by + ' ' : '') + 'เชิญคุณเช็คสุขภาพฝ่ายวิญญาณ 9 ด้าน', en: (by) => (by ? by + ' ' : '') + 'invites you to check your spiritual health (9 areas)' },
    invitePrivacy1: { th: 'แอปนี้เป็นของคุณคนเดียว — ', en: 'This app is just for you — ' },
    invitePrivacy2: { th: 'ข้อมูลเก็บในเครื่องคุณ เห็นเฉพาะของคุณ', en: 'data stays on your device, only you see it' },
    invitePrivacy3: { th: ' เมื่อประเมินเสร็จ เพียงกด "ส่งให้ผู้นำ" ผลของคุณก็จะไปรวมในภาพรวมของผู้นำ', en: '. When done, just tap "Send to leader" and your result joins the leader\'s overview.' },
    inviteSwitch: { th: (a, b) => '* เครื่องนี้เคยตั้งค่าเป็น "' + a + '" มาก่อน หากดำเนินต่อจะเปลี่ยนเป็น "' + b + '"', en: (a, b) => '* This device was set up as "' + a + '". Continuing will switch it to "' + b + '".' },
    inviteStart: { th: 'เริ่มประเมินของฉัน', en: 'Start my check-up' },
    // หน้าหลัก
    hello: { th: 'สวัสดี', en: 'Hello' },
    noAssessYet: { th: 'ยังไม่มีการประเมิน', en: 'No check-up yet' },
    noAssessSub: { th: 'เริ่มเช็คสุขภาพฝ่ายวิญญาณของคุณครั้งแรกได้เลย', en: 'Start your first spiritual health check-up' },
    startFirst: { th: 'เริ่มประเมินครั้งแรก', en: 'Start first check-up' },
    latestOverview: { th: 'ภาพรวมล่าสุด', en: 'Latest overview' },
    vsPrev: { th: (d, dt) => d + '% เทียบกับครั้งก่อน (' + dt + ')', en: (d, dt) => d + '% vs last time (' + dt + ')' },
    progressByArea: { th: 'ความก้าวหน้ารายด้าน', en: 'Progress by area' },
    newAssess: { th: '＋ ประเมินรอบใหม่', en: '＋ New check-up' },
    sendReport: { th: '📤 ส่งรายงาน', en: '📤 Send report' },
    history: { th: 'ประวัติย้อนหลัง', en: 'History' },
    // ประเมิน
    assessTitle: { th: 'แบบประเมินสุขภาพฝ่ายวิญญาณ', en: 'Spiritual Health Check-up' },
    assessFor: { th: (n) => 'ประเมินให้: ' + n, en: (n) => 'Assessing: ' + n },
    assessHint: { th: 'ทำเครื่องหมายในระดับที่ไปถึงของแต่ละข้อ', en: 'Tick the level you have reached for each item' },
    verseCol: { th: 'ข้อพระคัมภีร์', en: 'Scripture' },
    answered: { th: (a, b) => a + '/' + b + ' ข้อที่ตอบแล้ว', en: (a, b) => a + '/' + b + ' answered' },
    noteLabel: { th: 'บันทึก/คำอธิษฐาน (ไม่บังคับ)', en: 'Notes / prayer (optional)' },
    notePh: { th: 'สิ่งที่พระเจ้าตรัส, เป้าหมายที่อยากเติบโต...', en: 'What God is saying, growth goals...' },
    saveAssess: { th: 'บันทึกผลการประเมิน', en: 'Save results' },
    cancel: { th: 'ยกเลิก', en: 'Cancel' },
    // ผล
    resultTitle: { th: 'ผลการประเมิน', en: 'Results' },
    miniBreak: { th: (k, d, s, n) => `รู้ ${k} · กระทำ ${d} · แบ่งปัน ${s} (จาก ${n} ข้อ)`, en: (k, d, s, n) => `Know ${k} · Do ${d} · Share ${s} (of ${n})` },
    noteLabelShort: { th: 'บันทึก: ', en: 'Note: ' },
    sendToLeader: { th: '📤 ส่งรายงานให้ผู้ดูแล', en: '📤 Send report to leader' },
    del: { th: 'ลบ', en: 'Delete' },
    confirmDelResult: { th: 'ลบผลการประเมินนี้?', en: 'Delete this result?' },
    // ส่งรายงาน
    shareTitle: { th: 'ส่งรายงานให้ผู้ดูแล', en: 'Send report to leader' },
    shareTo: { th: (s) => 'ถึง: ' + s, en: (s) => 'To: ' + s },
    shareIntro: { th: 'ส่งสรุปผลให้พี่เลี้ยง/ผู้ดูแลของคุณ เพื่อหนุนใจและติดตามการเติบโต', en: 'Send a summary to your mentor/leader for encouragement and follow-up' },
    shareBtn: { th: '📲 ส่ง/แชร์ (LINE, ข้อความ ฯลฯ)', en: '📲 Send / Share (LINE, message, etc.)' },
    copyText: { th: '📋 คัดลอกข้อความรายงาน', en: '📋 Copy report text' },
    copyLink: { th: '🔗 คัดลอกลิงก์รายงาน', en: '🔗 Copy report link' },
    supChannel: { th: (c) => 'ช่องทางผู้ดูแล: ' + c, en: (c) => 'Leader contact: ' + c },
    copied: { th: 'คัดลอกแล้ว ✓', en: 'Copied ✓' },
    copyFail: { th: 'คัดลอกไม่สำเร็จ', en: 'Copy failed' },
    reportTitle: { th: 'รายงานการเติบโตฝ่ายวิญญาณ', en: 'Spiritual Growth Report' },
    rpName: { th: 'ชื่อ', en: 'Name' },
    rpDate: { th: 'วันที่', en: 'Date' },
    rpOverall: { th: 'ภาพรวม', en: 'Overall' },
    rpSeeMore: { th: 'ดูรายละเอียด/รวมสถิติ:', en: 'View details / aggregate:' },
    inviteMsg: { th: (by, n, link) => by + ' เชิญ ' + n + ' เช็คสุขภาพฝ่ายวิญญาณ\nเปิดลิงก์นี้เพื่อประเมินด้วยตัวเอง:\n' + link, en: (by, n, link) => by + ' invites ' + n + ' to a spiritual health check-up.\nOpen this link to assess yourself:\n' + link },
    // รับรายงาน
    importTitle: { th: 'รับรายงานจากสมาชิก', en: 'Receive member report' },
    importBad: { th: 'ลิงก์รายงานไม่ถูกต้องหรือเสียหาย', en: 'Report link is invalid or corrupted' },
    assessedOn: { th: (d) => 'ประเมินวันที่ ' + d, en: (d) => 'Assessed on ' + d },
    saveToTeam: { th: 'บันทึกเข้ารายชื่อทีม', en: 'Save to team' },
    savedToTeam: { th: 'บันทึกเข้าทีมแล้ว ✓', en: 'Saved to team ✓' },
    // ทีม
    teamTitle: { th: 'ทีม & สถิติรวม', en: 'Team & Stats' },
    teamSub: { th: (a, b) => a + ' สมาชิก · ' + b + ' คนประเมินแล้ว', en: (a, b) => a + ' members · ' + b + ' assessed' },
    addMember: { th: '➕ เพิ่มสมาชิกใหม่', en: '➕ Add new member' },
    memberPh: { th: 'ชื่อสมาชิก เช่น มานะ', en: 'Member name, e.g. Mana' },
    add: { th: 'เพิ่ม', en: 'Add' },
    addHint: { th: 'เพิ่มแล้วแตะที่ชื่อเพื่อทำแบบประเมินให้สมาชิกได้เลย', en: 'After adding, tap the name to assess them' },
    enterName: { th: 'กรุณาใส่ชื่อ', en: 'Please enter a name' },
    dupName: { th: 'มีสมาชิกชื่อนี้แล้ว', en: 'A member with this name already exists' },
    added: { th: (n) => 'เพิ่ม ' + n + ' แล้ว ✓', en: (n) => 'Added ' + n + ' ✓' },
    noMembers: { th: 'ยังไม่มีสมาชิก — เพิ่มสมาชิกคนแรกด้านบน หรือรับรายงานจากลิงก์ที่สมาชิกส่งมา', en: 'No members yet — add your first above, or receive a report link from a member' },
    teamAvg: { th: (n) => 'ค่าเฉลี่ยการเติบโตของทีม (จาก ' + n + ' คนที่ประเมินแล้ว)', en: (n) => 'Team average growth (from ' + n + ' assessed)' },
    teamAreaAvg: { th: 'เฉลี่ยรายด้านของทีม', en: 'Team average by area' },
    teamRoster: { th: 'สมาชิกในทีม (แตะเพื่อดู/ประเมิน)', en: 'Team roster (tap to view/assess)' },
    lastN: { th: (d, n) => 'ล่าสุด ' + d + ' · ' + n + ' ครั้ง', en: (d, n) => 'Last ' + d + ' · ' + n + 'x' },
    notAssessed: { th: 'ยังไม่ประเมิน', en: 'Not assessed' },
    importFromLink: { th: '🔗 รับรายงานจากลิงก์ที่สมาชิกส่งมา', en: '🔗 Receive a report link from a member' },
    importFromLinkHint: { th: 'ใช้กรณีสมาชิกประเมินในเครื่องตัวเองแล้วส่งลิงก์มา', en: 'For when a member assessed on their own device and sent a link' },
    importPh: { th: 'วางลิงก์ #import?r=... หรือโค้ดที่นี่', en: 'Paste #import?r=... link or code here' },
    openReport: { th: 'เปิดรายงาน', en: 'Open report' },
    readFail: { th: 'อ่านรายงานไม่ได้ ตรวจสอบลิงก์/โค้ด', en: 'Could not read report — check the link/code' },
    copyTeamSummary: { th: '📋 คัดลอกสรุปทั้งทีม', en: '📋 Copy team summary' },
    sumTeam: { th: (n) => 'สรุปสถิติทีม (' + n + ' คน)', en: (n) => 'Team summary (' + n + ' people)' },
    sumAvg: { th: (v) => 'ค่าเฉลี่ยการเติบโต: ' + v + '%', en: (v) => 'Average growth: ' + v + '%' },
    sumByArea: { th: 'เฉลี่ยรายด้าน:', en: 'Average by area:' },
    sumByPerson: { th: 'รายบุคคล:', en: 'By person:' },
    // สมาชิก (รายบุคคล)
    mNoResult: { th: 'ยังไม่มีผลประเมิน', en: 'No results yet' },
    mEmpty: { th: (n) => 'ยังไม่ได้ประเมิน ' + n + ' — เริ่มทำแบบประเมินให้สมาชิกคนนี้ได้เลย', en: (n) => n + ' has not been assessed yet — start a check-up for them' },
    mBelieve: { th: (d) => 'รับเชื่อ ' + d + ' · ', en: (d) => 'Believed ' + d + ' · ' },
    mReports: { th: (n) => n + ' รายงาน', en: (n) => n + ' report(s)' },
    assessAgainFor: { th: (n) => '✅ ประเมินรอบใหม่ให้ ' + n, en: (n) => '✅ New check-up for ' + n },
    assessForBtn: { th: (n) => '✅ เริ่มประเมินให้ ' + n, en: (n) => '✅ Start check-up for ' + n },
    inviteLinkBtn: { th: (n) => '🔗 ส่งลิงก์ให้ ' + n + ' กรอกเอง', en: (n) => '🔗 Send ' + n + ' a self-assess link' },
    inviteShareTitle: { th: (n) => 'ลิงก์ประเมินสำหรับ ' + n, en: (n) => 'Check-up link for ' + n },
    lastAssessed: { th: (d) => 'ประเมินล่าสุด ' + d, en: (d) => 'Last assessed ' + d },
    areasLatest: { th: 'รายด้าน (ล่าสุด)', en: 'Areas (latest)' },
    reportHistory: { th: 'ประวัติรายงาน', en: 'Report history' },
    delMember: { th: 'ลบสมาชิกนี้', en: 'Delete member' },
    confirmDelMember: { th: (n) => 'ลบสมาชิก ' + n + '?', en: (n) => 'Delete member ' + n + '?' },
    confirmDelMemberAll: { th: (n) => 'ลบสมาชิก ' + n + ' และผลประเมินทั้งหมด?', en: (n) => 'Delete ' + n + ' and all their results?' },
    fromPrev: { th: (d, dt) => d + '% จากรายงานก่อน (' + dt + ')', en: (d, dt) => d + '% from previous (' + dt + ')' },
    // อื่น ๆ
    editProfile: { th: 'แก้ไขโปรไฟล์', en: 'Edit profile' },
    back: { th: 'ย้อนกลับ', en: 'Back' },
    forward: { th: 'ถัดไป', en: 'Forward' },
    home: { th: 'หน้าหลัก', en: 'Home' },
    verseNotFound: { th: 'ไม่พบข้อความสำหรับข้ออ้างอิงนี้', en: 'No text found for this reference' },
    tabHome: { th: 'หน้าหลัก', en: 'Home' },
    tabAssess: { th: 'ประเมิน', en: 'Assess' },
    tabTeam: { th: 'ทีม', en: 'Team' },
    titHome: { th: 'หน้าหลัก', en: 'Home' },
    titAssess: { th: 'แบบประเมิน', en: 'Check-up' },
    titResult: { th: 'ผลการประเมิน', en: 'Results' },
    titShare: { th: 'ส่งรายงาน', en: 'Send report' },
    titTeam: { th: 'ทีม', en: 'Team' },
    titMember: { th: 'สมาชิก', en: 'Member' },
    titImport: { th: 'รับรายงาน', en: 'Receive report' },
    titRegister: { th: 'ลงทะเบียน', en: 'Register' },
    titInvite: { th: 'คำเชิญ', en: 'Invitation' },
    titBackup: { th: 'สำรองข้อมูล', en: 'Backup' },
    // สำรองข้อมูล & กู้คืน (Phase 1)
    backupCardTitle: { th: '🛟 สำรองข้อมูล & กู้คืน', en: '🛟 Backup & Restore' },
    backupCardSub: { th: 'บันทึกข้อมูลทั้งหมดเป็นไฟล์ กันข้อมูลหายเมื่อเปลี่ยนหรือล้างเครื่อง', en: 'Save all data to a file so nothing is lost if you change or clear your device' },
    backupOpen: { th: 'เปิดหน้าสำรองข้อมูล', en: 'Open backup & restore' },
    backupTitle: { th: 'สำรองข้อมูล & กู้คืน', en: 'Backup & Restore' },
    backupIntro: { th: 'ข้อมูลทั้งหมดเก็บอยู่ในเครื่องนี้เท่านั้น แนะนำให้ดาวน์โหลดไฟล์สำรองไว้เป็นประจำ เพื่อกู้คืนได้หากเปลี่ยนเครื่องหรือข้อมูลหาย', en: 'All data is stored only on this device. Download a backup regularly so you can restore it if you switch devices or lose data.' },
    backupSection: { th: 'สำรองข้อมูล (ดาวน์โหลด)', en: 'Back up (download)' },
    backupContains: { th: (m, s, a) => `รวม: ${m} สมาชิก · ${s} การประเมินของฉัน · ${a} รายงานสมาชิก`, en: (m, s, a) => `Includes: ${m} members · ${s} of my check-ups · ${a} member reports` },
    backupNow: { th: '⬇️ ดาวน์โหลดไฟล์สำรอง', en: '⬇️ Download backup file' },
    backupDownloaded: { th: 'ดาวน์โหลดไฟล์สำรองแล้ว ✓', en: 'Backup downloaded ✓' },
    restoreSection: { th: 'กู้คืนข้อมูล', en: 'Restore' },
    restoreIntro: { th: 'เลือกไฟล์สำรอง (.json) ที่เคยดาวน์โหลดไว้', en: 'Choose a backup file (.json) you saved earlier' },
    restoreChoose: { th: '📂 เลือกไฟล์สำรอง', en: '📂 Choose backup file' },
    backupAdvanced: { th: 'ตัวเลือกเพิ่มเติม (คัดลอก/วางข้อความ)', en: 'Advanced (copy / paste as text)' },
    backupCopyText: { th: '📋 คัดลอกข้อมูลสำรองเป็นข้อความ', en: '📋 Copy backup as text' },
    restorePastePh: { th: 'วางข้อความสำรองที่นี่ แล้วกดอ่าน', en: 'Paste backup text here, then read' },
    restorePasteBtn: { th: 'อ่านข้อความสำรอง', en: 'Read backup text' },
    restoreBad: { th: 'ไฟล์/ข้อความสำรองไม่ถูกต้องหรือเสียหาย', en: 'Backup file/text is invalid or corrupted' },
    restoreTooNew: { th: 'ไฟล์สำรองนี้มาจากแอปเวอร์ชันใหม่กว่า โปรดอัปเดตแอปก่อนกู้คืน', en: 'This backup is from a newer app version. Please update the app before restoring.' },
    restorePreview: { th: (m, s, a, d) => `พบในไฟล์สำรอง: ${m} สมาชิก · ${s} การประเมินของฉัน · ${a} รายงานสมาชิก${d ? ' · สำรองเมื่อ ' + d : ''}`, en: (m, s, a, d) => `Found in backup: ${m} members · ${s} my check-ups · ${a} member reports${d ? ' · backed up ' + d : ''}` },
    restoreReplace: { th: '♻️ แทนที่ข้อมูลทั้งหมด', en: '♻️ Replace all data' },
    restoreReplaceExplain: { th: 'ลบข้อมูลในเครื่องนี้ แล้วใช้ข้อมูลจากไฟล์แทน', en: 'Delete data on this device and use the file instead' },
    restoreReplaceConfirm: { th: 'แทนที่ข้อมูลทั้งหมดในเครื่องนี้ด้วยไฟล์สำรอง? ข้อมูลปัจจุบันจะถูกเขียนทับและกู้คืนไม่ได้', en: 'Replace ALL data on this device with the backup? Current data will be overwritten and cannot be recovered.' },
    restoreMerge: { th: '➕ รวมกับข้อมูลเดิม', en: '➕ Merge with current data' },
    restoreMergeExplain: { th: 'เพิ่มข้อมูลจากไฟล์ โดยไม่ลบข้อมูลเดิม (ข้ามรายการที่ซ้ำ)', en: 'Add data from the file without deleting current data (skips duplicates)' },
    restoreMergeConfirm: { th: 'รวมข้อมูลจากไฟล์สำรองเข้ากับข้อมูลปัจจุบัน?', en: 'Merge backup data into current data?' },
    restoreDone: { th: 'กู้คืนข้อมูลแล้ว ✓', en: 'Data restored ✓' },
  };
  function t(key, ...args) {
    const e = STR[key];
    if (!e) return key;
    const v = e[getLang()] ?? e.th;
    return typeof v === 'function' ? v(...args) : v;
  }
  // ตัวช่วยเนื้อหาตามภาษา
  const areaTitle = (a) => (getLang() === 'en' && a.title_en) ? a.title_en : a.title;
  const levelLabel = (l) => (getLang() === 'en' && l.label_en) ? l.label_en : l.label;
  const levelDesc = (l) => (getLang() === 'en' && l.desc_en) ? l.desc_en : l.desc;
  const refLabel = (k) => (getLang() === 'en' && typeof REF_EN !== 'undefined' && REF_EN[k]) ? REF_EN[k] : k;
  const bibleFor = (k) => (getLang() === 'en' && typeof BIBLE_EN !== 'undefined') ? BIBLE_EN[k] : BIBLE[k];
  const bibleVersion = () => (getLang() === 'en' && typeof BIBLE_VERSION_EN !== 'undefined') ? BIBLE_VERSION_EN : BIBLE_VERSION;


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
  const locale = () => (getLang() === 'en' ? 'en-GB' : 'th-TH');
  const fmtDate = (iso) => {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleDateString(locale(), { year: 'numeric', month: 'short', day: 'numeric' });
  };
  // เวลา HH:MM จาก timestamp (ms)
  const fmtTime = (ms) => {
    if (!ms) return '';
    const d = new Date(ms);
    if (isNaN(d)) return '';
    return d.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
  };
  // วันที่ + เวลา (ถ้ามี timestamp)
  const fmtDateTime = (iso, ms) => fmtDate(iso) + (ms ? ' · ' + fmtTime(ms) + (getLang() === 'en' ? '' : ' น.') : '');

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
  // การย้อนกลับใช้แถบนำทางด้านบน (history) — header แสดงเฉพาะชื่อหน้า
  function header(title, subtitle) {
    return el('div', { class: 'page-head' },
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
    const fg = mk('ring-fg', c); // เริ่มจากว่าง แล้วค่อยวิ่งไปถึงเป้า
    svg.appendChild(fg);
    const t = document.createElementNS(ns, 'text');
    t.setAttribute('x', size / 2); t.setAttribute('y', size / 2); t.setAttribute('class', 'ring-text');
    t.textContent = '0%';
    svg.appendChild(t);
    // อนิเมชัน: เส้นวิ่ง + ตัวเลขนับขึ้น
    if (reducedMotion()) { fg.setAttribute('stroke-dashoffset', off); t.textContent = pct + '%'; }
    else {
      requestAnimationFrame(() => requestAnimationFrame(() => { fg.setAttribute('stroke-dashoffset', off); }));
      const start = performance.now(), dur = 750;
      const tick = (now) => {
        const k = Math.min(1, (now - start) / dur);
        const e = 1 - Math.pow(1 - k, 3); // ease-out
        t.textContent = Math.round(pct * e) + '%';
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
    return svg;
  }

  // แถบความก้าวหน้าแยกระดับ รู้/กระทำ/แบ่งปัน
  function levelBar(byArea) {
    let know = 0, doc = 0, share = 0, items = 0;
    for (const a of AREAS) { const s = byArea[a.id]; know += s.know; doc += s.do; share += s.share; items += s.items; }
    const wrap = el('div', { class: 'levels' });
    [[levelLabel(LEVELS[0]), know, 'lk'], [levelLabel(LEVELS[1]), doc, 'ld'], [levelLabel(LEVELS[2]), share, 'ls']].forEach(([label, n, cls]) => {
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
      el('h1', {}, t('brand')),
      el('p', { class: 'muted' }, t('tagline')),
    ));
    wrap.appendChild(langToggleRow());

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

    f.appendChild(field(t('yourName'), el('input', { name: 'name', value: p.name || '', placeholder: t('namePh'), required: 'true' })));
    f.appendChild(field(t('role'), selectEl('role', [
      ['member', t('roleMember')],
      ['leader', t('roleLeader')],
    ], p.role || 'member')));
    f.appendChild(field(t('believeDate'), el('input', { name: 'believeDate', type: 'date', value: p.believeDate || '' })));
    f.appendChild(field(t('supName'), el('input', { name: 'supervisor', value: p.supervisor || '', placeholder: t('supNamePh') })));
    f.appendChild(field(t('supContact'), el('input', { name: 'supervisorContact', value: p.supervisorContact || '', placeholder: t('supContactPh') })));
    f.appendChild(el('button', { class: 'btn primary', type: 'submit' }, t('start')));
    wrap.appendChild(f);
    return wrap;
  });

  function field(label, input) {
    return el('label', { class: 'field' }, el('span', {}, label), input);
  }

  // สลับภาษา TH/EN
  function switchLang(l) { if (getLang() !== l) { setLang(l); render(); } }
  function langToggleRow() {
    const cur = getLang();
    const mk = (code, label) => el('button', { class: 'lang-opt' + (cur === code ? ' active' : ''), type: 'button', onclick: () => switchLang(code) }, label);
    return el('div', { class: 'lang-toggle' }, el('span', { class: 'lang-globe' }, '🌐'), mk('th', 'ไทย'), mk('en', 'English'));
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

    wrap.appendChild(langToggleRow());
    wrap.appendChild(el('div', { class: 'brand' },
      el('div', { class: 'logo' }, '✝'),
      el('h1', {}, t('inviteHi', name)),
      el('p', { class: 'muted' }, t('inviteSub', by)),
    ));
    wrap.appendChild(el('div', { class: 'card' },
      el('p', {}, t('invitePrivacy1'), el('b', {}, t('invitePrivacy2')), t('invitePrivacy3')),
      (existing && existing.name !== name)
        ? el('p', { class: 'muted small' }, t('inviteSwitch', existing.name, name))
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
      } }, t('inviteStart')),
    ));
    return wrap;
  });

  function selectEl(name, opts, val) {
    const s = el('select', { name });
    for (const [v, lbl] of opts) {
      const o = el('option', { value: v }, lbl);
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
      el('div', {}, el('div', { class: 'hello' }, t('hello'), ), el('div', { class: 'name' }, p.name)),
      el('button', { class: 'icon-btn', title: t('editProfile'), onclick: () => go('register') }, '⚙'),
    ));

    if (!latest) {
      wrap.appendChild(el('div', { class: 'card empty' },
        el('div', { class: 'emoji' }, '🌱'),
        el('h3', {}, t('noAssessYet')),
        el('p', { class: 'muted' }, t('noAssessSub')),
        el('button', { class: 'btn primary', onclick: () => go('assess') }, t('startFirst')),
      ));
    } else {
      const sc = score(latest.ratings);
      const card = el('div', { class: 'card center' });
      card.appendChild(ringSvg(sc.pct));
      card.appendChild(el('p', { class: 'muted' }, t('latestOverview') + ' • ' + fmtDate(latest.date)));
      card.appendChild(levelBar(sc.byArea));
      wrap.appendChild(card);

      // เปรียบเทียบกับครั้งก่อน
      if (hist[1]) {
        const prev = score(hist[1].ratings);
        const diff = sc.pct - prev.pct;
        wrap.appendChild(el('div', { class: 'trend ' + (diff >= 0 ? 'up' : 'down') },
          (diff >= 0 ? '▲ ' : '▼ ') + t('vsPrev', Math.abs(diff), fmtDate(hist[1].date))));
      }

      // สรุปรายด้าน
      const grid = el('div', { class: 'area-grid' });
      for (const a of AREAS) {
        const s = sc.byArea[a.id];
        grid.appendChild(el('div', { class: 'area-chip' },
          el('span', { class: 'area-icon' }, a.icon),
          el('span', { class: 'area-name' }, areaTitle(a)),
          el('span', { class: 'area-pct' }, s.pct + '%'),
        ));
      }
      wrap.appendChild(el('h3', { class: 'section-h' }, t('progressByArea')));
      wrap.appendChild(grid);
    }

    const actions = el('div', { class: 'action-row' },
      el('button', { class: 'btn primary', onclick: () => go('assess') }, t('newAssess')),
    );
    if (latest) actions.appendChild(el('button', { class: 'btn', onclick: () => go('share') }, t('sendReport')));
    wrap.appendChild(actions);

    if (hist.length) {
      wrap.appendChild(el('h3', { class: 'section-h' }, t('history')));
      const list = el('div', { class: 'list' });
      hist.forEach((rec, i) => {
        const sc = score(rec.ratings);
        list.appendChild(el('button', { class: 'list-item', onclick: () => go('result', { i }) },
          el('span', { class: 'li-date' }, fmtDateTime(rec.date, rec.at)),
          el('span', { class: 'li-pct' }, sc.pct + '%'),
          el('span', { class: 'li-go' }, '›'),
        ));
      });
      wrap.appendChild(list);
    }
    wrap.appendChild(dataSafetyCard());
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
      forName ? t('assessFor', forName) : t('assessTitle'),
      t('assessHint')));

    // คำอธิบายสเกล
    const legend = el('div', { class: 'legend' });
    LEVELS.forEach((l, i) => legend.appendChild(el('span', { class: 'legend-item lv' + i }, el('b', {}, levelLabel(l)), ' = ' + levelDesc(l))));
    wrap.appendChild(legend);

    const progressTop = el('div', { class: 'sticky-progress' }, el('div', { class: 'bar' }, el('div', { class: 'bar-fill lk', style: 'width:0%' })), el('span', {}, t('answered', 0, TOTAL_ITEMS)));
    const updateTop = () => {
      let touched = 0;
      for (const a of AREAS) for (const row of ratings[a.id]) if (row.some(Boolean)) touched++;
      const pct = Math.round((touched / TOTAL_ITEMS) * 100);
      $('.bar-fill', progressTop).style.width = pct + '%';
      $('span', progressTop).textContent = t('answered', touched, TOTAL_ITEMS);
    };
    wrap.appendChild(progressTop);

    for (const a of AREAS) {
      const sec = el('section', { class: 'assess-area' });
      sec.appendChild(el('div', { class: 'aa-head' }, el('span', { class: 'aa-icon' }, a.icon), el('h3', {}, areaTitle(a))));
      const table = el('div', { class: 'aa-table' });
      table.appendChild(el('div', { class: 'aa-row aa-header' },
        el('span', { class: 'aa-verse' }, t('verseCol')),
        ...LEVELS.map((l) => el('span', { class: 'aa-cell' }, levelLabel(l))),
      ));
      a.verses.forEach((v, vi) => {
        const row = el('div', { class: 'aa-row' },
          el('button', { class: 'aa-verse verse-link', type: 'button', onclick: () => showVerse(v) }, refLabel(v), el('span', { class: 'verse-ico' }, '📖')));
        LEVELS.forEach((l, li) => {
          const box = el('input', { type: 'checkbox', class: 'chk lv' + li });
          box.addEventListener('change', () => {
            ratings[a.id][vi][li] = box.checked;
            // บังคับลำดับ: ติ๊กระดับสูงต้องมีระดับล่างด้วย
            if (box.checked) for (let k = 0; k < li; k++) { ratings[a.id][vi][k] = true; row.querySelectorAll('.chk')[k].checked = true; }
            else for (let k = li + 1; k < LEVELS.length; k++) { ratings[a.id][vi][k] = false; row.querySelectorAll('.chk')[k].checked = false; }
            updateTop();
            if (box.checked) checkFx(box, a.icon, li); // เอฟเฟกต์กระจาย ต่างกันตามด้าน/ระดับ
          });
          row.appendChild(el('label', { class: 'aa-cell' }, box));
        });
        table.appendChild(row);
      });
      sec.appendChild(table);
      wrap.appendChild(sec);
    }

    const noteWrap = field(t('noteLabel'), el('textarea', { name: 'note', rows: '3', placeholder: t('notePh') }));
    noteWrap.classList.add('card');
    wrap.appendChild(noteWrap);

    wrap.appendChild(el('div', { class: 'action-row' },
      el('button', { class: 'btn primary', onclick: () => {
        const note = $('textarea', noteWrap).value.trim();
        if (forName) {
          // ผู้ดูแลประเมินแทนสมาชิก -> เก็บเข้าทีม
          const m = getMembers().find((x) => x.name === forName);
          const team = getTeam();
          team.unshift({ id: uid(), memberId: m ? m.id : null, name: forName, believeDate: m ? m.believeDate : '', supervisor: p.name, date: todayISO(), at: Date.now(), ratings, note, savedAt: Date.now() });
          setTeam(team);
          go('member', { name: forName, c: 1 });
        } else {
          const rec = { id: uid(), date: todayISO(), at: Date.now(), ratings, note };
          const hist = getHistory();
          hist.unshift(rec);
          setHistory(hist);
          go('result', { i: 0, c: 1 });
        }
      } }, t('saveAssess')),
      el('button', { class: 'btn', onclick: () => go(backTo) }, t('cancel')),
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
    wrap.appendChild(header(t('resultTitle'), fmtDateTime(rec.date, rec.at)));
    if (params.c) celebrate();

    const card = el('div', { class: 'card center' });
    card.appendChild(ringSvg(sc.pct));
    card.appendChild(levelBar(sc.byArea));
    wrap.appendChild(card);

    for (const a of AREAS) {
      const s = sc.byArea[a.id];
      wrap.appendChild(el('div', { class: 'res-area' },
        el('div', { class: 'res-head' }, el('span', { class: 'aa-icon' }, a.icon), el('b', {}, areaTitle(a)), el('span', { class: 'res-pct' }, s.pct + '%')),
        el('div', { class: 'bar' }, el('div', { class: 'bar-fill ls', style: `width:${s.pct}%` })),
        el('div', { class: 'res-mini' }, t('miniBreak', s.know, s.do, s.share, s.items)),
      ));
    }

    if (rec.note) wrap.appendChild(el('div', { class: 'card note' }, el('b', {}, t('noteLabelShort')), rec.note));

    wrap.appendChild(el('div', { class: 'action-row' },
      el('button', { class: 'btn primary', onclick: () => go('share', { i }) }, t('sendToLeader')),
      el('button', { class: 'btn danger', onclick: () => {
        if (!confirm(t('confirmDelResult'))) return;
        hist.splice(i, 1); setHistory(hist); go('home');
      } }, t('del')),
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

    const summaryLines = AREAS.map((a) => `${a.icon} ${areaTitle(a)}: ${sc.byArea[a.id].pct}%`).join('\n');
    const text =
      `${t('reportTitle')}\n` +
      `${t('rpName')}: ${p.name}\n` +
      `${t('rpDate')}: ${fmtDate(rec.date)}\n` +
      `${t('rpOverall')}: ${sc.pct}%\n\n` +
      summaryLines +
      `\n\n${t('rpSeeMore')}\n${link}`;

    const wrap = el('div', { class: 'page' });
    wrap.appendChild(header(t('shareTitle'), p.supervisor ? t('shareTo', p.supervisor) : null));
    wrap.appendChild(el('div', { class: 'card' },
      el('p', {}, t('shareIntro')),
      el('pre', { class: 'report-preview' }, text),
    ));

    const actions = el('div', { class: 'action-row col' });
    actions.appendChild(el('button', { class: 'btn primary', onclick: async () => {
      if (navigator.share) { try { await navigator.share({ title: t('reportTitle'), text }); return; } catch {} }
      copy(text);
    } }, t('shareBtn')));
    actions.appendChild(el('button', { class: 'btn', onclick: () => copy(text) }, t('copyText')));
    actions.appendChild(el('button', { class: 'btn', onclick: () => copy(link) }, t('copyLink')));
    if (p.supervisorContact) actions.appendChild(el('p', { class: 'muted center' }, t('supChannel', p.supervisorContact)));
    wrap.appendChild(actions);
    return wrap;
  });

  function copy(text) {
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => toast(t('copied')), () => toast(t('copyFail')));
    else { const ta = el('textarea', {}); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); toast(t('copied')); } catch { toast(t('copyFail')); } ta.remove(); }
  }

  // ---------- หน้า: รับรายงาน (เปิดจากลิงก์) ----------
  route('import', (params) => {
    const code = params.r ? decodeURIComponent(params.r) : '';
    const rep = decodeReport(code);
    const wrap = el('div', { class: 'page' });
    wrap.appendChild(header(t('importTitle'), null));
    if (!rep) {
      wrap.appendChild(el('div', { class: 'card' }, el('p', {}, t('importBad'))));
      return wrap;
    }
    const sc = score(rep.ratings);
    wrap.appendChild(el('div', { class: 'card center' },
      el('h3', {}, rep.name),
      el('p', { class: 'muted' }, t('assessedOn', fmtDate(rep.date))),
      ringSvg(sc.pct),
      levelBar(sc.byArea),
    ));
    wrap.appendChild(el('div', { class: 'action-row col' },
      el('button', { class: 'btn primary', onclick: () => {
        const team = getTeam();
        // อัปเดตถ้ามีรายงานของคนนี้วันเดียวกันแล้ว
        const k = (r) => r.name + '|' + r.date;
        const idx = team.findIndex((r) => k(r) === k(rep));
        const entry = { ...rep, id: (idx >= 0 && team[idx] && team[idx].id) ? team[idx].id : uid(), savedAt: Date.now() };
        if (idx >= 0) team[idx] = entry; else team.unshift(entry);
        setTeam(team);
        toast(t('savedToTeam'));
        go('team');
      } }, t('saveToTeam')),
      el('button', { class: 'btn', onclick: () => go('team') }, t('cancel')),
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
    wrap.appendChild(header(t('teamTitle'), t('teamSub', allNames.length, assessed.length)));

    // (1) ช่องเพิ่มสมาชิกใหม่
    const addCard = el('div', { class: 'card' });
    addCard.appendChild(el('h3', { class: 'card-h' }, t('addMember')));
    const nameInput = el('input', { id: 'newm', placeholder: t('memberPh') });
    addCard.appendChild(el('div', { class: 'add-row' },
      nameInput,
      el('button', { class: 'btn primary add-btn', onclick: () => {
        const nm = nameInput.value.trim();
        if (!nm) { toast(t('enterName')); return; }
        if (allNames.includes(nm)) { toast(t('dupName')); return; }
        const ms = getMembers(); ms.push({ id: uid(), name: nm, believeDate: '', createdAt: Date.now() }); setMembers(ms);
        toast(t('added', nm));
        go('member', { name: nm });
      } }, t('add')),
    ));
    addCard.appendChild(el('p', { class: 'muted small' }, t('addHint')));
    wrap.appendChild(addCard);

    // ว่างเปล่า
    if (!allNames.length) {
      wrap.appendChild(el('div', { class: 'card empty' }, el('div', { class: 'emoji' }, '👥'),
        el('p', { class: 'muted' }, t('noMembers'))));
    }

    // (2) ค่าเฉลี่ยรวมของสมาชิกทั้งหมด
    if (assessed.length) {
      let sumPct = 0; const areaSum = {}; AREAS.forEach((a) => areaSum[a.id] = 0);
      assessed.forEach((r) => { const s = score(r.ratings); sumPct += s.pct; AREAS.forEach((a) => areaSum[a.id] += s.byArea[a.id].pct); });
      const avg = Math.round(sumPct / assessed.length);
      wrap.appendChild(el('div', { class: 'card center' },
        ringSvg(avg),
        el('p', { class: 'muted' }, t('teamAvg', assessed.length)),
      ));
      const areaAvgs = AREAS.map((a) => ({ a, v: Math.round(areaSum[a.id] / assessed.length) })).sort((x, y) => x.v - y.v);
      const areaCard = el('div', { class: 'card' }, el('h3', { class: 'section-h' }, t('teamAreaAvg')));
      areaAvgs.forEach(({ a, v }) => {
        areaCard.appendChild(el('div', { class: 'res-area' },
          el('div', { class: 'res-head' }, el('span', { class: 'aa-icon' }, a.icon), el('b', {}, areaTitle(a)), el('span', { class: 'res-pct' }, v + '%')),
          el('div', { class: 'bar' }, el('div', { class: 'bar-fill ' + (v < 40 ? 'lk' : v < 70 ? 'ld' : 'ls'), style: `width:${v}%` })),
        ));
      });
      wrap.appendChild(areaCard);
    }

    // (3) รายชื่อสมาชิก (แตะเพื่อดู/ประเมินรายบุคคล)
    if (allNames.length) {
      wrap.appendChild(el('h3', { class: 'section-h' }, t('teamRoster')));
      const list = el('div', { class: 'list' });
      // เรียง: คนที่ % ต่ำสุดก่อน, คนที่ยังไม่ประเมินไว้ท้ายสุด
      allNames.map((nm) => ({ nm, r: latestByPerson[nm] }))
        .sort((x, y) => (x.r ? score(x.r.ratings).pct : 999) - (y.r ? score(y.r.ratings).pct : 999))
        .forEach(({ nm, r }) => {
          const pct = r ? score(r.ratings).pct + '%' : '—';
          const sub = r ? t('lastN', fmtDate(r.date), countByPerson[nm]) : t('notAssessed');
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
      el('summary', {}, t('importFromLink')),
      el('p', { class: 'muted small' }, t('importFromLinkHint')),
      el('textarea', { id: 'imp', rows: '2', placeholder: t('importPh') }),
      el('button', { class: 'btn', onclick: () => {
        let s = $('#imp').value.trim();
        const m = s.match(/[?&]r=([^&\s]+)/);
        if (m) s = decodeURIComponent(m[1]);
        if (decodeReport(s)) go('import', { r: s });
        else toast(t('readFail'));
      } }, t('openReport')),
    );
    wrap.appendChild(impDetails);

    if (assessed.length) {
      wrap.appendChild(el('div', { class: 'action-row' },
        el('button', { class: 'btn', onclick: () => exportTeamSummary(assessed) }, t('copyTeamSummary')),
      ));
    }
    wrap.appendChild(dataSafetyCard());
    return wrap;
  });

  // คัดลอกสรุปสถิติทั้งทีมเป็นข้อความ
  function exportTeamSummary(people) {
    let sumPct = 0; const areaSum = {}; AREAS.forEach((a) => areaSum[a.id] = 0);
    people.forEach((r) => { const s = score(r.ratings); sumPct += s.pct; AREAS.forEach((a) => areaSum[a.id] += s.byArea[a.id].pct); });
    const avg = Math.round(sumPct / people.length);
    const lines = [];
    lines.push(t('sumTeam', people.length));
    lines.push(t('sumAvg', avg));
    lines.push('');
    lines.push(t('sumByArea'));
    AREAS.map((a) => ({ a, v: Math.round(areaSum[a.id] / people.length) })).sort((x, y) => x.v - y.v)
      .forEach(({ a, v }) => lines.push('• ' + areaTitle(a) + ': ' + v + '%'));
    lines.push('');
    lines.push(t('sumByPerson'));
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
    if (params.c && reports.length) celebrate();

    const assessBtn = el('button', { class: 'btn primary', onclick: () => go('assess', { for: name }) },
      reports.length ? t('assessAgainFor', name) : t('assessForBtn', name));
    const inviteBtn = el('button', { class: 'btn', onclick: async () => {
      const link = inviteLink(name);
      const msg = t('inviteMsg', getProfile().name || (getLang() === 'en' ? 'Leader' : 'ผู้นำ'), name, link);
      if (navigator.share) { try { await navigator.share({ title: t('inviteShareTitle', name), text: msg }); return; } catch {} }
      copy(msg);
    } }, t('inviteLinkBtn', name));

    // ยังไม่มีผลประเมิน
    if (!reports.length) {
      wrap.appendChild(header(name, t('mNoResult')));
      wrap.appendChild(el('div', { class: 'card empty' },
        el('div', { class: 'emoji' }, '📝'),
        el('p', { class: 'muted' }, t('mEmpty', name)),
      ));
      wrap.appendChild(el('div', { class: 'action-row col' },
        assessBtn,
        inviteBtn,
        el('button', { class: 'btn danger', onclick: () => {
          if (!confirm(t('confirmDelMember', name))) return;
          setMembers(getMembers().filter((m) => m.name !== name));
          go('team');
        } }, t('delMember')),
      ));
      return wrap;
    }

    const latest = reports[0];
    const sc = score(latest.ratings);
    wrap.appendChild(header(name, (latest.believeDate ? t('mBelieve', fmtDate(latest.believeDate)) : '') + t('mReports', reports.length)));

    const card = el('div', { class: 'card center' });
    card.appendChild(ringSvg(sc.pct));
    card.appendChild(el('p', { class: 'muted' }, t('lastAssessed', fmtDate(latest.date))));
    card.appendChild(levelBar(sc.byArea));
    wrap.appendChild(card);

    wrap.appendChild(el('div', { class: 'action-row col' }, assessBtn, inviteBtn));

    // แนวโน้มเทียบรายงานก่อนหน้า
    if (reports[1]) {
      const diff = sc.pct - score(reports[1].ratings).pct;
      wrap.appendChild(el('div', { class: 'trend ' + (diff >= 0 ? 'up' : 'down') },
        (diff >= 0 ? '▲ ' : '▼ ') + t('fromPrev', Math.abs(diff), fmtDate(reports[1].date))));
    }

    // รายด้านของรายงานล่าสุด
    wrap.appendChild(el('h3', { class: 'section-h' }, t('areasLatest')));
    for (const a of AREAS) {
      const s = sc.byArea[a.id];
      wrap.appendChild(el('div', { class: 'res-area' },
        el('div', { class: 'res-head' }, el('span', { class: 'aa-icon' }, a.icon), el('b', {}, areaTitle(a)), el('span', { class: 'res-pct' }, s.pct + '%')),
        el('div', { class: 'bar' }, el('div', { class: 'bar-fill ls', style: `width:${s.pct}%` })),
        el('div', { class: 'res-mini' }, t('miniBreak', s.know, s.do, s.share, s.items)),
      ));
    }

    // ประวัติรายงานของคนนี้
    if (reports.length > 1) {
      wrap.appendChild(el('h3', { class: 'section-h' }, t('reportHistory')));
      const list = el('div', { class: 'list' });
      reports.forEach((r) => {
        const s = score(r.ratings);
        list.appendChild(el('div', { class: 'list-item' },
          el('span', { class: 'li-date' }, fmtDateTime(r.date, r.at || r.savedAt)),
          el('span', { class: 'li-pct' }, s.pct + '%'),
        ));
      });
      wrap.appendChild(list);
    }

    wrap.appendChild(el('div', { class: 'action-row' },
      el('button', { class: 'btn danger', onclick: () => {
        if (!confirm(t('confirmDelMemberAll', name))) return;
        setTeam(getTeam().filter((x) => x.name !== name));
        setMembers(getMembers().filter((m) => m.name !== name));
        go('team');
      } }, t('delMember')),
    ));
    return wrap;
  });

  // ---------- สำรองข้อมูล & กู้คืน (Phase 1) ----------
  // รวบรวมข้อมูลทั้งหมดในรูปแบบ localStorage
  function gatherRaw() {
    return { profile: getProfile(), history: getHistory(), members: getMembers(), team: getTeam(), lang: getLang(), appVersion: APP_VERSION };
  }
  // เขียนข้อมูลกลับลง localStorage (ใช้ทั้งกรณีแทนที่และกรณีรวม)
  function applyRaw(raw) {
    if (raw.profile) setProfile(raw.profile);
    setHistory(raw.history || []);
    setMembers(raw.members || []);
    setTeam(raw.team || []);
    if (raw.lang) setLang(raw.lang);
  }
  // ดาวน์โหลดไฟล์สำรอง (.json) — รูปแบบพร้อมย้ายไป Supabase ภายหลัง
  function downloadBackup() {
    const env = GrowthBackup.build(gatherRaw());
    const blob = new Blob([JSON.stringify(env, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = el('a', { href: url, download: 'growthct-backup-' + todayISO() + '.json' });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    toast(t('backupDownloaded'));
  }
  // การ์ดทางลัดไปหน้าสำรองข้อมูล (วางบนหน้าหลัก/ทีม)
  function dataSafetyCard() {
    return el('div', { class: 'card' },
      el('h3', { class: 'card-h' }, t('backupCardTitle')),
      el('p', { class: 'muted small' }, t('backupCardSub')),
      el('button', { class: 'btn', onclick: () => go('backup') }, t('backupOpen')),
    );
  }

  // ---------- หน้า: สำรองข้อมูล & กู้คืน ----------
  route('backup', () => {
    const wrap = el('div', { class: 'page' });
    wrap.appendChild(header(t('backupTitle'), t('backupIntro')));
    const raw = gatherRaw();

    // (1) สำรอง (ดาวน์โหลด)
    const exp = el('div', { class: 'card' },
      el('h3', { class: 'card-h' }, t('backupSection')),
      el('p', { class: 'muted small' }, t('backupContains', (raw.members || []).length, (raw.history || []).length, (raw.team || []).length)),
      el('button', { class: 'btn primary', onclick: downloadBackup }, t('backupNow')),
    );
    wrap.appendChild(exp);

    // (2) กู้คืน
    const imp = el('div', { class: 'card' },
      el('h3', { class: 'card-h' }, t('restoreSection')),
      el('p', { class: 'muted small' }, t('restoreIntro')),
    );
    const preview = el('div', { class: 'restore-preview' });

    const showParsed = (parsed) => {
      preview.innerHTML = '';
      if (!parsed || !parsed.ok) {
        preview.appendChild(el('p', { class: 'danger-text' }, parsed && parsed.error === 'too-new' ? t('restoreTooNew') : t('restoreBad')));
        return;
      }
      const s = parsed.summary;
      const when = s.exportedAt ? fmtDate(String(s.exportedAt).slice(0, 10)) : '';
      preview.appendChild(el('p', {}, t('restorePreview', s.members, s.selfAssessments, s.memberAssessments, when)));
      preview.appendChild(el('div', { class: 'action-row col' },
        el('button', { class: 'btn primary', onclick: () => {
          if (!confirm(t('restoreReplaceConfirm'))) return;
          applyRaw(parsed.data); toast(t('restoreDone')); go('home');
        } }, t('restoreReplace')),
        el('p', { class: 'muted small' }, t('restoreReplaceExplain')),
        el('button', { class: 'btn', onclick: () => {
          if (!confirm(t('restoreMergeConfirm'))) return;
          applyRaw(GrowthBackup.merge(gatherRaw(), parsed.data)); toast(t('restoreDone')); go('home');
        } }, t('restoreMerge')),
        el('p', { class: 'muted small' }, t('restoreMergeExplain')),
      ));
    };
    const readText = (text) => {
      try { showParsed(GrowthBackup.parse(JSON.parse(text))); }
      catch { showParsed({ ok: false, error: 'parse' }); }
    };

    const fileInput = el('input', { type: 'file', accept: '.json,application/json', class: 'hidden-file' });
    fileInput.addEventListener('change', () => {
      const f = fileInput.files && fileInput.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => readText(reader.result);
      reader.onerror = () => showParsed({ ok: false, error: 'read' });
      reader.readAsText(f);
    });
    imp.appendChild(el('button', { class: 'btn', onclick: () => fileInput.click() }, t('restoreChoose')));
    imp.appendChild(fileInput);
    imp.appendChild(preview);
    wrap.appendChild(imp);

    // (3) ตัวเลือกเพิ่มเติม: คัดลอก/วางเป็นข้อความ (สำรองทาง LINE ฯลฯ)
    const adv = el('details', { class: 'card details' },
      el('summary', {}, t('backupAdvanced')),
      el('button', { class: 'btn', onclick: () => copy(JSON.stringify(GrowthBackup.build(gatherRaw()))) }, t('backupCopyText')),
      el('textarea', { id: 'restore-text', rows: '3', placeholder: t('restorePastePh') }),
      el('button', { class: 'btn', onclick: () => {
        const v = ($('#restore-text').value || '').trim();
        if (v) readText(v);
      } }, t('restorePasteBtn')),
    );
    wrap.appendChild(adv);
    return wrap;
  });

  // ---------- แถบนำทางบน (ย้อนกลับ / ถัดไป / ภาษา / หน้าหลัก) ----------
  const PAGE_TITLE_KEY = {
    home: 'titHome', assess: 'titAssess', result: 'titResult', share: 'titShare',
    team: 'titTeam', member: 'titMember', import: 'titImport', register: 'titRegister', invite: 'titInvite',
    backup: 'titBackup',
  };
  function appBar() {
    return el('header', { class: 'appbar', id: 'appbar' },
      el('div', { class: 'appbar-nav' },
        el('button', { class: 'nav-btn', title: t('back'), onclick: () => history.back() }, '‹'),
        el('button', { class: 'nav-btn', title: t('forward'), onclick: () => history.forward() }, '›'),
      ),
      el('div', { class: 'appbar-title', id: 'appbar-title' }, t('brand')),
      el('button', { class: 'nav-btn lang-btn', id: 'lang-btn', title: 'ภาษา / Language', onclick: () => switchLang(getLang() === 'th' ? 'en' : 'th') }, getLang() === 'th' ? 'EN' : 'ไทย'),
      el('button', { class: 'nav-btn home-btn', title: t('home'), onclick: () => go('home') }, '🏠'),
    );
  }

  // ---------- แถบนำทางล่าง ----------
  function navBar() {
    const items = [['home', '🏠', 'tabHome'], ['assess', '✅', 'tabAssess'], ['team', '👥', 'tabTeam']];
    const nav = el('nav', { class: 'tabbar', id: 'tabbar' });
    items.forEach(([r, icon, key]) => {
      nav.appendChild(el('button', { class: 'tab', 'data-route': r, 'data-key': key, onclick: () => go(r) },
        el('span', { class: 'tab-ico' }, icon), el('span', { class: 'tab-label' }, t(key))));
    });
    return nav;
  }
  function updateNav(active) {
    const show = !!getProfile() && active !== 'register' && active !== 'invite';
    const nav = $('#tabbar');
    if (nav) {
      nav.style.display = show ? '' : 'none';
      nav.querySelectorAll('.tab').forEach((tab) => {
        tab.classList.toggle('active', tab.dataset.route === active);
        const lbl = $('.tab-label', tab); if (lbl) lbl.textContent = t(tab.dataset.key);
      });
    }
    const bar = $('#appbar');
    if (bar) bar.style.display = show ? '' : 'none';
    document.body.classList.toggle('with-appbar', show);
    const tt = $('#appbar-title');
    if (tt) tt.textContent = t(PAGE_TITLE_KEY[active] || 'brand');
    const lb = $('#lang-btn'); if (lb) lb.textContent = getLang() === 'th' ? 'EN' : 'ไทย';
  }

  // ---------- toast ----------
  let toastTimer;
  function toast(msg) {
    let node = $('#toast');
    if (!node) { node = el('div', { id: 'toast', class: 'toast' }); document.body.appendChild(node); }
    node.textContent = msg; node.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => node.classList.remove('show'), 2200);
  }

  // ---------- เอฟเฟกต์/ภาพเคลื่อนไหว ----------
  const reducedMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function fxLayer() {
    let l = $('#fx');
    if (!l) { l = el('div', { id: 'fx', class: 'fx-layer' }); document.body.appendChild(l); }
    return l;
  }
  function vibrate(pat) { try { navigator.vibrate && navigator.vibrate(pat); } catch {} }
  // กระจายอนุภาคจากจุด (x,y)
  function burstAt(x, y, opts = {}) {
    if (reducedMotion()) return;
    const { emojis = ['✨'], count = 10, power = 90, scale = 1 } = opts;
    const layer = fxLayer();
    for (let i = 0; i < count; i++) {
      const p = el('span', { class: 'particle' }, emojis[i % emojis.length]);
      const ang = Math.random() * Math.PI * 2;
      const dist = power * (0.45 + Math.random() * 0.8);
      p.style.left = x + 'px'; p.style.top = y + 'px';
      p.style.setProperty('--dx', Math.cos(ang) * dist + 'px');
      p.style.setProperty('--dy', (Math.sin(ang) * dist - 24) + 'px');
      p.style.setProperty('--rot', (Math.random() * 360 - 180) + 'deg');
      p.style.fontSize = (15 * scale * (0.7 + Math.random() * 0.6)) + 'px';
      p.style.animationDuration = (650 + Math.random() * 550) + 'ms';
      p.addEventListener('animationend', () => p.remove());
      layer.appendChild(p);
    }
  }
  // เอฟเฟกต์ตอนเช็ค — ต่างกันตามด้าน (ใช้ไอคอนด้าน) และระดับ (รู้/กระทำ/แบ่งปัน)
  function checkFx(box, areaIcon, level) {
    const r = box.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const conf = [
      { emojis: [areaIcon, '✨'], count: 8, power: 70, scale: 1, vib: 8 },
      { emojis: [areaIcon, '⭐', '✨'], count: 13, power: 100, scale: 1.15, vib: 14 },
      { emojis: [areaIcon, '🎉', '💚', '⭐', '✨'], count: 22, power: 140, scale: 1.35, vib: [10, 24, 12] },
    ][level] || {};
    burstAt(x, y, conf);
    vibrate(conf.vib);
    box.classList.remove('chk-pop'); void box.offsetWidth; box.classList.add('chk-pop');
  }
  // ฉลองตอนทำเสร็จ
  function celebrate() {
    if (reducedMotion()) return;
    vibrate([12, 30, 12, 30, 18]);
    const w = window.innerWidth;
    const emojis = ['🎉', '✨', '⭐', '💛', '💚', '🙌', '🔥'];
    for (let k = 0; k < 3; k++) {
      setTimeout(() => burstAt(w * (0.22 + 0.28 * k), 130, { emojis, count: 20, power: 170, scale: 1.35 }), k * 170);
    }
  }

  // ---------- ป๊อบอัพข้อพระคัมภีร์ ----------
  function showVerse(ref) {
    const data = bibleFor(ref);
    const overlay = el('div', { class: 'modal-overlay', onclick: (e) => { if (e.target === overlay) close(); } });
    function close() { overlay.classList.remove('show'); setTimeout(() => overlay.remove(), 200); }
    const sheet = el('div', { class: 'modal-sheet' });
    sheet.appendChild(el('div', { class: 'modal-head' },
      el('h3', {}, refLabel(ref)),
      el('button', { class: 'modal-x', onclick: close }, '✕'),
    ));
    const body = el('div', { class: 'modal-body' });
    if (data && data.length) {
      data.forEach((row) => {
        body.appendChild(el('p', { class: 'verse-p' },
          el('sup', { class: 'verse-n' }, String(row.n)), ' ', row.t));
      });
    } else {
      body.appendChild(el('p', { class: 'muted' }, t('verseNotFound')));
    }
    sheet.appendChild(body);
    sheet.appendChild(el('div', { class: 'modal-foot' }, bibleVersion()));
    overlay.appendChild(sheet);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));
  }

  // ---------- บูต ----------
  function boot() {
    document.body.appendChild(appBar());
    document.body.appendChild(navBar());
    // ถ้ามาจากลิงก์รายงานแต่ยังไม่มีโปรไฟล์ ให้ลงทะเบียนก่อนแล้วค่อยกลับ
    if (!getProfile() && !location.hash.startsWith('#import') && !location.hash.startsWith('#invite')) location.hash = '#register';
    window.addEventListener('hashchange', render);
    render();
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  document.addEventListener('DOMContentLoaded', boot);
})();
