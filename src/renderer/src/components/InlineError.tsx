import React, { useEffect } from "react";
import { X, AlertTriangle } from "lucide-react";

interface InlineErrorProps {
	message: string;
	onClose: () => void;
	duration?: number;
}

export const InlineError: React.FC<InlineErrorProps> = ({
	message,
	onClose,
	duration = 4000,
}) => {
	useEffect(() => {
		const timer = setTimeout(() => {
			onClose();
		}, duration);

		return () => clearTimeout(timer);
	}, [onClose, duration]);

	return (
		<div
			style={{
				background: "rgba(239, 68, 68, 0.15)",
				border: "1px solid rgba(239, 68, 68, 0.3)",
				borderRadius: "6px",
				padding: "8px 10px",
				margin: "4px 0",
				display: "flex",
				alignItems: "center",
				gap: "6px",
				fontSize: "10px",
				color: "rgba(239, 68, 68, 0.9)",
				animation: "fadeIn 0.2s ease-out",
			}}
		>
			<AlertTriangle size={12} />
			<span style={{ flex: 1, lineHeight: "1.3" }}>{message}</span>
			<button
				onClick={onClose}
				style={{
					background: "none",
					border: "none",
					color: "rgba(239, 68, 68, 0.7)",
					cursor: "pointer",
					padding: "2px",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					borderRadius: "2px",
				}}
				onMouseEnter={(e) => {
					e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
				}}
				onMouseLeave={(e) => {
					e.currentTarget.style.background = "none";
				}}
			>
				<X size={10} />
			</button>
			<style>
				{`
					@keyframes fadeIn {
						from {
							opacity: 0;
							transform: translateY(-10px);
						}
						to {
							opacity: 1;
							transform: translateY(0);
						}
					}
				`}
			</style>
		</div>
	);
};
