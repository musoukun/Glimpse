import pkg from 'electron-updater';
const { autoUpdater } = pkg;
import { BrowserWindow, ipcMain, dialog } from 'electron';

export interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes?: string;
}

export function setupAutoUpdater(mainWindow: BrowserWindow) {
  console.log('Setting up auto-updater...');
  
  // プレリリースも含めて更新をチェック
  autoUpdater.allowPrerelease = true;
  
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

  // 初回チェック
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(console.error);
  }, 3000);

  // 定期チェック（1時間ごと）
  setInterval(() => {
    autoUpdater.checkForUpdates().catch(console.error);
  }, 60 * 60 * 1000);
}