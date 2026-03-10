import { generateIcs } from "@/lib/generateIcs";
import { CalendarEvent } from "@/types/event";

const BASE_EVENT: CalendarEvent = {
  id: "test-uuid-1234",
  date: "2026-03-15",
  title: "テスト会議",
  memo: "メモ内容",
};

describe("generateIcs", () => {
  // ─── RFC 5545 基本構造 ────────────────────────────────────────

  describe("RFC 5545 基本構造", () => {
    it("VCALENDAR の開始・終了タグを含む", () => {
      const ics = generateIcs([BASE_EVENT]);
      expect(ics).toContain("BEGIN:VCALENDAR");
      expect(ics).toContain("END:VCALENDAR");
    });

    it("VERSION:2.0 を含む", () => {
      const ics = generateIcs([BASE_EVENT]);
      expect(ics).toContain("VERSION:2.0");
    });

    it("PRODID を含む", () => {
      const ics = generateIcs([BASE_EVENT]);
      expect(ics).toContain("PRODID:");
    });

    it("CALSCALE:GREGORIAN を含む", () => {
      const ics = generateIcs([BASE_EVENT]);
      expect(ics).toContain("CALSCALE:GREGORIAN");
    });

    it("CRLF（\\r\\n）で行を区切る", () => {
      const ics = generateIcs([BASE_EVENT]);
      expect(ics).toContain("\r\n");
      // CR のない LF のみの改行が存在しないことを確認
      const withoutCrlf = ics.replace(/\r\n/g, "");
      expect(withoutCrlf).not.toContain("\n");
    });
  });

  // ─── 単一イベントの正常系 ────────────────────────────────────

  describe("単一イベントの生成", () => {
    it("VEVENT の開始・終了タグを含む", () => {
      const ics = generateIcs([BASE_EVENT]);
      expect(ics).toContain("BEGIN:VEVENT");
      expect(ics).toContain("END:VEVENT");
    });

    it("UID が event.id@mycalender 形式で含まれる", () => {
      const ics = generateIcs([BASE_EVENT]);
      expect(ics).toContain("UID:test-uuid-1234@mycalender");
    });

    it("DTSTART が終日（VALUE=DATE）形式で含まれる", () => {
      const ics = generateIcs([BASE_EVENT]);
      expect(ics).toContain("DTSTART;VALUE=DATE:20260315");
    });

    it("DTEND が翌日の終日形式で含まれる", () => {
      const ics = generateIcs([BASE_EVENT]);
      expect(ics).toContain("DTEND;VALUE=DATE:20260316");
    });

    it("SUMMARY にタイトルが含まれる", () => {
      const ics = generateIcs([BASE_EVENT]);
      expect(ics).toContain("SUMMARY:テスト会議");
    });

    it("メモがある場合は DESCRIPTION に含まれる", () => {
      const ics = generateIcs([BASE_EVENT]);
      expect(ics).toContain("DESCRIPTION:メモ内容");
    });

    it("DTSTAMP が YYYYMMDDTHHmmssZ 形式で含まれる", () => {
      const ics = generateIcs([BASE_EVENT]);
      expect(ics).toMatch(/DTSTAMP:\d{8}T\d{6}Z/);
    });
  });

  // ─── メモが空の場合 ───────────────────────────────────────────

  describe("メモが空のイベント", () => {
    it("memo が空文字のとき DESCRIPTION 行を出力しない", () => {
      const event: CalendarEvent = { ...BASE_EVENT, memo: "" };
      const ics = generateIcs([event]);
      expect(ics).not.toContain("DESCRIPTION:");
    });
  });

  // ─── 複数イベント ────────────────────────────────────────────

  describe("複数イベントの生成", () => {
    it("イベント数分の VEVENT ブロックを生成する", () => {
      const events: CalendarEvent[] = [
        { id: "id-1", date: "2026-04-01", title: "入社式", memo: "" },
        { id: "id-2", date: "2026-04-05", title: "研修", memo: "終日" },
        { id: "id-3", date: "2026-04-10", title: "健康診断", memo: "" },
      ];
      const ics = generateIcs(events);
      const beginCount = (ics.match(/BEGIN:VEVENT/g) ?? []).length;
      const endCount = (ics.match(/END:VEVENT/g) ?? []).length;
      expect(beginCount).toBe(3);
      expect(endCount).toBe(3);
    });

    it("各イベントのタイトルがすべて SUMMARY に含まれる", () => {
      const events: CalendarEvent[] = [
        { id: "id-1", date: "2026-04-01", title: "入社式", memo: "" },
        { id: "id-2", date: "2026-04-05", title: "研修", memo: "" },
      ];
      const ics = generateIcs(events);
      expect(ics).toContain("SUMMARY:入社式");
      expect(ics).toContain("SUMMARY:研修");
    });

    it("イベントが0件のときも VCALENDAR 構造は出力する", () => {
      const ics = generateIcs([]);
      expect(ics).toContain("BEGIN:VCALENDAR");
      expect(ics).toContain("END:VCALENDAR");
      expect(ics).not.toContain("BEGIN:VEVENT");
    });
  });

  // ─── ICS エスケープ処理 ───────────────────────────────────────

  describe("ICS テキストエスケープ（RFC 5545 準拠）", () => {
    it("タイトル内のカンマをエスケープする（\\,）", () => {
      const event: CalendarEvent = {
        ...BASE_EVENT,
        title: "会議,ランチ",
        memo: "",
      };
      const ics = generateIcs([event]);
      expect(ics).toContain("SUMMARY:会議\\,ランチ");
    });

    it("タイトル内のセミコロンをエスケープする（\\;）", () => {
      const event: CalendarEvent = {
        ...BASE_EVENT,
        title: "会議;打ち合わせ",
        memo: "",
      };
      const ics = generateIcs([event]);
      expect(ics).toContain("SUMMARY:会議\\;打ち合わせ");
    });

    it("タイトル内のバックスラッシュをエスケープする（\\\\）", () => {
      const event: CalendarEvent = {
        ...BASE_EVENT,
        title: "パス\\フォルダ",
        memo: "",
      };
      const ics = generateIcs([event]);
      expect(ics).toContain("SUMMARY:パス\\\\フォルダ");
    });

    it("メモ内の改行を \\n にエスケープする", () => {
      const event: CalendarEvent = {
        ...BASE_EVENT,
        title: "会議",
        memo: "14:00〜\n会議室A",
      };
      const ics = generateIcs([event]);
      expect(ics).toContain("DESCRIPTION:14:00〜\\n会議室A");
    });
  });

  // ─── 月末日の DTEND 計算 ─────────────────────────────────────

  describe("月末日の DTEND 計算", () => {
    it("月末日のイベントの DTEND が翌月1日になる", () => {
      const event: CalendarEvent = {
        ...BASE_EVENT,
        date: "2026-03-31",
      };
      const ics = generateIcs([event]);
      expect(ics).toContain("DTSTART;VALUE=DATE:20260331");
      expect(ics).toContain("DTEND;VALUE=DATE:20260401");
    });

    it("うるう年の2月28日のイベントの DTEND が2月29日になる", () => {
      const event: CalendarEvent = {
        ...BASE_EVENT,
        date: "2028-02-28", // 2028年はうるう年
      };
      const ics = generateIcs([event]);
      expect(ics).toContain("DTSTART;VALUE=DATE:20280228");
      expect(ics).toContain("DTEND;VALUE=DATE:20280229");
    });
  });
});
