import React from "react";
import { X, Minus, Settings, LogOut } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { User } from "firebase/auth";

interface TitleBarProps {
	onSettingsClick: () => void;
	opacity?: number;
	onOpacityChange?: (opacity: number) => void;
	user?: User | null;
	onLogout?: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
	onSettingsClick,
	opacity,
	onOpacityChange,
	user,
	onLogout,
}) => {
	const handleMinimize = async () => {
		try {
			const appWindow = getCurrentWindow();
			await appWindow.minimize();
		} catch (error) {
			console.error("Failed to minimize window:", error);
		}
	};

	const handleClose = async () => {
		try {
			const appWindow = getCurrentWindow();
			await appWindow.hide();
		} catch (error) {
			console.error("Failed to close window:", error);
		}
	};

	return (
		<div
			data-tauri-drag-region
			style={{
				height: "32px",
				background: "rgba(0, 0, 0, 0.8)",
				backdropFilter: "blur(10px)",
				borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				padding: "0 8px",
				userSelect: "none",
				WebkitUserSelect: "none",
			}}
		>
			{/* 左側: アプリアイコンとタイトル */}
			<div
				data-tauri-drag-region
				style={{
					display: "flex",
					alignItems: "center",
					gap: "8px",
					fontSize: "12px",
					color: "rgba(255, 255, 255, 0.8)",
					fontWeight: "500",
					fontFamily:
						"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
					cursor: "grab",
				}}
			>
				<img
					src="/glimpse-icon.png"
					alt="Glimpse"
					style={{
						width: "16px",
						height: "16px",
						borderRadius: "50%",
						objectFit: "cover",
					}}
				/>
				Glimpse
			</div>

			{/* 中央: 透明度スライダー */}
			<div
				data-tauri-drag-region
				style={{
					display: "flex",
					alignItems: "center",
					gap: "8px",
					flex: 1,
					justifyContent: "center",
					maxWidth: "200px",
					cursor: "grab",
				}}
			>
				{opacity !== undefined && onOpacityChange && (
					<input
						type="range"
						min="0.1"
						max="1"
						step="0.1"
						value={opacity}
						onChange={(e) =>
							onOpacityChange(parseFloat(e.target.value))
						}
						style={{
							width: "80px",
							height: "4px",
							background: "rgba(255, 255, 255, 0.2)",
							borderRadius: "2px",
							outline: "none",
							cursor: "pointer",
						}}
					/>
				)}
			</div>

			{/* 右側: ウィンドウコントロール */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: "4px",
				}}
			>
				{/* ログアウトボタン */}
				{user && onLogout && (
					<button
						onClick={onLogout}
						style={{
							width: "24px",
							height: "24px",
							background: "transparent",
							border: "none",
							borderRadius: "4px",
							color: "rgba(255, 255, 255, 0.7)",
							cursor: "pointer",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							transition: "all 0.2s ease",
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.background =
								"rgba(255, 255, 255, 0.1)";
							e.currentTarget.style.color =
								"rgba(255, 255, 255, 1)";
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.background = "transparent";
							e.currentTarget.style.color =
								"rgba(255, 255, 255, 0.7)";
						}}
						title={`ログアウト (${user.email || user.displayName})`}
					>
						<LogOut size={12} />
					</button>
				)}

				{/* 設定ボタン */}
				<button
					onClick={onSettingsClick}
					style={{
						width: "24px",
						height: "24px",
						background: "transparent",
						border: "none",
						borderRadius: "4px",
						color: "rgba(255, 255, 255, 0.7)",
						cursor: "pointer",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						transition: "all 0.2s ease",
					}}
					onMouseEnter={(e) => {
						e.currentTarget.style.background =
							"rgba(255, 255, 255, 0.1)";
						e.currentTarget.style.color = "rgba(255, 255, 255, 1)";
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.background = "transparent";
						e.currentTarget.style.color =
							"rgba(255, 255, 255, 0.7)";
					}}
					title="設定"
				>
					<Settings size={14} />
				</button>

				{/* 最小化ボタン */}
				<button
					onClick={handleMinimize}
					style={{
						width: "24px",
						height: "24px",
						background: "transparent",
						border: "none",
						borderRadius: "4px",
						color: "rgba(255, 255, 255, 0.7)",
						cursor: "pointer",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						transition: "all 0.2s ease",
					}}
					onMouseEnter={(e) => {
						e.currentTarget.style.background =
							"rgba(255, 255, 255, 0.1)";
						e.currentTarget.style.color = "rgba(255, 255, 255, 1)";
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.background = "transparent";
						e.currentTarget.style.color =
							"rgba(255, 255, 255, 0.7)";
					}}
					title="最小化"
				>
					<Minus size={14} />
				</button>

				{/* 閉じるボタン */}
				<button
					onClick={handleClose}
					style={{
						width: "24px",
						height: "24px",
						background: "transparent",
						border: "none",
						borderRadius: "4px",
						color: "rgba(255, 255, 255, 0.7)",
						cursor: "pointer",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						transition: "all 0.2s ease",
					}}
					onMouseEnter={(e) => {
						e.currentTarget.style.background =
							"rgba(255, 107, 107, 0.8)";
						e.currentTarget.style.color = "white";
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.background = "transparent";
						e.currentTarget.style.color =
							"rgba(255, 255, 255, 0.7)";
					}}
					title="閉じる"
				>
					<X size={14} />
				</button>
			</div>
		</div>
	);
};
