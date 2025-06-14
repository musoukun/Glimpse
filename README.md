# Glimpse

AI搭載のデスクトップチャットアプリケーション

## アーキテクチャ

```
Electron App (Firebase Auth) → Supabase Edge Functions → Vertex AI API
                ↓
        Supabase Auth で認証
                ↓  
        Supabase Database で使用量記録
                ↓
        Stripe で課金管理
```

## 主な機能

- AI チャット機能（Vertex AI 統合）
- 画像添付・解析機能
- ウィンドウサイズ調整（小・中・大）
- 透明度調整
- 設定のカスタマイズ（文字数制限、ユーザープロンプト）
- Google検索統合（Grounding機能）
- 使用量制限・課金管理

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Supabase の設定

#### プロジェクト作成
1. [Supabase](https://supabase.com/) でプロジェクトを作成
2. データベースマイグレーションを実行：
```bash
supabase db push
```

#### Edge Functions のデプロイ
```bash
supabase functions deploy vertex-ai-chat
```

#### 環境変数の設定
Supabase Edge Functions に以下の環境変数を設定：

```bash
# Google Cloud設定
supabase secrets set GOOGLE_CLOUD_PROJECT_ID=your-project-id
supabase secrets set GOOGLE_APPLICATION_CREDENTIALS='{"type":"service_account",...}'

# Supabase設定
supabase secrets set SUPABASE_URL=your-supabase-url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Vertex AI の設定

#### サービスアカウントの作成
1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクトを選択または作成
3. 「IAM と管理」→「サービスアカウント」に移動
4. 「サービスアカウントを作成」をクリック
5. サービスアカウント名を入力（例：`glimpse-vertex-ai`）
6. 以下のロールを付与：
   - `Vertex AI User`
   - `AI Platform Developer`
7. 「キーを作成」→「JSON」を選択してダウンロード

#### APIの有効化
```bash
gcloud services enable aiplatform.googleapis.com
```

### 4. Firebase の設定

#### プロジェクト作成
1. [Firebase Console](https://console.firebase.google.com/) でプロジェクトを作成
2. Authentication を有効化
3. Web アプリを追加してconfig情報を取得

#### 設定ファイル
`src/renderer/src/config/firebase.ts` にFirebase設定を追加

### 5. Stripe の設定（オプション）

課金機能を使用する場合：
1. [Stripe Dashboard](https://dashboard.stripe.com/) でアカウント作成
2. Webhook エンドポイントを設定
3. 商品・価格を作成

### 6. アプリケーションの起動

```bash
npm run dev
```

## 機能概要

### AI チャット
- **モデル**: Vertex AI (Gemini 2.0 Flash Lite) を使用
- **認証**: Firebase Authentication
- **使用量管理**: Supabase Database で月間使用量を記録
- **制限**: デフォルト月間1000リクエスト

### セキュリティ
- **認証**: Firebase Auth + Supabase Auth の統合
- **API保護**: Supabase Edge Functions でサーバーサイド処理
- **データ保護**: Row Level Security (RLS) でユーザーデータを保護

### 課金管理
- **Stripe統合**: サブスクリプション管理
- **使用量制限**: プランに応じた制限設定
- **自動更新**: 月次使用量の自動リセット

## デプロイ

### Edge Functions
```bash
supabase functions deploy vertex-ai-chat --project-ref your-project-ref
```

### Electron App
```bash
npm run build
npm run dist
```

## ライセンス

MIT License