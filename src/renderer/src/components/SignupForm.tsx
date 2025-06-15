import { useState } from "react";
import { Loader2 } from "lucide-react";

interface SignupFormProps {
	onSignup?: (email: string, password: string) => Promise<void>;
	onGoogleSignup?: () => Promise<void>;
	onSwitchToLogin?: () => void;
	loading?: boolean;
}

function SignupForm({
	onSignup,
	onGoogleSignup,
	onSwitchToLogin,
	loading = false,
}: SignupFormProps) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [agreeToTerms, setAgreeToTerms] = useState(false);

	const handleSignup = async (e: React.FormEvent) => {
		e.preventDefault();
		
		if (!agreeToTerms) {
			setError("利用規約に同意してください");
			return;
		}

		if (password !== confirmPassword) {
			setError("パスワードが一致しません");
			return;
		}

		if (password.length < 6) {
			setError("パスワードは6文字以上で入力してください");
			return;
		}

		if (!onSignup) {
			console.error("onSignup prop is not provided");
			return;
		}

		console.log("Starting signup with:", email);
		setError(null);
		setIsLoading(true);

		try {
			await onSignup(email, password);
			console.log("Signup successful");
		} catch (err) {
			const errorMessage = (err as Error)?.message || "アカウント作成に失敗しました";
			setError(errorMessage);
			console.error("Signup error:", err);
		} finally {
			setIsLoading(false);
		}
	};

	const handleGoogleSignup = async () => {
		if (!agreeToTerms) {
			setError("利用規約に同意してください");
			return;
		}

		if (!onGoogleSignup) {
			console.error("onGoogleSignup prop is not provided");
			return;
		}

		console.log("Starting Google signup");
		setError(null);
		setIsLoading(true);

		try {
			await onGoogleSignup();
			console.log("Google signup successful");
		} catch (err) {
			const errorMessage = (err as Error)?.message || "Googleアカウントでの登録に失敗しました";
			setError(errorMessage);
			console.error("Google signup error:", err);
		} finally {
			setIsLoading(false);
		}
	};

	const isSubmitDisabled = !email || !password || !confirmPassword || !agreeToTerms || isLoading || loading;

	return (
		<div className="login-card">
			<div className="login-header">
				<h1 className="login-title">Create your account</h1>
				<p className="login-subtitle">アカウントを作成して始めましょう</p>
			</div>

			<form onSubmit={handleSignup} className="login-form">
				<div className="form-group">
					<div className="input-wrapper">
						<label htmlFor="email" className="form-label">
							メールアドレス
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
							パスワード
						</label>
						<div style={{ position: 'relative' }}>
							<input
								id="password"
								type={showPassword ? "text" : "password"}
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="form-input"
								placeholder="••••••••"
								disabled={isLoading || loading}
								required
								style={{ paddingRight: '40px' }}
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="password-toggle"
								style={{
									position: 'absolute',
									right: '10px',
									top: '50%',
									transform: 'translateY(-50%)',
									background: 'none',
									border: 'none',
									cursor: 'pointer',
									color: '#666',
									padding: '4px',
								}}
							>
								{showPassword ? '🙈' : '👁️'}
							</button>
						</div>
					</div>
				</div>

				<div className="form-group">
					<div className="input-wrapper">
						<label htmlFor="confirmPassword" className="form-label">
							パスワード（確認）
						</label>
						<div style={{ position: 'relative' }}>
							<input
								id="confirmPassword"
								type={showConfirmPassword ? "text" : "password"}
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								className="form-input"
								placeholder="••••••••"
								disabled={isLoading || loading}
								required
								style={{ paddingRight: '40px' }}
							/>
							<button
								type="button"
								onClick={() => setShowConfirmPassword(!showConfirmPassword)}
								className="password-toggle"
								style={{
									position: 'absolute',
									right: '10px',
									top: '50%',
									transform: 'translateY(-50%)',
									background: 'none',
									border: 'none',
									cursor: 'pointer',
									color: '#666',
									padding: '4px',
								}}
							>
								{showConfirmPassword ? '🙈' : '👁️'}
							</button>
						</div>
					</div>
				</div>

				<div className="form-group">
					<label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
						<input
							type="checkbox"
							checked={agreeToTerms}
							onChange={(e) => setAgreeToTerms(e.target.checked)}
							style={{ cursor: 'pointer' }}
						/>
						<span style={{ fontSize: '0.875rem', color: '#888' }}>
							<a href="#" style={{ color: '#60a5fa' }}>利用規約</a>に同意します
						</span>
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
						"アカウントを作成"
					)}
				</button>
			</form>

			<div className="divider">
				<span className="divider-text">OR CONTINUE WITH</span>
			</div>

			<button
				onClick={handleGoogleSignup}
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
				Sign up with Google
			</button>

			<div className="login-footer">
				<p className="footer-text">
					すでにアカウントをお持ちですか？{" "}
					<button
						onClick={onSwitchToLogin}
						style={{
							background: 'none',
							border: 'none',
							color: '#60a5fa',
							cursor: 'pointer',
							textDecoration: 'underline',
							padding: 0,
							font: 'inherit',
						}}
					>
						ログイン
					</button>
				</p>
			</div>
		</div>
	);
}

export default SignupForm;