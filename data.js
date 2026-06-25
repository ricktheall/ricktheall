/*
 * data.js — เนื้อหาแบบประเมินสุขภาพฝ่ายวิญญาณของสาวก (9 ด้าน) · 2 ภาษา TH/EN
 * สเกลการเติบโต: รู้ (Know) -> กระทำ (Do) -> แบ่งปัน (Share)
 */

// ระดับการเติบโต (เรียงจากต้นทางไปปลายทาง)
const LEVELS = [
  { key: 'know',  label: 'รู้',      label_en: 'Know',  desc: 'เข้าใจและรู้จักหลักการนี้',        desc_en: 'Understand and know this principle' },
  { key: 'do',    label: 'กระทำ',   label_en: 'Do',    desc: 'ลงมือทำในชีวิตจริงอย่างสม่ำเสมอ', desc_en: 'Practice it consistently in real life' },
  { key: 'share', label: 'แบ่งปัน', label_en: 'Share', desc: 'ถ่ายทอด/สอนผู้อื่นให้ทำตามได้',    desc_en: 'Pass it on — teach others to do it too' },
];

// 9 ด้านของการเป็นสาวก พร้อมข้ออ้างอิงพระคัมภีร์และไอคอน
const AREAS = [
  {
    id: 'worship', title: 'นมัสการร่วมกัน', title_en: 'Worship Together', icon: '🙌',
    verses: ['กิจการฯ 2:42-47', 'กิจการฯ 4:32-35', 'ฮีบรู 10:24-25', 'โคโลสี 3:15-17', 'สดุดี 95:1-7'],
  },
  {
    id: 'prayer', title: 'อธิษฐาน และ อดอาหาร', title_en: 'Prayer & Fasting', icon: '🙏',
    verses: ['มัทธิว 6:5-15', 'ลูกา 6:16-18', 'ฟีลิปปี 4:6-7; 1 เปโตร 5:7', 'มัทธิว 4:1-11', 'โยชูวา 24:15ข'],
  },
  {
    id: 'giving', title: 'อุทิศเวลา และ ถวายทรัพย์', title_en: 'Time & Giving', icon: '🍚',
    verses: ['มัทธิว 6:19-21', 'มาระโก 12:41-44', 'กิจการฯ 9:36-39', '1 โครินธ์ 16:1-3', '1 เปโตร 4:10-11'],
  },
  {
    id: 'victory', title: 'ดำเนินชีวิตอย่างมีชัยชนะ', title_en: 'Victorious Living', icon: '🤝',
    verses: ['ยอห์น 15:4-10', 'กาลาเทีย 5:16-26', '1 เปโตร 1:3-9', 'โรม 8:1-11', 'โรม 8:31-37'],
  },
  {
    id: 'love', title: 'รักพระเจ้า และ รักผู้อื่น', title_en: 'Love God & Others', icon: '❤️',
    verses: ['ยอห์น 14:15-21', 'มัทธิว 25:35-36', '1 โครินธ์ 13:4-7', 'ลูกา 10:25-37', 'มัทธิว 5:43-48'],
  },
  {
    id: 'sacrament', title: 'พิธีมหาสนิท และ บัพติศมา', title_en: 'Communion & Baptism', icon: '🍷',
    verses: ['มัทธิว 26:26-30', '1 โครินธ์ 11:23-29', 'มัทธิว 28:19-20', 'กิจการฯ 8:26-39', 'โรม 6:1-9'],
  },
  {
    id: 'word', title: 'ศึกษาและเชื่อฟังพระวจนะ', title_en: 'Study & Obey the Word', icon: '📖',
    verses: ['2 ทิโมธี 3:10-17', 'โยชูวา 1:7-9', 'ยากอบ 1:22-25', 'ฉธบ. 31:12-13', 'กิจการฯ 17:11'],
  },
  {
    id: 'multiply', title: 'สร้างสาวกที่สร้างสาวก', title_en: 'Make Disciples', icon: '🌱',
    verses: ['มัทธิว 28:18-20', '2 ทิโมธี 2:1-3', 'กิจการฯ 18:24-27', 'ลูกา 10:1-9', 'เอเฟซัส 4:17-28'],
  },
  {
    id: 'accountability', title: 'ยอมจำนนและรายงานชีวิต', title_en: 'Submit & Be Accountable', icon: '🧭',
    verses: ['ยากอบ 4:6-10', 'กาลาเทีย 2:19-21', 'ฮีบรู 13:7, 17-19', '1 เปโตร 5:1-7', 'เอเฟซัส 4:11-16'],
  },
];

const TOTAL_ITEMS = AREAS.reduce((n, a) => n + a.verses.length, 0); // 45
const TOTAL_BITS = TOTAL_ITEMS * LEVELS.length;                     // 135

if (typeof module !== 'undefined') {
  module.exports = { LEVELS, AREAS, TOTAL_ITEMS, TOTAL_BITS };
}
