import React from "react";
import type { Message } from "../types";
import type { UserUsage } from "../config/supabase";

interface MainResponseSectionProps {
	messages: Message[];
	loading?: boolean;
	usage?: UserUsage | null;
	usageLoading?: boolean;
}

export const MainResponseSection: React.FC<MainResponseSectionProps> = ({
	messages,
	loading = false,
	usage,
	usageLoading = false,
}) => {
	// 使用量の表示
	const renderUsageInfo = () => {
		if (usageLoading) {
			return (
				<div className="usage-display compact">
					<div className="usage-status loading">
						<div className="spinner"></div>
						使用量を確認中...
					</div>
				</div>
			);
		}

		if (!usage) return null;

		const percentage =
			usage.subscription_status === "paid"
				? 0
				: Math.min((usage.free_calls_used / 50) * 100, 100);

		const remaining =
			usage.subscription_status === "paid"
				? "無制限"
				: Math.max(50 - usage.free_calls_used, 0);

		return (
			<div className="usage-display compact">
				<div className="usage-header">
					<div className="usage-title">
						使用量 (
						{usage.subscription_status === "paid"
							? "有料プラン"
							: "無料プラン"}
						)
					</div>
				</div>
				{usage.subscription_status === "free" && (
					<div className="usage-progress">
						<div className="progress-bar">
							<div
								className="progress-fill"
								style={{ width: `${percentage}%` }}
							></div>
						</div>
						<div className="usage-text">
							{usage.free_calls_used}/50 回使用 (残り: {remaining}
							回)
						</div>
					</div>
				)}
				{percentage >= 80 && usage.subscription_status === "free" && (
					<div className="usage-message warning">
						使用制限に近づいています
					</div>
				)}
			</div>
		);
	};

	return (
		<div className="main-response-section">
			{/* 使用量表示 */}
			{renderUsageInfo()}

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
					<div className="loading-message">
						<div className="loading-dots">
							<span></span>
							<span></span>
							<span></span>
						</div>
						<p>回答を生成中...</p>
					</div>
				)}
			</div>
		</div>
	);
};
