import { useState, useEffect, useCallback } from 'react'
import { useFirebaseAuth } from './useFirebaseAuth'
import { aiLogicService } from '../services/aiLogic'
import Logger from '../utils/logger'

interface Usage {
  monthlyTokens: number
  monthlyRequests: number
  limit: number
  planType: string
}

export const useUsage = () => {
  const { user } = useFirebaseAuth()
  const isAuthenticated = !!user
  const [usage, setUsage] = useState<Usage | null>(null)
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

      const usageData = await aiLogicService.getUsage()
      
      if (usageData) {
        setUsage(usageData)
        Logger.info('USAGE', '使用量取得完了', { 
          monthlyRequests: usageData.monthlyRequests,
          monthlyTokens: usageData.monthlyTokens,
          limit: usageData.limit,
          planType: usageData.planType
        })
      } else {
        // 初回の場合はデフォルト値を設定
        setUsage({
          monthlyTokens: 0,
          monthlyRequests: 0,
          limit: 50,
          planType: 'free'
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
    if (usage.planType === 'paid') return 0 // 有料プランは制限なし
    return Math.min((usage.monthlyRequests / usage.limit) * 100, 100)
  }, [usage])

  const getRemainingCalls = useCallback(() => {
    if (!usage) return 0
    if (usage.planType === 'paid') return Infinity // 有料プランは無制限
    return Math.max(usage.limit - usage.monthlyRequests, 0)
  }, [usage])

  const canMakeCall = useCallback(() => {
    if (!usage) return false
    if (usage.planType === 'paid') return true // 有料プランは常に可能
    return usage.monthlyRequests < usage.limit
  }, [usage])

  const getUsageStatus = useCallback(() => {
    if (!isAuthenticated) return 'not_authenticated'
    if (loading) return 'loading'
    if (error) return 'error'
    if (!usage) return 'loading'

    if (usage.planType === 'paid') return 'unlimited'
    
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