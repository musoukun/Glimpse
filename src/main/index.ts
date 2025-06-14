import {
	app,
	shell,
	BrowserWindow,
	ipcMain,
	dialog,
	desktopCapturer,
	globalShortcut,
	screen,
	Tray,
	Menu,
	nativeImage,
} from "electron";
import { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import { readFileSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import Store from 'electron-store';
import { setupAutoUpdater } from './updater';

// OAuth認証のコールバックを処理するための変数
let mainWindow: BrowserWindow | null = null;
let authWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

// electron-storeのインスタンス
const store = new Store();

function createWindow(): void {
	// 保存されたウィンドウ位置を読み込む
	const savedBounds = store.get('windowBounds') as { x: number; y: number; width: number; height: number } | undefined;
	
	// Create the browser window.
	mainWindow = new BrowserWindow({
		width: savedBounds?.width || 280,
		height: savedBounds?.height || 400,
		x: savedBounds?.x,
		y: savedBounds?.y,
		show: false,
		autoHideMenuBar: true,
		frame: false, // フレームレスウィンドウ
		resizable: true, // サイズ変更を有効化
		transparent: true, // ウィンドウ透明化
		backgroundColor: "#00000001", // ほぼ透明（完全透明だとクリックできない）
		maximizable: false, // 最大化を無効化
		minimizable: true, // 最小化を有効化
		alwaysOnTop: false, // 常に最前面を無効化
		skipTaskbar: false, // タスクバーに表示する
		icon: join(__dirname, '../../public/glimpse-icon3.png'), // アイコンを設定
		webPreferences: {
			preload: join(__dirname, "../preload/index.mjs"),
			sandbox: false,
			contextIsolation: true,
			nodeIntegration: false,
			webSecurity: false, // 開発環境での外部リソースアクセスを許可
		},
	});

	// ウィンドウの位置・サイズ変更を監視して保存
	let saveTimeout: NodeJS.Timeout;
	const saveBounds = () => {
		if (mainWindow && !mainWindow.isDestroyed()) {
			const bounds = mainWindow.getBounds();
			store.set('windowBounds', bounds);
		}
	};

	mainWindow.on('move', () => {
		clearTimeout(saveTimeout);
		saveTimeout = setTimeout(saveBounds, 500);
	});

	mainWindow.on('resize', () => {
		clearTimeout(saveTimeout);
		saveTimeout = setTimeout(saveBounds, 500);
	});

	mainWindow.on("ready-to-show", () => {
		mainWindow?.show();
		console.log("Window created successfully");
		
		// 開発時のデバッグ情報
		if (is.dev) {
			console.log("Window properties:", {
				resizable: mainWindow?.isResizable(),
				maximizable: mainWindow?.isMaximizable(),
				minimizable: mainWindow?.isMinimizable(),
				backgroundColor: mainWindow?.getBackgroundColor()
			});
		}
	});

	mainWindow.webContents.setWindowOpenHandler((details) => {
		// Supabase認証のポップアップを許可
		if (details.url.includes('accounts.google.com') || details.url.includes('supabase')) {
			return { action: "allow" };
		}
		// その他の外部URLは外部ブラウザで開く
		shell.openExternal(details.url);
		return { action: "deny" };
	});

	// HMR for renderer base on electron-vite cli.
	// Load the remote URL for development or the local html file for production.
	if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
		mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
	} else {
		mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
	}
}



// キャッシュパスの問題を解決
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-software-rasterizer');

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
	// Set app user model id for windows
	electronApp.setAppUserModelId("com.glimpse.app");

	// Default open or close DevTools by F12 in development
	// and ignore CommandOrControl + R in production.
	// see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
	app.on("browser-window-created", (_, window) => {
		optimizer.watchWindowShortcuts(window);
	});

	// IPC test
	ipcMain.handle("ping", () => "pong");

	// Supabase OAuth認証ウィンドウを開くIPCハンドラー
	ipcMain.handle('auth:open-window', async (event, provider: string) => {
		try {
			if (authWindow && !authWindow.isDestroyed()) {
				authWindow.focus();
				return { error: new Error('認証ウィンドウは既に開いています') };
			}

			// Supabase Auth URLを構築
			const supabaseUrl = 'https://kafgcovlbmatojtzlxkv.supabase.co';
			const redirectUrl = 'http://localhost:5173/auth/callback'; // 開発環境
			
			authWindow = new BrowserWindow({
				width: 500,
				height: 700,
				show: true,
				modal: true,
				parent: mainWindow || undefined,
				webPreferences: {
					nodeIntegration: false,
					contextIsolation: true,
				}
			});

			// Supabase Google OAuth URL
			const authUrl = `${supabaseUrl}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(redirectUrl)}`;
			authWindow.loadURL(authUrl);

			// 認証成功を検出
			authWindow.webContents.on('will-redirect', (event, url) => {
				console.log('Redirect to:', url);
				if (url.startsWith(redirectUrl)) {
					// 認証成功、メインウィンドウでコールバックURLを処理
					if (mainWindow) {
						mainWindow.webContents.send('auth:callback', url);
					}
					authWindow?.close();
				}
			});

			authWindow.on('closed', () => {
				authWindow = null;
			});

			return { error: null };
		} catch (error) {
			console.error('Auth window error:', error);
			return { error };
		}
	});

	// 認証成功の通知を受け取るIPCハンドラー
	ipcMain.handle('auth:success', async (event, authData) => {
		console.log('Auth success:', authData);
		// 必要に応じて処理を追加
		return true;
	});

	// サインアウトの通知を受け取るIPCハンドラー
	ipcMain.handle('auth:signout', async () => {
		console.log('User signed out');
		// 必要に応じて処理を追加
		return true;
	});

	// 外部URLを開くIPCハンドラー
	ipcMain.handle("oauth:open-external", async (event, url: string) => {
		try {
			await shell.openExternal(url);
			return true;
		} catch (error) {
			console.error("外部URL起動エラー:", error);
			return false;
		}
	});

	// ファイル選択IPCハンドラー
	ipcMain.handle("file:select", async (event) => {
		const window = BrowserWindow.fromWebContents(event.sender);
		if (!window) return null;

		try {
			const result = await dialog.showOpenDialog(window, {
				title: "ファイルを選択",
				properties: ["openFile"],
				filters: [
					{
						name: "画像ファイル",
						extensions: [
							"jpg",
							"jpeg",
							"png",
							"gif",
							"webp",
							"svg",
						],
					},
					{
						name: "テキストファイル",
						extensions: [
							"txt",
							"md",
							"json",
							"js",
							"ts",
							"tsx",
							"jsx",
							"css",
							"html",
						],
					},
					{
						name: "全てのファイル",
						extensions: ["*"],
					},
				],
			});

			if (result.canceled || result.filePaths.length === 0) {
				return null;
			}

			const filePath = result.filePaths[0];
			const fileName = filePath.split(/[\\/]/).pop() || "unknown";

			// ファイルを読み込んでBase64エンコード
			const fileBuffer = readFileSync(filePath);
			const mimeType = getMimeType(fileName);
			const fileData = `data:${mimeType};base64,${fileBuffer.toString("base64")}`;

			return {
				fileName,
				fileData,
				fileSize: fileBuffer.length,
				mimeType,
			};
		} catch (error) {
			console.error("ファイル選択エラー:", error);
			return null;
		}
	});

	// スクリーンショット機能のハンドラー
	ipcMain.handle("take-screenshot", async () => {
		try {
			// デスクトップキャプチャのソースを取得
			const sources = await desktopCapturer.getSources({
				types: ["screen"],
				thumbnailSize: { width: 1920, height: 1080 },
			});

			if (sources.length === 0) {
				throw new Error("スクリーンソースが見つかりません");
			}

			// プライマリスクリーンを取得（最初のスクリーン）
			const primaryScreen = sources[0];
			const thumbnail = primaryScreen.thumbnail;

			// NativeImageをPNGバッファに変換
			const pngBuffer = thumbnail.toPNG();
			const base64Data = `data:image/png;base64,${pngBuffer.toString("base64")}`;

			return {
				fileName: `screenshot-${Date.now()}.png`,
				fileData: base64Data,
				fileSize: pngBuffer.length,
				mimeType: "image/png",
			};
		} catch (error) {
			console.error("スクリーンショットエラー:", error);
			throw error;
		}
	});

	// MIMEタイプを推定する関数
	function getMimeType(fileName: string): string {
		const ext = fileName.split(".").pop()?.toLowerCase() || "";
		const mimeTypes: Record<string, string> = {
			// 画像
			jpg: "image/jpeg",
			jpeg: "image/jpeg",
			png: "image/png",
			gif: "image/gif",
			webp: "image/webp",
			svg: "image/svg+xml",
			// テキスト
			txt: "text/plain",
			md: "text/markdown",
			json: "application/json",
			js: "text/javascript",
			ts: "text/typescript",
			tsx: "text/typescript",
			jsx: "text/javascript",
			css: "text/css",
			html: "text/html",
			// デフォルト
		};
		return mimeTypes[ext] || "application/octet-stream";
	}

	// ウィンドウサイズ変更のIPCハンドラー
	ipcMain.handle("window:resize", async (event, size: string) => {
		const window = BrowserWindow.fromWebContents(event.sender);
		if (!window) return false;

		let width: number, height: number;
		switch (size) {
			case "small":
				width = 280;
				height = 400;
				break;
			case "medium":
				width = 320;
				height = 450;
				break;
			case "large":
				width = 360;
				height = 500;
				break;
			default:
				return false;
		}

		window.setSize(width, height);
		// サイズ変更後も位置を保存
		const bounds = window.getBounds();
		store.set('windowBounds', bounds);
		store.set('windowSize', size);
		console.log(`ウィンドウサイズを${size}(${width}x${height})に変更`);
		return true;
	});

	// ウィンドウを閉じるIPCハンドラー
	ipcMain.handle("window:close", async (event) => {
		const window = BrowserWindow.fromWebContents(event.sender);
		if (!window) return;
		// タスクトレイがある場合はウィンドウを非表示にするだけ
		if (tray) {
			window.hide();
		} else {
			window.close();
		}
	});

	// ウィンドウ表示/非表示切り替えIPCハンドラー
	ipcMain.handle("window:toggle-visibility", async (event) => {
		const window = BrowserWindow.fromWebContents(event.sender);
		if (!window) return;

		if (window.isVisible()) {
			window.hide();
		} else {
			window.show();
			window.focus();
		}
	});

	// 範囲選択キャプチャのIPCハンドラー
	ipcMain.handle("capture-area", async () => {
		try {
			if (!mainWindow) return null;

			// メインウィンドウを一時的に非表示
			mainWindow.hide();

			// 少し待ってからキャプチャ（ウィンドウが確実に非表示になるため）
			await new Promise(resolve => setTimeout(resolve, 200));

			// スクリーン全体のキャプチャを取得
			const sources = await desktopCapturer.getSources({
				types: ["screen"],
				thumbnailSize: {
					width: screen.getPrimaryDisplay().workAreaSize.width,
					height: screen.getPrimaryDisplay().workAreaSize.height
				}
			});

			if (sources.length === 0) {
				mainWindow.show();
				throw new Error("スクリーンソースが見つかりません");
			}

			// 範囲選択ウィンドウを作成
			const captureWindow = new BrowserWindow({
				fullscreen: true,
				frame: false,
				transparent: true,
				alwaysOnTop: true,
				skipTaskbar: true,
				movable: false,
				resizable: false,
				hasShadow: false,
				webPreferences: {
					preload: join(__dirname, "../preload/index.mjs"),
					sandbox: false,
					contextIsolation: true,
					nodeIntegration: false,
				}
			});

			// キャプチャウィンドウ用のHTMLを読み込む
			const captureHtml = `
				<!DOCTYPE html>
				<html>
				<head>
					<style>
						body {
							margin: 0;
							padding: 0;
							overflow: hidden;
							cursor: crosshair;
							background: rgba(0, 0, 0, 0.3);
						}
						#selection {
							position: absolute;
							border: 2px solid #0099ff;
							background: rgba(0, 153, 255, 0.1);
							display: none;
						}
						#screenshot {
							position: absolute;
							top: 0;
							left: 0;
							width: 100%;
							height: 100%;
							z-index: -1;
						}
					</style>
				</head>
				<body>
					<img id="screenshot" />
					<div id="selection"></div>
					<script>
						let isSelecting = false;
						let startX, startY, endX, endY;
						const selection = document.getElementById('selection');
						const screenshot = document.getElementById('screenshot');

						// スクリーンショットを表示
						window.addEventListener('message', (event) => {
							if (event.data.type === 'screenshot') {
								screenshot.src = event.data.data;
							}
						});

						document.addEventListener('mousedown', (e) => {
							isSelecting = true;
							startX = e.clientX;
							startY = e.clientY;
							selection.style.display = 'block';
							selection.style.left = startX + 'px';
							selection.style.top = startY + 'px';
							selection.style.width = '0px';
							selection.style.height = '0px';
						});

						document.addEventListener('mousemove', (e) => {
							if (!isSelecting) return;
							endX = e.clientX;
							endY = e.clientY;
							const width = Math.abs(endX - startX);
							const height = Math.abs(endY - startY);
							selection.style.left = Math.min(startX, endX) + 'px';
							selection.style.top = Math.min(startY, endY) + 'px';
							selection.style.width = width + 'px';
							selection.style.height = height + 'px';
						});

						document.addEventListener('mouseup', () => {
							if (!isSelecting) return;
							isSelecting = false;
							const rect = {
								x: Math.min(startX, endX),
								y: Math.min(startY, endY),
								width: Math.abs(endX - startX),
								height: Math.abs(endY - startY)
							};
							if (rect.width > 10 && rect.height > 10) {
								window.electron.ipcRenderer.send('capture-selection', rect);
							}
						});

						// ESCキーでキャンセル
						document.addEventListener('keydown', (e) => {
							if (e.key === 'Escape') {
								window.electron.ipcRenderer.send('capture-cancel');
							}
						});
					</script>
				</body>
				</html>
			`;

			// HTMLを一時ファイルとして保存
			const tempPath = join(tmpdir(), 'capture.html');
			writeFileSync(tempPath, captureHtml);
			captureWindow.loadFile(tempPath);

			// スクリーンショットをキャプチャウィンドウに送信
			captureWindow.webContents.on('did-finish-load', () => {
				const screenshot = sources[0].thumbnail;
				const base64Data = `data:image/png;base64,${screenshot.toPNG().toString('base64')}`;
				captureWindow.webContents.postMessage('screenshot', { type: 'screenshot', data: base64Data });
			});

			// 範囲選択完了を待つPromise
			return new Promise((resolve) => {
				// 範囲選択完了のハンドラー
				ipcMain.once('capture-selection', (event, rect) => {
					try {
						// 選択範囲でスクリーンショットをクロップ
						const screenshot = sources[0].thumbnail;
						const cropped = screenshot.crop(rect);
						const croppedBase64 = `data:image/png;base64,${cropped.toPNG().toString('base64')}`;

						captureWindow.close();
						mainWindow?.show();
						resolve({
							fileName: `capture_${Date.now()}.png`,
							fileData: croppedBase64,
							fileSize: cropped.toPNG().length,
							mimeType: 'image/png'
						});
					} catch (error) {
						console.error('Crop error:', error);
						captureWindow.close();
						mainWindow?.show();
						resolve(null);
					}
				});

				// キャンセルのハンドラー
				ipcMain.once('capture-cancel', () => {
					captureWindow.close();
					mainWindow?.show();
					resolve(null);
				});

				// ウィンドウが閉じられた場合
				captureWindow.on('closed', () => {
					mainWindow?.show();
					resolve(null);
				});
			});
		} catch (error) {
			console.error('Capture area error:', error);
			mainWindow?.show();
			return null;
		}
	});

	createWindow();

	// 自動更新機能をセットアップ
	if (mainWindow) {
		setupAutoUpdater(mainWindow);
	}

	// タスクトレイを作成
	const iconPath = join(__dirname, '../../public/glimpse-icon3.png');
	const trayIcon = nativeImage.createFromPath(iconPath);
	tray = new Tray(trayIcon);

	// タスクトレイのツールチップ
	tray.setToolTip('Glimpse');

	// タスクトレイのコンテキストメニュー
	const contextMenu = Menu.buildFromTemplate([
		{
			label: '表示/非表示',
			click: () => {
				if (mainWindow) {
					if (mainWindow.isVisible()) {
						mainWindow.hide();
					} else {
						mainWindow.show();
						mainWindow.focus();
					}
				}
			}
		},
		{ type: 'separator' },
		{
			label: '終了',
			click: () => {
				app.quit();
			}
		}
	]);

	// タスクトレイをクリックしたときの動作
	tray.on('click', () => {
		if (mainWindow) {
			if (mainWindow.isVisible()) {
				mainWindow.hide();
			} else {
				mainWindow.show();
				mainWindow.focus();
			}
		}
	});

	// 右クリックでコンテキストメニューを表示
	tray.on('right-click', () => {
		tray?.popUpContextMenu(contextMenu);
	});

	// ALT + Spaceでウィンドウの表示/非表示を切り替えるグローバルショートカットを登録
	globalShortcut.register('Alt+Space', () => {
		if (mainWindow) {
			if (mainWindow.isVisible()) {
				mainWindow.hide();
			} else {
				mainWindow.show();
				mainWindow.focus();
			}
		}
	});

	app.on("activate", function () {
		// On macOS it's common to re-create a window in the app when the
		// dock icon is clicked and there are no other windows open.
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
	// タスクトレイがある場合はアプリを終了しない
	if (process.platform !== "darwin" && !tray) {
		app.quit();
	}
});

// アプリケーション終了時にグローバルショートカットを解除
app.on("will-quit", () => {
	globalShortcut.unregisterAll();
	if (tray) {
		tray.destroy();
	}
});

// In this file you can include the rest of your app"s main process
// code. You can also put them in separate files and require them here.
