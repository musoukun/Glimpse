import { createClient } from "@supabase/supabase-js";

// Supabase設定（直接指定）
const supabaseUrl = 'https://kafgcovlbmatojtzlxkv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthZmdjb3ZsYm1hdG9qdHpseGt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM5NzE5NzQsImV4cCI6MjA0OTU0Nzk3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

// デバッグ情報
console.log('Supabase初期化:', { supabaseUrl, hasAnonKey: !!supabaseAnonKey });

// Supabaseクライアントを作成
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		autoRefreshToken: true,
		persistSession: true,
		detectSessionInUrl: false,
	},
});

// 型定義
export interface UserUsage {
	id: string;
	user_id: string;
	free_calls_used: number;
	subscription_status: "free" | "paid";
	stripe_customer_id?: string;
	current_period_start: string;
	current_period_end: string;
	last_call_at?: string;
	created_at: string;
	updated_at: string;
}

export interface CallHistory {
	id: string;
	user_id: string;
	prompt_length: number;
	response_length: number;
	tokens_used?: number;
	call_type: string;
	created_at: string;
}
