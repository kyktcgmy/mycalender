import { NextRequest, NextResponse } from "next/server";
import { generateIcs } from "@/lib/generateIcs";
import { CalendarEvent } from "@/types/event";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "リクエストの解析に失敗しました。JSON 形式で送信してください。" },
      { status: 400 }
    );
  }

  if (
    !body ||
    typeof body !== "object" ||
    !("events" in body) ||
    !Array.isArray((body as { events: unknown }).events)
  ) {
    return NextResponse.json(
      { error: "不正なリクエスト形式です。{ events: CalendarEvent[] } の形式で送信してください。" },
      { status: 400 }
    );
  }

  const events = (body as { events: unknown[] }).events;

  // 各イベントの必須フィールドを検証
  for (const event of events) {
    if (
      !event ||
      typeof event !== "object" ||
      typeof (event as Record<string, unknown>).id !== "string" ||
      typeof (event as Record<string, unknown>).date !== "string" ||
      typeof (event as Record<string, unknown>).title !== "string" ||
      typeof (event as Record<string, unknown>).memo !== "string"
    ) {
      return NextResponse.json(
        { error: "イベントデータの形式が不正です。各イベントに id・date・title・memo フィールドが必要です。" },
        { status: 400 }
      );
    }

    // date フィールドが "YYYY-MM-DD" 形式かを確認
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test((event as Record<string, unknown>).date as string)) {
      return NextResponse.json(
        { error: `日付の形式が不正です: "${(event as Record<string, unknown>).date}"。"YYYY-MM-DD" 形式で指定してください。` },
        { status: 400 }
      );
    }
  }

  try {
    const icsContent = generateIcs(events as CalendarEvent[]);
    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'attachment; filename="calendar.ics"',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "不明なエラーが発生しました。";
    return NextResponse.json(
      { error: `.ics ファイルの生成に失敗しました: ${message}` },
      { status: 500 }
    );
  }
}
