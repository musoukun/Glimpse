import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const GOOGLE_CLOUD_PROJECT_ID = Deno.env.get('GOOGLE_CLOUD_PROJECT_ID')
const GOOGLE_APPLICATION_CREDENTIALS = Deno.env.get('GOOGLE_APPLICATION_CREDENTIALS')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface ChatRequest {
  message: string
  images?: string[]
  systemPrompt?: string
  model?: string
}

interface UsageRecord {
  user_id: string
  tokens_used: number
  request_count: number
  created_at: string
}

serve(async (req) => {
  // CORS対応
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 認証チェック
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Supabaseクライアント作成
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // JWTトークンからユーザー情報を取得
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // サブスクリプション情報を取得
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // サブスクリプションが存在しない場合は無料プランとして作成
    let userSubscription = subscription
    if (subError && subError.code === 'PGRST116') {
      const { data: newSub, error: insertError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          plan_type: 'free',
          status: 'active',
          monthly_limit: 50
        })
        .select()
        .single()

      if (insertError) {
        console.error('Failed to create subscription:', insertError)
        return new Response(
          JSON.stringify({ error: 'Failed to initialize user subscription' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      userSubscription = newSub
    }

    // 使用量チェック
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
    const { data: usage, error: usageError } = await supabase
      .from('user_usage')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', currentMonth)
      .single()

    if (usageError && usageError.code !== 'PGRST116') {
      console.error('Usage check error:', usageError)
      return new Response(
        JSON.stringify({ error: 'Failed to check usage limits' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // 使用制限チェック
    const monthlyLimit = userSubscription?.monthly_limit || 50
    const currentUsage = usage?.monthly_requests || 0
    
    if (currentUsage >= monthlyLimit) {
      const planType = userSubscription?.plan_type || 'free'
      const errorMessage = planType === 'free' 
        ? 'Free plan limit (50 calls) exceeded. Please upgrade to continue.'
        : 'Monthly usage limit exceeded'
        
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          planType,
          currentUsage,
          monthlyLimit
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // リクエストボディを解析
    const { message, images = [], systemPrompt, model = 'gemini-2.0-flash-lite' }: ChatRequest = await req.json()

    // Vertex AI API呼び出し
    const vertexResponse = await callVertexAI({
      message,
      images,
      systemPrompt: systemPrompt || getDefaultSystemPrompt(),
      model
    })

    if (!vertexResponse.success) {
      return new Response(
        JSON.stringify({ error: vertexResponse.error }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // 使用量を記録
    await recordUsage(supabase, user.id, {
      tokens_used: vertexResponse.tokensUsed || 0,
      request_count: 1
    })

    return new Response(
      JSON.stringify({ 
        text: vertexResponse.text,
        usage: {
          tokensUsed: vertexResponse.tokensUsed,
          requestCount: 1,
          currentUsage: currentUsage + 1,
          monthlyLimit,
          planType: userSubscription?.plan_type || 'free'
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function callVertexAI({ message, images, systemPrompt, model }: {
  message: string
  images: string[]
  systemPrompt: string
  model: string
}): Promise<{ success: boolean; text?: string; tokensUsed?: number; error?: string }> {
  try {
    // Google Cloud認証情報を設定
    const credentials = JSON.parse(GOOGLE_APPLICATION_CREDENTIALS!)
    
    // アクセストークンを取得
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: await createJWT(credentials)
      })
    })

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Vertex AI APIエンドポイント
    const endpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${GOOGLE_CLOUD_PROJECT_ID}/locations/us-central1/publishers/google/models/${model}:generateContent`

    // リクエストボディを構築
    const parts: any[] = []
    
    // システムプロンプトを追加
    parts.push({ text: systemPrompt })
    
    // 画像を追加
    for (const imageData of images) {
      const [mimeInfo, base64Data] = imageData.split(',')
      const mimeType = mimeInfo.match(/data:([^;]+)/)?.[1] || 'image/jpeg'
      
      parts.push({
        inline_data: {
          mime_type: mimeType,
          data: base64Data
        }
      })
    }
    
    // メッセージを追加
    if (message.trim()) {
      parts.push({ text: message })
    }

    const requestBody = {
      contents: [{
        parts: parts
      }],
      generation_config: {
        max_output_tokens: 8192,
        temperature: 0.7,
        top_p: 0.8,
        top_k: 40
      },
      tools: [{
        google_search_retrieval: {
          dynamic_retrieval_config: {
            mode: 'MODE_DYNAMIC',
            dynamic_threshold: 0.7
          }
        }
      }]
    }

    // Vertex AI APIを呼び出し
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Vertex AI API error:', errorText)
      return { success: false, error: `Vertex AI API error: ${response.status}` }
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated'
    const tokensUsed = data.usage_metadata?.total_token_count || 0

    return { success: true, text, tokensUsed }

  } catch (error) {
    console.error('Vertex AI call error:', error)
    return { success: false, error: error.message }
  }
}

async function createJWT(credentials: any): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  }

  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  }

  // JWT作成（実際の実装では適切なJWTライブラリを使用）
  const encodedHeader = btoa(JSON.stringify(header))
  const encodedPayload = btoa(JSON.stringify(payload))
  const signature = await signJWT(`${encodedHeader}.${encodedPayload}`, credentials.private_key)
  
  return `${encodedHeader}.${encodedPayload}.${signature}`
}

async function signJWT(data: string, privateKey: string): Promise<string> {
  // 実際の実装では適切な署名ライブラリを使用
  // ここでは簡略化
  return btoa(data)
}

async function recordUsage(supabase: any, userId: string, usage: { tokens_used: number; request_count: number }) {
  const currentMonth = new Date().toISOString().slice(0, 7)
  
  // 既存の使用量レコードを取得または作成
  const { data: existingUsage, error: fetchError } = await supabase
    .from('user_usage')
    .select('*')
    .eq('user_id', userId)
    .eq('month', currentMonth)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Failed to fetch usage:', fetchError)
    return
  }

  if (existingUsage) {
    // 既存レコードを更新
    await supabase
      .from('user_usage')
      .update({
        monthly_tokens: existingUsage.monthly_tokens + usage.tokens_used,
        monthly_requests: existingUsage.monthly_requests + usage.request_count,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingUsage.id)
  } else {
    // 新しいレコードを作成
    await supabase
      .from('user_usage')
      .insert({
        user_id: userId,
        month: currentMonth,
        monthly_tokens: usage.tokens_used,
        monthly_requests: usage.request_count,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
  }
}

function getDefaultSystemPrompt(): string {
  return `あなたは画像解析と質問回答のAIアシスタントです。

以下のルールに従って回答してください：
1. 画像のみが提供された場合：画像の内容を詳しく解説してください
2. 画像と質問が提供された場合：質問に対して画像を参考に回答してください
3. 回答は500文字以内で要約してください
4. 必ず日本語で回答してください
5. Google検索の結果も参考にして、最新の情報を含めて回答してください`
} 