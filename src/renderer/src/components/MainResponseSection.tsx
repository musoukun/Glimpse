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

	return (
		<div className="main-response-section">
			<div className="response-content-area">
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
									<div className="message-content">
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

				{/* ローディング表示 */}
				{loading && (
					<div className="loading-message" style={{ opacity: 0.6 }}>
						<div className="loading-dots">
							<span></span>
							<span></span>
							<span></span>
						</div>
						<p>Thinking...</p>
					</div>
				)}
			</div>
		</div>
	);
};
