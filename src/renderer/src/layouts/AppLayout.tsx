import React, { useState } from "react";
import { MainHeader } from "../components/MainHeader";
import { MainInputSection } from "../components/MainInputSection";
import { MainResponseSection } from "../components/MainResponseSection";
import SettingsModal from "../components/SettingsModal";
import { AuthLayout } from "./AuthLayout";
import { useAttachments } from "../hooks/useAttachments";
import { useLLM } from "../hooks/useLLM";
import { useFirebaseAuth } from "../hooks/useFirebaseAuth";
import { useUsage } from "../hooks/useUsage";
import type { Message, Attachment } from "../types";
import "../assets/ai-chat.css";

export const AppLayout: React.FC = () => {
	const [messages, setMessages] = useState<Message[]>([]);
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const { user, loading: authLoading } = useFirebaseAuth();
	const { usage, loading: usageLoading } = useUsage();
	const { callLLM, loading: llmLoading } = useLLM();

	// useAttachmentsフックを使用
	const {
		attachments,
		addAttachment,
		addFromClipboard,
		removeAttachment,
		clearAttachments,
		canAddMore,
	} = useAttachments();

	const handleSendMessage = async (
		message: string,
		attachments: Attachment[]
	) => {
		if (!message.trim()) return;

		const userMessage: Message = {
			id: Date.now().toString(),
			content: message,
			role: "user",
			timestamp: new Date(),
			attachments,
		};

		setMessages((prev) => [...prev, userMessage]);
		clearAttachments();

		try {
			const response = await callLLM(message, attachments);

			const assistantMessage: Message = {
				id: (Date.now() + 1).toString(),
				content: response,
				role: "assistant",
				timestamp: new Date(),
			};

			setMessages((prev) => [...prev, assistantMessage]);
		} catch (error) {
			const errorMessage: Message = {
				id: (Date.now() + 1).toString(),
				content: `エラー: ${error instanceof Error ? error.message : "不明なエラーが発生しました"}`,
				role: "assistant",
				timestamp: new Date(),
				isError: true,
			};

			setMessages((prev) => [...prev, errorMessage]);
		}
	};

	// 認証中の場合
	if (authLoading) {
		return (
			<div className="main-app-layout">
				<div className="loading-message">
					<div className="spinner"></div>
					認証状態を確認中...
				</div>
			</div>
		);
	}

	// 未認証の場合
	if (!user) {
		return <AuthLayout />;
	}

	return (
		<div className="main-app-layout">
			{/* ヘッダー */}
			<MainHeader onSettingsClick={() => setIsSettingsOpen(true)} />

			{/* メインコンテンツ */}
			<main className="main-content">
				{/* 入力エリア */}
				<div className="input-area">
					<MainInputSection
						onSendMessage={handleSendMessage}
						disabled={llmLoading || usageLoading}
						attachments={attachments}
						onAddAttachment={addAttachment}
						onAddFromClipboard={addFromClipboard}
						onRemoveAttachment={removeAttachment}
						onClearAttachments={clearAttachments}
						canAddMore={canAddMore}
					/>
				</div>

				{/* 回答エリア */}
				<div className="response-area">
					<MainResponseSection
						messages={messages}
						loading={llmLoading}
						usage={usage}
						usageLoading={usageLoading}
					/>
				</div>
			</main>

			{/* 設定モーダル */}
			<SettingsModal
				isOpen={isSettingsOpen}
				onClose={() => setIsSettingsOpen(false)}
			/>
		</div>
	);
};

export default AppLayout;
