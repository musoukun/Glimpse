import { useState, useCallback } from 'react'
import { supabase } from '../config/supabase'
import { useAuth } from './useAuth'
import { useUsage } from './useUsage'
import type { Attachment } from '../types'
import Logger from '../utils/logger'

export const useLLM = () => {
  const { session, isAuthenticated } = useAuth()
  const { canMakeCall, fetchUsage } = useUsage()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const callLLM = useCallback(async (prompt: string, attachments: Attachment[] = []) => {
    if (!isAuthenticated || !session) {
      throw new Error('認証が必要です')
    }

    if (!canMakeCall()) {
      throw new Error('使用制限に達しています。アップグレードしてください。')
    }

    try {
      setLoading(true)
      setError(null)

      Logger.info('LLM', 'Edge Function呼び出し開始', {
        promptLength: prompt.length,
        attachmentsCount: attachments.length
      })

      // Supabase Edge Functionを呼び出し
      const { data, error: functionError } = await supabase.functions.invoke('call-gemini', {
        body: {
          prompt,
          attachments: attachments.map(att => ({
            name: att.name,
            type: att.type,
            data: att.data
          }))
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        }
      })

      if (functionError) {
        Logger.error('LLM', 'Edge Function呼び出しエラー', { error: functionError })
        throw new Error(`API呼び出しエラー: ${functionError.message}`)
      }

      if (!data || !data.response) {
        Logger.error('LLM', '無効なレスポンス', { data })
        throw new Error('無効なレスポンスです')
      }

      Logger.info('LLM', 'Edge Function呼び出し成功', {
        responseLength: data.response.length
      })

      // 使用量を更新
      await fetchUsage()

      return data.response
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'LLM呼び出しに失敗しました'
      setError(errorMessage)
      Logger.error('LLM', 'LLM呼び出しエラー', { error })
      throw error
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, session, canMakeCall, fetchUsage])

  return {
    callLLM,
    loading,
    error,
    isAuthenticated,
  }
} 