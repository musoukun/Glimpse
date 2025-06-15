import React, { useState, useEffect } from "react";
import LoginCard from "./LoginCard";
import SignupForm from "../components/SignupForm";
import { useSupabaseAuth } from "../hooks/useSupabaseAuth";
import "./LoginCard.css";

export const AuthLayout: React.FC = () => {
	const { signInWithEmail, signUpWithEmail, signInWithGoogle, loading } = useSupabaseAuth();
	const [isSignupView, setIsSignupView] = useState(false);
	const [savedEmail, setSavedEmail] = useState("");
	const [savedPassword, setSavedPassword] = useState("");

	useEffect(() => {
		// 保存されたログイン情報を読み込む
		const saved = localStorage.getItem("glimpse_saved_credentials");
		if (saved) {
			try {
				const { email, password } = JSON.parse(saved);
				// 簡易的な復号化（本番環境ではより安全な方法を使用すべき）
				setSavedEmail(atob(email));
				setSavedPassword(atob(password));
			} catch (e) {
				console.error("Failed to load saved credentials:", e);
			}
		}
	}, []);

	const handleEmailLogin = async (email: string, password: string, rememberMe: boolean) => {
		try {
			const { error } = await signInWithEmail(email, password);
			if (error) {
				throw new Error(error.message);
			}
			
			// ログイン成功時、rememberMeがtrueの場合は保存
			if (rememberMe) {
				// 簡易的な暗号化（本番環境ではより安全な方法を使用すべき）
				const credentials = {
					email: btoa(email),
					password: btoa(password)
				};
				localStorage.setItem("glimpse_saved_credentials", JSON.stringify(credentials));
			} else {
				// rememberMeがfalseの場合は保存を削除
				localStorage.removeItem("glimpse_saved_credentials");
			}
		} catch (error) {
			console.error('Email login error:', error);
			throw error;
		}
	};

	const handleSignup = async (email: string, password: string) => {
		try {
			const { error } = await signUpWithEmail(email, password);
			if (error) {
				throw new Error(error.message);
			}
		} catch (error) {
			console.error('Signup error:', error);
			throw error;
		}
	};

	const handleGoogleLogin = async () => {
		try {
			const { error } = await signInWithGoogle();
			if (error) {
				throw new Error(error.message);
			}
		} catch (error) {
			console.error('Google login error:', error);
			throw error;
		}
	};

	return (
		<div className="auth-layout">
			{isSignupView ? (
				<SignupForm
					onSignup={handleSignup}
					onGoogleSignup={handleGoogleLogin}
					onSwitchToLogin={() => setIsSignupView(false)}
					loading={loading}
				/>
			) : (
				<LoginCard
					onEmailLogin={handleEmailLogin}
					onGoogleLogin={handleGoogleLogin}
					onSwitchToSignup={() => setIsSignupView(true)}
					loading={loading}
					initialEmail={savedEmail}
					initialPassword={savedPassword}
				/>
			)}
		</div>
	);
};
