# リリースガイド

## 自動リリース方法（推奨）

### 1. バージョンを更新
```bash
npm version patch  # または minor/major
```

### 2. 変更をコミット・プッシュ
```bash
git add package.json package-lock.json
git commit -m "chore: bump version to x.x.x"
git push origin main
```

### 3. タグを作成・プッシュ
```bash
git tag vx.x.x  # x.x.xは新しいバージョン
git push origin vx.x.x
```

GitHub Actionsが自動的に：
- 全プラットフォーム（Windows/macOS/Linux）のビルドを実行
- 各プラットフォーム用の`latest.yml`を生成
- リリースを作成・公開
- 自動更新用のファイルをアップロード

## ローカルでのリリース準備（Windowsのみ）

### 1. 自動準備スクリプトを使用
```bash
npm run prepare-release
```

このスクリプトは以下を実行：
- アプリケーションのビルド
- Windows用のパッケージ作成（Windowsで実行時のみ）
- Windows用の`latest.yml`の生成
- リリースアセットの確認

**注意**: macOSとLinux向けのビルドはGitHub Actions経由で行われます。

### 2. 手動で`latest.yml`を生成
```bash
# Windows用
npm run generate-latest dist/Glimpse-Setup-0.1.2.exe 0.1.2

# 引数：
# - 第1引数: インストーラーファイルのパス
# - 第2引数: バージョン番号
```

## `latest.yml`について

`latest.yml`は electron-updater が自動更新時に参照するファイルです：

- **version**: アプリケーションのバージョン
- **files**: ダウンロード可能なファイルの情報
  - **url**: ファイル名
  - **sha512**: ファイルのSHA512ハッシュ（Base64）
  - **size**: ファイルサイズ（バイト）
- **path**: メインのインストーラーファイル名
- **sha512**: メインファイルのSHA512ハッシュ
- **releaseDate**: リリース日時（ISO 8601形式）

## トラブルシューティング

### エラー: Cannot find latest.yml
- リリースに`latest.yml`がアップロードされていない
- 解決：新しいタグをプッシュしてGitHub Actionsでビルド

### エラー: 404 Not Found
- プライベートリポジトリで認証が必要
- 解決：リポジトリをパブリックにするか、認証トークンを設定

### エラー: SHA512 mismatch
- ダウンロードしたファイルが破損している
- 解決：`latest.yml`を再生成してアップロード

## ベストプラクティス

1. **必ずタグを使用**: タグなしのリリースは避ける
2. **セマンティックバージョニング**: major.minor.patch形式を守る
3. **リリースノート**: 変更内容を明確に記載
4. **テスト**: リリース前に必ず動作確認