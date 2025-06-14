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
	openAuthWindow: (provider: string) => Promise<{ error: any | null }>
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
}

declare global {
	interface Window {
		electron: IElectronAPI
		api: IApi
	}
}

export {};
