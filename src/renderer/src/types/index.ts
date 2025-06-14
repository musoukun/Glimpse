// ユーザー関連の型
export interface User {
	uid: string;
	email: string | null;
	displayName: string | null;
	photoURL: string | null;
}

// AI プロバイダー関連の型
export interface AIProvider {
	id: string;
	name: string;
	enabled: boolean;
	apiKey?: string;
}

// メッセージ関連の型
export interface Message {
	id: string;
	content: string;
	role: "user" | "assistant";
	timestamp: Date;
	attachments?: Attachment[];
	isError?: boolean;
}

// 添付ファイル関連の型
export interface Attachment {
	id: string;
	name: string;
	data: string; // base64 encoded data
	size: number;
	type: string; // MIME type
}

// 設定関連の型
export interface UISettings {
	opacity: number;
	window_size: {
		width: number;
		height: number;
	};
	system_prompt: string;
}

export interface AppSettings {
	ui: UISettings;
	providers: AIProvider[];
	llmProvider: LLMProvider;
	systemPrompt: string;
	temperature: number;
	maxTokens: number;
}

// API レスポンス関連の型
export interface APIResponse {
	success: boolean;
	data?: unknown;
	error?: string;
}

// 使用量関連の型
export interface UsageInfo {
	current: number;
	limit: number;
	period: string;
}

export interface LLMProvider {
	name: string;
	apiKey: string;
	model: string;
	endpoint?: string;
}
