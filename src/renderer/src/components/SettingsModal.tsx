import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useUsage } from "../hooks/useUsage";

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
		user_prompt: string;
		font_size: number;
	};
}

function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
	const [settings, setSettings] = useState<AppSettings | null>(null);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const { getRemainingCalls, usage } = useUsage();

	useEffect(() => {
		if (isOpen) {
			loadSettings();
		}
	}, [isOpen]);

	const loadSettings = async () => {
		setLoading(true);
		setError("");
		try {
			// ローカルストレージから設定を読み込み
			const savedSettings = localStorage.getItem("glimpse_settings");

			// デフォルト設定
			const defaultSettings: AppSettings = {
				ui_settings: {
					window_size: "small",
					opacity: 0.9,
				},
				response_settings: {
					max_characters: 230,
					response_language: "日本語",
					user_prompt: "",
					font_size: 14,
				},
			};

			if (savedSettings) {
				const parsed = JSON.parse(savedSettings);
				// デフォルト設定とマージ
				const currentSettings: AppSettings = {
					ui_settings: {
						...defaultSettings.ui_settings,
						...parsed.ui_settings,
					},
					response_settings: {
						...defaultSettings.response_settings,
						...parsed.response_settings,
					},
				};
				setSettings(currentSettings);
			} else {
				setSettings(defaultSettings);
			}
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
			// ローカルストレージに設定を保存
			localStorage.setItem("glimpse_settings", JSON.stringify(settings));

			// 設定変更イベントを発火
			window.dispatchEvent(
				new CustomEvent("settings-changed", {
					detail: settings,
				})
			);

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
							{/* 使用状況 */}
							<div className="usage-info" style={{
								padding: '12px 16px',
								marginBottom: '20px',
								background: 'rgba(255, 255, 255, 0.1)',
								border: '1px solid rgba(255, 255, 255, 0.2)',
								borderRadius: '6px',
								fontSize: '14px',
								color: 'rgba(255, 255, 255, 0.9)'
							}}>
								今月の残り質問回数: <strong style={{ color: 'white' }}>{usage ? getRemainingCalls() : '...'}回</strong>
							</div>

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
										<option value="中文">中文</option>
										<option value="Español">Español</option>
										<option value="Français">
											Français
										</option>
										<option value="Deutsch">Deutsch</option>
										<option value="한국어">한국어</option>
										<option value="自動">自動</option>
									</select>
								</div>

								<div className="form-group">
									<label>追加プロンプト</label>
									<textarea
										value={
											settings.response_settings
												.user_prompt
										}
										onChange={(e) =>
											updateResponseSetting(
												"user_prompt",
												e.target.value
											)
										}
										placeholder="システムプロンプトに追加したい指示を入力してください"
										rows={3}
									/>
									<small>
										ここに入力した内容がシステムプロンプトの末尾に追加されます
									</small>
								</div>

								<div className="form-group">
									<label>
										文字サイズ:
										{
											settings.response_settings
												.font_size || 14
										}px
									</label>
									<input
										type="range"
										min="10"
										max="20"
										step="1"
										value={
											settings.response_settings
												.font_size || 14
										}
										onChange={(e) =>
											updateResponseSetting(
												"font_size",
												parseInt(e.target.value)
											)
										}
									/>
									<small>
										AIの回答の文字サイズを調整します
									</small>
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
