import React from "react";
import { GraduationCap } from "lucide-react";

interface AnswerModeToggleProps {
	enabled: boolean;
	onChange: (enabled: boolean) => void;
}

export const AnswerModeToggle: React.FC<AnswerModeToggleProps> = ({
	enabled,
	onChange,
}) => {
	return (
		<div className="answer-mode-toggle">
			<label
				className="toggle-label"
				title="Answer Modeでは以下の機能が有効になります：
- 数式・問題の解答手順を段階表示または証明
- 任意言語のテキストを指定言語に翻訳
- 指定言語のテキストを英語に翻訳
- 画像内文字を認識して処理"
			>
				<input
					type="checkbox"
					className="toggle-input"
					checked={enabled}
					onChange={(e) => onChange(e.target.checked)}
				/>
				<span className="toggle-slider"></span>
				<span className="toggle-text">
					<GraduationCap size={12} />
					Answer Mode
				</span>
			</label>
		</div>
	);
};
