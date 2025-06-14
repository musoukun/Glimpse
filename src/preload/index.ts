import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";

// Custom APIs for renderer
const api = {
	// AI関連のAPI
	callAI: (prompt: string, options?: Record<string, unknown>) =>
		ipcRenderer.invoke("call-ai", prompt, options),

	// 設定関連のAPI
	getSettings: () => ipcRenderer.invoke("get-settings"),
	setSettings: (settings: Record<string, unknown>) =>
		ipcRenderer.invoke("set-settings", settings),

	// OAuth認証関連のAPI（BrowserWindow方式）
	openOAuthWindow: (oauthUrl: string) => ipcRenderer.invoke("oauth:open-window", oauthUrl),
	openFirebaseOAuthWindow: () => ipcRenderer.invoke("firebase:oauth-window"),
	openExternal: (url: string) => ipcRenderer.invoke("oauth:open-external", url),

	// Firebase関連のAPI（後方互換性のため保持）
	firebaseAuth: (action: string, data?: Record<string, unknown>) =>
		ipcRenderer.invoke("firebase:auth", action, data),
	firebaseStore: (action: string, data?: Record<string, unknown>) =>
		ipcRenderer.invoke("firebase:store", action, data),

	// ファイル関連のAPI
	selectFile: () => ipcRenderer.invoke("select-file"),
	readFile: (filePath: string) => ipcRenderer.invoke("read-file", filePath),

	// スクリーンショット関連のAPI
	getScreenSources: () => ipcRenderer.invoke("get-screen-sources"),
	captureScreen: (sourceId: string) =>
		ipcRenderer.invoke("capture-screen", sourceId),

	// スクリーンショット機能
	takeScreenshot: () => ipcRenderer.invoke("take-screenshot"),

	// ウィンドウ関連のAPI
	minimizeWindow: () => ipcRenderer.invoke("minimize-window"),
	maximizeWindow: () => ipcRenderer.invoke("maximize-window"),
	closeWindow: () => ipcRenderer.invoke("close-window"),
	resizeWindow: (size: string) => ipcRenderer.invoke("window:resize", size),
	toggleWindowVisibility: () =>
		ipcRenderer.invoke("window:toggle-visibility"),
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
	try {
		contextBridge.exposeInMainWorld("electron", electronAPI);
		contextBridge.exposeInMainWorld("api", api);
	} catch (error) {
		console.error(error);
	}
} else {
	// @ts-ignore (define in dts)
	window.electron = electronAPI;
	// @ts-ignore (define in dts)
	window.api = api;
}
