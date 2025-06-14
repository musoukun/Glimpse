/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from 'react'
import { useSupabaseAuth } from './useSupabaseAuth'
import { aiLogicService } from '../services/aiLogic'
import type { Attachment } from '../types'
import Logger from '../utils/logger'

export const useLLM = () => {
  const { user } = useSupabaseAuth()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const callLLM = useCallback(async (prompt: string, attachments: Attachment[] = []) => {
    // 認証チェックを有効化
    if (!user) {
      throw new Error('認証が必要です。ログインしてください。')
    }


    try {
      setLoading(true)
      setError(null)

      Logger.info('LLM', 'Supabase Edge Function呼び出し開始', {
        promptLength: prompt.length,
        attachmentsCount: attachments.length
      })

      // 添付ファイルから画像データを抽出
      const images = attachments
        .filter(attachment => attachment.type.startsWith('image/'))
        .map(attachment => attachment.data)

      // Supabase Edge Functionを使用してレスポンスを生成
      const response = await aiLogicService.generateResponse(prompt, images)

      if (response.error) {
        throw new Error(response.error)
      }

      Logger.info('LLM', 'Supabase Edge Function呼び出し成功', {
        responseLength: response.text.length,
        usage: response.usage
      })


      return response.text
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'LLM呼び出しに失敗しました'
      setError(errorMessage)
      Logger.error('LLM', 'LLM呼び出しエラー', { error })
      throw error
    } finally {
      setLoading(false)
    }
  }, [user])

  return {
    callLLM,
    loading,
    error,
    isAuthenticated: !!user,
  }
} 