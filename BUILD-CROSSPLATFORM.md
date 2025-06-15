# WindowsからmacOSアプリをビルドする方法

WindowsではmacOSアプリの完全なビルド（特に署名）はできませんが、以下の方法で未署名のDMGを作成できます。

## 方法1: Docker を使用（推奨）

### 前提条件
- Docker Desktop for Windows がインストールされていること

### 手順

1. PowerShellで以下のスクリプトを実行:
```powershell
.\build-mac-docker.ps1
```

または手動で:
```powershell
docker run --rm `
    -v "${PWD}:/project" `
    -w /project `
    electronuserland/builder:wine-mono `
    /bin/bash -c "npm install && npm run build && npx electron-builder --mac --config.mac.identity=null"
```

### 注意事項
- 作成されるDMGは**未署名**です
- macOS 10.15以降で実行するには追加の手順が必要です

## 方法2: GitHub Actions を使用

### 設定手順

1. GitHubリポジトリに `.github/workflows/build.yml` を作成済み

2. コードをプッシュまたはタグを作成:
```bash
git tag v1.0.0
git push origin v1.0.0
```

3. GitHub Actions が自動的に全プラットフォーム用にビルド

### 利点
- 署名済みビルドも可能（証明書をSecretsに設定すれば）
- 自動リリース作成
- クロスプラットフォーム対応

## 方法3: ローカルでの制限付きビルド

`package.json` の設定を変更済みなので、以下でビルド可能:

```powershell
npm run package:mac
```

ただし、以下の制限があります：
- DMGのみ作成可能（pkg, zip は不可）
- 未署名
- Hardened Runtime なし
- Notarization 不可

## 配布時の注意事項

### 未署名アプリの実行方法（ユーザー向け）

1. **初回起動時**:
   - DMGをダブルクリック
   - アプリを Applications フォルダにドラッグ
   - Finderで Applications を開く
   - アプリを右クリック → 「開く」を選択
   - 警告ダイアログで「開く」をクリック

2. **Gatekeeper を一時的に無効化**:
   ```bash
   sudo spctl --master-disable
   # アプリを起動
   sudo spctl --master-enable
   ```

### 署名済みアプリにする方法

1. **Macで署名**:
   - 未署名DMGをMacに転送
   - Apple Developer証明書で署名
   - Notarization を実行

2. **署名サービスを使用**:
   - [electron-builder-notarize](https://github.com/karaggeorge/electron-builder-notarize)
   - CI/CDサービスでmacOSランナーを使用

## トラブルシューティング

### "can't be opened because Apple cannot check it for malicious software"
- 上記の「未署名アプリの実行方法」を参照

### "Build for macOS is supported only on macOS"
- Docker または GitHub Actions を使用

### アイコンが表示されない
- `build/icon.png` が存在することを確認
- 最低512x512px、推奨1024x1024px

## 推奨ワークフロー

1. **開発**: Windowsでコード開発
2. **テストビルド**: Dockerで未署名DMG作成
3. **本番ビルド**: GitHub ActionsまたはmacOSマシンで署名済みビルド
4. **配布**: 署名・Notarization済みのDMGを配布