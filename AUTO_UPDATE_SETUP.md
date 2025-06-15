# Glimpse 自動更新設定ガイド

## 概要
GitHub Actions経由で自動配信を設定しました。以下の変更を行いました：

## 実装済みの変更

### 1. GitHub Actions ワークフロー（`.github/workflows/build.yml`）
- タグ付きリリース時に `--publish always` を使用してビルド
- 通常のビルドでは `--publish never` を維持
- リリースを自動的に公開（`draft: false`）
- リリースノートの自動生成を有効化

### 2. package.json の設定
```json
"publish": {
  "provider": "github",
  "releaseType": "release",
  "publishAutoUpdate": true
}
```

## 自動更新のテスト手順

### 1. リリース前の準備
1. `package.json` のバージョンを更新
   ```bash
   npm version patch  # または minor/major
   ```

2. 変更をコミットしてプッシュ
   ```bash
   git add package.json package-lock.json
   git commit -m "chore: bump version to x.x.x"
   git push origin main
   ```

### 2. リリースの作成
1. タグを作成してプッシュ
   ```bash
   git tag v0.1.1  # バージョン番号に合わせて変更
   git push origin v0.1.1
   ```

2. GitHub Actions が自動的に：
   - 各プラットフォーム用のビルドを作成
   - リリースを作成して公開
   - latest.yml ファイルを生成してアップロード

### 3. 自動更新の確認
1. **古いバージョンのアプリを起動**
   - アプリが起動時に自動的に更新をチェック
   - 新しいバージョンが見つかると通知

2. **手動で更新をチェック**
   - アプリ内で更新チェックを実行（実装済みの場合）

3. **ログの確認**
   - 開発環境では、コンソールで更新プロセスのログを確認可能

### 4. トラブルシューティング

#### 更新が検出されない場合
- GitHub リリースが公開されているか確認
- latest.yml ファイルが正しく生成されているか確認
- アプリのバージョンがリリースバージョンより低いか確認

#### エラーが発生する場合
- GitHub Token（GH_TOKEN）が正しく設定されているか確認
- リポジトリの設定でActionsの権限を確認

## 重要な注意事項

1. **初回リリース**
   - v0.1.0 からアップデートするには、まず v0.1.1 以上のリリースが必要

2. **署名について**
   - Windows: 現在は未署名のため、SmartScreenの警告が表示される可能性
   - macOS: 同様に Gatekeeper の警告が表示される可能性
   - 本番環境では適切なコード署名証明書の設定が推奨

3. **プライベートリポジトリ**
   - プライベートリポジトリの場合、ユーザーが更新をダウンロードするには認証が必要
   - パブリックリポジトリでの運用が推奨

## 今後の改善点

1. **差分更新**の実装（現在は完全なインストーラーをダウンロード）
2. **署名証明書**の追加（Windows/macOS）
3. **更新チャンネル**の実装（stable/beta/alpha）
4. **ロールバック機能**の追加