import { supabase } from '../config/supabase'

interface AIResponse {
  text: string
  error?: string
  usage?: {
    tokensUsed: number
    requestCount: number
    currentUsage: number
    monthlyLimit: number
    planType: string
  }
}

class SupabaseEdgeService {

  async generateResponse(
    message: string,
    images: string[] = [],
    systemPrompt?: string,
    enableGrounding: boolean = true,
    groundingMaxTokens: number = 512
  ): Promise<AIResponse> {
    try {
      // Supabaseの現在のセッションを取得
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        return {
          text: '認証が必要です。ログインしてください。',
          error: 'Authentication required'
        }
      }

      // システムプロンプトとユーザーメッセージを結合
      const fullMessage = systemPrompt ? `${systemPrompt}\n\nユーザーの質問: ${message}` : message

      console.log('Calling Edge Function with session:', {
        hasSession: !!session,
        userId: session.user.id,
        messageLength: fullMessage.length,
        imagesCount: images.length
      })

      // 画像データの詳細ログ
      if (images.length > 0) {
        images.forEach((img, index) => {
          console.log(`Image ${index + 1} preview:`, {
            length: img.length,
            startsWithData: img.startsWith('data:'),
            mimeType: img.match(/data:([^;]+)/)?.[1],
            first50Chars: img.substring(0, 50)
          })
        })
      }

      // リクエストボディを明示的に作成
      const requestBody = {
        message: fullMessage,
        images,
        systemPrompt,
        enableGrounding,
        groundingMaxTokens
      }
      
      console.log('Request body size:', JSON.stringify(requestBody).length)

      // call-vertex-ai Edge Functionを呼び出し
      try {
        const { data, error } = await supabase.functions.invoke('call-vertex-ai', {
          body: requestBody
        })

        // エラーハンドリングをここに移動
        if (error) {
          console.error('Edge function error:', error)
          console.error('Edge function response:', data)
          
          // エラーメッセージを詳細に確認
          let errorMessage = 'サーバーでエラーが発生しました。'
          if (error.message?.includes('401')) {
            errorMessage = '認証エラーが発生しました。再度ログインしてください。'
          }
          
          return {
            text: errorMessage,
            error: error.message
          }
        }

        // Edge Functionが401エラーを返した場合、dataは空の可能性がある
        if (!data) {
          return {
            text: 'サーバーからの応答がありませんでした。Edge Functionが正しくデプロイされているか確認してください。',
            error: '応答なし'
          }
        }

        console.log('Edge Function response:', data)

        if (data.error) {
          // サーバーサイドエラーの処理
          if (data.error.includes('制限')) {
            return {
              text: data.error,
              error: data.error
            }
          }
          
          return {
            text: 'AI応答の生成でエラーが発生しました。',
            error: data.error
          }
        }

        return {
          text: data.text,
          usage: {
            tokensUsed: 0, // 今後実装予定
            requestCount: 1,
            currentUsage: 0, // 今後実装予定
            monthlyLimit: 50,
            planType: 'free'
          }
        }
      } catch (err) {
        console.error('Edge function call failed:', err)
        return {
          text: 'Edge Functionの呼び出しに失敗しました。ネットワーク接続を確認してください。',
          error: err instanceof Error ? err.message : 'Unknown error'
        }
      }

    } catch (error) {
      console.error('Supabase Edge Service error:', error)
      return {
        text: 'ネットワークエラーが発生しました。インターネット接続を確認してください。',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // 使用量を取得
  async getUsage(): Promise<{
    monthlyTokens: number
    monthlyRequests: number
    limit: number
    planType: string
  } | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return null

      const currentMonth = new Date().toISOString().slice(0, 7)
      
      // 使用量とサブスクリプション情報を並行取得
      const [usageResult, subscriptionResult] = await Promise.all([
        supabase
          .from('user_usage')
          .select('monthly_tokens, monthly_requests')
          .eq('user_id', session.user.id)
          .eq('month', currentMonth)
          .single(),
        supabase
          .from('user_subscriptions')
          .select('plan_type, monthly_limit')
          .eq('user_id', session.user.id)
          .single()
      ])

      const usage = usageResult.data
      const subscription = subscriptionResult.data

      // サブスクリプションが存在しない場合はデフォルト値
      const planType = subscription?.plan_type || 'free'
      const limit = subscription?.monthly_limit || 50

      return {
        monthlyTokens: usage?.monthly_tokens || 0,
        monthlyRequests: usage?.monthly_requests || 0,
        limit,
        planType
      }
    } catch (error) {
      console.error('Usage fetch error:', error)
      return null
    }
  }
}

export const supabaseEdgeService = new SupabaseEdgeService() 