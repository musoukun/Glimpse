import React from "react";
import type { Message } from "../types";
interface MainResponseSectionProps {
	messages: Message[];
	loading?: boolean;
}

export const MainResponseSection: React.FC<MainResponseSectionProps> = ({
	messages,
	loading = false,
}) => {
	// 設定からフォントサイズを取得
	const [fontSize, setFontSize] = React.useState(14);

	React.useEffect(() => {
		// 初回ロード時に設定を読み込み
		const loadSettings = () => {
			try {
				const settings = localStorage.getItem('glimpse_settings');
				if (settings) {
					const parsed = JSON.parse(settings);
					const size = parsed.response_settings?.font_size || 14;
					setFontSize(size);
				}
			} catch (error) {
				console.error('Failed to load settings:', error);
			}
		};

		loadSettings();

		// 設定変更イベントを監視
		const handleSettingsChange = () => {
			loadSettings();
		};

		window.addEventListener('settings-changed', handleSettingsChange);
		return () => {
			window.removeEventListener('settings-changed', handleSettingsChange);
		};
	}, []);

	return (
		<div className="main-response-section">
			<div className="response-content-area">
				{/* ローディング表示を優先 */}
				{loading ? (
					<div className="loading-container">
						<div className="thinking-text">Thinking</div>
					</div>
				) : (
					<>
						{/* 回答履歴（最新の回答のみ表示） */}
						{messages.length > 0 ? (
							<div className="messages-container">
								{/* アシスタントの回答のみを表示 */}
								{messages
									.filter((message) => message.role === "assistant")
									.slice(-1) // 最新の回答のみ
									.map((message) => (
										<div
											key={message.id}
											className={`message assistant-message ${message.isError ? "error-message" : ""}`}
										>
											<div className="message-content" style={{ fontSize: `${fontSize}px` }}>
												{message.content}
											</div>
										</div>
									))}
							</div>
						) : (
							<div className="empty-state">
								<p>メッセージを入力してAIとの会話を開始してください</p>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
};
