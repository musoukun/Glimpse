# Glimpse

Glimpse は AI チャット機能を搭載した Electron デスクトップアプリケーションです。

## 主な機能

- **AI チャット**: Vertex AI API (Gemini) を使用した AI 応答生成
- **Google 検索 (Grounding)**: AI 応答にリアルタイムの検索結果を統合
- **画像添付**: 画像ファイルを添付して AI に質問可能
- **カスタマイズ可能な設定**: 応答文字数、言語、カスタムプロンプトの設定
- **ウィンドウサイズ調整**: 3段階のサイズ切り替え (small/medium/large)
- **透明度調整**: ウィンドウの透明度をカスタマイズ可能

## セットアップ方法

### 1. 依存関係のインストール
```bash
npm install
```

### 2. Google AI API キーの設定
1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) でAPIキーを取得
2. プロジェクトルートに `.env` ファイルを作成
3. 以下の内容を追加:
```
VITE_GOOGLE_AI_API_KEY=your_google_ai_api_key_here
```

### 3. アプリケーションの起動
```bash
npm run dev
```

## 機能の概要

### AI チャット機能
- **モデル**: Gemini 2.0 Flash Lite を使用
- **Grounding**: Google 検索結果を統合したリアルタイム情報取得
- **画像解析**: 添付された画像の内容を解析・説明
- **カスタムプロンプト**: ユーザー独自の指示をシステムプロンプトに追加可能

### ユーザーインターフェース
- **フレームレスウィンドウ**: モダンなデザインのカスタムウィンドウ
- **動的入力欄**: テキスト量に応じて自動サイズ調整
- **添付ファイル表示**: ドラッグ&ドロップでファイル添付
- **設定モーダル**: リアルタイムで設定変更が反映

## ライセンス

MIT License
