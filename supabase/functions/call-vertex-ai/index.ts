/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// Vertex AI Edge Function
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from '@supabase/supabase-js'
import { GoogleAuth } from 'google-auth-library'

console.log("Call Vertex AI Edge Function started")

// 環境変数
const supabaseUrl = Deno.env.get("SUPABASE_URL")!
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const gcpProjectId = Deno.env.get("GCP_PROJECT_ID")!
const gcpLocation = Deno.env.get("GCP_LOCATION") || "us-central1"
const gcpServiceAccountKey = Deno.env.get("GCP_SERVICE_ACCOUNT_KEY")! // JSON文字列として保存

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 使用制限の定数
const MONTHLY_LIMIT = 50

interface CallRequest {
	message: string
	images?: string[] // Base64エンコードされた画像データ
	systemPrompt?: string // システムプロンプト
	enableGrounding?: boolean // グラウンディングを有効化するかどうか
	groundingMaxTokens?: number // Google検索結果用の最大トークン数
}

interface VertexAIResponse {
	candidates: Array<{
		content: {
			parts: Array<{
				text?: string
			}>
			role: string
		}
		finishReason: string
		safetyRatings?: Array<{
			category: string
			probability: string
		}>
	}>
	usageMetadata?: {
		promptTokenCount: number
		candidatesTokenCount: number
		totalTokenCount: number
	}
}

// Supabaseトークンを検証してユーザー情報を取得する関数
async function verifySupabaseToken(token: string): Promise<{ uid: string; email?: string } | null> {
	try {
		// Supabaseのgetuser APIを使用してトークンを検証
		const { data: { user }, error } = await supabase.auth.getUser(token)
		
		if (error || !user) {
			console.error('Supabase token verification error:', error)
			return null
		}

		return {
			uid: user.id,
			email: user.email
		}
	} catch (error) {
		console.error('Supabase token verification error:', error)
		return null
	}
}

// Google Cloud認証を取得
// キャッシュして再利用する
let cachedAuth: GoogleAuth | null = null

async function getGoogleAuth(): Promise<GoogleAuth> {
	if (cachedAuth) {
		return cachedAuth
	}
	
	try {
		console.log("Parsing GCP service account key...")
		const credentials = JSON.parse(gcpServiceAccountKey)
		console.log("Service account email:", credentials.client_email)
		console.log("Project ID:", gcpProjectId)
		
		// Vertex AI専用のスコープに限定
		const auth = new GoogleAuth({
			credentials,
			projectId: gcpProjectId,
			scopes: ['https://www.googleapis.com/auth/cloud-platform']
		})
		
		cachedAuth = auth
		return auth
	} catch (error) {
		console.error("Failed to initialize Google Auth:", error)
		if (error instanceof Error) {
			console.error("Error details:", error.message)
			console.error("Error stack:", error.stack)
		}
		throw error
	}
}

// Vertex AI APIを呼び出す関数
async function callVertexAI(
	message: string,
	images: string[] = [],
	systemPrompt?: string,
	enableGrounding: boolean = false,
	groundingMaxTokens: number = 512
): Promise<string> {
	try {
		console.log("Calling Vertex AI with message length:", message.length)
		
		const auth = await getGoogleAuth()
		const client = await auth.getClient()
		const accessToken = await client.getAccessToken()
		
		console.log("Got access token:", !!accessToken.token)

		// システムプロンプトをユーザーメッセージに統合
		let finalMessage = message
		if (systemPrompt) {
			// グラウンディング有効時は特別な指示を追加
			if (enableGrounding) {
				finalMessage = `${systemPrompt}

重要: 検索結果を使用する場合でも、必ず指定された文字数制限を守ってください。簡潔で要点を絞った回答をしてください。

${message}`
			} else {
				finalMessage = `${systemPrompt}\n\n${message}`
			}
		}

		// Gemini用のコンテンツ構築
		const parts: any[] = [{ text: finalMessage }]
		
		console.log(`Processing ${images?.length || 0} images`)
		
		if (images.length > 0) {
			images.forEach((img, index) => {
				console.log(`Processing image ${index + 1}, length: ${img.length}, starts with data: ${img.startsWith('data:')}`)
				// Base64データからMIMEタイプとデータを抽出
				if (img.startsWith('data:')) {
					const [mimeInfo, base64Data] = img.split(',')
					const mimeType = mimeInfo.match(/data:([^;]+)/)?.[1] || 'image/jpeg'
					
					console.log(`Image ${index + 1} - MIME type: ${mimeType}, Base64 length: ${base64Data.length}`)
					
					parts.push({
						inlineData: {
							mimeType,
							data: base64Data
						}
					})
				} else {
					console.log(`Image ${index + 1} - Using raw data, length: ${img.length}`)
					parts.push({
						inlineData: {
							mimeType: 'image/jpeg',
							data: img
						}
					})
				}
			})
		}

		// コンテンツを作成（systemロールはサポートされていないためuserロールのみ）
		const contents = [{
			role: 'user',
			parts
		}]

		// グラウンディング用のツール設定（修正版）
		const tools = enableGrounding ? [{
			google_search: {}
		}] : undefined

		// 新しいGemini API形式のリクエストボディ
		const requestBody = {
			contents,
			...(tools && { tools }),
			generationConfig: {
				temperature: 0.7,
				topK: 40,
				topP: 0.95,
				// グラウンディング有効時はユーザー設定を使用
				maxOutputTokens: enableGrounding ? groundingMaxTokens : 2048,
				stopSequences: []
			},
			safetySettings: [
				{
					category: "HARM_CATEGORY_HARASSMENT",
					threshold: "BLOCK_MEDIUM_AND_ABOVE"
				},
				{
					category: "HARM_CATEGORY_HATE_SPEECH",
					threshold: "BLOCK_MEDIUM_AND_ABOVE"
				},
				{
					category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
					threshold: "BLOCK_MEDIUM_AND_ABOVE"
				},
				{
					category: "HARM_CATEGORY_DANGEROUS_CONTENT",
					threshold: "BLOCK_MEDIUM_AND_ABOVE"
				}
			]
		}

		// Vertex AI エンドポイント - generateContentを使用
		// Gemini 2.0 Flashを使用（新しいプロジェクトで利用可能）
		const endpoint = `https://${gcpLocation}-aiplatform.googleapis.com/v1/projects/${gcpProjectId}/locations/${gcpLocation}/publishers/google/models/gemini-2.0-flash-001:generateContent`
		
		console.log("Calling Vertex AI endpoint:", endpoint)
		console.log("GCP Location:", gcpLocation)
		console.log("Request body parts count:", contents[0].parts.length)
		console.log("Grounding enabled:", enableGrounding)
		console.log("Request body structure:", JSON.stringify(requestBody, (key, value) => {
			if (key === 'data' && typeof value === 'string' && value.length > 100) {
				return `[Base64 data - ${value.length} chars]`
			}
			return value
		}, 2))

		const response = await fetch(endpoint, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${accessToken.token}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(requestBody)
		})

		if (!response.ok) {
			const errorText = await response.text()
			console.error("Vertex AI API エラー:", errorText)
			console.error("Response status:", response.status)
			console.error("Response headers:", Object.fromEntries(response.headers.entries()))
			
			// エラーメッセージを解析
			try {
				const errorData = JSON.parse(errorText)
				if (errorData.error) {
					throw new Error(`Vertex AI API エラー: ${errorData.error.message || errorText}`)
				}
			} catch (e) {
				// JSONパースエラーの場合はそのままテキストを使用
			}
			
			throw new Error(`Vertex AI API エラー: ${response.status} - ${errorText}`)
		}

		const data = await response.json()
		console.log("Vertex AI response received:", JSON.stringify(data, null, 2))

		// 新しいレスポンス形式に対応
		if (!data.candidates || data.candidates.length === 0) {
			throw new Error("Vertex AI APIからの応答が無効です")
		}

		const candidate = data.candidates[0]
		if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
			throw new Error("Vertex AI APIからのコンテンツが無効です")
		}

		// 複数のパーツがある場合は全て結合する（改行を保持）
		const fullText = candidate.content.parts
			.map(part => part.text || '')
			.filter(text => text.length > 0)
			.join('\n')

		return fullText
	} catch (error) {
		console.error("Vertex AI call failed:", error)
		if (error instanceof Error) {
			console.error("Error stack:", error.stack)
		}
		throw error
	}
}

// ユーザーの使用量をチェックする関数
async function checkUsageLimit(userId: string): Promise<boolean> {
	const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format

	// サブスクリプション情報を取得
	const { data: subscription } = await supabase
		.from("user_subscriptions")
		.select("plan_type, monthly_limit")
		.eq("user_id", userId)
		.single()

	// 使用量を取得
	const { data: usage } = await supabase
		.from("user_usage")
		.select("monthly_requests")
		.eq("user_id", userId)
		.eq("month", currentMonth)
		.single()

	const limit = subscription?.monthly_limit || MONTHLY_LIMIT
	const used = usage?.monthly_requests || 0

	return used < limit
}

// 使用量を更新する関数
async function updateUsage(userId: string): Promise<void> {
	const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format

	// 使用量レコードをupsert
	const { data: existingUsage } = await supabase
		.from("user_usage")
		.select("monthly_requests")
		.eq("user_id", userId)
		.eq("month", currentMonth)
		.single()

	if (existingUsage) {
		// 既存レコードを更新
		const { error } = await supabase
			.from("user_usage")
			.update({
				monthly_requests: existingUsage.monthly_requests + 1
			})
			.eq("user_id", userId)
			.eq("month", currentMonth)

		if (error) {
			console.error("使用量更新エラー:", error)
			throw new Error("使用量の更新に失敗しました")
		}
	} else {
		// 新規レコードを作成
		const { error } = await supabase
			.from("user_usage")
			.insert({
				user_id: userId,
				month: currentMonth,
				monthly_requests: 1
			})

		if (error) {
			console.error("使用量作成エラー:", error)
			throw new Error("使用量の作成に失敗しました")
		}
	}
}

// ユーザーのサブスクリプション情報を初期化する関数
async function initializeUserSubscription(userId: string): Promise<void> {
	const { error } = await supabase
		.from('user_subscriptions')
		.upsert({
			user_id: userId,
			plan_type: 'free',
			status: 'active',
			monthly_limit: 50
		}, {
			onConflict: 'user_id',
			ignoreDuplicates: true
		})

	if (error) {
		console.error('Subscription initialization error:', error)
	}
}

// 通話履歴を記録する関数
async function recordCallHistory(
	userId: string,
	prompt: string,
	response: string,
	success: boolean,
	errorMessage?: string
): Promise<void> {
	const { error } = await supabase.from("call_history").insert({
		user_id: userId,
		prompt: prompt.substring(0, 1000), // プロンプトを1000文字に制限
		response: response ? response.substring(0, 2000) : null, // レスポンスを2000文字に制限
		success,
		error_message: errorMessage,
		tokens_used: 0 // 今後実装予定
	})

	if (error) {
		console.error("通話履歴記録エラー:", error)
		// 履歴記録の失敗は致命的ではないので、エラーを投げない
	}
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
		// 環境変数の確認
		console.log("Environment check:", {
			hasSupabaseUrl: !!supabaseUrl,
			hasSupabaseKey: !!supabaseServiceKey,
			hasGcpProjectId: !!gcpProjectId,
			hasGcpServiceAccountKey: !!gcpServiceAccountKey,
			gcpProjectId,
			gcpLocation
		})
		// 認証の確認
		const authHeader = req.headers.get("Authorization")
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return new Response(
				JSON.stringify({ error: "認証が必要です" }),
				{
					status: 401,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				}
			)
		}

		// Supabaseトークンを検証
		const token = authHeader.replace("Bearer ", "")
		const supabaseUser = await verifySupabaseToken(token)

		if (!supabaseUser) {
			return new Response(
				JSON.stringify({ error: "無効な認証トークンです" }),
				{
					status: 401,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				}
			)
		}

		// ユーザーのサブスクリプション情報を初期化
		await initializeUserSubscription(supabaseUser.uid)

		// リクエストボディの解析
		const requestData: CallRequest = await req.json()
		const { message, images = [], systemPrompt, enableGrounding = true, groundingMaxTokens = 512 } = requestData

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
		const canUse = await checkUsageLimit(supabaseUser.uid)
		if (!canUse) {
			return new Response(
				JSON.stringify({
					error: `月間使用制限（${MONTHLY_LIMIT}回）に達しました。有料プラン（$4/月）にアップグレードしてください。`,
				}),
				{
					status: 429,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				}
			)
		}

		// Vertex AI APIの呼び出し
		const vertexResponse = await callVertexAI(message, images, systemPrompt, enableGrounding, groundingMaxTokens)

		// 使用量の更新
		await updateUsage(supabaseUser.uid)

		// 通話履歴の記録
		await recordCallHistory(supabaseUser.uid, message, vertexResponse, true)

		return new Response(
			JSON.stringify({
				text: vertexResponse,
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
			if (authHeader && authHeader.startsWith("Bearer ")) {
				const token = authHeader.replace("Bearer ", "")
				const supabaseUser = await verifySupabaseToken(token)
				if (supabaseUser) {
					const requestData = await req.json().catch(() => ({ message: "" }))
					await recordCallHistory(
						supabaseUser.uid,
						requestData.message || "",
						"",
						false,
						error instanceof Error ? error.message : "不明なエラー"
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
