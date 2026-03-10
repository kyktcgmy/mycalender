import { NextRequest } from "next/server";
import { POST } from "@/app/api/ocr/route";

// visionApi をモック（外部 API 呼び出しを行わない）
jest.mock("@/lib/visionApi", () => ({
  extractTextFromImage: jest.fn(),
}));

import { extractTextFromImage } from "@/lib/visionApi";
const mockExtractText = extractTextFromImage as jest.MockedFunction<
  typeof extractTextFromImage
>;

// テスト用 FormData リクエストを生成するヘルパー
function makeRequest(file: File): NextRequest {
  const formData = new FormData();
  formData.append("file", file);
  return new NextRequest("http://localhost/api/ocr", {
    method: "POST",
    body: formData,
  });
}

// 指定サイズのダミーバッファを持つ File を生成するヘルパー
function makeFile(
  name: string,
  type: string,
  sizeBytes: number = 100
): File {
  const buffer = new Uint8Array(sizeBytes);
  return new File([buffer], name, { type });
}

describe("POST /api/ocr", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── 正常系 ───────────────────────────────────────────────────

  describe("正常なファイルアップロード", () => {
    it("JPEG ファイルを受け取ると OCR を実行し events を JSON で返す", async () => {
      mockExtractText.mockResolvedValueOnce("3月15日 会議");

      const file = makeFile("photo.jpg", "image/jpeg");
      const req = makeRequest(file);
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toHaveProperty("events");
      expect(Array.isArray(body.events)).toBe(true);
      expect(body.events.length).toBeGreaterThan(0);
      expect(body.events[0].title).toBe("会議");
    });

    it("PNG ファイルを受け取ると正常に処理する", async () => {
      mockExtractText.mockResolvedValueOnce("4月1日 入社式");

      const file = makeFile("calendar.png", "image/png");
      const req = makeRequest(file);
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.events[0].title).toBe("入社式");
    });

    it("PDF ファイルを受け取ると正常に処理する", async () => {
      mockExtractText.mockResolvedValueOnce("5月10日 健康診断");

      const file = makeFile("doc.pdf", "application/pdf");
      const req = makeRequest(file);
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.events[0].title).toBe("健康診断");
    });

    it("OCR テキストが空のとき events は空配列を返す", async () => {
      mockExtractText.mockResolvedValueOnce("");

      const file = makeFile("blank.jpg", "image/jpeg");
      const req = makeRequest(file);
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.events).toEqual([]);
    });

    it("レスポンスの events 内の各要素が id・date・title・memo を持つ", async () => {
      mockExtractText.mockResolvedValueOnce("6月1日 定例会議");

      const file = makeFile("cal.jpg", "image/jpeg");
      const req = makeRequest(file);
      const res = await POST(req);
      const body = await res.json();
      const event = body.events[0];

      expect(event).toHaveProperty("id");
      expect(event).toHaveProperty("date");
      expect(event).toHaveProperty("title");
      expect(event).toHaveProperty("memo");
    });
  });

  // ─── バリデーションエラー（400） ─────────────────────────────

  describe("不正ファイルのエラーレスポンス", () => {
    it("ファイルが添付されていない場合は 400 を返す", async () => {
      const formData = new FormData();
      // file フィールドなし
      const req = new NextRequest("http://localhost/api/ocr", {
        method: "POST",
        body: formData,
      });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body).toHaveProperty("error");
    });

    it("対応していない MIME タイプは 400 を返す", async () => {
      const file = makeFile("image.gif", "image/gif");
      const req = makeRequest(file);
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toMatch(/対応していない/);
    });

    it("ファイルサイズが 10MB を超える場合は 400 を返す", async () => {
      const oversizeBytes = 10 * 1024 * 1024 + 1; // 10MB + 1byte
      const file = makeFile("big.jpg", "image/jpeg", oversizeBytes);
      const req = makeRequest(file);
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toMatch(/上限/);
    });
  });

  // ─── Vision API エラー（500） ─────────────────────────────────

  describe("Vision API エラー時のレスポンス", () => {
    it("extractTextFromImage が例外を投げると 500 を返す", async () => {
      mockExtractText.mockRejectedValueOnce(
        new Error("Vision API 呼び出しに失敗しました")
      );

      const file = makeFile("photo.jpg", "image/jpeg");
      const req = makeRequest(file);
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body).toHaveProperty("error");
      expect(body.error).toMatch(/OCR 処理に失敗しました/);
    });
  });
});
