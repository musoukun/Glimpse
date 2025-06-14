import React, { useState } from "react";
import { MainHeader } from "../components/MainHeader";
import { MainInputSection } from "../components/MainInputSection";
import { MainResponseSection } from "../components/MainResponseSection";
import SettingsModal from "../components/SettingsModal";
// import { AuthLayout } from "./AuthLayout";
import { useAttachments } from "../hooks/useAttachments";
import { useLLM } from "../hooks/useLLM";
// import { useFirebaseAuth } from "../hooks/useFirebaseAuth";
import type { Message, Attachment } from "../types";
import "../assets/ai-chat.css";

export const AppLayout: React.FC = () => {
	const [messages, setMessages] = useState<Message[]>([]);
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const [isThinking, setIsThinking] = useState(false);
	// const { user, loading: authLoading } = useFirebaseAuth();
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
		// メッセージが空でも画像があれば送信を許可
		if (!message.trim() && attachments.length === 0) return;

		// 画像のみの場合はデフォルトメッセージを設定
		const finalMessage = message.trim() || "画像を解析してください";

		const userMessage: Message = {
			id: Date.now().toString(),
			content: finalMessage,
			role: "user",
			timestamp: new Date(),
			attachments,
		};

		setMessages((prev) => [...prev, userMessage]);
		clearAttachments();
		setIsThinking(true);

		try {
			const response = await callLLM(finalMessage, attachments);

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
		} finally {
			setIsThinking(false);
		}
	};

	// 一時的に認証チェックを無効化してFirebase AIをテスト
	// 認証中の場合
	// if (authLoading) {
	// 	return (
	// 		<div className="main-app-layout">
	// 			<div className="loading-message">
	// 				<div className="spinner"></div>
	// 				認証状態を確認中...
	// 			</div>
	// 		);
	// }

	// 未認証の場合
	// if (!user) {
	// 	return <AuthLayout />;
	// }

	return (
		<div className="main-app-layout">
			{/* ヘッダー */}
			<MainHeader onSettingsClick={() => setIsSettingsOpen(true)} />

			{/* メインコンテンツ */}
			<main className="main-content">
				{/* 入力エリア */}
				<div
					className={`input-area ${attachments.length > 0 ? "has-attachments" : ""}`}
				>
					<MainInputSection
						onSendMessage={handleSendMessage}
						disabled={llmLoading}
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
						loading={llmLoading || isThinking}
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
