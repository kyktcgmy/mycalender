import { CalendarEvent } from "@/types/event";

/**
 * テキストの ICS エスケープ処理（RFC 5545 準拠）
 * バックスラッシュ → カンマ → セミコロン → 改行 の順でエスケープする
 */
function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\r\n|\r|\n/g, "\\n");
}

/**
 * "YYYY-MM-DD" 形式の日付文字列を ICS の DATE 形式 "YYYYMMDD" に変換する
 */
function toIcsDate(date: string): string {
  return date.replace(/-/g, "");
}

/**
 * 現在の UTC 日時を ICS の DTSTAMP 形式 "YYYYMMDDTHHmmssZ" で返す
 */
function nowDtstamp(): string {
  return new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

/**
 * CalendarEvent の配列を RFC 5545 準拠の .ics 文字列に変換する
 * すべてのイベントは終日イベント（VALUE=DATE）として出力する
 */
export function generateIcs(events: CalendarEvent[]): string {
  const dtstamp = nowDtstamp();

  const vevents = events
    .map((event) => {
      const dtstart = toIcsDate(event.date);
      // 終日イベントの DTEND は翌日（RFC 5545: 4.6.1）
      const nextDay = new Date(event.date);
      nextDay.setDate(nextDay.getDate() + 1);
      const dtend = toIcsDate(nextDay.toISOString().split("T")[0]);

      const lines = [
        "BEGIN:VEVENT",
        `UID:${event.id}@mycalender`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART;VALUE=DATE:${dtstart}`,
        `DTEND;VALUE=DATE:${dtend}`,
        `SUMMARY:${escapeIcsText(event.title)}`,
      ];

      if (event.memo) {
        lines.push(`DESCRIPTION:${escapeIcsText(event.memo)}`);
      }

      lines.push("END:VEVENT");
      return lines.join("\r\n");
    })
    .join("\r\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//mycalender//mycalender//JA",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    vevents,
    "END:VCALENDAR",
  ].join("\r\n");
}
