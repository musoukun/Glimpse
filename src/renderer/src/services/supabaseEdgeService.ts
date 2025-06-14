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
  private systemPrompt: string = ''

  constructor() {
    this.updateSystemPrompt()
    
    // 設定変更イベントを監視
    window.addEventListener('settings-changed', () => {
      this.updateSystemPrompt()
    })
  }

  private updateSystemPrompt() {
    const settings = this.getSettings()
    const maxChars = settings.maxChars || 500
    const userPrompt = settings.userPrompt || ''

    this.systemPrompt = `あなたは画像解析と質問回答のAIアシスタントです。

以下のルールに従って回答してください：
1. 画像のみが提供された場合：画像の内容を詳しく解説してください
2. 画像と質問が提供された場合：質問に対して画像を参考に回答してください
3. 回答は${maxChars}文字以内で要約してください
4. 必ず日本語で回答してください
5. Google検索の結果も参考にして、最新の情報を含めて回答してください

${userPrompt ? `追加の指示：${userPrompt}` : ''}`
  }

  private getSettings() {
    try {
      const settings = localStorage.getItem('glimpse-settings')
      return settings ? JSON.parse(settings) : {}
    } catch (error) {
      console.error('Failed to load settings:', error)
      return {}
    }
  }

  async generateResponse(
    message: string,
    images: string[] = []
  ): Promise<AIResponse> {
    try {
      // 現在のユーザーセッションを取得
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        return {
          text: '認証が必要です。ログインしてください。',
          error: 'Authentication required'
        }
      }

      // Supabase Edge Functionを呼び出し
      const { data, error } = await supabase.functions.invoke('vertex-ai-chat', {
        body: {
          message,
          images,
          systemPrompt: this.systemPrompt,
          model: 'gemini-2.0-flash-lite'
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (error) {
        console.error('Edge function error:', error)
        return {
          text: 'サーバーでエラーが発生しました。しばらく時間をおいて再試行してください。',
          error: error.message
        }
      }

      if (data.error) {
        // サーバーサイドエラーの処理
        if (data.error.includes('limit') && data.planType === 'free') {
          return {
            text: '無料プランの制限（50回/月）に達しました。有料プラン（$4/月）にアップグレードして無制限でご利用ください。',
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
        usage: data.usage
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
      if (!session) return null

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