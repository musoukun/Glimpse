import React, { useState, useCallback, useEffect } from "react";
import { Settings, LogOut, Maximize2, X } from "lucide-react";
import { useSupabaseAuth } from "../hooks/useSupabaseAuth";

interface MainHeaderProps {
	onSettingsClick?: () => void;
}

type WindowSize = "small" | "medium" | "large";

export const MainHeader: React.FC<MainHeaderProps> = ({ onSettingsClick }) => {
	const [opacity, setOpacity] = useState(1.0);
	const [currentSize, setCurrentSize] = useState<WindowSize>("small");
	const { signOut } = useSupabaseAuth();

	const handleOpacityChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const newOpacity = parseFloat(event.target.value);
			setOpacity(newOpacity);

			// CSS変数を更新して透明度を変更
			document.documentElement.style.setProperty(
				"--app-opacity",
				newOpacity.toString()
			);
		},
		[]
	);

	const handleLogout = useCallback(async () => {
		try {
			await signOut();
		} catch (error) {
			console.error("ログアウトエラー:", error);
		}
	}, [signOut]);

	const handleSettingsClick = useCallback(() => {
		onSettingsClick?.();
	}, [onSettingsClick]);

	const handleSizeToggle = useCallback(async () => {
		const sizes: WindowSize[] = ["small", "medium", "large"];
		const currentIndex = sizes.indexOf(currentSize);
		const nextSize = sizes[(currentIndex + 1) % sizes.length];

		try {
			// Electron IPC経由でウィンドウサイズを変更
			const success = await (
				window as unknown as {
					api: {
						resizeWindow: (size: string) => Promise<boolean>;
					};
				}
			).api.resizeWindow(nextSize);

			if (success) {
				setCurrentSize(nextSize);
				console.log(`ウィンドウサイズを${nextSize}に変更しました`);
			}
		} catch (error) {
			console.error("ウィンドウサイズ変更エラー:", error);
		}
	}, [currentSize]);

	// ウィンドウを閉じる
	const handleCloseWindow = useCallback(async () => {
		try {
			await (
				window as unknown as {
					api: {
						closeWindow: () => Promise<void>;
					};
				}
			).api.closeWindow();
		} catch (error) {
			console.error("ウィンドウクローズエラー:", error);
		}
	}, []);

	// ウィンドウの表示/非表示を切り替える
	const handleToggleVisibility = useCallback(async () => {
		try {
			await (
				window as unknown as {
					api: {
						toggleWindowVisibility: () => Promise<void>;
					};
				}
			).api.toggleWindowVisibility();
		} catch (error) {
			console.error("ウィンドウ表示切り替えエラー:", error);
		}
	}, []);

	// Alt+Spaceショートカット
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.altKey && event.code === "Space") {
				event.preventDefault();
				handleToggleVisibility();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [handleToggleVisibility]);

	return (
		<div className="main-header">
			{/* ドラッグ可能エリア */}
			<div className="drag-area">
				{/* 透明度スライダー */}
				<div className="opacity-control">
					<input
						type="range"
						min="0.3"
						max="1.0"
						step="0.1"
						value={opacity}
						onChange={handleOpacityChange}
						className="opacity-slider"
						title="透明度調整"
					/>
				</div>
			</div>

			{/* ボタンエリア（ドラッグ無効） */}
			<div className="header-buttons">
				<button
					onClick={handleSizeToggle}
					className="header-button"
					title={`サイズ変更 (現在: ${currentSize})`}
				>
					<Maximize2 size={14} />
				</button>

				<button
					onClick={handleSettingsClick}
					className="header-button"
					title="設定"
				>
					<Settings size={14} />
				</button>

				<button
					onClick={handleLogout}
					className="header-button logout-button"
					title="ログアウト"
				>
					<LogOut size={14} />
				</button>

				<button
					onClick={handleCloseWindow}
					className="header-button close-button"
					title="閉じる (Alt+Space: 表示切り替え)"
				>
					<X size={14} />
				</button>
			</div>
		</div>
	);
};
