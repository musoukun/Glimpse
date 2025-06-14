import React from "react";
import { GraduationCap } from "lucide-react";

interface StudyModeToggleProps {
	enabled: boolean;
	onChange: (enabled: boolean) => void;
}

export const StudyModeToggle: React.FC<StudyModeToggleProps> = ({
	enabled,
	onChange,
}) => {
	return (
		<div className="study-mode-toggle">
			<label className="toggle-label">
				<input
					type="checkbox"
					className="toggle-input"
					checked={enabled}
					onChange={(e) => onChange(e.target.checked)}
				/>
				<span className="toggle-slider"></span>
				<span className="toggle-text">
					<GraduationCap size={12} />
					Study Mode
				</span>
			</label>
		</div>
	);
};