import React from "react";
import { X, FileText, Image, Video, Volume2, Code } from "lucide-react";
import { AttachedFile, AttachedScreenshot } from "../types";

interface AttachmentPreviewProps {
	screenshots: AttachedScreenshot[];
	attachedFile: AttachedFile | null;
	onRemoveScreenshot: (id: string) => void;
	onRemoveFile: () => void;
}

export const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({
	screenshots,
	attachedFile,
	onRemoveScreenshot,
	onRemoveFile,
}) => {
	const getFileIcon = (fileType: string) => {
		switch (fileType) {
			case "image":
				return <Image size={14} />;
			case "document":
				return <FileText size={14} />;
			case "video":
				return <Video size={14} />;
			case "audio":
				return <Volume2 size={14} />;
			case "text":
				return <Code size={14} />;
			default:
				return <FileText size={14} />;
		}
	};

	const formatFileSize = (bytes: number): string => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	};

	if (screenshots.length === 0 && !attachedFile) {
		return null;
	}

	return (
		<div
			style={{
				padding: "8px",
				background: "rgba(255, 255, 255, 0.03)",
				borderTop: "1px solid rgba(255, 255, 255, 0.1)",
				borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
			}}
		>
			{/* スクリーンショット表示 */}
			{screenshots.length > 0 && (
				<div style={{ marginBottom: attachedFile ? "8px" : "0" }}>
					<div
						style={{
							fontSize: "10px",
							color: "rgba(255, 255, 255, 0.6)",
							marginBottom: "4px",
							fontWeight: "500",
						}}
					>
						Screenshots ({screenshots.length}/5)
					</div>
					<div
						style={{
							display: "flex",
							gap: "4px",
							flexWrap: "wrap",
						}}
					>
						{screenshots.map((screenshot) => (
							<div
								key={screenshot.id}
								style={{
									position: "relative",
									width: "40px",
									height: "40px",
									borderRadius: "4px",
									overflow: "hidden",
									border: "1px solid rgba(255, 255, 255, 0.2)",
									background: "rgba(255, 255, 255, 0.1)",
								}}
							>
								<img
									src={`data:image/png;base64,${screenshot.data}`}
									alt="Screenshot"
									style={{
										width: "100%",
										height: "100%",
										objectFit: "cover",
									}}
								/>
								<button
									onClick={() =>
										onRemoveScreenshot(screenshot.id)
									}
									style={{
										position: "absolute",
										top: "-2px",
										right: "-2px",
										width: "16px",
										height: "16px",
										borderRadius: "50%",
										background: "rgba(255, 107, 107, 0.9)",
										border: "1px solid rgba(255, 255, 255, 0.3)",
										color: "white",
										cursor: "pointer",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										fontSize: "8px",
										fontWeight: "bold",
										transition: "all 0.2s ease",
									}}
									onMouseEnter={(e) => {
										e.currentTarget.style.background =
											"rgba(255, 107, 107, 1)";
										e.currentTarget.style.transform =
											"scale(1.1)";
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.background =
											"rgba(255, 107, 107, 0.9)";
										e.currentTarget.style.transform =
											"scale(1)";
									}}
									title="スクリーンショットを削除"
								>
									<X size={10} />
								</button>
							</div>
						))}
					</div>
				</div>
			)}

			{/* 添付ファイル表示 */}
			{attachedFile && (
				<div>
					<div
						style={{
							fontSize: "10px",
							color: "rgba(255, 255, 255, 0.6)",
							marginBottom: "4px",
							fontWeight: "500",
						}}
					>
						Attached File
					</div>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: "8px",
							padding: "6px 8px",
							background: "rgba(255, 255, 255, 0.1)",
							borderRadius: "6px",
							border: "1px solid rgba(255, 255, 255, 0.2)",
						}}
					>
						{/* ファイルプレビュー */}
						{attachedFile.file_type === "image" ? (
							<img
								src={`data:${attachedFile.mime_type};base64,${attachedFile.data}`}
								alt={attachedFile.name}
								style={{
									width: "24px",
									height: "24px",
									objectFit: "cover",
									borderRadius: "3px",
									border: "1px solid rgba(255, 255, 255, 0.2)",
								}}
							/>
						) : (
							<div
								style={{
									width: "24px",
									height: "24px",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									background: "rgba(255, 255, 255, 0.1)",
									borderRadius: "3px",
									color: "rgba(255, 255, 255, 0.7)",
								}}
							>
								{getFileIcon(attachedFile.file_type)}
							</div>
						)}

						{/* ファイル情報 */}
						<div style={{ flex: 1, minWidth: 0 }}>
							<div
								style={{
									fontSize: "10px",
									color: "rgba(255, 255, 255, 0.9)",
									fontWeight: "500",
									overflow: "hidden",
									textOverflow: "ellipsis",
									whiteSpace: "nowrap",
								}}
							>
								{attachedFile.name}
							</div>
							<div
								style={{
									fontSize: "8px",
									color: "rgba(255, 255, 255, 0.6)",
								}}
							>
								{formatFileSize(attachedFile.size)} •{" "}
								{attachedFile.file_type}
							</div>
						</div>

						{/* 削除ボタン */}
						<button
							onClick={onRemoveFile}
							style={{
								width: "20px",
								height: "20px",
								borderRadius: "50%",
								background: "rgba(255, 107, 107, 0.8)",
								border: "1px solid rgba(255, 255, 255, 0.3)",
								color: "white",
								cursor: "pointer",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								transition: "all 0.2s ease",
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.background =
									"rgba(255, 107, 107, 1)";
								e.currentTarget.style.transform = "scale(1.05)";
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.background =
									"rgba(255, 107, 107, 0.8)";
								e.currentTarget.style.transform = "scale(1)";
							}}
							title="ファイルを削除"
						>
							<X size={12} />
						</button>
					</div>
				</div>
			)}
		</div>
	);
};
