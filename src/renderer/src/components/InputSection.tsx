import React from "react";
import { Paperclip, /* Camera, */ Send } from "lucide-react";
import { useAttachments } from "../hooks/useAttachments";
import { useErrorToast } from "../hooks/useErrorToast";
import { AttachmentPreview } from "./AttachmentPreview";
import { InlineError } from "./InlineError";

interface InputSectionProps {
	message: string;
	loading: boolean;
	onMessageChange: (message: string) => void;
	onSubmit: (e: React.FormEvent) => void;
	onKeyDown: (e: React.KeyboardEvent) => void;
	onSubmitWithAttachments?: (
		attachments: {
			screenshots: any[];
			file: any;
		},
		clearAttachments?: () => void
	) => void;
}

export const InputSection: React.FC<InputSectionProps> = ({
	message,
	loading,
	onMessageChange,
	onSubmit,
	onKeyDown,
	onSubmitWithAttachments,
}) => {
	const { toasts, showError, removeToast } = useErrorToast();

	console.log("InputSection render:", {
		toastsCount: toasts.length,
		toasts: toasts.map((t) => ({ id: t.id, message: t.message })),
	});

	const {
		screenshots,
		attachedFile,
		hasAttachments,
		// addScreenshot,
		// takeScreenshotAndSend,
		selectFile,
		removeScreenshot,
		removeAttachedFile,
		clearAllAttachments,
		pasteFromClipboard,
	} = useAttachments({
		onError: (msg) => {
			console.log("useAttachments onError called:", msg);
			showError(msg);
		},
	});

	// スクリーンショット関連の関数をコメントアウト
	/*
	const handleScreenshotOnly = async () => {
		await addScreenshot();
	};

	const handleScreenshotAndSend = async () => {
		const screenshot = await takeScreenshotAndSend();
		if (screenshot && onSubmitWithAttachments) {
			onSubmitWithAttachments({
				screenshots: [screenshot],
				file: null,
			});
		}
	};
	*/

	const handleSubmit = (e: React.FormEvent) => {
		console.log("InputSection handleSubmit called", {
			hasAttachments,
			messageLength: message.trim().length,
			loading,
		});
		e.preventDefault();

		// ローディング中または空のメッセージ＆添付ファイルなしの場合は送信しない
		if (loading || (!message.trim() && !hasAttachments)) {
			console.log("Submit blocked:", {
				loading,
				messageEmpty: !message.trim(),
				noAttachments: !hasAttachments,
			});
			return;
		}

		if (hasAttachments && onSubmitWithAttachments) {
			console.log("Submitting with attachments");
			onSubmitWithAttachments(
				{
					screenshots,
					file: attachedFile,
				},
				() => {
					// 送信後に添付ファイルをクリア
					clearAllAttachments();
				}
			);
		} else {
			console.log("Submitting without attachments");
			onSubmit(e);
		}
	};

	// キーボードイベントハンドラー（Ctrl+V対応）
	const handleKeyDown = async (e: React.KeyboardEvent) => {
		// Enterキーの処理（Shift+Enterは改行）
		if (e.key === "Enter" && !e.shiftKey) {
			console.log("Enter key pressed", {
				messageLength: message.trim().length,
				hasAttachments,
				loading,
			});
			// メッセージがあるか、添付ファイルがある場合のみ送信
			if (message.trim() || hasAttachments) {
				e.preventDefault();
				console.log("Triggering form submit");
				// フォーム送信をトリガー
				const form = e.currentTarget.closest("form");
				if (form) {
					const submitEvent = new Event("submit", {
						bubbles: true,
						cancelable: true,
					});
					form.dispatchEvent(submitEvent);
				} else {
					console.log("Form not found");
				}
				return;
			} else {
				console.log("Enter key ignored - no message or attachments");
			}
		}

		// 元のキーダウンイベントを呼び出し（Enterキー以外の場合）
		if (e.key !== "Enter" || e.shiftKey) {
			onKeyDown(e);
		}

		// Ctrl+Vでクリップボード処理
		if (e.ctrlKey && e.key === "v") {
			e.preventDefault();

			try {
				// まずクリップボードからテキストを取得を試行
				const text = await navigator.clipboard.readText();
				if (text) {
					// テキストがある場合は入力欄に追加
					const textarea = e.currentTarget as HTMLTextAreaElement;
					const start = textarea.selectionStart;
					const end = textarea.selectionEnd;
					const newValue =
						message.substring(0, start) +
						text +
						message.substring(end);
					onMessageChange(newValue);

					// カーソル位置を調整
					setTimeout(() => {
						textarea.selectionStart = textarea.selectionEnd =
							start + text.length;
					}, 0);
					return;
				}
			} catch (error) {
				// テキストの取得に失敗した場合は画像を試行
				console.log("No text in clipboard, trying image");
			}

			// テキストがない場合は画像を試行
			await pasteFromClipboard();
		}
	};

	const buttonStyle = {
		padding: "8px",
		background: "rgba(255, 255, 255, 0.1)",
		border: "1px solid rgba(255, 255, 255, 0.2)",
		borderRadius: "6px",
		color: "rgba(255, 255, 255, 0.8)",
		cursor: loading ? "not-allowed" : "pointer",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		gap: "2px",
		fontSize: "9px",
		fontWeight: "500",
		transition: "all 0.2s ease",
		fontFamily:
			"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
		backdropFilter: "blur(10px)",
		width: "40px",
		height: "32px",
	};

	const sendButtonStyle = {
		...buttonStyle,
		background:
			loading || (!message.trim() && !hasAttachments)
				? "rgba(255, 255, 255, 0.1)"
				: "linear-gradient(135deg, rgba(122, 170, 255, 0.8), rgba(74, 144, 226, 0.8))",
		color:
			loading || (!message.trim() && !hasAttachments)
				? "rgba(255, 255, 255, 0.4)"
				: "white",
		boxShadow:
			loading || (!message.trim() && !hasAttachments)
				? "none"
				: "0 4px 16px rgba(122, 170, 255, 0.3)",
	};

	const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
		if (!loading) {
			e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
			e.currentTarget.style.color = "rgba(255, 255, 255, 1)";
			e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.2)";
		}
	};

	const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
		if (!loading) {
			e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
			e.currentTarget.style.color = "rgba(255, 255, 255, 0.8)";
			e.currentTarget.style.boxShadow = "none";
		}
	};

	const handleSendMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
		if (!loading && (message.trim() || hasAttachments)) {
			e.currentTarget.style.background =
				"linear-gradient(135deg, rgba(122, 170, 255, 1), rgba(74, 144, 226, 1))";
			e.currentTarget.style.boxShadow =
				"0 6px 20px rgba(122, 170, 255, 0.4)";
			e.currentTarget.style.transform = "translateY(-1px)";
		}
	};

	const handleSendMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
		if (!loading && (message.trim() || hasAttachments)) {
			e.currentTarget.style.background =
				"linear-gradient(135deg, rgba(122, 170, 255, 0.8), rgba(74, 144, 226, 0.8))";
			e.currentTarget.style.boxShadow =
				"0 4px 16px rgba(122, 170, 255, 0.3)";
			e.currentTarget.style.transform = "translateY(0)";
		}
	};

	return (
		<div className="input-section">
			{/* インラインエラーの表示 */}
			{toasts.map((toast) => (
				<InlineError
					key={toast.id}
					message={toast.message}
					onClose={() => {
						console.log("Closing toast:", toast.id);
						removeToast(toast.id);
					}}
				/>
			))}

			{/* フォーム要素で囲む */}
			<form onSubmit={handleSubmit}>
				{/* 入力欄とボタンを横並びに配置 */}
				<div
					style={{
						display: "flex",
						gap: "8px",
						alignItems: "flex-end",
						marginBottom: "8px",
					}}
				>
					{/* 質問入力欄 */}
					<textarea
						value={message}
						onChange={(e) => onMessageChange(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder="Ask anything... (Enter to send, Shift+Enter for new line, Ctrl+V to paste text/image)"
						disabled={loading}
						rows={4}
						style={{
							flex: 1,
							padding: "8px 12px",
							border: "1px solid rgba(255, 255, 255, 0.2)",
							borderRadius: "8px",
							fontSize: "11px",
							resize: "none",
							fontFamily: "inherit",
							background: "rgba(255, 255, 255, 0.1)",
							backdropFilter: "blur(10px)",
							color: "white",
							minHeight: "120px",
							maxHeight: "180px",
						}}
					/>

					{/* 右側のボタン群 */}
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							gap: "6px",
						}}
					>
						{/* Screenshot添付のみボタン - コメントアウト */}
						{/*
						<button
							type="button"
							onClick={handleScreenshotOnly}
							disabled={loading || attachmentLoading}
							style={buttonStyle}
							onMouseEnter={handleMouseEnter}
							onMouseLeave={handleMouseLeave}
							title="スクリーンショットを撮影して添付"
						>
							<Camera size={16} />
						</button>
						*/}

						{/* Screenshot & Sendボタン - コメントアウト */}
						{/*
						<button
							type="button"
							onClick={handleScreenshotAndSend}
							disabled={loading}
							style={buttonStyle}
							onMouseEnter={handleMouseEnter}
							onMouseLeave={handleMouseLeave}
							title="スクリーンショットを撮影して即座に送信"
						>
							<Camera size={14} />
							<Send size={14} />
						</button>
						*/}

						{/* ファイル添付ボタン */}
						<button
							type="button"
							onClick={selectFile}
							disabled={loading}
							style={buttonStyle}
							onMouseEnter={handleMouseEnter}
							onMouseLeave={handleMouseLeave}
							title="ファイルを添付"
						>
							<Paperclip size={16} />
						</button>

						{/* Sendボタン */}
						<button
							type="submit"
							disabled={
								loading || (!message.trim() && !hasAttachments)
							}
							style={sendButtonStyle}
							onMouseEnter={handleSendMouseEnter}
							onMouseLeave={handleSendMouseLeave}
							title="メッセージを送信"
						>
							<Send size={16} />
						</button>
					</div>
				</div>
			</form>

			{/* 添付ファイルプレビュー */}
			<AttachmentPreview
				screenshots={screenshots}
				attachedFile={attachedFile}
				onRemoveScreenshot={removeScreenshot}
				onRemoveFile={removeAttachedFile}
			/>

			{/* 範囲選択機能は廃止（コメントアウト）
			<div style={{ display: "none" }}>
				<button onClick={takeRegionScreenshot}>範囲選択スクリーンショット</button>
				<button onClick={takeRegionScreenshotAndSend}>範囲選択&送信</button>
			</div>
			*/}
		</div>
	);
};
