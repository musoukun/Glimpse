# Glimpse

AI搭載のデスクトップチャットアプリケーション

## アーキテクチャ

```
Electron App (Desktop)
    ↓
Supabase Auth (認証)
    ↓
Supabase Edge Functions (API Gateway)
    ↓
Vertex AI API (Gemini 2.0 Flash)
    ↓
Supabase Database (使用量記録・ユーザー管理)
    ↓
Stripe (課金管理 - 実装予定)
```

## 主な機能

- **AIチャット機能**
  - Vertex AI (Gemini 2.0 Flash)による高速レスポンス
  - Google検索統合（Grounding機能）で最新情報を提供
  - Answer Mode: 数式問題の解答・翻訳機能

- **画像解析機能**
  - 画像の内容を認識・解説
  - スクリーンショット・画面キャプチャ対応
  - ドラッグ&ドロップまたはクリップボード貼り付け

- **使いやすいUI**
  - ウィンドウサイズ調整（小・中・大）
  - 透明度調整（0.1〜1.0）
  - ウィンドウ位置の記憶・復元
  - フレームレスデザイン

- **カスタマイズ機能**
  - 回答文字数制限設定（デフォルト: 230文字）
  - カスタムプロンプト設定
  - フォントサイズ調整（デフォルト: 12px）
  - 回答言語設定

- **使用量管理**
  - 月間50回まで無料
  - 使用量の可視化
  - 月額$4でプレミアムプラン（実装予定）

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

#### Google Cloud プロジェクトの準備
1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクトを選択または作成
3. Vertex AI APIを有効化：
   ```bash
   gcloud services enable aiplatform.googleapis.com
   ```

#### サービスアカウントの作成
1. 「IAM と管理」→「サービスアカウント」に移動
2. 「サービスアカウントを作成」をクリック
3. サービスアカウント名を入力（例：`glimpse-vertex-ai`）
4. 以下のロールを付与：
   - `Vertex AI User`
   - `AI Platform Developer`
5. 「キーを作成」→「JSON」を選択してダウンロード
6. ダウンロードしたJSONの内容をSupabase Edge Functionの環境変数に設定

### 4. 環境設定ファイルの作成

`src/renderer/src/config/supabase.ts`を作成：
```typescript
export const SUPABASE_URL = 'your-supabase-url'
export const SUPABASE_ANON_KEY = 'your-anon-key'
```

### 5. Stripe の設定（オプション）

課金機能を使用する場合：
1. [Stripe Dashboard](https://dashboard.stripe.com/) でアカウント作成
2. Webhook エンドポイントを設定
3. 商品・価格を作成

### 6. アプリケーションの起動

```bash
npm run dev
```

## 技術仕様

### AI機能
- **モデル**: Vertex AI (Gemini 2.0 Flash)
- **Grounding**: Google検索統合による最新情報の取得
- **プロンプト**: カスタマイズ可能なシステムプロンプト
- **Answer Mode**: 数式解答・翻訳特化モード

### 認証・セキュリティ
- **認証**: Supabase Authentication (OAuth2.0)
- **API保護**: Supabase Edge Functions でサーバーサイド処理
- **データ保護**: Row Level Security (RLS) でユーザーデータを保護
- **トークン管理**: セキュアなトークン保存と自動更新

### 使用量管理・課金
- **使用量追跡**: Supabase Database で月間使用量を記録
- **無料枠**: 月間50リクエスト
- **プレミアムプラン**: 月額$4で無制限（Stripe統合 - 実装予定）
- **自動リセット**: 月次使用量の自動リセット

### UI/UX
- **Electron**: クロスプラットフォーム対応
- **React + TypeScript**: 型安全なフロントエンド開発
- **フレームレス**: モダンなウィンドウデザイン
- **レスポンシブ**: 3段階のウィンドウサイズ

## デプロイ

### Edge Functions
```bash
supabase functions deploy call-vertex-ai --project-ref your-project-ref
```

### Electron App

#### Windows
```bash
npm run build
npm run package
```

#### macOS
```bash
npm run build
npm run package
```

#### Linux
```bash
npm run build
npm run package
```

配布用ファイルは`dist`ディレクトリに生成されます。

  実装内容：
  1. ✅
  electron-updaterパッケージをインストール
  2. ✅ メインプロセスに自動更新機能を追加（src     
  /main/updater.ts）
  3. ✅ 設定画面にアップデートセクションを追加      
  4. ✅ アップデート確認、ダウンロード、インス      
  トールボタン
  5. ✅ 進捗表示とエラーハンドリング
  6. ✅ GitHubリリースからの自動更新設定

  使い方：
  1. GitHubでリリースを作成し、ビルドしたインス     
  トーラーをアップロード
  2. package.jsonのpublish設定で実際のGitHubユ      
  ーザー名とリポジトリ名を設定
  3. アプリの設定画面でアップデートボタンをクリ     
  ックして更新を確認