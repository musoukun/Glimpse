import { useState, useEffect, useCallback } from 'react'
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithPopup
} from 'firebase/auth'
import { auth, googleProvider } from '../config/firebase'
import Logger from '../utils/logger'

export const useFirebaseAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Firebase認証状態の監視
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
      Logger.info('FIREBASE_AUTH', '認証状態変更', { 
        hasUser: !!user,
        userId: user?.uid 
      })
    })

    return () => unsubscribe()
  }, [])

  // メールアドレスとパスワードでサインイン
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true)
      Logger.info('FIREBASE_AUTH', 'メール認証開始', { email })
      
      const result = await signInWithEmailAndPassword(auth, email, password)
      Logger.info('FIREBASE_AUTH', 'メール認証成功', { userId: result.user.uid })
      
      return result.user
    } catch (error) {
      Logger.error('FIREBASE_AUTH', 'メール認証失敗', { error })
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  // メールアドレスとパスワードでサインアップ
  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true)
      Logger.info('FIREBASE_AUTH', 'メール登録開始', { email })
      
      const result = await createUserWithEmailAndPassword(auth, email, password)
      Logger.info('FIREBASE_AUTH', 'メール登録成功', { userId: result.user.uid })
      
      return result.user
    } catch (error) {
      Logger.error('FIREBASE_AUTH', 'メール登録失敗', { error })
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  // Googleでサインイン
  const signInWithGoogle = useCallback(async () => {
    try {
      setLoading(true)
      Logger.info('FIREBASE_AUTH', 'Google認証開始')

      // Firebase標準のポップアップ方式を使用
      const result = await signInWithPopup(auth, googleProvider)
      Logger.info('FIREBASE_AUTH', 'Google認証成功', { userId: result.user.uid })
      return result.user
    } catch (error) {
      Logger.error('FIREBASE_AUTH', 'Google認証失敗', { error })
      setLoading(false)
      throw error
    }
  }, [])

  // サインアウト
  const signOut = useCallback(async () => {
    try {
      Logger.info('FIREBASE_AUTH', 'サインアウト開始')
      await firebaseSignOut(auth)
      Logger.info('FIREBASE_AUTH', 'サインアウト成功')
    } catch (error) {
      Logger.error('FIREBASE_AUTH', 'サインアウト失敗', { error })
      throw error
    }
  }, [])

  return {
    user,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut
  }
} 