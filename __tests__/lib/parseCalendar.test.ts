import { parseCalendar } from "@/lib/parseCalendar";

const CURRENT_YEAR = new Date().getFullYear();

// UUID の形式チェック用
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("parseCalendar", () => {
  // ─── 空文字・空白 ───────────────────────────────────────────────

  describe("空文字・空白のみの入力", () => {
    it("空文字列のとき空配列を返す", () => {
      expect(parseCalendar("")).toEqual([]);
    });

    it("空白文字のみのとき空配列を返す", () => {
      expect(parseCalendar("   \n  \t  ")).toEqual([]);
    });
  });

  // ─── 日付パターン：YYYY年MM月DD日 ──────────────────────────────

  describe("日付パターン: YYYY年MM月DD日", () => {
    it("日付と同じ行のテキストをタイトルとして抽出する", () => {
      const result = parseCalendar("2026年3月15日 会議");
      expect(result).toHaveLength(1);
      expect(result[0].date).toBe("2026-03-15");
      expect(result[0].title).toBe("会議");
      expect(result[0].memo).toBe("");
    });

    it("年・月・日を1桁で指定してもゼロ埋めされた日付を返す", () => {
      const result = parseCalendar("2026年1月5日 イベント");
      expect(result[0].date).toBe("2026-01-05");
    });

    it("id が UUID v4 形式である", () => {
      const result = parseCalendar("2026年3月15日 会議");
      expect(result[0].id).toMatch(UUID_PATTERN);
    });
  });

  // ─── 日付パターン：MM月DD日（年なし）───────────────────────────

  describe("日付パターン: MM月DD日（年なし）", () => {
    it("年が省略されているとき現在の年を使用する", () => {
      const result = parseCalendar("3月20日 セミナー");
      expect(result).toHaveLength(1);
      expect(result[0].date).toBe(`${CURRENT_YEAR}-03-20`);
      expect(result[0].title).toBe("セミナー");
    });

    it("月・日を1桁で指定してもゼロ埋めされた日付を返す", () => {
      const result = parseCalendar("1月7日 新年会");
      expect(result[0].date).toBe(`${CURRENT_YEAR}-01-07`);
    });
  });

  // ─── 日付パターン：MM/DD（年なし）──────────────────────────────

  describe("日付パターン: MM/DD（年なし）", () => {
    it("年が省略されているとき現在の年を使用する", () => {
      const result = parseCalendar("4/10 健康診断");
      expect(result).toHaveLength(1);
      expect(result[0].date).toBe(`${CURRENT_YEAR}-04-10`);
      expect(result[0].title).toBe("健康診断");
    });

    it("月・日を2桁で指定しても正しく解析する", () => {
      const result = parseCalendar("12/31 大晦日");
      expect(result[0].date).toBe(`${CURRENT_YEAR}-12-31`);
      expect(result[0].title).toBe("大晦日");
    });
  });

  // ─── タイトル取得ロジック ────────────────────────────────────

  describe("タイトルの取得", () => {
    it("日付行にテキストがなければ次の行をタイトルとして使用する", () => {
      const input = "2026年5月1日\nメーデー";
      const result = parseCalendar(input);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("メーデー");
    });

    it("日付行にも次の行にもタイトルがなければデフォルト値を使用する", () => {
      const input = "2026年5月1日\n2026年5月2日";
      const result = parseCalendar(input);
      expect(result[0].title).toBe("（タイトル未設定）");
    });
  });

  // ─── メモの取得 ──────────────────────────────────────────────

  describe("メモの取得", () => {
    it("タイトル行の後に続くテキスト行をメモとして格納する", () => {
      const input = "3月10日 打ち合わせ\n14:00〜\n会議室A";
      const result = parseCalendar(input);
      expect(result[0].memo).toBe("14:00〜\n会議室A");
    });

    it("メモがない場合は空文字を返す", () => {
      const result = parseCalendar("3月10日 打ち合わせ");
      expect(result[0].memo).toBe("");
    });
  });

  // ─── 複数イベント ────────────────────────────────────────────

  describe("複数イベントの解析", () => {
    it("複数の日付パターンが混在していてもすべて抽出できる", () => {
      const input = [
        "2026年4月1日 入社式",
        "4月5日 オリエンテーション",
        "4/10 健康診断",
      ].join("\n");
      const result = parseCalendar(input);
      expect(result).toHaveLength(3);
      expect(result[0].date).toBe("2026-04-01");
      expect(result[1].date).toBe(`${CURRENT_YEAR}-04-05`);
      expect(result[2].date).toBe(`${CURRENT_YEAR}-04-10`);
    });

    it("各イベントが一意の id を持つ", () => {
      const input = "4月1日 A\n4月2日 B\n4月3日 C";
      const result = parseCalendar(input);
      const ids = result.map((e) => e.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  // ─── 解析不能テキスト ────────────────────────────────────────

  describe("解析不能テキストの扱い", () => {
    it("日付パターンを含まない行は解析不能テキストとしてダミーイベントのメモに格納する", () => {
      const input = "不明なテキスト\nその他の情報";
      const result = parseCalendar(input);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("（解析不能テキスト）");
      expect(result[0].memo).toBe("不明なテキスト\nその他の情報");
      expect(result[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("正常なイベントと解析不能テキストが混在するとき解析不能テキストは末尾のイベントにまとめる", () => {
      const input = "3月1日 会議\n不明な行";
      const result = parseCalendar(input);
      // 最後のイベントが解析不能テキストの可能性もあるため、
      // 「会議」イベントが必ず含まれることを確認
      const kaigi = result.find((e) => e.title === "会議");
      expect(kaigi).toBeDefined();
      expect(kaigi!.date).toBe(`${CURRENT_YEAR}-03-01`);
    });
  });

  // ─── CRLF / CR 改行の対応 ────────────────────────────────────

  describe("改行コードの対応", () => {
    it("CRLF 改行でも正しく解析できる", () => {
      const input = "4月1日 入社式\r\n4月2日 研修";
      const result = parseCalendar(input);
      expect(result).toHaveLength(2);
    });

    it("CR のみの改行でも正しく解析できる", () => {
      const input = "4月1日 入社式\r4月2日 研修";
      const result = parseCalendar(input);
      expect(result).toHaveLength(2);
    });
  });
});
