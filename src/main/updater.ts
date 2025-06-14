import pkg from 'electron-updater';
const { autoUpdater } = pkg;
import { BrowserWindow, ipcMain, dialog } from 'electron';

export interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes?: string;
}

export function setupAutoUpdater(mainWindow: BrowserWindow) {
  // 開発環境でのチェック
  const isDev = process.env.NODE_ENV === 'development' || !mainWindow.webContents.getURL().startsWith('file://');
  
  if (isDev) {
    console.log('Development mode: Auto-update features are limited');
  }

  // 自動ダウンロードを無効化（ユーザーが手動で更新を選択）
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  // 更新チェック開始
  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for updates...');
    mainWindow.webContents.send('update:checking');
  });

  // 更新が利用可能
  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info.version);
    const updateInfo: UpdateInfo = {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes as string
    };
    mainWindow.webContents.send('update:available', updateInfo);
  });

  // 更新が利用不可
  autoUpdater.on('update-not-available', () => {
    console.log('No updates available');
    mainWindow.webContents.send('update:not-available');
  });

  // ダウンロード進捗
  autoUpdater.on('download-progress', (progressObj) => {
    const logMessage = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`;
    console.log(logMessage);
    mainWindow.webContents.send('update:download-progress', progressObj);
  });

  // ダウンロード完了
  autoUpdater.on('update-downloaded', () => {
    console.log('Update download completed');
    mainWindow.webContents.send('update:downloaded');
  });

  // エラー処理
  autoUpdater.on('error', (error) => {
    console.error('Update error:', error);
    mainWindow.webContents.send('update:error', error.message);
  });

  // IPCハンドラー：更新チェック
  ipcMain.handle('update:check', async () => {
    try {
      if (isDev) {
        // 開発環境では模擬的な結果を返す
        console.log('Skipping update check in development mode');
        mainWindow.webContents.send('update:not-available');
        return { success: true, data: null };
      }
      const result = await autoUpdater.checkForUpdates();
      return { success: true, data: result };
    } catch (error) {
      console.error('Update check error:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // IPCハンドラー：更新ダウンロード開始
  ipcMain.handle('update:download', async () => {
    try {
      if (isDev) {
        console.log('Skipping update download in development mode');
        return { success: false, error: '開発環境では更新できません' };
      }
      await autoUpdater.downloadUpdate();
      return { success: true };
    } catch (error) {
      console.error('Download error:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // IPCハンドラー：更新インストール
  ipcMain.handle('update:install', async () => {
    try {
      if (isDev) {
        console.log('Skipping update install in development mode');
        return { success: false, error: '開発環境では更新できません' };
      }
      
      // ユーザーに確認
      const response = await dialog.showMessageBox(mainWindow, {
        type: 'question',
        buttons: ['今すぐ再起動', 'あとで'],
        defaultId: 0,
        message: '更新をインストールするにはアプリを再起動する必要があります。',
        detail: '今すぐ再起動してインストールしますか？'
      });

      if (response.response === 0) {
        autoUpdater.quitAndInstall();
      }
      return { success: true, restart: response.response === 0 };
    } catch (error) {
      console.error('Install error:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // 初回チェック（開発環境では実行しない）
  if (!isDev) {
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch(console.error);
    }, 3000);

    // 定期チェック（1時間ごと）
    setInterval(() => {
      autoUpdater.checkForUpdates().catch(console.error);
    }, 60 * 60 * 1000);
  }
}