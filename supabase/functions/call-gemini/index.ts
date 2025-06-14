// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { createClient } from 'npm:@supabase/supabase-js@2'

console.log("Call Gemini Edge Function started")

// Supabaseクライアントの初期化
const supabaseUrl = Deno.env.get("SUPABASE_URL")!
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const geminiApiKey = Deno.env.get("GEMINI_API_KEY")!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 使用制限の定数
const MONTHLY_LIMIT = 50

interface CallRequest {
	message: string
	attachments?: Array<{
		type: "image" | "text"
		content: string
		name?: string
	}>
}

interface GeminiResponse {
	candidates: Array<{
		content: {
			parts: Array<{
				text: string
			}>
		}
	}>
}

// ユーザーの使用量をチェックする関数
async function checkUsageLimit(userId: string): Promise<boolean> {
	const currentDate = new Date()
	const currentMonth = currentDate.getMonth() + 1
	const currentYear = currentDate.getFullYear()

	const { data, error } = await supabase
		.from("user_usage")
		.select("calls_used")
		.eq("user_id", userId)
		.eq("month", currentMonth)
		.eq("year", currentYear)
		.single()

	if (error && error.code !== "PGRST116") {
		// PGRST116 = レコードが見つからない
		console.error("使用量チェックエラー:", error)
		throw new Error("使用量の確認に失敗しました")
	}

	const callsUsed = data?.calls_used || 0
	return callsUsed < MONTHLY_LIMIT
}

// 使用量を更新する関数
async function updateUsage(userId: string): Promise<void> {
	const currentDate = new Date()
	const currentMonth = currentDate.getMonth() + 1
	const currentYear = currentDate.getFullYear()

	const { error } = await supabase.rpc("increment_user_usage", {
		p_user_id: userId,
		p_month: currentMonth,
		p_year: currentYear,
	})

	if (error) {
		console.error("使用量更新エラー:", error)
		throw new Error("使用量の更新に失敗しました")
	}
}

// 通話履歴を記録する関数
async function recordCallHistory(
	userId: string,
	message: string,
	response: string,
	success: boolean
): Promise<void> {
	const { error } = await supabase.from("call_history").insert({
		user_id: userId,
		message: message.substring(0, 1000), // メッセージを1000文字に制限
		response: response.substring(0, 2000), // レスポンスを2000文字に制限
		success,
		created_at: new Date().toISOString(),
	})

	if (error) {
		console.error("通話履歴記録エラー:", error)
		// 履歴記録の失敗は致命的ではないので、エラーを投げない
	}
}

// Gemini APIを呼び出す関数
async function callGeminiAPI(
	message: string,
	attachments: CallRequest["attachments"] = []
): Promise<string> {
	const parts = [{ text: message }]

	// 添付ファイルの処理（現在は未実装）
	// 将来的に画像やファイルの処理を追加する場合はここで実装

	const requestBody = {
		contents: [
			{
				parts,
			},
		],
		generationConfig: {
			temperature: 0.7,
			topK: 40,
			topP: 0.95,
			maxOutputTokens: 2048,
		},
	}

	const response = await fetch(
		`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(requestBody),
		}
	)

	if (!response.ok) {
		const errorText = await response.text()
		console.error("Gemini API エラー:", errorText)
		throw new Error(`Gemini API エラー: ${response.status}`)
	}

	const data: GeminiResponse = await response.json()

	if (!data.candidates || data.candidates.length === 0) {
		throw new Error("Gemini APIからの応答が無効です")
	}

	return data.candidates[0].content.parts[0].text
}

Deno.serve(async (req: Request) => {
	// CORSヘッダーの設定
	const corsHeaders = {
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Headers":
			"authorization, x-client-info, apikey, content-type",
		"Access-Control-Allow-Methods": "POST, OPTIONS",
	}

	// プリフライトリクエストの処理
	if (req.method === "OPTIONS") {
		return new Response(null, { headers: corsHeaders })
	}

	try {
		// 認証の確認
		const authHeader = req.headers.get("Authorization")
		if (!authHeader) {
			return new Response(
				JSON.stringify({ error: "認証が必要です" }),
				{
					status: 401,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				}
			)
		}

		// JWTトークンからユーザー情報を取得
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser(authHeader.replace("Bearer ", ""))

		if (authError || !user) {
			return new Response(
				JSON.stringify({ error: "無効な認証トークンです" }),
				{
					status: 401,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				}
			)
		}

		// リクエストボディの解析
		const requestData: CallRequest = await req.json()
		const { message, attachments } = requestData

		if (!message || message.trim().length === 0) {
			return new Response(
				JSON.stringify({ error: "メッセージが必要です" }),
				{
					status: 400,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				}
			)
		}

		// 使用制限のチェック
		const canUse = await checkUsageLimit(user.id)
		if (!canUse) {
			return new Response(
				JSON.stringify({
					error: `月間使用制限（${MONTHLY_LIMIT}回）に達しました`,
				}),
				{
					status: 429,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				}
			)
		}

		// Gemini APIの呼び出し
		const geminiResponse = await callGeminiAPI(message, attachments)

		// 使用量の更新
		await updateUsage(user.id)

		// 通話履歴の記録
		await recordCallHistory(user.id, message, geminiResponse, true)

		return new Response(
			JSON.stringify({
				response: geminiResponse,
				success: true,
			}),
			{
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			}
		)
	} catch (error) {
		console.error("Edge Function エラー:", error)

		// エラーの場合も履歴を記録（ユーザーが認証されている場合のみ）
		try {
			const authHeader = req.headers.get("Authorization")
			if (authHeader) {
				const {
					data: { user },
				} = await supabase.auth.getUser(authHeader.replace("Bearer ", ""))
				if (user) {
					const requestData = await req.json().catch(() => ({ message: "" }))
					await recordCallHistory(
						user.id,
						requestData.message || "",
						error instanceof Error ? error.message : "不明なエラー",
						false
					)
				}
			}
		} catch (historyError) {
			console.error("エラー履歴記録失敗:", historyError)
		}

		return new Response(
			JSON.stringify({
				error: error instanceof Error ? error.message : "不明なエラーが発生しました",
				success: false,
			}),
			{
				status: 500,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			}
		)
	}
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/call-gemini' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
