import React, { useState, useRef, useCallback, useEffect } from "react";
import { Send, Paperclip } from "lucide-react";
import type { Attachment } from "../types";

interface MainInputSectionProps {
	onSendMessage: (message: string, attachments: Attachment[]) => void;
	disabled?: boolean;
	attachments: Attachment[];
	onAddAttachment: () => void;
	onAddFromClipboard: () => void;
	onRemoveAttachment: (id: string) => void;
	onClearAttachments: () => void;
	canAddMore: boolean;
}

export const MainInputSection: React.FC<MainInputSectionProps> = ({
	onSendMessage,
	disabled = false,
	attachments,
	onAddAttachment,
	onAddFromClipboard,
	onRemoveAttachment,
	onClearAttachments,
	canAddMore,
}) => {
	const [message, setMessage] = useState("");
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	// サムネイル表示を考慮した入力欄の高さ調整
	const getInputHeight = useCallback(() => {
		const hasAttachments = attachments.length > 0;
		if (hasAttachments) {
			// サムネイルがある場合は入力欄を小さくする
			return "60px";
		}
		// サムネイルがない場合は適度なサイズ
		return "100px";
	}, [attachments.length]);

	// テキストエリアの高さを自動調整
	const adjustTextareaHeight = useCallback(() => {
		const textarea = textareaRef.current;
		if (textarea) {
			textarea.style.height = "auto";
			const maxHeight = parseInt(getInputHeight(), 10);
			textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
		}
	}, [getInputHeight]);

	// メッセージが変更されたときにテキストエリアの高さを調整
	useEffect(() => {
		adjustTextareaHeight();
	}, [message, adjustTextareaHeight]);

	// 添付ファイル数が変更されたときにテキストエリアの高さを調整
	useEffect(() => {
		adjustTextareaHeight();
	}, [attachments.length, adjustTextareaHeight]);

	// キーボードイベントハンドラー
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
			if (e.key === "Enter") {
				if (e.shiftKey) {
					// Shift+Enter: 改行
					return;
				} else {
					// Enter: 送信
					e.preventDefault();
					if (message.trim() || attachments.length > 0) {
						onSendMessage(message, attachments);
						setMessage("");
						onClearAttachments();
					}
				}
			} else if (e.key === "v" && e.ctrlKey) {
				// Ctrl+V: クリップボードから貼り付け
				e.preventDefault();
				if (canAddMore) {
					onAddFromClipboard();
				}
			}
		},
		[
			message,
			attachments,
			onSendMessage,
			onClearAttachments,
			onAddFromClipboard,
			canAddMore,
		]
	);

	// 送信ハンドラー
	const handleSend = useCallback(() => {
		if (message.trim() || attachments.length > 0) {
			onSendMessage(message, attachments);
			setMessage("");
			onClearAttachments();
		}
	}, [message, attachments, onSendMessage, onClearAttachments]);

	return (
		<div className="main-input-section">
			{/* 入力コンテナ */}
			<div className="input-container">
				<textarea
					ref={textareaRef}
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder="メッセージを入力... (Ctrl+V: 画像貼り付け, Enter: 送信, Shift+Enter: 改行)"
					className="message-input"
					disabled={disabled}
					style={{
						minHeight: getInputHeight(),
						maxHeight: getInputHeight(),
					}}
				/>
				<div className="input-buttons">
					<button
						onClick={onAddAttachment}
						disabled={disabled || !canAddMore}
						className="input-button"
						title={
							canAddMore ? "ファイルを添付" : "添付は最大4枚まで"
						}
					>
						<Paperclip size={16} />
					</button>
					<button
						onClick={handleSend}
						disabled={
							disabled ||
							(!message.trim() && attachments.length === 0)
						}
						className="input-button send-button"
						title="送信"
					>
						<Send size={16} />
					</button>
				</div>
			</div>

			{/* 添付ファイルのサムネイル表示（入力欄の下） */}
			{attachments.length > 0 && (
				<div className="attachments-thumbnail-area">
					{attachments.map((attachment) => (
						<div
							key={attachment.id}
							className="attachment-thumbnail"
						>
							{attachment.type.startsWith("image/") ? (
								<img
									src={attachment.data}
									alt={attachment.name}
									className="thumbnail-image"
								/>
							) : (
								<div className="thumbnail-file">📄</div>
							)}
							<button
								className="thumbnail-remove"
								onClick={() =>
									onRemoveAttachment(attachment.id)
								}
								title="削除"
							>
								×
							</button>
						</div>
					))}
				</div>
			)}
		</div>
	);
};
