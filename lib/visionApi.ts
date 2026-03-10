/**
 * Google Cloud Vision API を使用して画像からテキストを抽出する
 * TEXT_DETECTION 機能を使用し、日本語ヒントを指定する
 */

const VISION_API_ENDPOINT =
  "https://vision.googleapis.com/v1/images:annotate";

type VisionApiRequest = {
  requests: {
    image: { content: string };
    features: { type: string; maxResults?: number }[];
    imageContext?: { languageHints: string[] };
  }[];
};

type VisionApiResponse = {
  responses: {
    textAnnotations?: { description: string }[];
    error?: { message: string; code: number };
  }[];
};

/**
 * バイト列を Base64 文字列に変換する
 */
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * 対応する MIME タイプかどうかを検証する
 */
function validateMimeType(mimeType: string): void {
  const supported = ["image/jpeg", "image/png", "application/pdf"];
  if (!supported.includes(mimeType)) {
    throw new Error(
      `対応していないファイル形式です: ${mimeType}。JPEG・PNG・PDF を使用してください。`
    );
  }
}

/**
 * 画像ファイルを Google Cloud Vision API に送信し、OCR テキストを返す
 * @param fileBuffer - 画像ファイルの ArrayBuffer
 * @param mimeType  - ファイルの MIME タイプ（"image/jpeg" | "image/png" | "application/pdf"）
 * @returns OCR で抽出されたテキスト文字列
 */
export async function extractTextFromImage(
  fileBuffer: ArrayBuffer,
  mimeType: string
): Promise<string> {
  validateMimeType(mimeType);

  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GOOGLE_CLOUD_VISION_API_KEY が設定されていません。.env.local を確認してください。"
    );
  }

  const base64Content = bufferToBase64(fileBuffer);

  const requestBody: VisionApiRequest = {
    requests: [
      {
        image: { content: base64Content },
        features: [{ type: "TEXT_DETECTION", maxResults: 1 }],
        imageContext: { languageHints: ["ja"] },
      },
    ],
  };

  const response = await fetch(`${VISION_API_ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(
      `Vision API リクエストが失敗しました: ${response.status} ${response.statusText}`
    );
  }

  const data: VisionApiResponse = await response.json();
  const result = data.responses[0];

  if (result.error) {
    throw new Error(
      `Vision API エラー (${result.error.code}): ${result.error.message}`
    );
  }

  const text = result.textAnnotations?.[0]?.description ?? "";
  return text;
}
