# ─────────────────────────────────────────────
# mycalender Makefile
# ─────────────────────────────────────────────

# Google Cloud の設定（環境変数で上書き可能）
PROJECT_ID   ?= mycalender-489710
REGION       ?= asia-northeast1
SERVICE_NAME ?= mycalender
IMAGE        = gcr.io/$(PROJECT_ID)/$(SERVICE_NAME)

.PHONY: init dev build start lint test test-watch \
        docker-build docker-push deploy help

# ─── ローカル開発 ──────────────────────────

## 初回セットアップ（依存パッケージのインストール）
init:
	npm ci

## 開発サーバーを起動する（http://localhost:3000）
dev:
	npm run dev

## プロダクションビルドを実行する
build:
	npm run build

## プロダクションサーバーを起動する（要ビルド済み）
start:
	npm start

## ESLint を実行する
lint:
	npm run lint

## テストを実行する
test:
	npm test

## テストをウォッチモードで実行する
test-watch:
	npm run test:watch

# ─── Docker ───────────────────────────────

## Docker イメージをビルドする
docker-build:
	docker build -t $(IMAGE) .

## Docker イメージを Container Registry へプッシュする
docker-push: docker-build
	docker push $(IMAGE)

# ─── デプロイ（Google Cloud Run） ─────────

## Cloud Run へデプロイする
## 使い方: make deploy PROJECT_ID=your-project-id
deploy: docker-push
	gcloud run deploy $(SERVICE_NAME) \
		--image $(IMAGE) \
		--platform managed \
		--region $(REGION) \
		--allow-unauthenticated \
		--set-secrets GOOGLE_CLOUD_VISION_API_KEY=GOOGLE_CLOUD_VISION_API_KEY:latest,ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest \
		--project $(PROJECT_ID)

# ─── ヘルプ ───────────────────────────────

## 利用可能なコマンド一覧を表示する
help:
	@echo ""
	@echo "使い方: make <target> [PROJECT_ID=...] [REGION=...] [SERVICE_NAME=...]"
	@echo ""
	@grep -E '^##' Makefile | sed 's/^## /  /'
	@echo ""
