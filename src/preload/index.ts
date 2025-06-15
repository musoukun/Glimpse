/* eslint-disable @typescript-eslint/no-explicit-any */
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

	// Supabase Auth関連のAPI
	openAuthWindow: (provider: string) => ipcRenderer.invoke("auth:open-window", provider),
	authSuccess: (authData: any) => ipcRenderer.invoke("auth:success", authData),
	authSignOut: () => ipcRenderer.invoke("auth:signout"),
	
	// 外部URLを開くAPI
	openExternal: (url: string) => ipcRenderer.invoke("oauth:open-external", url),

	// ファイル関連のAPI
	selectFile: () => ipcRenderer.invoke("file:select"),
	readFile: (filePath: string) => ipcRenderer.invoke("read-file", filePath),

	// スクリーンショット関連のAPI
	getScreenSources: () => ipcRenderer.invoke("get-screen-sources"),
	captureScreen: (sourceId: string) =>
		ipcRenderer.invoke("capture-screen", sourceId),

	// スクリーンショット機能
	takeScreenshot: () => ipcRenderer.invoke("take-screenshot"),
	captureArea: () => ipcRenderer.invoke("capture-area"),

	// ウィンドウ関連のAPI
	minimizeWindow: () => ipcRenderer.invoke("minimize-window"),
	maximizeWindow: () => ipcRenderer.invoke("maximize-window"),
	closeWindow: () => ipcRenderer.invoke("window:close"),
	resizeWindow: (size: string) => ipcRenderer.invoke("window:resize", size),
	toggleWindowVisibility: () =>
		ipcRenderer.invoke("window:toggle-visibility"),
		
	// 更新関連のAPI
	checkForUpdate: () => ipcRenderer.invoke("update:check"),
	downloadUpdate: () => ipcRenderer.invoke("update:download"),
	installUpdate: () => ipcRenderer.invoke("update:install"),
	
	// ショートカット関連のAPI
	updateGlobalShortcut: (shortcut: string) => ipcRenderer.invoke("update-global-shortcut", shortcut),
	
	// 更新イベントのリスナー
	onUpdateChecking: (callback: () => void) => {
		ipcRenderer.on("update:checking", callback);
	},
	onUpdateAvailable: (callback: (info: any) => void) => {
		ipcRenderer.on("update:available", (_event, info) => callback(info));
	},
	onUpdateNotAvailable: (callback: () => void) => {
		ipcRenderer.on("update:not-available", callback);
	},
	onUpdateDownloadProgress: (callback: (progress: any) => void) => {
		ipcRenderer.on("update:download-progress", (_event, progress) => callback(progress));
	},
	onUpdateDownloaded: (callback: () => void) => {
		ipcRenderer.on("update:downloaded", callback);
	},
	onUpdateError: (callback: (error: string) => void) => {
		ipcRenderer.on("update:error", (_event, error) => callback(error));
	},
	
	// リスナーの削除
	removeAllUpdateListeners: () => {
		ipcRenderer.removeAllListeners("update:checking");
		ipcRenderer.removeAllListeners("update:available");
		ipcRenderer.removeAllListeners("update:not-available");
		ipcRenderer.removeAllListeners("update:download-progress");
		ipcRenderer.removeAllListeners("update:downloaded");
		ipcRenderer.removeAllListeners("update:error");
	},
	
	// 汎用的なinvokeメソッド（開発テスト用）
	invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
};

console.log("Preload: Starting API exposure");
console.log("Preload: process.contextIsolated =", process.contextIsolated);

if (process.contextIsolated) {
	try {
		console.log("Preload: Exposing APIs via contextBridge");
		console.log("Preload: API object:", api);
		
		contextBridge.exposeInMainWorld("electron", electronAPI);
		contextBridge.exposeInMainWorld("api", api);
		
		console.log("Preload: APIs exposed successfully");
		
		// 公開されたAPIを確認
		console.log("Preload: Verifying API exposure...");
	} catch (error) {
		console.error("Preload: Error exposing APIs:", error);
		
	}
} else {
	console.log("Preload: Context isolation disabled, adding to window");
	(window as any).electron = electronAPI;
	(window as any).api = api;
	console.log("Preload: APIs added to window object");
}

// DOMContentLoadedイベントでAPIの確認
window.addEventListener('DOMContentLoaded', () => {
	console.log("Preload: DOMContentLoaded - checking API availability");
	console.log("Preload: window.api =", (window as any).api);
	console.log("Preload: window.api.resizeWindow =", (window as any).api?.resizeWindow);
});
