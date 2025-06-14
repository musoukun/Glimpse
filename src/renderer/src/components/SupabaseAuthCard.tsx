import { useState } from 'react'
import { useSupabaseAuth } from '../hooks/useSupabaseAuth'
import { Loader2, LogIn } from 'lucide-react'

export function SupabaseAuthCard() {
  const { signInWithGoogle, loading } = useSupabaseAuth()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    setError(null)
    setIsLoading(true)
    
    try {
      const { error } = await signInWithGoogle()
      if (error) {
        setError(error.message || 'ログインに失敗しました')
      }
    } catch (err) {
      setError('予期しないエラーが発生しました')
      console.error('Sign in error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="auth-card">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="auth-card">
      <div className="auth-header">
        <h1 className="auth-title">Glimpse</h1>
        <p className="auth-subtitle">AI画像解析アシスタント</p>
      </div>
      
      <div className="auth-content">
        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="auth-button google-button"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              <span>Googleでログイン</span>
            </>
          )}
        </button>
        
        {error && (
          <div className="auth-error">
            <p>{error}</p>
          </div>
        )}
      </div>
      
      <div className="auth-footer">
        <p className="text-xs text-gray-500">
          Supabase Authenticationで保護されています
        </p>
      </div>
    </div>
  )
}
