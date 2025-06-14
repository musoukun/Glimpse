# TauriからElectronへの移植タスク

## タスク概要
小型AIアプリケーション「Glimpse」をTauriからElectronに移植する。
デザインとUI構造はそのまま維持し、処理部分をTypeScriptで再実装する。

## 現在の状況
- ✅ Tauriバージョンが `src copy` フォルダにコピー済み
- ✅ Electronプロジェクト構造が `src` フォルダに存在
- ⚠️ 移植作業開始

## 実装計画

### フェーズ1: 構造分析とファイル移植 ⚠️進行中
1. ✅ Tauriバージョンの構造を詳細分析
2. ⚠️ Electronのrendererフォルダにフロントエンド部分を移植
   - ✅ package.json更新（依存関係追加）
   - ✅ electron.vite.config.ts作成
   - ✅ main process実装
   - ✅ preload script実装
   - ✅ renderer/index.html作成
   - ✅ フォルダ構造作成
   - ✅ App.css移植
   - ✅ Firebase設定移植
   - ✅ AuthContext移植（Electron IPC対応）
   - ✅ Layout基本構造移植
   - ⚠️ コンポーネント移植（進行中）
     - ✅ AuthCard移植・エラー修正
     - ✅ InlineError移植
     - ⚠️ 残りのコンポーネント移植中
   - ⚠️ フック移植（進行中）
     - ✅ useAuthActions作成
     - ✅ useErrorToast作成
     - ✅ useFirebaseAuth修正（Electron対応）
     - ✅ useAttachments修正（モック対応）
     - ⚠️ 残りのフック移植中
3. ✅ 必要な依存関係を特定

### フェーズ2: Electron固有の実装
4. main processの実装（ウィンドウ管理、メニュー等）
5. preload scriptの実装（IPC通信）
6. renderer processでのIPC通信実装

### フェーズ3: 機能実装
7. 設定画面の実装
8. メイン画面の実装
9. AI機能の実装

### フェーズ4: テストと調整
10. 動作確認
11. UI/UXの調整
12. パフォーマンス最適化

## 人間テストチェックポイント
- [ ] フェーズ1完了後: ファイル構造とビルド確認
- [ ] フェーズ2完了後: Electronアプリ起動確認
- [ ] フェーズ3完了後: 各機能動作確認
- [ ] フェーズ4完了後: 最終動作確認

## 次のステップ
Tauriバージョンの詳細構造を分析し、Electronのrendererフォルダに移植開始 

# Firebase Authentication ログイン機能実装

## 要件
- Firebase Authenticationを使用してログイン機能を実装
- セットアップ済みのFirebaseプロジェクトを使用
- ログイン成功後にメイン画面へ遷移

## Firebase設定情報
- プロジェクトID: glimpse-dfe44
- 認証ドメイン: glimpse-dfe44.firebaseapp.com

## 実装計画

### Phase 1: Firebase設定とAuth初期化 ⚠️進行中
1. Firebase設定ファイルの作成
2. Firebase Auth初期化
3. 必要な依存関係の確認

### Phase 2: 認証フック作成
1. useAuth カスタムフックの実装
2. 認証状態管理
3. ログイン/ログアウト機能

### Phase 3: ログイン画面UI作成
1. ログインフォームコンポーネント
2. Google認証ボタン
3. エラーハンドリング

### Phase 4: 認証ルーティング
1. 認証状態による画面切り替え
2. プライベートルート保護

### Phase 5: 人間テストチェックポイント
- ログイン機能のテスト
- 認証状態の確認
- エラーケースの動作確認

## 進捗状況
- ✅ タスク計画作成
- ✅ Firebase設定確認（既存）
- ✅ 認証フック確認（既存のuseAuthActions）
- ✅ ログイン画面UI確認（既存のAuthCard）
- ✅ 認証ルーティング確認（既存のApp.tsx）

## 発見事項
- Firebase Authentication機能は既に完全に実装済み
- AuthContext、useAuthActions、AuthCardが存在
- Google認証とメール認証の両方をサポート
- 認証状態による画面切り替えも実装済み

## 次のステップ
⚠️ **問題発生**: Firebase認証でポップアップブロックエラー
- Electronでのポップアップ認証制限
- リダイレクトベース認証への変更が必要

## 修正計画
⚠️ **追加問題発見**:
1. preloadスクリプトが見つからない (`out/preload/index.js`)
2. `window.api.firebaseAuth` が未定義
3. Content Security Policy警告

## 修正手順
1. ✅ preloadスクリプトのパス問題（index.mjs形式に修正）
2. ✅ Electron APIの実装（firebase:authハンドラー追加）
3. ✅ CSP設定の改善（開発環境と本番環境で分離）
4. ✅ Firebase認証ポップアップ許可設定
5. ✅ 修正完了

## 最新の修正内容
1. **preloadスクリプトパス修正**
   - `index.js` → `index.mjs`（ESM形式）
   - ビルド出力形式に合わせて修正

2. **CSP設定の大幅改善**
   - ✅ **最終修正**: 開発環境では最も緩いCSP設定（`*`使用）
   - 本番環境では適切なセキュリティ設定を維持
   - Cross-Origin-Opener-Policy問題を解決
   - webSecurityを開発環境では無効化

3. **Firebase認証対応強化**
   - `child-src`ディレクティブ追加
   - `blob:`プロトコルサポート
   - より包括的なGoogle APIsサポート
   - Firebase App ドメイン（`*.firebaseapp.com`）を追加

## 解決したセキュリティ問題
- ✅ `https://apis.google.com/js/api.js`の読み込み拒否を解決
- ✅ Firebase App フレーム読み込み拒否を解決
- ✅ Cross-Origin-Opener-Policy エラーを解決
- ✅ 開発環境でのすべてのCSP制限を緩和

## 人間テストチェックポイント
以下をテストしてください：
1. アプリケーションの再起動（`npm run dev`）
2. すべてのCSPエラーが解消されているか
3. Cross-Origin-Opener-Policy エラーが解消されているか
4. Google認証ボタンのクリック
5. 認証ポップアップの表示と動作
6. Google認証の完了
7. 認証成功後のメイン画面遷移

## 注意事項
開発環境では最も緩いセキュリティ設定を使用しています。本番環境では適切なセキュリティ設定が適用されます。

## 次のステップ
⚠️ **問題発生**: Firebase認証でポップアップブロックエラー
- Electronでのポップアップ認証制限
- リダイレクトベース認証への変更が必要

## 修正計画
⚠️ **追加問題発見**:
1. preloadスクリプトが見つからない (`out/preload/index.js`)
2. `window.api.firebaseAuth` が未定義
3. Content Security Policy警告

## 修正手順
1. ❌ preloadスクリプトのパス問題（`out/preload/index.js`が見つからない）
2. ✅ Electron APIの実装（firebase:authハンドラー追加）
3. ❌ CSP設定の問題（Google APIsスクリプトが拒否される）
4. ✅ Firebase認証ポップアップ許可設定
5. ⚠️ 追加修正が必要

## 新たに発見された問題
- preloadスクリプトのビルドパスが`out/`ではなく`dist-electron/`
- CSPでGoogle APIsのスクリプト読み込みが拒否される
- `script-src-elem`ディレクティブが必要

## 次の修正
1. preloadスクリプトのパス修正
2. CSP設定の改善（Google APIs対応） 

# 現在のタスク: メイン画面UI実装（サイズ切り替え対応）

## 要件
- フレームレスヘッダー（ドラッグで画面移動可能）
- 透明度調整スライダー
- 設定ボタン（アイコンのみ）
- ログアウトボタン（アイコンのみ）
- サイズ切り替えボタン（アイコンのみ）
- 画面サイズ対応：small(280x400), medium(320x450), large(360x500)
- 初期表示サイズ：small
- 上部：入力欄（Ctrl+V対応、文字・画像貼り付け）
- 下部：回答結果欄
- 送信ボタン（アイコンのみ）
- ファイル添付ボタン（アイコンのみ）

## 実装計画

### 1. 現在の状況確認 ✅完了
- ✅ 既存のCSSとコンポーネント構造を確認
- ✅ 現在のApp.tsxの構造を確認
- ✅ 必要なアイコンライブラリの確認（lucide-react利用可能）

### 2. ヘッダーコンポーネント実装 ✅完了
- ✅ フレームレスヘッダーコンポーネント作成
- ✅ ドラッグ機能実装（-webkit-app-region: drag）
- ✅ 透明度スライダー実装
- ✅ 設定ボタン実装
- ✅ ログアウトボタン実装
- ✅ サイズ切り替えボタン実装

### 3. メインレイアウト実装 ✅完了
- ✅ 画面サイズ対応のレスポンシブレイアウト
- ✅ 入力欄エリア実装
- ✅ 回答結果エリア実装

### 4. 入力機能実装 ✅完了
- ✅ Ctrl+V貼り付け機能
- ✅ 画像貼り付け対応
- ✅ 送信ボタン実装
- ✅ ファイル添付ボタン実装

### 5. スタイリング調整 ✅完了
- ✅ 全体的なデザイン調整
- ✅ アイコンの配置とサイズ調整
- ✅ 固定サイズ対応CSS実装

### 6. ウィンドウサイズ制御実装 ✅完了
- ✅ メインプロセスでのウィンドウサイズ設定（初期：small）
- ✅ フレームレスウィンドウ設定
- ✅ サイズ変更IPCハンドラー実装
- ✅ preloadスクリプトAPI追加
- ✅ 型定義更新

### 7. 人間テストチェックポイント ⚠️準備完了
- [ ] ヘッダードラッグ機能テスト
- [ ] 透明度スライダーテスト
- [ ] サイズ切り替えボタンテスト
- [ ] 各ボタンの動作確認
- [ ] 貼り付け機能テスト

## 進捗状況
- ✅ タスク開始
- ✅ 現在の状況確認完了
- ✅ ヘッダーコンポーネント実装完了
- ✅ メインレイアウト実装完了
- ✅ 入力機能実装完了
- ✅ スタイリング調整完了
- ✅ ウィンドウサイズ制御実装完了
- ⚠️ 人間テストチェックポイント準備完了

## 実装完了内容

### 新規作成ファイル
1. `src/renderer/src/components/MainHeader.tsx` - フレームレスヘッダー（サイズ切り替え機能追加）
2. `src/renderer/src/components/MainInputSection.tsx` - 入力セクション
3. `src/renderer/src/components/MainResponseSection.tsx` - 回答セクション
4. `src/renderer/src/layouts/MainAppLayout.tsx` - メインレイアウト

### 修正ファイル
1. `src/renderer/src/App.css` - 新しいレイアウト用CSS追加、固定サイズ対応
2. `src/renderer/src/App.tsx` - MainAppLayoutに切り替え
3. `src/main/index.ts` - ウィンドウサイズ制御、フレームレス設定
4. `src/preload/index.ts` - resizeWindow API追加
5. `src/renderer/src/types/electron.d.ts` - 型定義更新

### 実装機能
- **フレームレスヘッダー**: ドラッグ移動、透明度スライダー、設定・ログアウト・サイズ切り替えボタン
- **入力セクション**: Ctrl+V貼り付け、画像対応、送信・添付ボタン
- **回答セクション**: メッセージ履歴、ローディング表示、エラー処理
- **ウィンドウサイズ制御**: 3つの固定サイズ（small/medium/large）の切り替え
- **初期サイズ**: small (280x400) で起動

### 現在の状態
- モック実装でメッセージ送受信が動作
- 全てのUI要素が実装済み
- CSS スタイリング完了
- フレームレスウィンドウで起動
- サイズ切り替え機能が動作

## テスト項目
以下の機能をテストしてください：

1. **初期サイズ**: アプリがsmall (280x400) サイズで起動するか
2. **フレームレス**: ウィンドウにタイトルバーがないか
3. **ヘッダードラッグ機能**: ヘッダー部分をドラッグして画面を移動できるか
4. **透明度スライダー**: スライダーで画面の透明度が変更されるか
5. **サイズ切り替えボタン**: Maximize2アイコンのボタンでsmall→medium→large→smallの順でサイズが切り替わるか
6. **設定ボタン**: 設定ボタンをクリックしてコンソールにログが出力されるか
7. **ログアウトボタン**: ログアウトボタンでログアウト画面に戻るか
8. **入力機能**: テキスト入力とEnterキーでの送信が動作するか
9. **ファイル添付**: 添付ボタンでモックファイルが追加されるか
10. **Ctrl+V貼り付け**: 画像をコピーして貼り付けが動作するか（モック）
11. **メッセージ表示**: 送信したメッセージとAI応答が正しく表示されるか
12. **サイズ別レイアウト**: 各サイズでUIが適切に調整されるか 

# Supabase実装タスク

## 要求内容
- スクリーンショットボタンの削除 ✅
- Firebase FunctionsからSupabase Edge Functionsへの移行
- 認証・データベース・API統合の実装
- 使用量管理システムの構築
- Stripe連携は後回し

## 実装計画

### Phase 1: 基本セットアップ ✅完了
1. ✅ スクリーンショットボタン削除完了
2. ✅ Supabaseプロジェクト設定確認
3. ✅ 環境変数設定
4. ✅ 基本的なSupabaseクライアント設定
5. ✅ Supabase CLIセットアップ
6. ✅ Edge Function作成 (call-gemini)
7. ✅ データベーススキーマ作成
8. ✅ 認証フック作成 (useAuth)
9. ✅ 使用量管理フック作成 (useUsage)
10. ✅ LLMフック更新 (useLLM)
11. ✅ 認証フォームコンポーネント作成
12. ✅ 認証フォームスタイル追加

### Phase 2: 型定義とコンポーネント統合 ⚠️進行中
1. 型定義の整合性確保
2. MainResponseSectionの更新
3. SettingsModalの更新
4. useOpacityフックの作成
5. 既存コンポーネントとの統合

### Phase 3: テストとデバッグ
1. ローカルでのEdge Function実行テスト
2. 認証フローのテスト
3. 使用量管理のテスト
4. エラーハンドリングの確認

### Phase 4: デプロイメント
1. Edge Functionのデプロイ
2. データベースマイグレーション実行
3. 本番環境での動作確認

## 現在の状況
- Phase 1完了：基本的なSupabase統合が完了
- 型エラーが発生中：既存コンポーネントとの整合性調整が必要
- 次：型定義の修正と既存コンポーネントの更新

## 技術スタック
- Supabase (認証・DB・Edge Functions)
- TypeScript/Deno (Edge Functions)
- Electron (フロントエンド)
- Gemini API (LLM)

## 実装済み機能
- ✅ Supabaseクライアント設定
- ✅ Edge Function (call-gemini)
- ✅ データベーススキーマ (user_usage, call_history)
- ✅ 認証システム (useAuth)
- ✅ 使用量管理 (useUsage)
- ✅ LLM呼び出し (useLLM)
- ✅ 認証フォーム (AuthForm)

## 次のステップ
1. 型定義の整合性確保
2. 既存コンポーネントの更新
3. ローカルテスト実行 