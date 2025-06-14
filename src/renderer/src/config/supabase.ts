import { createClient } from "@supabase/supabase-js";

// Supabase設定（環境変数から取得）
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kafgcovlbmatojtzlxkv.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// デバッグ情報
console.log('Supabase初期化:', { supabaseUrl, hasAnonKey: !!supabaseAnonKey });

// Supabaseクライアントを作成
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		autoRefreshToken: true,
		persistSession: true,
		detectSessionInUrl: true,
		// Electronでのリダイレクト対応
		flowType: 'pkce',
		storage: window.localStorage,
	},
});

// Electron環境でのOAuth認証コールバック処理
if (window.electron && window.api) {
	// メインプロセスからのコールバックを受信
	window.electron.ipcRenderer.on('auth:callback', async (event, url) => {
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
