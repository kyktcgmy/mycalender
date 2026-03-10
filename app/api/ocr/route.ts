import { NextRequest, NextResponse } from "next/server";
import { extractTextFromImage } from "@/lib/visionApi";
import { parseCalendar } from "@/lib/parseCalendar";
import { parseCalendarWithAI } from "@/lib/parseCalendarWithAI";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"];

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "リクエストの解析に失敗しました。multipart/form-data 形式で送信してください。" },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "ファイルが見つかりません。フィールド名 'file' でファイルを送信してください。" },
      { status: 400 }
    );
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `対応していないファイル形式です: ${file.type}。JPEG・PNG・PDF を使用してください。` },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `ファイルサイズが上限（10MB）を超えています: ${(file.size / 1024 / 1024).toFixed(1)}MB` },
      { status: 400 }
    );
  }

  try {
    const buffer = await file.arrayBuffer();
    const ocrText = await extractTextFromImage(buffer, file.type);
    const currentYear = new Date().getFullYear();

    // AI 解析を優先し、失敗またはイベント未抽出の場合はルールベースにフォールバック
    let events;
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        events = await parseCalendarWithAI(ocrText, currentYear);
        if (events.length === 0) {
          events = parseCalendar(ocrText);
        }
      } catch {
        events = parseCalendar(ocrText);
      }
    } else {
      events = parseCalendar(ocrText);
    }

    return NextResponse.json({ events });
  } catch (error) {
    const message = error instanceof Error ? error.message : "不明なエラーが発生しました。";
    return NextResponse.json(
      { error: `OCR 処理に失敗しました: ${message}` },
      { status: 500 }
    );
  }
}
