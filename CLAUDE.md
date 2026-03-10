# CLAUDE.md

このファイルは、Claude Code がこのリポジトリで作業する際のガイダンスを提供します。

---

## プロジェクト概要

カレンダー画像（手書きカレンダー・Google カレンダーのスクリーンショット）をアップロードし、
Google Cloud Vision API で OCR 処理を行い、スケジュールデータを抽出して `.ics` ファイルとして出力する Web アプリケーション。

ユーザーは出力された `.ics` ファイルを Google カレンダーに手動インポートして利用する。

---

## 技術スタック

| 項目 | 技術 |
|------|------|
| フレームワーク | Next.js (App Router) |
| 言語 | TypeScript |
| OCR | Google Cloud Vision API |
| UIフレームワーク | Material UI (MUI v6) |
| デプロイ | Google Cloud (Cloud Run または App Engine) |
| パッケージマネージャー | npm |

---

## アーキテクチャ

```
mycalender/
├── app/
│   ├── page.tsx                  # 画像アップロード画面（画面1）
│   ├── confirm/
│   │   └── page.tsx              # 確認・編集画面（画面2）
│   ├── api/
│   │   ├── ocr/
│   │   │   └── route.ts          # Google Cloud Vision API 呼び出し
│   │   └── export/
│   │       └── route.ts          # .ics ファイル生成・ダウンロード
│   └── layout.tsx
├── components/
│   ├── ImageUploader.tsx         # 画像選択・プレビューコンポーネント
│   ├── EventEditor.tsx           # イベント編集フォームコンポーネント
│   └── EventList.tsx             # 抽出イベント一覧コンポーネント
├── lib/
│   ├── visionApi.ts              # Google Cloud Vision API クライアント
│   ├── parseCalendar.ts          # OCR テキスト → スケジュールデータ変換
│   └── generateIcs.ts            # スケジュールデータ → .ics 変換
├── types/
│   └── event.ts                  # イベント型定義
├── public/
├── .env.local                    # 環境変数（API キーなど）
└── CLAUDE.md
```

---

## 画面仕様

### 画面1：画像アップロード画面（`/`）

**目的：** カレンダー画像をアップロードし、OCR 処理を開始する

**機能：**
- 以下の2つの方法で画像を取得可能：
  - **ファイル選択**：端末のファイルシステムから選択（PC・スマホ共通）
  - **カメラ撮影**：スマホカメラを起動して直接撮影（モバイル専用ボタンとして表示）
- 対応フォーマット：JPEG、PNG、PDF
- アップロード後にプレビュー表示
- 「OCR 処理開始」ボタンで解析を実行
- 処理中はローディング表示（MUI CircularProgress）
- 処理完了後、確認画面へ自動遷移

**カメラ撮影の実装：**
```html
<!-- モバイルでカメラを直接起動 -->
<input type="file" accept="image/*" capture="environment" />
```
- `capture="environment"` で背面カメラを起動
- モバイル端末でのみ表示する（User-Agent またはメディアクエリで判定）

**バリデーション：**
- ファイルサイズ上限：10MB
- 対応外フォーマットはエラーメッセージを表示（MUI Snackbar）
- ファイル未選択での送信を防止

---

### 画面2：確認・編集画面（`/confirm`）

**目的：** OCR で抽出したイベントデータを確認・修正し、.ics ファイルを出力する

**機能：**
- 抽出されたイベントを一覧表示
- 各イベントの以下の項目を編集可能：
  - 日付（年・月・日）
  - タイトル
  - メモ（任意）
- イベントの追加・削除が可能
- 「.ics ファイルをダウンロード」ボタンで出力
- 「戻る」ボタンで画像アップロード画面に戻る

---

## データ型定義

```typescript
// types/event.ts

export type CalendarEvent = {
  id: string;          // UUID（フロントエンド管理用）
  date: string;        // "YYYY-MM-DD" 形式
  title: string;       // イベントタイトル
  memo: string;        // メモ（空文字も可）
};
```

---

## API 仕様

### POST `/api/ocr`

**リクエスト：**
- `Content-Type: multipart/form-data`
- Body: `file`（画像ファイル）

**レスポンス：**
```json
{
  "events": [
    {
      "id": "uuid",
      "date": "2026-03-15",
      "title": "会議",
      "memo": "14:00〜"
    }
  ]
}
```

**処理内容：**
1. 画像を受け取り Google Cloud Vision API へ送信
2. OCR テキストを取得
3. `parseCalendar.ts` でテキストを解析してイベントデータに変換
4. イベント配列をレスポンスとして返す

---

### POST `/api/export`

**リクエスト：**
```json
{
  "events": [CalendarEvent]
}
```

**レスポンス：**
- `Content-Type: text/calendar`
- `.ics` ファイルをダウンロード

---

## 環境変数

```bash
# .env.local

GOOGLE_CLOUD_VISION_API_KEY=your_api_key_here
```

---

## Google Cloud Vision API 利用方針

- 月 1,000 リクエストまで無料枠を使用
- API キーは環境変数で管理し、コードに直接記述しない
- サーバーサイド（API Route）からのみ呼び出す（クライアントに API キーを露出しない）
- テキスト検出機能（`TEXT_DETECTION`）を使用

---

## .ics ファイル仕様

- RFC 5545 準拠の iCalendar 形式
- 文字コード：UTF-8
- 終日イベントとして出力（時間は含まない）
- `DTSTART;VALUE=DATE` 形式で日付を指定
- `SUMMARY`：タイトル
- `DESCRIPTION`：メモ

---

## OCR テキスト解析方針（`parseCalendar.ts`）

- 日付パターンの認識：
  - `YYYY年MM月DD日`
  - `MM/DD`
  - `MM月DD日`
  - 数字のみ（カレンダーグリッドの位置から推定）
- 年が不明な場合は現在の年を使用
- 解析できなかったテキストはメモに格納して、ユーザーが手動修正できるようにする
- Claude API による補助解析も将来的に検討可能

---

## デプロイ（Google Cloud）

- **サービス：** Cloud Run（コンテナベース）
- **コンテナ：** Dockerfile を使用
- **環境変数：** Cloud Run のシークレットマネージャーで管理

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

---

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番起動
npm start

# 型チェック
npm run type-check

# Lint
npm run lint
```

---

## テストコード作成時の厳守事項

### テストコードの「品質」
- テストは必ず実際の機能を検証すること
- `expect(true).toBe(true)` のような意味のないアサーションは絶対に書かない
- 各テストケースは具体的な入力と期待する出力を検証すること
- モックは必要最小限にとどめ、実際の動作に近い形でテストすること

### ハードコーディングの禁止
- テストを通すためだけのハードコードは絶対に禁止
- 本番コードに `if(testMode)` のような条件分岐を入れない
- テスト用の特別な値（マジックナンバー）を本番コードに埋め込まない

### テスト駆動の原則
- テストが失敗する状態から始めること（Red-Green-Refactor）
- 境界値、異常系、エラーケースを必ずテストすること
- カバレッジよりも、実際の品質を重視すること

---

## Material UI (MUI) 利用方針

- テーマはGoogle Calendarに近いカラーパレットを使用
  - Primary: `#1a73e8`（Google Blue）
  - Secondary: `#ea4335`（Google Red）
- モバイルファーストで設計（ブレークポイント：xs/sm/md）
- 主に使用するコンポーネント：
  - `Button`、`IconButton`：操作ボタン
  - `Card`：イベントカード
  - `TextField`：編集フォーム
  - `CircularProgress`：ローディング
  - `Snackbar` / `Alert`：エラー・成功メッセージ
  - `AppBar`：ヘッダー
  - `BottomNavigation`：モバイル向けナビゲーション

---

## モバイル対応方針

- MUI の `useMediaQuery` でモバイル／デスクトップを判定
- カメラ撮影ボタンはモバイルのみ表示
- タップしやすいボタンサイズ（最小 44×44px）を確保
- スワイプ操作は不要（シンプルな縦スクロール構成）

---

## 注意事項

- Google Cloud Vision API のキーをコードにハードコードしない
- PDF は Vision API に送る前にページ単位で処理する
- OCR の精度は画像品質に依存するため、確認画面での修正を必須フローとして設計する
- 日本語のみ対応（OCR の言語ヒント：`ja`）
