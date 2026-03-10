import { v4 as uuidv4 } from "uuid";
import { CalendarEvent } from "@/types/event";

/**
 * 数値を2桁ゼロ埋めの文字列に変換する
 */
function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * 年・月・日を "YYYY-MM-DD" 形式に変換する
 */
function toDateString(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

/**
 * 日付パターンにマッチした行かどうかを判定し、マッチした場合は日付文字列を返す
 * 対応パターン：
 *   - YYYY年MM月DD日
 *   - MM月DD日
 *   - MM/DD
 */
function extractDate(
  line: string,
  currentYear: number
): { date: string; rest: string } | null {
  // YYYY年MM月DD日
  const fullJpPattern = /(\d{4})年(\d{1,2})月(\d{1,2})日/;
  let m = line.match(fullJpPattern);
  if (m) {
    const date = toDateString(Number(m[1]), Number(m[2]), Number(m[3]));
    const rest = line.replace(m[0], "").trim();
    return { date, rest };
  }

  // MM月DD日（年なし → 現在の年を使用）
  const shortJpPattern = /(\d{1,2})月(\d{1,2})日/;
  m = line.match(shortJpPattern);
  if (m) {
    const date = toDateString(currentYear, Number(m[1]), Number(m[2]));
    const rest = line.replace(m[0], "").trim();
    return { date, rest };
  }

  // MM/DD（年なし → 現在の年を使用）
  const slashPattern = /(\d{1,2})\/(\d{1,2})/;
  m = line.match(slashPattern);
  if (m) {
    const date = toDateString(currentYear, Number(m[1]), Number(m[2]));
    const rest = line.replace(m[0], "").trim();
    return { date, rest };
  }

  return null;
}

/**
 * OCR で取得したテキストを解析して CalendarEvent の配列に変換する
 *
 * 解析ルール：
 * - 日付パターン（YYYY年MM月DD日 / MM月DD日 / MM/DD）を含む行を起点にイベントを生成
 * - 日付行の残りテキストをタイトルとする（空の場合は次の行をタイトルとして使用）
 * - 日付が見つからない行は解析不能テキストとして末尾のメモに付加する
 */
export function parseCalendar(ocrText: string): CalendarEvent[] {
  if (!ocrText.trim()) return [];

  const currentYear = new Date().getFullYear();
  const lines = ocrText
    .split(/\r\n|\r|\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const events: CalendarEvent[] = [];
  const unmatched: string[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const result = extractDate(line, currentYear);

    if (result) {
      const { date, rest } = result;

      // 日付行の残り部分をタイトルとして使う。空なら次の行を確認
      let title = rest;
      let memoLines: string[] = [];

      if (!title && i + 1 < lines.length) {
        // 次の行が日付を含まない場合はタイトルとして使用
        const next = lines[i + 1];
        if (!extractDate(next, currentYear)) {
          title = next;
          i++;
        }
      }

      // タイトルがまだなければデフォルト値
      if (!title) {
        title = "（タイトル未設定）";
      }

      // さらに次の行にテキストがあり日付でなければメモとして蓄積
      while (
        i + 1 < lines.length &&
        !extractDate(lines[i + 1], currentYear)
      ) {
        memoLines.push(lines[i + 1]);
        i++;
        // 2行以上続く場合は次のイベントの開始と判断して止める
        if (memoLines.length >= 3) break;
      }

      events.push({
        id: uuidv4(),
        date,
        title,
        memo: memoLines.join("\n"),
      });
    } else {
      unmatched.push(line);
    }

    i++;
  }

  // 解析できなかったテキストをダミーイベントとして末尾に追加（ユーザーが手動修正可能）
  if (unmatched.length > 0) {
    const today = toDateString(
      currentYear,
      new Date().getMonth() + 1,
      new Date().getDate()
    );
    events.push({
      id: uuidv4(),
      date: today,
      title: "（解析不能テキスト）",
      memo: unmatched.join("\n"),
    });
  }

  return events;
}
