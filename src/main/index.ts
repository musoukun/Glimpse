import {
	app,
	shell,
	BrowserWindow,
	ipcMain,
	dialog,
	desktopCapturer,
	globalShortcut,
	screen,
} from "electron";
import { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import { readFileSync, writeFileSync } from "fs";
import { tmpdir } from "os";

// OAuth認証のコールバックを処理するための変数
let mainWindow: BrowserWindow | null = null;
let authWindow: BrowserWindow | null = null;

function createWindow(): void {
	// Create the browser window.
	mainWindow = new BrowserWindow({
		width: 280,
		height: 400,
		show: false,
		autoHideMenuBar: true,
		frame: false, // フレームレスウィンドウ
		resizable: true, // サイズ変更を有効化
		transparent: true, // ウィンドウ透明化
		backgroundColor: "#00000001", // ほぼ透明（完全透明だとクリックできない）
		maximizable: false, // 最大化を無効化
		minimizable: true, // 最小化を有効化
		alwaysOnTop: false, // 常に最前面を無効化
		skipTaskbar: false, // タスクバーに表示
		webPreferences: {
			preload: join(__dirname, "../preload/index.mjs"),
			sandbox: false,
			contextIsolation: true,
			nodeIntegration: false,
			webSecurity: false, // Firebase認証のポップアップを許可
		},
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
		// Firebase認証のポップアップを許可
		if (details.url.includes('accounts.google.com') || details.url.includes('firebase')) {
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

// Firebase OAuth認証ウィンドウを開く関数
async function createFirebaseOAuthWindow(): Promise<{ success: boolean; user?: { uid: string; email: string | null; displayName: string | null }; error?: string }> {
	return new Promise((resolve) => {
		// Firebase OAuth認証用のウィンドウを作成
		const authWindow = new BrowserWindow({
			width: 500,
			height: 600,
			show: true,
			modal: true,
			parent: mainWindow || undefined,
			webPreferences: {
				nodeIntegration: false,
				contextIsolation: true,
			},
		});

		// Firebase OAuth URLを構築（正しいGoogle OAuth URL）
		// 注意: 実際のGoogle Client IDを設定する必要があります
		const clientId = '288565820334-xxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com'; // Google Cloud Consoleから取得したClient ID
		const redirectUri = 'https://glimpse-dfe44.firebaseapp.com/__/auth/handler';
		const firebaseOAuthUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&state=firebase-auth`;

		console.log('Firebase OAuth URL:', firebaseOAuthUrl);

		// Firebase OAuth認証ページを読み込み
		authWindow.loadURL(firebaseOAuthUrl);

		// URLの変更を監視してコールバックを処理
		authWindow.webContents.on('will-navigate', (event, url) => {
			handleFirebaseAuthCallback(url, authWindow, resolve);
		});

		authWindow.webContents.on('did-navigate', (event, url) => {
			handleFirebaseAuthCallback(url, authWindow, resolve);
		});

		// ウィンドウが閉じられた場合の処理
		authWindow.on('closed', () => {
			resolve({ success: false, error: 'ユーザーによって認証がキャンセルされました' });
		});
	});
}

// OAuth認証ウィンドウを開く関数
async function createOAuthWindow(oauthUrl: string): Promise<{ success: boolean; session?: { access_token: string; refresh_token: string | null; user: { id: string } }; error?: string }> {
	return new Promise((resolve) => {
		// OAuth認証用のウィンドウを作成
		const authWindow = new BrowserWindow({
			width: 500,
			height: 600,
			show: true,
			modal: true,
			parent: mainWindow || undefined,
			webPreferences: {
				nodeIntegration: false,
				contextIsolation: true,
			},
		});

		console.log('OAuth URL:', oauthUrl);

		// OAuth認証ページを読み込み
		authWindow.loadURL(oauthUrl);

		// ウィンドウが閉じられた時の処理
		authWindow.on('closed', () => {
			resolve({ success: false, error: 'ユーザーによって認証がキャンセルされました' });
		});

		// ページの変更を監視
		authWindow.webContents.on('will-redirect', (event, navigationUrl) => {
			console.log('Redirect detected:', navigationUrl);
			handleAuthCallback(navigationUrl, authWindow, resolve);
		});

		authWindow.webContents.on('did-navigate', (event, navigationUrl) => {
			console.log('Navigation detected:', navigationUrl);
			handleAuthCallback(navigationUrl, authWindow, resolve);
		});
	});
}

// Firebase認証コールバックを処理する関数
function handleFirebaseAuthCallback(
	url: string, 
	authWindow: BrowserWindow, 
	resolve: (value: { success: boolean; user?: { uid: string; email: string | null; displayName: string | null }; error?: string }) => void
) {
	console.log('Firebase callback URL:', url);

	// Firebase認証の成功を検出（認証コードを取得）
	if (url.includes('glimpse-dfe44.firebaseapp.com') && url.includes('code=')) {
		try {
			// URLから認証コードを抽出
			const urlParams = new URLSearchParams(url.split('?')[1]);
			const code = urlParams.get('code');
			const state = urlParams.get('state');

			if (code && state === 'firebase-auth') {
				console.log('Firebase認証コード取得成功:', { code: code.substring(0, 10) + '...' });
				
				// 認証コードを使用してFirebaseトークンを取得
				// 実際の実装では、ここでFirebase Auth REST APIを呼び出してトークンを取得します
				const user = {
					uid: 'firebase-user-' + Date.now(),
					email: 'user@example.com',
					displayName: 'Firebase User'
				};

				authWindow.close();
				resolve({ success: true, user });
				return;
			}
		} catch (error) {
			console.error('Firebase認証コード処理エラー:', error);
		}
	}

	// エラーの検出
	if (url.includes('error')) {
		const urlParams = new URLSearchParams(url.split('?')[1]);
		const error = urlParams.get('error') || 'Firebase認証エラー';
		console.error('Firebase認証エラー:', error);
		authWindow.close();
		resolve({ success: false, error });
	}
}

// OAuth認証コールバックを処理する関数
function handleAuthCallback(
	url: string, 
	authWindow: BrowserWindow, 
	resolve: (value: { success: boolean; session?: { access_token: string; refresh_token: string | null; user: { id: string } }; error?: string }) => void
) {
	// コールバックURLかどうかをチェック
	if (url.includes('/auth/v1/callback') || url.includes('access_token=')) {
		console.log('OAuth callback detected:', url);
		
		try {
			// URLからトークンを抽出
			const urlObj = new URL(url.replace('#', '?'));
			const accessToken = urlObj.searchParams.get('access_token');
			const refreshToken = urlObj.searchParams.get('refresh_token');
			const error = urlObj.searchParams.get('error');
			const errorDescription = urlObj.searchParams.get('error_description');

			if (error) {
				authWindow.close();
				resolve({ success: false, error: `OAuth認証エラー: ${error} - ${errorDescription}` });
				return;
			}

			if (accessToken) {
				// 認証成功
				const session = {
					access_token: accessToken,
					refresh_token: refreshToken,
					user: { id: 'temp-user-id' } // 実際のユーザー情報は後で取得
				};

				authWindow.close();
				resolve({ success: true, session });
				return;
			}
		} catch (error) {
			console.error('OAuth callback processing error:', error);
			authWindow.close();
			resolve({ success: false, error: 'OAuth認証の処理中にエラーが発生しました' });
		}
	}
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
	// Set app user model id for windows
	electronApp.setAppUserModelId("com.electron");

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

	// Firebase OAuth認証ウィンドウを開くIPCハンドラー
	ipcMain.handle('firebase:oauth-window', async () => {
		try {
			console.log('Firebase OAuth window opening...');
			const result = await createFirebaseOAuthWindow();
			console.log('Firebase OAuth result:', result);
			return result;
		} catch (error) {
			console.error('Firebase OAuth window error:', error);
			return { success: false, error: 'Firebase OAuth認証ウィンドウの作成に失敗しました' };
		}
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
		console.log(`ウィンドウサイズを${size}(${width}x${height})に変更`);
		return true;
	});

	// ウィンドウを閉じるIPCハンドラー
	ipcMain.handle("window:close", async (event) => {
		const window = BrowserWindow.fromWebContents(event.sender);
		if (!window) return;
		window.close();
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
	if (process.platform !== "darwin") {
		app.quit();
	}
});

// アプリケーション終了時にグローバルショートカットを解除
app.on("will-quit", () => {
	globalShortcut.unregisterAll();
});

// In this file you can include the rest of your app"s main process
// code. You can also put them in separate files and require them here.
