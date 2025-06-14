import React from "react";
import LoginCard from "../components/LoginCard";
import { useSupabaseAuth } from "../hooks/useSupabaseAuth";
import "./LoginCard.css";

export const AuthLayout: React.FC = () => {
	const { signInWithEmail, signInWithGoogle } = useSupabaseAuth();

	const handleEmailLogin = async (email: string, password: string) => {
		await signInWithEmail(email, password);
	};

	const handleGoogleLogin = async () => {
		await signInWithGoogle();
	};

	return (
		<div className="auth-layout">
			<LoginCard
				onEmailLogin={handleEmailLogin}
				onGoogleLogin={handleGoogleLogin}
			/>
		</div>
	);
};
