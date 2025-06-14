import React, { useState, useRef, useCallback, useEffect } from "react";
import { Send, Paperclip, Crop } from "lucide-react";
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

	// テキストエリアの高さを自動調整
	const adjustTextareaHeight = useCallback(() => {
		const textarea = textareaRef.current;
		if (textarea) {
			// 高さをリセット
			textarea.style.height = "auto";

			// 最小・最大高さを設定
			const minHeight = 40;
			const maxHeight = attachments.length > 0 ? 80 : 120;

			// スクロール高さに基づいて調整
			const scrollHeight = textarea.scrollHeight;
			const newHeight = Math.max(
				minHeight,
				Math.min(scrollHeight, maxHeight)
			);

			textarea.style.height = `${newHeight}px`;
		}
	}, [attachments.length]);

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
					placeholder="メッセージを入力&#10;Ctrl+V: 画像貼り付け&#10;Enter: 送信&#10;Shift+Enter: 改行"
					className="message-input"
					disabled={disabled}
					style={{
						minHeight: "40px",
						resize: "none",
					}}
				/>
				<div className="input-buttons">
					<button
						onClick={async () => {
							if (canAddMore) {
								const result = await window.api.captureArea();
								if (result) {
									// キャプチャした画像を添付として追加
									const attachment: Attachment = {
										id: Date.now().toString(),
										name: result.fileName,
										type: result.mimeType,
										size: result.fileSize,
										data: result.fileData,
									};
									// 親コンポーネントに渡されたaddAttachmentメソッドを直接呼び出すことができないため、
									// 一時的にローカルストレージ経由でイベントを発火
									window.dispatchEvent(
										new CustomEvent("capture-complete", {
											detail: attachment,
										})
									);
								}
							}
						}}
						disabled={disabled || !canAddMore}
						className="input-button"
						title={
							canAddMore
								? "画面をキャプチャ"
								: "添付は最大4枚まで"
						}
					>
						<Crop size={16} />
					</button>
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
