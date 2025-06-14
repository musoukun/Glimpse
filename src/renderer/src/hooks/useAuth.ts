import { useState, useEffect, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../config/supabase'
import Logger from '../utils/logger'

export const useAuth = () => {
	const [user, setUser] = useState<User | null>(null)
	const [session, setSession] = useState<Session | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		// 現在のセッションを取得
		const getSession = async () => {
			try {
				const { data: { session }, error } = await supabase.auth.getSession()
				if (error) {
					Logger.error('AUTH', 'セッション取得エラー', { error })
				} else {
					setSession(session)
					setUser(session?.user ?? null)
					Logger.info('AUTH', 'セッション取得成功', { 
						hasUser: !!session?.user,
						userId: session?.user?.id 
					})
				}
			} catch (error) {
				Logger.error('AUTH', 'セッション取得例外', { error })
			} finally {
				setLoading(false)
			}
		}

		getSession()

		// 認証状態の変更を監視
		const { data: { subscription } } = supabase.auth.onAuthStateChange(
			async (event, session) => {
				Logger.info('AUTH', '認証状態変更', { event, hasSession: !!session })
				setSession(session)
				setUser(session?.user ?? null)
				setLoading(false)
			}
		)

		return () => subscription.unsubscribe()
	}, [])

	// メールとパスワードでサインイン
	const signInWithEmail = useCallback(async (email: string, password: string) => {
		try {
			setLoading(true)
			Logger.info('AUTH', 'メール認証開始', { email })

			const { data, error } = await supabase.auth.signInWithPassword({
				email,
				password,
			})

			if (error) {
				Logger.error('AUTH', 'メール認証失敗', { error })
				throw error
			}

			Logger.info('AUTH', 'メール認証成功', { userId: data.user?.id })
			return data
		} catch (error) {
			Logger.error('AUTH', 'メール認証例外', { error })
			throw error
		} finally {
			setLoading(false)
		}
	}, [])

	// メールとパスワードでサインアップ
	const signUpWithEmail = useCallback(async (email: string, password: string) => {
		try {
			setLoading(true)
			Logger.info('AUTH', 'メール登録開始', { email })

			const { data, error } = await supabase.auth.signUp({
				email,
				password,
			})

			if (error) {
				Logger.error('AUTH', 'メール登録失敗', { error })
				throw error
			}

			Logger.info('AUTH', 'メール登録成功', { userId: data.user?.id })
			return data
		} catch (error) {
			Logger.error('AUTH', 'メール登録例外', { error })
			throw error
		} finally {
			setLoading(false)
		}
	}, [])

	// Googleでサインイン（BrowserWindow方式）
	const signInWithGoogle = useCallback(async () => {
		try {
			setLoading(true)
			Logger.info('AUTH', 'Google認証開始（BrowserWindow方式）')

			// SupabaseクライアントでOAuth URLを取得
			const { data, error } = await supabase.auth.signInWithOAuth({
				provider: 'google',
				options: {
					redirectTo: 'http://localhost:54321/auth/v1/callback',
					skipBrowserRedirect: true,
				}
			})

			if (error) {
				Logger.error('AUTH', 'OAuth URL取得エラー', { error })
				throw error
			}

			if (!data.url) {
				throw new Error('OAuth URLが取得できませんでした')
			}

			Logger.info('AUTH', 'OAuth URL取得成功', { url: data.url })

			// Electron APIを使用してOAuth認証ウィンドウを開く
			if (window.api?.openOAuthWindow) {
				const result = await window.api.openOAuthWindow(data.url)
				if (result.success && result.session) {
					Logger.info('AUTH', 'Google認証成功', { userId: result.session.user?.id })
					
					// トークンを使用してSupabaseセッションを設定
					const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
						access_token: result.session.access_token,
						refresh_token: result.session.refresh_token || '',
					})

					if (sessionError) {
						Logger.error('AUTH', 'セッション設定エラー', { error: sessionError })
						throw sessionError
					}

					if (sessionData.session) {
						Logger.info('AUTH', 'Supabaseセッション設定完了', { userId: sessionData.session.user.id })
						// セッションは自動的に更新されるため、ここでは何もしない
					}
				} else {
					throw new Error(result.error || 'Google認証に失敗しました')
				}
			} else {
				throw new Error('OAuth認証機能が利用できません')
			}
		} catch (error) {
			Logger.error('AUTH', 'Google認証失敗', { error })
			setLoading(false)
			throw error
		}
	}, [])

	// サインアウト
	const signOut = useCallback(async () => {
		try {
			setLoading(true)
			Logger.info('AUTH', 'サインアウト開始')

			const { error } = await supabase.auth.signOut()
			if (error) {
				Logger.error('AUTH', 'サインアウト失敗', { error })
				throw error
			}

			Logger.info('AUTH', 'サインアウト成功')
		} catch (error) {
			Logger.error('AUTH', 'サインアウト例外', { error })
			throw error
		} finally {
			setLoading(false)
		}
	}, [])

	return {
		user,
		session,
		loading,
		signInWithEmail,
		signUpWithEmail,
		signInWithGoogle,
		signOut,
	}
}
