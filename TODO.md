# 実装 TODO リスト

## フェーズ 1：プロジェクトセットアップ

- [x] **1-1** Next.js プロジェクト作成
  ```bash
  npx create-next-app@latest mycalender --typescript --app --eslint
  ```
- [x] **1-2** 依存パッケージのインストール
  ```bash
  npm install @mui/material @mui/icons-material @emotion/react @emotion/styled
  npm install uuid
  npm install @types/uuid --save-dev
  ```
- [x] **1-3** `.env.local` ファイルを作成し、`GOOGLE_CLOUD_VISION_API_KEY` を設定
- [x] **1-4** `.gitignore` に `.env.local` が含まれていることを確認
- [x] **1-5** ディレクトリ構造を作成（`components/`、`lib/`、`types/`）

---

## フェーズ 2：型定義・共通モジュール

- [x] **2-1** `types/event.ts` に `CalendarEvent` 型を定義
- [x] **2-2** `lib/generateIcs.ts` を実装
  - `CalendarEvent[]` を受け取り `.ics` 文字列を返す関数
  - RFC 5545 準拠・終日イベント形式
  - `SUMMARY`（タイトル）・`DESCRIPTION`（メモ）を含める
- [x] **2-3** `lib/parseCalendar.ts` を実装
  - OCR テキストから日付・タイトル・メモを抽出する関数
  - 対応する日付パターン：`YYYY年MM月DD日`、`MM月DD日`、`MM/DD`
  - 年が不明な場合は現在の年を使用
  - 解析できないテキストはメモに格納
- [x] **2-4** `lib/visionApi.ts` を実装
  - Google Cloud Vision API を呼び出す関数
  - `TEXT_DETECTION` を使用・言語ヒント `ja` を指定
  - PDF・JPEG・PNG に対応

---

## フェーズ 3：API Route 実装

- [x] **3-1** `app/api/ocr/route.ts` を実装
  - `multipart/form-data` で画像ファイルを受け取る
  - `visionApi.ts` でOCR処理
  - `parseCalendar.ts` でイベントデータへ変換
  - `CalendarEvent[]` を JSON で返す
  - エラーハンドリング（API エラー・不正ファイル）
- [x] **3-2** `app/api/export/route.ts` を実装
  - `CalendarEvent[]` を受け取る
  - `generateIcs.ts` で `.ics` ファイルを生成
  - `Content-Type: text/calendar` でレスポンスを返す

---

## フェーズ 4：MUI テーマ設定

- [x] **4-1** `app/layout.tsx` に MUI の `ThemeProvider` を設定
- [x] **4-2** Google カレンダーカラーのカスタムテーマを作成
  - Primary: `#1a73e8`（Google Blue）
  - Secondary: `#ea4335`（Google Red）
- [x] **4-3** モバイルファーストの viewport 設定を `layout.tsx` に追加

---

## フェーズ 5：コンポーネント実装

- [x] **5-1** `components/ImageUploader.tsx` を実装
  - ファイル選択ボタン（PC・スマホ共通）
  - カメラ撮影ボタン（`capture="environment"`、モバイルのみ表示）
  - 画像プレビュー表示
  - ファイルサイズ・フォーマットのバリデーション（エラーは MUI Snackbar で表示）
  - `useMediaQuery` でモバイル判定
- [x] **5-2** `components/EventEditor.tsx` を実装
  - 1件のイベントを編集するフォーム（MUI TextField）
  - 日付・タイトル・メモの入力欄
  - 削除ボタン（MUI IconButton）
- [x] **5-3** `components/EventList.tsx` を実装
  - `EventEditor` を一覧で並べる
  - 「イベントを追加」ボタン
  - イベントが0件の場合の空状態表示

---

## フェーズ 6：画面実装

- [x] **6-1** `app/page.tsx`（画像アップロード画面）を実装
  - MUI `AppBar` でヘッダー表示
  - `ImageUploader` コンポーネントを配置
  - 「OCR 処理開始」ボタン（MUI Button）
  - 処理中は MUI `CircularProgress` を表示
  - OCR 完了後、イベントデータを `sessionStorage` に保存して `/confirm` へ遷移
- [x] **6-2** `app/confirm/page.tsx`（確認・編集画面）を実装
  - `sessionStorage` からイベントデータを読み込む
  - `EventList` コンポーネントを配置
  - 「.ics ファイルをダウンロード」ボタン
  - 「戻る」ボタンで `/` へ遷移
  - ダウンロード完了後に MUI Snackbar で完了メッセージを表示

---

## フェーズ 7：テスト

- [x] **7-1** `lib/parseCalendar.ts` のユニットテスト
  - 各日付パターンの正常系テスト
  - 年が不明な場合のテスト
  - 解析不能テキストの扱いのテスト
  - 異常系・空文字テスト
- [x] **7-2** `lib/generateIcs.ts` のユニットテスト
  - 正常なイベントデータからの .ics 生成テスト
  - メモが空の場合のテスト
  - 複数イベントのテスト
- [x] **7-3** `app/api/ocr/route.ts` の統合テスト
  - 正常なファイルアップロードのテスト
  - 不正ファイルのエラーレスポンステスト
- [ ] **7-4** 実機（スマホ）でのカメラ撮影・アップロード動作確認

---

## フェーズ 8：デプロイ準備

- [x] **8-1** `Dockerfile` を作成
  ```dockerfile
  FROM node:20-alpine
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci
  COPY . .
  RUN npm run build
  EXPOSE 3000
  CMD ["npm", "start"]
  ```
- [x] **8-2** `.dockerignore` を作成（`node_modules`、`.env.local` を除外）
- [ ] **8-3** Google Cloud プロジェクトのセットアップ
  - Cloud Run API を有効化
  - Vision API を有効化
  - Secret Manager に `GOOGLE_CLOUD_VISION_API_KEY` を登録
- [ ] **8-4** Cloud Run へのデプロイ
  ```bash
  gcloud run deploy mycalender \
    --source . \
    --region asia-northeast1 \
    --allow-unauthenticated
  ```
- [ ] **8-5** デプロイ後の動作確認（実機）

---

## 優先順位まとめ

| フェーズ | 内容 | 優先度 |
|---------|------|--------|
| 1・2 | セットアップ・共通モジュール | 最高 |
| 3 | API Route | 高 |
| 4・5・6 | UI実装 | 高 |
| 7 | テスト | 中 |
| 8 | デプロイ | 最後 |
