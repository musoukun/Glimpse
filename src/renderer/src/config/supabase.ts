/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@supabase/supabase-js";

// Supabase設定（環境変数から取得）
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kafgcovlbmatojtzlxkv.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// デバッグ情報
console.log('Supabase初期化:', { supabaseUrl, hasAnonKey: !!supabaseAnonKey });

// カスタムストレージアダプター（Electron環境でのセッション永続化）
const customStorage = {
	getItem: (key: string) => {
		try {
			const value = window.localStorage.getItem(key);
			console.log(`Storage get: ${key}`, value ? 'found' : 'not found');
			return value;
		} catch (error) {
			console.error('Storage get error:', error);
			return null;
		}
	},
	setItem: (key: string, value: string) => {
		try {
			window.localStorage.setItem(key, value);
			console.log(`Storage set: ${key}`, 'success');
		} catch (error) {
			console.error('Storage set error:', error);
		}
	},
	removeItem: (key: string) => {
		try {
			window.localStorage.removeItem(key);
			console.log(`Storage remove: ${key}`, 'success');
		} catch (error) {
			console.error('Storage remove error:', error);
		}
	},
};

// Supabaseクライアントを作成
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		autoRefreshToken: true,
		persistSession: true,
		detectSessionInUrl: true,
		// Electronでのリダイレクト対応
		flowType: 'pkce',
		storage: customStorage,
		storageKey: 'glimpse-auth',
	},
});

// Electron環境でのOAuth認証コールバック処理
if (window.electron && window.api) {
	// メインプロセスからのコールバックを受信
	// NOTE: ElectronのIPCイベントリスナーの処理
	// @ts-ignore - Electron APIの型定義の問題を回避
	const ipcOn = window.electron?.on || window.electron?.ipcRenderer?.on;
	if (ipcOn) {
		ipcOn('auth:callback', async (_event: any, url: string) => {
			console.log('Received auth callback:', url);
		
		try {
			// URLからアクセストークンを抽出
			const urlParams = new URLSearchParams(url.split('#')[1]);
			const access_token = urlParams.get('access_token');
			const refresh_token = urlParams.get('refresh_token');
			
			if (access_token && refresh_token) {
				// Supabaseセッションを手動で設定
				const { data, error } = await supabase.auth.setSession({
					access_token,
					refresh_token
				});
				
				if (error) {
					console.error('Session set error:', error);
				} else {
					console.log('Session set successfully:', data);
				}
			}
		} catch (error) {
			console.error('Auth callback error:', error);
		}
		});
	}
}

// 型定義
export interface UserUsage {
	id: string;
	user_id: string;
	month: string;
	monthly_tokens: number;
	monthly_requests: number;
	created_at: string;
	updated_at: string;
}

export interface UserSubscription {
	id: string;
	user_id: string;
	stripe_customer_id?: string;
	stripe_subscription_id?: string;
	plan_type: 'free' | 'paid';
	status: 'active' | 'canceled' | 'past_due';
	current_period_start?: string;
	current_period_end?: string;
	monthly_limit: number;
	created_at: string;
	updated_at: string;
}

export interface CallHistory {
	id: string;
	user_id: string;
	prompt: string;
	response?: string;
	tokens_used: number;
	success: boolean;
	error_message?: string;
	created_at: string;
}
