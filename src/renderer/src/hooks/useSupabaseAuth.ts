import { useEffect, useState } from 'react'
import { supabase } from '../config/supabase'
import type { User, AuthError } from '@supabase/supabase-js'

interface UseSupabaseAuthReturn {
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<{ error: AuthError | null }>
  signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUpWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
}

export function useSupabaseAuth(): UseSupabaseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 初期セッションチェック
    checkUser()

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        
        if (session?.user) {
          setUser(session.user)
          
          // Electronメインプロセスに認証成功を通知
          if (window.api?.authSuccess) {
            window.api.authSuccess({
              userId: session.user.id,
              email: session.user.email || '',
              accessToken: session.access_token
            })
          }
        } else {
          setUser(null)
        }
        
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function checkUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
    } catch (error) {
      console.error('Session check error:', error)
    } finally {
      setLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    try {
      // Electronの場合、特別な処理が必要
      if (window.api?.openAuthWindow) {
        // メインプロセス経由で認証ウィンドウを開く
        // Googleの場合は常にアカウント選択画面が表示される
        const { error } = await window.api.openAuthWindow('google')
        return { error }
      } else {
        // 通常のWebアプリの場合、常にアカウント選択画面を表示
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            queryParams: {
              prompt: 'select_account'
            }
          }
        })
        return { error }
      }
    } catch (error) {
      console.error('Google sign in error:', error)
      return { error: error as AuthError }
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      return { error }
    } catch (error) {
      console.error('Email sign in error:', error)
      return { error: error as AuthError }
    }
  }

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password
      })
      return { error }
    } catch (error) {
      console.error('Email sign up error:', error)
      return { error: error as AuthError }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (!error) {
        setUser(null)
        
        // Electronメインプロセスに通知
        if (window.api?.authSignOut) {
          window.api.authSignOut()
        }
      }
      return { error }
    } catch (error) {
      console.error('Sign out error:', error)
      return { error: error as AuthError }
    }
  }

  return {
    user,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut
  }
}
