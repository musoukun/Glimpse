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
	
	  // OAuth認証関連（BrowserWindow方式）
  openOAuthWindow: (oauthUrl: string) => Promise<{ success: boolean; session?: { access_token: string; refresh_token: string | null; user: { id: string } }; error?: string }>
  openFirebaseOAuthWindow: () => Promise<{ success: boolean; user?: { uid: string; email: string | null; displayName: string | null }; error?: string }>
  openExternal: (url: string) => Promise<boolean>
	
	// Firebase関連（後方互換性のため保持）
	firebaseAuth: (action: string, data?: Record<string, unknown>) => Promise<unknown>
	firebaseStore: (action: string, data?: Record<string, unknown>) => Promise<unknown>
	
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
}

declare global {
	interface Window {
		electron: IElectronAPI
		api: IApi
	}
}

export {};
