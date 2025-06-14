import React, { useEffect } from "react";
import { X, AlertCircle } from "lucide-react";

interface ErrorToastProps {
	message: string;
	onClose: () => void;
	duration?: number;
}

export const ErrorToast: React.FC<ErrorToastProps> = ({
	message,
	onClose,
	duration = 5000,
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
				position: "fixed",
				top: "20px",
				right: "20px",
				background: "rgba(239, 68, 68, 0.95)",
				color: "white",
				padding: "12px 16px",
				borderRadius: "8px",
				display: "flex",
				alignItems: "center",
				gap: "8px",
				boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
				backdropFilter: "blur(10px)",
				border: "1px solid rgba(255, 255, 255, 0.2)",
				maxWidth: "300px",
				fontSize: "12px",
				zIndex: 1000,
				animation: "slideIn 0.3s ease-out",
			}}
		>
			<AlertCircle size={16} />
			<span style={{ flex: 1 }}>{message}</span>
			<button
				onClick={onClose}
				style={{
					background: "none",
					border: "none",
					color: "white",
					cursor: "pointer",
					padding: "2px",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<X size={14} />
			</button>
			<style>
				{`
					@keyframes slideIn {
						from {
							transform: translateX(100%);
							opacity: 0;
						}
						to {
							transform: translateX(0);
							opacity: 1;
						}
					}
				`}
			</style>
		</div>
	);
};
