import { useState, useEffect } from "react";
import { X, Download, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { useUsage } from "../hooks/useUsage";
import { useUpdater } from "../hooks/useUpdater";

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
		grounding_max_tokens: number; // Google検索結果の文字数制限
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
					grounding_max_tokens: 512, // Google検索結果のデフォルト制限
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
							<div
								className="usage-info"
								style={{
									padding: "12px 16px",
									marginBottom: "20px",
									background: "rgba(255, 255, 255, 0.1)",
									border: "1px solid rgba(255, 255, 255, 0.2)",
									borderRadius: "6px",
									fontSize: "14px",
									color: "rgba(255, 255, 255, 0.9)",
								}}
							>
								今月の残り質問回数:{" "}
								<strong style={{ color: "white" }}>
									{usage ? getRemainingCalls() : "..."}回
								</strong>
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
										min="0.1"
										max="1.0"
										step="0.05"
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
									<label>Google検索結果の制限</label>
									<input
										type="number"
										min="256"
										max="2048"
										step="128"
										value={
											settings.response_settings
												.grounding_max_tokens
										}
										onChange={(e) =>
											updateResponseSetting(
												"grounding_max_tokens",
												parseInt(e.target.value)
											)
										}
									/>
									<small>
										Google検索結果を使用した回答の最大トークン数（約文字数の0.7倍）。低い値ほど簡潔な回答になります。
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
										{settings.response_settings.font_size ||
											14}
										px
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

							{/* アップデート設定 */}
							<UpdateSection />
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

// アップデートセクションコンポーネント
function UpdateSection() {
	const { updateState, checkForUpdate, downloadUpdate, installUpdate, isChecking } = useUpdater();
	const [currentVersion, setCurrentVersion] = useState<string>('');

	useEffect(() => {
		// package.jsonからバージョンを取得するか、デフォルト値を使用
		setCurrentVersion('0.1.0'); // TODO: 実際のバージョンを取得
	}, []);

	const handleCheckUpdate = async () => {
		await checkForUpdate();
	};

	const handleDownloadUpdate = async () => {
		await downloadUpdate();
	};

	const handleInstallUpdate = async () => {
		const result = await installUpdate();
		if (result && 'restart' in result && result.restart) {
			// アプリが再起動される
		}
	};

	return (
		<div className="settings-section">
			<h3>アップデート</h3>
			
			<div className="form-group">
				<label>現在のバージョン: {currentVersion}</label>
			</div>

			{updateState.status === 'idle' && (
				<div className="form-group">
					<button
						className="update-check-button"
						onClick={handleCheckUpdate}
						disabled={isChecking}
					>
						<RefreshCw size={14} className={isChecking ? 'spinning' : ''} />
						{isChecking ? 'チェック中...' : 'アップデートを確認'}
					</button>
				</div>
			)}

			{updateState.status === 'checking' && (
				<div className="form-group">
					<p className="update-status">
						<RefreshCw size={14} className="spinning" />
						アップデートを確認中...
					</p>
				</div>
			)}

			{updateState.status === 'available' && updateState.updateInfo && (
				<div className="form-group update-available">
					<p className="update-info">
						<AlertCircle size={14} />
						新しいバージョン {updateState.updateInfo.version} が利用可能です
					</p>
					{updateState.updateInfo.releaseNotes && (
						<div className="release-notes">
							<small>{updateState.updateInfo.releaseNotes}</small>
						</div>
					)}
					<button
						className="download-button"
						onClick={handleDownloadUpdate}
					>
						<Download size={14} />
						ダウンロード
					</button>
				</div>
			)}

			{updateState.status === 'downloading' && updateState.downloadProgress && (
				<div className="form-group">
					<p className="update-status">
						<Download size={14} className="downloading" />
						ダウンロード中... {Math.round(updateState.downloadProgress.percent)}%
					</p>
					<div className="progress-bar">
						<div 
							className="progress-fill" 
							style={{ width: `${updateState.downloadProgress.percent}%` }}
						/>
					</div>
				</div>
			)}

			{updateState.status === 'downloaded' && (
				<div className="form-group update-ready">
					<p className="update-info">
						<CheckCircle size={14} />
						ダウンロード完了！インストールの準備ができました
					</p>
					<button
						className="install-button"
						onClick={handleInstallUpdate}
					>
						<RefreshCw size={14} />
						今すぐ再起動してインストール
					</button>
				</div>
			)}

			{updateState.status === 'error' && updateState.error && (
				<div className="form-group update-error">
					<p className="error-message">
						<AlertCircle size={14} />
						エラー: {updateState.error}
					</p>
				</div>
			)}
		</div>
	);
}

export default SettingsModal;