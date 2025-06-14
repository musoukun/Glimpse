import { useState, useEffect } from "react";
import "./App.css";
import { useSupabaseAuth } from "./hooks/useSupabaseAuth";
import { AppLayout } from "./layouts/AppLayout";
import { AuthLayout } from "./layouts/AuthLayout";

function App() {
	const auth = useSupabaseAuth();

	const [isAuthChecked, setIsAuthChecked] = useState(false);

	useEffect(() => {
		// 認証状態の初期チェック完了を待つ
		if (!auth.loading) {
			setIsAuthChecked(true);
		}
	}, [auth.loading]);

	// 認証チェック中はローディング表示
	if (!isAuthChecked) {
		return (
			<div className="app">
				<div className="loading-container">
					<div className="loading-spinner"></div>
					<p>認証状態を確認中...</p>
				</div>
			</div>
		);
	}

	// 認証されていない場合はログイン画面を表示
	if (!auth.user) {
		return <AuthLayout />;
	}

	// 認証されている場合はメイン画面を表示
	return (
		<div className="app">
			<AppLayout />
		</div>
	);
}

export default App;
