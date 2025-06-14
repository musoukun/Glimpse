/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import "./LoginCard.css";

interface LoginCardProps {
	onEmailLogin?: (
		email: string,
		password: string,
		rememberMe: boolean
	) => Promise<void>;
	onGoogleLogin?: () => Promise<void>;
	onSwitchToSignup?: () => void;
	loading?: boolean;
	initialEmail?: string;
	initialPassword?: string;
}

function LoginCard({
	onEmailLogin,
	onGoogleLogin,
	onSwitchToSignup,
	loading = false,
	initialEmail = "",
	initialPassword = "",
}: LoginCardProps) {
	const [email, setEmail] = useState(initialEmail);
	const [password, setPassword] = useState(initialPassword);
	const [rememberMe, setRememberMe] = useState(
		initialEmail !== "" && initialPassword !== ""
	);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (initialEmail) {
			setEmail(initialEmail);
		}
		if (initialPassword) {
			setPassword(initialPassword);
		}
		if (initialEmail && initialPassword) {
			setRememberMe(true);
		}
	}, [initialEmail, initialPassword]);

	const handleEmailLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!onEmailLogin) {
			console.error("onEmailLogin prop is not provided");
			return;
		}

		console.log("Starting email login with:", email);
		setError(null);
		setIsLoading(true);

		try {
			await onEmailLogin(email, password, rememberMe);
			console.log("Email login successful");
		} catch (err: any) {
			const errorMessage =
				err?.message ||
				"メールアドレスまたはパスワードが正しくありません";
			setError(errorMessage);
			console.error("Login error:", err);
		} finally {
			setIsLoading(false);
		}
	};

	const handleGoogleLogin = async () => {
		if (!onGoogleLogin) {
			console.error("onGoogleLogin prop is not provided");
			return;
		}

		console.log("Starting Google login");
		setError(null);
		setIsLoading(true);

		try {
			await onGoogleLogin();
			console.log("Google login successful");
		} catch (err: any) {
			const errorMessage = err?.message || "Googleログインに失敗しました";
			setError(errorMessage);
			console.error("Google login error:", err);
		} finally {
			setIsLoading(false);
		}
	};

	const isSubmitDisabled = !email || !password || isLoading || loading;

	return (
		<div className="login-card">
			<div className="login-header">
				<h1 className="login-title">Glimpse</h1>
				<p className="login-subtitle">Sign in to your account</p>
			</div>

			<form onSubmit={handleEmailLogin} className="login-form">
				<div className="form-group">
					<div className="input-wrapper">
						<label htmlFor="email" className="form-label">
							Email address
						</label>
						<input
							id="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="form-input"
							placeholder="you@example.com"
							disabled={isLoading || loading}
							required
						/>
					</div>
				</div>

				<div className="form-group">
					<div className="input-wrapper">
						<label htmlFor="password" className="form-label">
							Password
						</label>
						<input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="form-input"
							placeholder="••••••••"
							disabled={isLoading || loading}
							required
						/>
					</div>
				</div>

				<div className="checkbox-wrapper">
					<input
						type="checkbox"
						id="rememberMe"
						className="checkbox-input"
						checked={rememberMe}
						onChange={(e) => setRememberMe(e.target.checked)}
					/>
					<label htmlFor="rememberMe" className="checkbox-label">
						ログイン情報を保存する
					</label>
				</div>

				{error && (
					<div className="error-message">
						<p>{error}</p>
					</div>
				)}

				<button
					type="submit"
					disabled={isSubmitDisabled}
					className="submit-button"
				>
					{isLoading || loading ? (
						<Loader2 className="w-5 h-5 animate-spin mx-auto" />
					) : (
						"Sign in"
					)}
				</button>
			</form>

			<div className="divider">
				<span className="divider-text">OR CONTINUE WITH</span>
			</div>

			<button
				onClick={handleGoogleLogin}
				disabled={isLoading || loading}
				className="oauth-button google-button"
			>
				<svg className="oauth-icon" viewBox="0 0 24 24">
					<path
						fill="#4285F4"
						d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
					/>
					<path
						fill="#34A853"
						d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
					/>
					<path
						fill="#FBBC05"
						d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
					/>
					<path
						fill="#EA4335"
						d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
					/>
				</svg>
				Continue with Google
			</button>

			<div className="login-footer">
				<p className="footer-text" style={{ marginBottom: "8px" }}>
					By continuing, you agree to our{" "}
					<a href="#" className="footer-link">
						Terms of Service
					</a>{" "}
					and{" "}
					<a href="#" className="footer-link">
						Privacy Policy
					</a>
				</p>
				<p className="footer-text">
					アカウントをお持ちでない方は{" "}
					<button
						onClick={onSwitchToSignup}
						style={{
							background: "none",
							border: "none",
							color: "#60a5fa",
							cursor: "pointer",
							textDecoration: "underline",
							padding: 0,
							font: "inherit",
						}}
					>
						新規作成
					</button>
				</p>
			</div>
		</div>
	);
}

export default LoginCard;
