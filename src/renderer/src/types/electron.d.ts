/* eslint-disable @typescript-eslint/no-explicit-any */
// Electron APIの型定義
export interface ElectronAPI {
	closeApp: () => void;
	resizeWindow: (size: string) => Promise<boolean>;
	openExternal: (url: string) => Promise<void>;
}

export interface IElectronAPI {
	openExternal: (url: string) => Promise<void>
}

export interface IApi {
	// AI関連
	callAI: (prompt: string, options?: Record<string, unknown>) => Promise<unknown>
	
	// 設定関連
	getSettings: () => Promise<Record<string, unknown>>
	setSettings: (settings: Record<string, unknown>) => Promise<void>
	
	// Supabase Auth関連
	openAuthWindow: (provider: string) => Promise<{
		success: any;
		session: any; error: any | null 
}>
	authSuccess: (authData: any) => Promise<boolean>
	authSignOut: () => Promise<boolean>
	
	// 外部URLを開く
	openExternal: (url: string) => Promise<boolean>
	
	// ファイル関連
	selectFile: () => Promise<{
		fileName: string
		fileData: string
		fileSize: number
		mimeType: string
	} | null>
	readFile: (filePath: string) => Promise<string>
	
	// スクリーンショット関連
	getScreenSources: () => Promise<unknown>
	captureScreen: (sourceId: string) => Promise<unknown>
	takeScreenshot: () => Promise<string>
	captureArea: () => Promise<{
		fileName: string
		fileData: string
		fileSize: number
		mimeType: string
	} | null>
	
	// ウィンドウ関連
	minimizeWindow: () => Promise<void>
	maximizeWindow: () => Promise<void>
	closeWindow: () => Promise<void>
	resizeWindow: (size: string) => Promise<boolean>
	toggleWindowVisibility: () => Promise<void>
	
	// 更新関連
	checkForUpdate: () => Promise<{ success: boolean; data?: any; error?: string }>
	downloadUpdate: () => Promise<{ success: boolean; error?: string }>
	installUpdate: () => Promise<{ success: boolean; restart: boolean; error?: string }>
	
	// 更新イベントのリスナー
	onUpdateChecking: (callback: () => void) => void
	onUpdateAvailable: (callback: (info: UpdateInfo) => void) => void
	onUpdateNotAvailable: (callback: () => void) => void
	onUpdateDownloadProgress: (callback: (progress: UpdateProgress) => void) => void
	onUpdateDownloaded: (callback: () => void) => void
	onUpdateError: (callback: (error: string) => void) => void
	
	// リスナーの削除
	removeAllUpdateListeners: () => void
	
	// ショートカット関連
	updateGlobalShortcut: (shortcut: string) => Promise<boolean>
}

export interface UpdateInfo {
	version: string
	releaseDate: string
	releaseNotes?: string
}

export interface UpdateProgress {
	bytesPerSecond: number
	percent: number
	transferred: number
	total: number
}

declare global {
	interface Window {
		electron: IElectronAPI
		api: IApi
	}
}

export {};
