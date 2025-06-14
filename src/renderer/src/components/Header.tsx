import React from "react";
import { Settings, LogOut } from "lucide-react";
import { User } from "firebase/auth";

interface HeaderProps {
	opacity: number;
	onOpacityChange: (opacity: number) => void;
	onSettingsClick: () => void;
	user?: User | null;
	onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
	opacity,
	onOpacityChange,
	onSettingsClick,
	user,
	onLogout,
}) => {
	return (
		<div className="app-header">
			<div className="opacity-control">
				<input
					type="range"
					min="0.1"
					max="1"
					step="0.1"
					value={opacity}
					onChange={(e) =>
						onOpacityChange(parseFloat(e.target.value))
					}
					className="opacity-slider"
				/>
			</div>
			<div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
				{user && onLogout && (
					<button
						className="settings-icon"
						onClick={onLogout}
						title={`Logout (${user.email || user.displayName})`}
						style={{
							fontSize: "10px",
							width: "20px",
							height: "20px",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<LogOut size={12} />
					</button>
				)}
				<button
					className="settings-icon"
					onClick={onSettingsClick}
					title="Settings"
					style={{
						width: "20px",
						height: "20px",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<Settings size={14} />
				</button>
			</div>
		</div>
	);
};
