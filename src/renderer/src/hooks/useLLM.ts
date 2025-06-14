import { useState, useCallback } from 'react'
import { useFirebaseAuth } from './useFirebaseAuth'
import { useUsage } from './useUsage'
import { defaultAILogic } from '../services/aiLogic'
import type { Attachment } from '../types'
import Logger from '../utils/logger'

export const useLLM = () => {
  const { user } = useFirebaseAuth()
  const { canMakeCall, fetchUsage } = useUsage()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const callLLM = useCallback(async (prompt: string, attachments: Attachment[] = []) => {
    // 一時的に認証チェックを無効化してFirebase AIをテスト
    // if (!user) {
    //   throw new Error('認証が必要です')
    // }

    // if (!canMakeCall()) {
    //   throw new Error('使用制限に達しています。アップグレードしてください。')
    // }

    try {
      setLoading(true)
      setError(null)

      Logger.info('LLM', 'Firebase AI呼び出し開始', {
        promptLength: prompt.length,
        attachmentsCount: attachments.length
      })

      // Firebase AIを使用してレスポンスを生成
      const response = await defaultAILogic.generateResponse(prompt, attachments)

      Logger.info('LLM', 'Firebase AI呼び出し成功', {
        responseLength: response.content.length,
        usage: response.usage
      })

      // 使用量を更新（一時的に無効化）
      // await fetchUsage()

      return response.content
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'LLM呼び出しに失敗しました'
      setError(errorMessage)
      Logger.error('LLM', 'LLM呼び出しエラー', { error })
      throw error
    } finally {
      setLoading(false)
    }
  }, [user, canMakeCall, fetchUsage])

  return {
    callLLM,
    loading,
    error,
    isAuthenticated: !!user,
  }
} 