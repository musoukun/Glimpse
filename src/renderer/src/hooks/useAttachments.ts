import { useState, useCallback } from "react";
import type { Attachment } from "../types/index";
import Logger from "../utils/logger";
import { getFileValidationError } from "../utils/fileValidation";

const MAX_ATTACHMENTS = 4;

export const useAttachments = () => {
	const [attachments, setAttachments] = useState<Attachment[]>([]);

	// 外部から添付ファイルを追加する関数
	const addAttachmentDirect = useCallback((attachment: Attachment) => {
		if (attachments.length >= MAX_ATTACHMENTS) {
			Logger.warn(
				"ATTACHMENTS",
				`添付ファイルは最大${MAX_ATTACHMENTS}枚までです`
			);
			return;
		}
		
		// ファイルバリデーション
		const validationError = getFileValidationError(
			attachment.type,
			attachment.size,
			attachment.name
		);
		
		if (validationError) {
			Logger.error("ATTACHMENTS", validationError);
			window.alert(validationError);
			return;
		}
		
		setAttachments((prev) => [...prev, attachment]);
		Logger.info("ATTACHMENTS", `ファイル追加完了: ${attachment.name}`);
	}, [attachments.length]);

	const addAttachment = useCallback(async () => {
		try {
			// 最大数チェック
			if (attachments.length >= MAX_ATTACHMENTS) {
				Logger.warn(
					"ATTACHMENTS",
					`添付ファイルは最大${MAX_ATTACHMENTS}枚までです`
				);
				return;
			}

			Logger.info("ATTACHMENTS", "ファイル選択開始");

			// 実際のファイル選択ダイアログを使用
			const result = await (
				window as unknown as {
					api: {
						selectFile: () => Promise<{
							fileName: string;
							fileData: string;
							fileSize: number;
							mimeType: string;
						} | null>;
					};
				}
			).api.selectFile();

			if (!result) {
				Logger.info(
					"ATTACHMENTS",
					"ファイル選択がキャンセルされました"
				);
				return;
			}

			// ファイルバリデーション
			const validationError = getFileValidationError(
				result.mimeType,
				result.fileSize,
				result.fileName
			);
			
			if (validationError) {
				Logger.error("ATTACHMENTS", validationError);
				// エラーメッセージをユーザーに表示（トースト通知など）
				window.alert(validationError);
				return;
			}

			const newAttachment: Attachment = {
				id: Date.now().toString(),
				name: result.fileName,
				data: result.fileData,
				size: result.fileSize,
				type: result.mimeType,
			};

			setAttachments((prev) => [...prev, newAttachment]);
			Logger.info("ATTACHMENTS", `ファイル追加完了: ${result.fileName}`);
		} catch (error) {
			Logger.error("ATTACHMENTS", "ファイル選択エラー", { error });
		}
	}, [attachments.length]);

	// クリップボードから画像を追加する機能
	const addFromClipboard = useCallback(async () => {
		try {
			// 最大数チェック
			if (attachments.length >= MAX_ATTACHMENTS) {
				Logger.warn(
					"ATTACHMENTS",
					`添付ファイルは最大${MAX_ATTACHMENTS}枚までです`
				);
				return;
			}

			Logger.info("ATTACHMENTS", "クリップボードから画像取得開始");

			// Web Clipboard APIを使用して画像を取得
			const clipboardItems = await navigator.clipboard.read();

			for (const clipboardItem of clipboardItems) {
				for (const type of clipboardItem.types) {
					if (type.startsWith("image/")) {
						const blob = await clipboardItem.getType(type);
						const reader = new FileReader();

						return new Promise<void>((resolve, reject) => {
							reader.onload = () => {
								const dataUrl = reader.result as string;
								const newAttachment: Attachment = {
									id: Date.now().toString(),
									name: `clipboard-${Date.now()}.${type.split("/")[1]}`,
									data: dataUrl,
									size: blob.size,
									type: type,
								};

								setAttachments((prev) => [
									...prev,
									newAttachment,
								]);
								Logger.info(
									"ATTACHMENTS",
									`クリップボードから画像追加完了: ${type}`
								);
								resolve();
							};

							reader.onerror = () => {
								Logger.error(
									"ATTACHMENTS",
									"クリップボード画像の読み込みに失敗"
								);
								reject(
									new Error("Failed to read clipboard image")
								);
							};

							reader.readAsDataURL(blob);
						});
					}
				}
			}

			Logger.warn(
				"ATTACHMENTS",
				"クリップボードに画像が見つかりませんでした"
			);
		} catch (error) {
			Logger.error("ATTACHMENTS", "クリップボード画像取得エラー", {
				error,
			});
		}
	}, [attachments.length]);

	const removeAttachment = useCallback((id: string) => {
		setAttachments((prev) =>
			prev.filter((attachment) => attachment.id !== id)
		);
		Logger.info("ATTACHMENTS", "添付ファイル削除完了");
	}, []);

	const clearAttachments = useCallback(() => {
		setAttachments([]);
		Logger.info("ATTACHMENTS", "全添付ファイル削除完了");
	}, []);

	return {
		attachments,
		addAttachment,
		addAttachmentDirect,
		addFromClipboard,
		removeAttachment,
		clearAttachments,
		maxAttachments: MAX_ATTACHMENTS,
		canAddMore: attachments.length < MAX_ATTACHMENTS,
	};
};
