/**
 * The 66 books of the Protestant canon — the single source of truth.
 *
 * Nothing else in the app may hard-code a book name, order or chapter count.
 * `lessonStatus` describes whether *we* have prepared a lesson; it is a
 * completely separate concern from how far a reader has got, which lives in
 * `lib/progress`. A book can be `ready` and unread, or `coming-soon` and
 * already finished by a reader working from their own Bible.
 */

export type Testament = "old" | "new";
export type LessonStatus = "ready" | "coming-soon";

export interface BibleBook {
  /** Stable id, also the URL segment. Matches the chapter-key prefix. */
  readonly id: string;
  readonly order: number;
  readonly code: string;
  readonly nameTh: string;
  readonly nameEn: string;
  readonly testament: Testament;
  readonly chapterCount: number;
  readonly lessonStatus: LessonStatus;
}

/**
 * Books with at least one prepared chapter. Verified against
 * `content/books/**` — do not add a book here before its content exists.
 */
const BOOKS_WITH_LESSONS = new Set<string>(["ephesians"]);

type Row = readonly [order: number, code: string, th: string, en: string, chapters: number, id: string];

const OLD_TESTAMENT_ROWS: readonly Row[] = [
  [1, "GEN", "ปฐมกาล", "Genesis", 50, "genesis"],
  [2, "EXO", "อพยพ", "Exodus", 40, "exodus"],
  [3, "LEV", "เลวีนิติ", "Leviticus", 27, "leviticus"],
  [4, "NUM", "กันดารวิถี", "Numbers", 36, "numbers"],
  [5, "DEU", "เฉลยธรรมบัญญัติ", "Deuteronomy", 34, "deuteronomy"],
  [6, "JOS", "โยชูวา", "Joshua", 24, "joshua"],
  [7, "JDG", "ผู้วินิจฉัย", "Judges", 21, "judges"],
  [8, "RUT", "รูธ", "Ruth", 4, "ruth"],
  [9, "1SA", "1 ซามูเอล", "1 Samuel", 31, "1-samuel"],
  [10, "2SA", "2 ซามูเอล", "2 Samuel", 24, "2-samuel"],
  [11, "1KI", "1 พงศ์กษัตริย์", "1 Kings", 22, "1-kings"],
  [12, "2KI", "2 พงศ์กษัตริย์", "2 Kings", 25, "2-kings"],
  [13, "1CH", "1 พงศาวดาร", "1 Chronicles", 29, "1-chronicles"],
  [14, "2CH", "2 พงศาวดาร", "2 Chronicles", 36, "2-chronicles"],
  [15, "EZR", "เอสรา", "Ezra", 10, "ezra"],
  [16, "NEH", "เนหะมีย์", "Nehemiah", 13, "nehemiah"],
  [17, "EST", "เอสเธอร์", "Esther", 10, "esther"],
  [18, "JOB", "โยบ", "Job", 42, "job"],
  [19, "PSA", "สดุดี", "Psalms", 150, "psalms"],
  [20, "PRO", "สุภาษิต", "Proverbs", 31, "proverbs"],
  [21, "ECC", "ปัญญาจารย์", "Ecclesiastes", 12, "ecclesiastes"],
  [22, "SNG", "เพลงซาโลมอน", "Song of Songs", 8, "song-of-songs"],
  [23, "ISA", "อิสยาห์", "Isaiah", 66, "isaiah"],
  [24, "JER", "เยเรมีย์", "Jeremiah", 52, "jeremiah"],
  [25, "LAM", "เพลงคร่ำครวญ", "Lamentations", 5, "lamentations"],
  [26, "EZK", "เอเสเคียล", "Ezekiel", 48, "ezekiel"],
  [27, "DAN", "ดาเนียล", "Daniel", 12, "daniel"],
  [28, "HOS", "โฮเชยา", "Hosea", 14, "hosea"],
  [29, "JOL", "โยเอล", "Joel", 3, "joel"],
  [30, "AMO", "อาโมส", "Amos", 9, "amos"],
  [31, "OBA", "โอบาดีย์", "Obadiah", 1, "obadiah"],
  [32, "JON", "โยนาห์", "Jonah", 4, "jonah"],
  [33, "MIC", "มีคาห์", "Micah", 7, "micah"],
  [34, "NAM", "นาฮูม", "Nahum", 3, "nahum"],
  [35, "HAB", "ฮาบากุก", "Habakkuk", 3, "habakkuk"],
  [36, "ZEP", "เศฟันยาห์", "Zephaniah", 3, "zephaniah"],
  [37, "HAG", "ฮักกัย", "Haggai", 2, "haggai"],
  [38, "ZEC", "เศคาริยาห์", "Zechariah", 14, "zechariah"],
  [39, "MAL", "มาลาคี", "Malachi", 4, "malachi"],
];

const NEW_TESTAMENT_ROWS: readonly Row[] = [
  [40, "MAT", "มัทธิว", "Matthew", 28, "matthew"],
  [41, "MRK", "มาระโก", "Mark", 16, "mark"],
  [42, "LUK", "ลูกา", "Luke", 24, "luke"],
  [43, "JHN", "ยอห์น", "John", 21, "john"],
  [44, "ACT", "กิจการของอัครทูต", "Acts", 28, "acts"],
  [45, "ROM", "โรม", "Romans", 16, "romans"],
  [46, "1CO", "1 โครินธ์", "1 Corinthians", 16, "1-corinthians"],
  [47, "2CO", "2 โครินธ์", "2 Corinthians", 13, "2-corinthians"],
  [48, "GAL", "กาลาเทีย", "Galatians", 6, "galatians"],
  [49, "EPH", "เอเฟซัส", "Ephesians", 6, "ephesians"],
  [50, "PHP", "ฟีลิปปี", "Philippians", 4, "philippians"],
  [51, "COL", "โคโลสี", "Colossians", 4, "colossians"],
  [52, "1TH", "1 เธสะโลนิกา", "1 Thessalonians", 5, "1-thessalonians"],
  [53, "2TH", "2 เธสะโลนิกา", "2 Thessalonians", 3, "2-thessalonians"],
  [54, "1TI", "1 ทิโมธี", "1 Timothy", 6, "1-timothy"],
  [55, "2TI", "2 ทิโมธี", "2 Timothy", 4, "2-timothy"],
  [56, "TIT", "ทิตัส", "Titus", 3, "titus"],
  [57, "PHM", "ฟีเลโมน", "Philemon", 1, "philemon"],
  [58, "HEB", "ฮีบรู", "Hebrews", 13, "hebrews"],
  [59, "JAS", "ยากอบ", "James", 5, "james"],
  [60, "1PE", "1 เปโตร", "1 Peter", 5, "1-peter"],
  [61, "2PE", "2 เปโตร", "2 Peter", 3, "2-peter"],
  [62, "1JN", "1 ยอห์น", "1 John", 5, "1-john"],
  [63, "2JN", "2 ยอห์น", "2 John", 1, "2-john"],
  [64, "3JN", "3 ยอห์น", "3 John", 1, "3-john"],
  [65, "JUD", "ยูดา", "Jude", 1, "jude"],
  [66, "REV", "วิวรณ์", "Revelation", 22, "revelation"],
];

function toBook(row: Row, testament: Testament): BibleBook {
  const [order, code, nameTh, nameEn, chapterCount, id] = row;
  return {
    id,
    order,
    code,
    nameTh,
    nameEn,
    testament,
    chapterCount,
    lessonStatus: BOOKS_WITH_LESSONS.has(id) ? "ready" : "coming-soon",
  };
}

export const BIBLE_BOOKS: readonly BibleBook[] = [
  ...OLD_TESTAMENT_ROWS.map((row) => toBook(row, "old")),
  ...NEW_TESTAMENT_ROWS.map((row) => toBook(row, "new")),
];

export const OLD_TESTAMENT: readonly BibleBook[] = BIBLE_BOOKS.filter((b) => b.testament === "old");
export const NEW_TESTAMENT: readonly BibleBook[] = BIBLE_BOOKS.filter((b) => b.testament === "new");

export const TOTAL_BOOKS = BIBLE_BOOKS.length;
export const TOTAL_CHAPTERS = BIBLE_BOOKS.reduce((sum, b) => sum + b.chapterCount, 0);

const BY_ID = new Map(BIBLE_BOOKS.map((b) => [b.id, b]));

export function findBook(id: string): BibleBook | undefined {
  return BY_ID.get(id);
}

/**
 * Chapter keys look like `ephesians-01`, so book progress can be derived from
 * the key the reader already passes in — no call site needs to change.
 */
export function parseChapterKey(chapterKey: string): { bookId: string; chapterNumber: number } | null {
  const match = /^(.+)-(\d{2,3})$/.exec(chapterKey);
  if (match === null) return null;
  const bookId = match[1] as string;
  const chapterNumber = Number.parseInt(match[2] as string, 10);
  const book = BY_ID.get(bookId);
  if (book === undefined) return null;
  if (!Number.isInteger(chapterNumber) || chapterNumber < 1 || chapterNumber > book.chapterCount) return null;
  return { bookId, chapterNumber };
}

export function chapterKeyFor(bookId: string, chapterNumber: number): string {
  return `${bookId}-${String(chapterNumber).padStart(2, "0")}`;
}
