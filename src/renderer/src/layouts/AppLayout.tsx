import React, { useState, useEffect } from "react";
import { MainHeader } from "../components/MainHeader";
import { MainInputSection } from "../components/MainInputSection";
import { MainResponseSection } from "../components/MainResponseSection";
import SettingsModal from "../components/SettingsModal";
import { AuthLayout } from "./AuthLayout";
import { useAttachments } from "../hooks/useAttachments";
import { useLLM } from "../hooks/useLLM";
import { useSupabaseAuth } from "../hooks/useSupabaseAuth";
import type { Message, Attachment } from "../types";
import "../assets/ai-chat.css";

export const AppLayout: React.FC = () => {
	const [messages, setMessages] = useState<Message[]>([]);
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const [isThinking, setIsThinking] = useState(false);
	const [studyMode, setStudyMode] = useState(() => {
		const saved = localStorage.getItem('glimpse_study_mode');
		return saved === 'true';
	});
	const [notification, setNotification] = useState<{
		type: "info" | "warning" | "subscription" | "error";
		title: string;
		message: string;
		actionButton?: {
			label: string;
			onClick: () => void;
		};
	} | null>(null);
	const { user, loading: authLoading } = useSupabaseAuth();
	const { callLLM, loading: llmLoading } = useLLM();

	// useAttachmentsフックを使用
	const {
		attachments,
		addAttachment,
		addAttachmentDirect,
		addFromClipboard,
		removeAttachment,
		clearAttachments,
		canAddMore,
	} = useAttachments();

	// キャプチャ完了イベントのリスナーを設定
	useEffect(() => {
		const handleCaptureComplete = (event: CustomEvent) => {
			if (event.detail) {
				addAttachmentDirect(event.detail);
			}
		};

		window.addEventListener('capture-complete', handleCaptureComplete as EventListener);
		return () => {
			window.removeEventListener('capture-complete', handleCaptureComplete as EventListener);
		};
	}, [addAttachmentDirect]);

	// 初回起動時のお知らせをチェック
	// Study Mode変更時にLocalStorageに保存
	const handleStudyModeChange = (enabled: boolean) => {
		setStudyMode(enabled);
		localStorage.setItem('glimpse_study_mode', enabled.toString());
	};

	useEffect(() => {
		if (user) {
			const hasSeenWelcome = localStorage.getItem('glimpse_welcome_seen');
			if (!hasSeenWelcome) {
				setNotification({
					type: 'info',
					title: 'Glimpseへようこそ！',
					message: 'AIアシスタントが質問に答えます。画像の解析も可能です。月50回まで無料でご利用いただけます。',
					actionButton: {
						label: '使い始める',
						onClick: () => {
							localStorage.setItem('glimpse_welcome_seen', 'true');
							setNotification(null);
						}
					}
				});
			}
		}
	}, [user]);

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
		// 通知をクリア（LLMを実行するとお知らせは消える）
		setNotification(null);

		try {
			const response = await callLLM(finalMessage, attachments, studyMode);

			const assistantMessage: Message = {
				id: (Date.now() + 1).toString(),
				content: response,
				role: "assistant",
				timestamp: new Date(),
			};

			setMessages((prev) => [...prev, assistantMessage]);
		} catch (error) {
			// 月間制限エラーのチェック
			const errorMsg = error instanceof Error ? error.message : "不明なエラーが発生しました";
			if (errorMsg.includes('月間使用制限') || errorMsg.includes('制限')) {
				// 課金促進の通知を表示
				setNotification({
					type: 'subscription',
					title: '月間利用上限に達しました',
					message: '今月の無料利用枠（50回）を使い切りました。月額$4で無制限にアップグレードできます。',
					actionButton: {
						label: 'アップグレードする',
						onClick: () => {
							// TODO: Stripeの決済ページへ遷移
							window.open('https://buy.stripe.com/your-payment-link', '_blank');
						}
					}
				});
			} else {
				const errorMessage: Message = {
					id: (Date.now() + 1).toString(),
					content: `エラー: ${errorMsg}`,
					role: "assistant",
					timestamp: new Date(),
					isError: true,
				};

				setMessages((prev) => [...prev, errorMessage]);
			}
		} finally {
			setIsThinking(false);
		}
	};

	// 認証中の場合
	if (authLoading) {
		return (
			<div className="main-app-layout">
				<div className="loading-container">
					<div className="thinking-text">認証状態を確認中</div>
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
						notification={notification}
						onNotificationClose={() => setNotification(null)}
						studyMode={studyMode}
						onStudyModeChange={handleStudyModeChange}
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
