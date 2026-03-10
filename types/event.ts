export type CalendarEvent = {
  id: string;     // UUID（フロントエンド管理用）
  date: string;   // "YYYY-MM-DD" 形式
  title: string;  // イベントタイトル
  memo: string;   // メモ（空文字も可）
};
