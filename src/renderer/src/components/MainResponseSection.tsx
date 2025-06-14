import React from "react";
import type { Message } from "../types";
import { NotificationCard } from "./NotificationCard";

interface MainResponseSectionProps {
	messages: Message[];
	loading?: boolean;
	notification?: {
		type: "info" | "warning" | "subscription" | "error";
		title: string;
		message: string;
		actionButton?: {
			label: string;
			onClick: () => void;
		};
	} | null;
	onNotificationClose?: () => void;
	studyMode?: boolean;
	onStudyModeChange?: (enabled: boolean) => void;
}

// 連続する改行を2つまでに制限する関数
const formatMessageContent = (content: string): string => {
	// 3つ以上の改行を2つの改行に置換
	return content.replace(/\n{3,}/g, "\n\n");
};

export const MainResponseSection: React.FC<MainResponseSectionProps> = ({
	messages,
	loading = false,
	notification,
	onNotificationClose,
}) => {
	// 設定からフォントサイズを取得
	const [fontSize, setFontSize] = React.useState(12);

	React.useEffect(() => {
		// 初回ロード時に設定を読み込み
		const loadSettings = () => {
			try {
				const settings = localStorage.getItem("glimpse_settings");
				if (settings) {
					const parsed = JSON.parse(settings);
					const size = parsed.response_settings?.font_size || 12;
					setFontSize(size);
				}
			} catch (error) {
				console.error("Failed to load settings:", error);
			}
		};

		loadSettings();

		// 設定変更イベントを監視
		const handleSettingsChange = () => {
			loadSettings();
		};

		window.addEventListener("settings-changed", handleSettingsChange);
		return () => {
			window.removeEventListener(
				"settings-changed",
				handleSettingsChange
			);
		};
	}, []);

	return (
		<div className="main-response-section">
			<div className="response-content-area">
				{/* 通知表示を最優先 */}
				{notification && (
					<NotificationCard
						type={notification.type}
						title={notification.title}
						message={notification.message}
						actionButton={notification.actionButton}
						onClose={onNotificationClose}
						showCloseButton={!!onNotificationClose}
					/>
				)}

				{/* ローディング表示を優先 */}
				{loading ? (
					<div className="loading-container">
						<div className="thinking-text">Thinking</div>
					</div>
				) : (
					<>
						{/* 通知がある場合はメッセージを表示しない */}
						{!notification && messages.length > 0 ? (
							<div className="messages-container">
								{/* アシスタントの回答のみを表示 */}
								{messages
									.filter(
										(message) =>
											message.role === "assistant"
									)
									.slice(-1) // 最新の回答のみ
									.map((message) => (
										<div
											key={message.id}
											className={`message assistant-message ${message.isError ? "error-message" : ""}`}
										>
											<div
												className="message-content"
												style={{
													fontSize: `${fontSize}px`,
												}}
											>
												{formatMessageContent(
													message.content
												)}
											</div>
										</div>
									))}
							</div>
						) : !notification ? (
							<div className="empty-state">
								<p>
									質問してください。<p></p>-
									画像だけでも質問できます<p></p>-
									Web検索し回答します
								</p>
							</div>
						) : null}
					</>
				)}
			</div>
		</div>
	);
};
