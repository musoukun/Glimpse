import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface SettingsModalProps {
	isOpen: boolean;
	onClose: () => void;
}

interface AppSettings {
	ui_settings: {
		window_size: string;
		opacity: number;
	};
	response_settings: {
		max_characters: number;
		response_language: string;
	};
}

function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
	const [settings, setSettings] = useState<AppSettings | null>(null);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		if (isOpen) {
			loadSettings();
		}
	}, [isOpen]);

	const loadSettings = async () => {
		setLoading(true);
		setError("");
		try {
			// デフォルト設定
			const currentSettings: AppSettings = {
				ui_settings: {
					window_size: "small",
					opacity: 0.9,
				},
				response_settings: {
					max_characters: 300,
					response_language: "日本語",
				},
			};

			setSettings(currentSettings);
		} catch (err) {
			console.error("設定読み込み失敗", err);
			setError("設定の読み込みに失敗しました: " + String(err));
		} finally {
			setLoading(false);
		}
	};

	const saveSettings = async () => {
		if (!settings) return;

		setSaving(true);
		setError("");
		try {
			console.log("設定保存:", settings);
			onClose();
		} catch (err) {
			setError("設定の保存に失敗しました: " + String(err));
		} finally {
			setSaving(false);
		}
	};

	const updateUiSetting = async (key: string, value: string | number) => {
		if (!settings) return;
		setSettings({
			...settings,
			ui_settings: {
				...settings.ui_settings,
				[key]: value,
			},
		});

		// ウィンドウサイズ変更時は即座に適用
		if (key === "window_size" && typeof value === "string") {
			try {
				// Electron IPC経由でウィンドウサイズを変更
				await window.api.resizeWindow(value);
				console.log(`ウィンドウサイズを${value}に変更`);
			} catch (err) {
				console.error("ウィンドウサイズ変更エラー:", err);
			}
		}
	};

	const updateResponseSetting = (key: string, value: string | number) => {
		if (!settings) return;
		setSettings({
			...settings,
			response_settings: {
				...settings.response_settings,
				[key]: value,
			},
		});
	};

	if (!isOpen) return null;

	return (
		<div className="modal-overlay">
			<div className="modal-content">
				<div className="modal-header">
					<h2>設定</h2>
					<button className="close-button" onClick={onClose}>
						<X size={16} />
					</button>
				</div>

				<div className="settings-content">
					{loading && (
						<div className="loading">
							<div className="spinner"></div>
							設定を読み込み中...
						</div>
					)}

					{error && (
						<div className="error">
							<p>{error}</p>
						</div>
					)}

					{settings && (
						<>
							{/* UI設定 */}
							<div className="settings-section">
								<h3>UI設定</h3>
								<div className="form-group">
									<label>ウィンドウサイズ</label>
									<select
										value={settings.ui_settings.window_size}
										onChange={(e) =>
											updateUiSetting(
												"window_size",
												e.target.value
											)
										}
									>
										<option value="small">
											small (280x400)
										</option>
										<option value="medium">
											medium (320x450)
										</option>
										<option value="large">
											large (360x500)
										</option>
									</select>
								</div>

								<div className="form-group">
									<label>
										透明度:{" "}
										{Math.round(
											settings.ui_settings.opacity * 100
										)}
										%
									</label>
									<input
										type="range"
										min="0.3"
										max="1.0"
										step="0.1"
										value={settings.ui_settings.opacity}
										onChange={(e) =>
											updateUiSetting(
												"opacity",
												parseFloat(e.target.value)
											)
										}
									/>
								</div>
							</div>

							{/* 応答設定 */}
							<div className="settings-section">
								<h3>応答設定</h3>
								<div className="form-group">
									<label>最大文字数</label>
									<input
										type="number"
										min="100"
										max="2000"
										value={
											settings.response_settings
												.max_characters
										}
										onChange={(e) =>
											updateResponseSetting(
												"max_characters",
												parseInt(e.target.value)
											)
										}
									/>
									<small>
										AIの応答の最大文字数を設定します
									</small>
								</div>

								<div className="form-group">
									<label>応答言語</label>
									<select
										value={
											settings.response_settings
												.response_language
										}
										onChange={(e) =>
											updateResponseSetting(
												"response_language",
												e.target.value
											)
										}
									>
										<option value="日本語">日本語</option>
										<option value="English">English</option>
										<option value="自動">自動</option>
									</select>
								</div>
							</div>
						</>
					)}
				</div>

				<div className="modal-footer">
					<button
						className="cancel-button"
						onClick={onClose}
						disabled={saving}
					>
						キャンセル
					</button>
					<button
						className="save-button"
						onClick={saveSettings}
						disabled={saving || !settings}
					>
						{saving ? "保存中..." : "保存"}
					</button>
				</div>
			</div>
		</div>
	);
}

export default SettingsModal;
