import Anthropic from "@anthropic-ai/sdk";
import { v4 as uuidv4 } from "uuid";
import { CalendarEvent } from "@/types/event";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Claude API を使って OCR テキストからカレンダーイベントを抽出する。
 * グリッドレイアウトや文脈を理解して日付とイベントを紐付ける。
 */
export async function parseCalendarWithAI(
  ocrText: string,
  currentYear: number
): Promise<CalendarEvent[]> {
  const stream = client.messages.stream({
    model: "claude-opus-4-6",
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    tools: [
      {
        name: "extract_calendar_events",
        description:
          "カレンダーの OCR テキストから予定を抽出して構造化データとして返す",
        input_schema: {
          type: "object" as const,
          properties: {
            events: {
              type: "array",
              description: "抽出した予定の一覧",
              items: {
                type: "object",
                properties: {
                  date: {
                    type: "string",
                    description:
                      "予定の日付（YYYY-MM-DD 形式）。月・日のみの場合は currentYear を使用",
                  },
                  title: {
                    type: "string",
                    description:
                      "予定のタイトル（簡潔に。時刻はタイトルに含めない）",
                  },
                  memo: {
                    type: "string",
                    description:
                      "時刻・場所・補足情報など。なければ空文字列",
                  },
                },
                required: ["date", "title", "memo"],
                additionalProperties: false,
              },
            },
          },
          required: ["events"],
          additionalProperties: false,
        },
      },
    ],
    tool_choice: { type: "tool", name: "extract_calendar_events" },
    messages: [
      {
        role: "user",
        content: `以下は手書きカレンダーまたは Google カレンダーのスクリーンショットを OCR で読み取ったテキストです。テキストを解析して、含まれるすべての予定（イベント）を抽出してください。

【解析のポイント】
- カレンダーグリッドでは数字が日付を表します。数字の周辺や下のテキストがその日の予定です
- 「月・火・水・木・金・土・日」「Mon〜Sun」などの曜日ヘッダーを手がかりに列を判断してください
- 時刻（例: 10:00、14:00〜、AM/PM）はメモ欄に入れてください
- 年が不明な場合は ${currentYear} 年を使用してください
- 同じ日に複数の予定がある場合は、それぞれ別のイベントとして抽出してください
- 予定が読み取れない、またはテキストが存在しない場合は events を空配列にしてください

【OCR テキスト】
${ocrText}`,
      },
    ],
  });

  const response = await stream.finalMessage();

  const toolUseBlock = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );
  if (!toolUseBlock) return [];

  const input = toolUseBlock.input as {
    events: Array<{ date: string; title: string; memo: string }>;
  };

  return (input.events ?? []).map((event) => ({
    id: uuidv4(),
    date: event.date,
    title: event.title,
    memo: event.memo,
  }));
}
