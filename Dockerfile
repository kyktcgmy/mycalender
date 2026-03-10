# ─── ステージ1: 依存パッケージのインストール ───────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# package*.json のみ先にコピーしてキャッシュを活用する
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ─── ステージ2: ビルド ──────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# 依存パッケージをコピー（devDependencies を含む全パッケージが必要）
COPY package.json package-lock.json ./
RUN npm ci

# ソースをコピーしてビルド
COPY . .

# ビルド時に必要な環境変数（シークレットはビルド時には不要 → ランタイムで注入）
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ─── ステージ3: 本番実行 ────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# セキュリティのため非 root ユーザーで実行する
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# standalone バンドルと静的ファイルをコピー
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

# Cloud Run は PORT 環境変数でポートを指定する
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
EXPOSE 3000

# standalone の最小サーバーを起動する
CMD ["node", "server.js"]
