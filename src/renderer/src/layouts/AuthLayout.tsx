import React from "react";
import LoginCard from "./LoginCard";
import { useSupabaseAuth } from "../hooks/useSupabaseAuth";
import "./LoginCard.css";

export const AuthLayout: React.FC = () => {
	const { signInWithEmail, signInWithGoogle, loading } = useSupabaseAuth();

	const handleEmailLogin = async (email: string, password: string) => {
		try {
			const { error } = await signInWithEmail(email, password);
			if (error) {
				throw new Error(error.message);
			}
		} catch (error) {
			console.error('Email login error:', error);
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
			<LoginCard
				onEmailLogin={handleEmailLogin}
				onGoogleLogin={handleGoogleLogin}
				loading={loading}
			/>
		</div>
	);
};
