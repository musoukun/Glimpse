import { useState, useEffect, useCallback } from 'react'
import { supabase, UserUsage } from '../config/supabase'
import { useAuth } from './useAuth'
import Logger from '../utils/logger'

export const useUsage = () => {
  const { user, isAuthenticated } = useAuth()
  const [usage, setUsage] = useState<UserUsage | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 使用量を取得
  const fetchUsage = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setUsage(null)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('user_usage')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // レコードが存在しない場合は新規作成
          const { data: newUsage, error: insertError } = await supabase
            .from('user_usage')
            .insert({
              user_id: user.id,
              free_calls_used: 0,
              subscription_status: 'free',
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            })
            .select()
            .single()

          if (insertError) {
            throw insertError
          }

          setUsage(newUsage)
          Logger.info('USAGE', '新規使用量レコード作成完了')
        } else {
          throw fetchError
        }
      } else {
        setUsage(data)
        Logger.info('USAGE', '使用量取得完了', { 
          freeCallsUsed: data.free_calls_used,
          subscriptionStatus: data.subscription_status 
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '使用量の取得に失敗しました'
      setError(errorMessage)
      Logger.error('USAGE', '使用量取得エラー', { error })
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, user])

  // 認証状態が変わったら使用量を取得
  useEffect(() => {
    fetchUsage()
  }, [fetchUsage])

  // 使用量の計算
  const getUsagePercentage = useCallback(() => {
    if (!usage) return 0
    if (usage.subscription_status === 'paid') return 0 // 有料プランは制限なし
    return Math.min((usage.free_calls_used / 50) * 100, 100)
  }, [usage])

  const getRemainingCalls = useCallback(() => {
    if (!usage) return 0
    if (usage.subscription_status === 'paid') return Infinity
    return Math.max(50 - usage.free_calls_used, 0)
  }, [usage])

  const canMakeCall = useCallback(() => {
    if (!usage) return false
    if (usage.subscription_status === 'paid') return true
    return usage.free_calls_used < 50
  }, [usage])

  const getUsageStatus = useCallback(() => {
    if (!isAuthenticated) return 'not_authenticated'
    if (loading) return 'loading'
    if (error) return 'error'
    if (!usage) return 'loading'

    const percentage = getUsagePercentage()
    if (percentage >= 100) return 'limit_exceeded'
    if (percentage >= 80) return 'warning'
    return 'normal'
  }, [isAuthenticated, loading, error, usage, getUsagePercentage])

  return {
    usage,
    loading,
    error,
    fetchUsage,
    getUsagePercentage,
    getRemainingCalls,
    canMakeCall,
    getUsageStatus,
    isAuthenticated,
  }
} 