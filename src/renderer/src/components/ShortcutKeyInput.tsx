import { useState, useEffect, useRef } from "react";
import { Keyboard } from "lucide-react";

interface ShortcutKeyInputProps {
	value: string;
	onChange: (value: string) => void;
	label: string;
	description?: string;
}

function ShortcutKeyInput({ value, onChange, label, description }: ShortcutKeyInputProps) {
	const [isRecording, setIsRecording] = useState(false);
	const [recordedKeys, setRecordedKeys] = useState<Set<string>>(new Set());
	const inputRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!isRecording) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			e.preventDefault();
			e.stopPropagation();

			const key = getKeyName(e);
			setRecordedKeys((prev) => new Set([...prev, key]));
		};

		const handleKeyUp = (e: KeyboardEvent) => {
			e.preventDefault();
			e.stopPropagation();

			// すべてのキーが離されたら記録を終了
			setTimeout(() => {
				if (recordedKeys.size > 0) {
					const shortcut = formatShortcut(Array.from(recordedKeys));
					onChange(shortcut);
					setIsRecording(false);
					setRecordedKeys(new Set());
				}
			}, 100);
		};

		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("keyup", handleKeyUp);

		// フォーカスを設定
		inputRef.current?.focus();

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("keyup", handleKeyUp);
		};
	}, [isRecording, recordedKeys, onChange]);

	const getKeyName = (e: KeyboardEvent): string => {
		// 修飾キー
		if (e.key === "Control") return "Ctrl";
		if (e.key === "Meta") return "Cmd";
		if (e.key === "Alt") return "Alt";
		if (e.key === "Shift") return "Shift";

		// 特殊キー
		if (e.key === " ") return "Space";
		if (e.key === "ArrowUp") return "Up";
		if (e.key === "ArrowDown") return "Down";
		if (e.key === "ArrowLeft") return "Left";
		if (e.key === "ArrowRight") return "Right";
		if (e.key === "Enter") return "Enter";
		if (e.key === "Escape") return "Esc";
		if (e.key === "Tab") return "Tab";
		if (e.key === "Backspace") return "Backspace";
		if (e.key === "Delete") return "Delete";

		// ファンクションキー
		if (e.key.startsWith("F") && e.key.length <= 3) return e.key;

		// その他のキー（大文字に変換）
		return e.key.toUpperCase();
	};

	const formatShortcut = (keys: string[]): string => {
		// 修飾キーの順序を正規化
		const modifiers = ["Ctrl", "Cmd", "Alt", "Shift"];
		const sortedKeys = keys.sort((a, b) => {
			const aIndex = modifiers.indexOf(a);
			const bIndex = modifiers.indexOf(b);
			
			// 両方が修飾キーの場合
			if (aIndex !== -1 && bIndex !== -1) {
				return aIndex - bIndex;
			}
			
			// aだけが修飾キーの場合
			if (aIndex !== -1) return -1;
			
			// bだけが修飾キーの場合
			if (bIndex !== -1) return 1;
			
			// 両方が通常のキーの場合
			return 0;
		});

		return sortedKeys.join("+");
	};

	const handleStartRecording = () => {
		setIsRecording(true);
		setRecordedKeys(new Set());
	};

	const handleStopRecording = () => {
		setIsRecording(false);
		setRecordedKeys(new Set());
	};

	return (
		<div className="shortcut-key-input">
			<label>{label}</label>
			<div className="input-wrapper">
				<div
					ref={inputRef}
					className={`shortcut-display ${isRecording ? "recording" : ""}`}
					tabIndex={0}
				>
					{isRecording ? (
						<span className="recording-text">
							{recordedKeys.size > 0
								? formatShortcut(Array.from(recordedKeys))
								: "キーを押してください..."}
						</span>
					) : (
						<span className="shortcut-text">{value || "未設定"}</span>
					)}
				</div>
				<button
					className="record-button"
					onClick={isRecording ? handleStopRecording : handleStartRecording}
					type="button"
				>
					<Keyboard size={16} />
					{isRecording ? "キャンセル" : "設定"}
				</button>
			</div>
			{description && <small>{description}</small>}
		</div>
	);
}

export default ShortcutKeyInput;