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
	
	// OAuth認証関連のAPI（後方互換性）
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
	closeWindow: () => ipcRenderer.invoke("window:close"),
	resizeWindow: (size: string) => ipcRenderer.invoke("window:resize", size),
	toggleWindowVisibility: () =>
		ipcRenderer.invoke("window:toggle-visibility"),
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
