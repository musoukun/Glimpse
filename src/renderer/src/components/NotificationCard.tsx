import React from "react";
import { AlertCircle, Info, CreditCard, X } from "lucide-react";

export type NotificationType = "info" | "warning" | "subscription" | "error";

interface NotificationCardProps {
	type: NotificationType;
	title: string;
	message: string;
	actionButton?: {
		label: string;
		onClick: () => void;
	};
	onClose?: () => void;
	showCloseButton?: boolean;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
	type,
	title,
	message,
	actionButton,
	onClose,
	showCloseButton = true,
}) => {
	const getIcon = () => {
		switch (type) {
			case "subscription":
				return <CreditCard size={20} />;
			case "warning":
				return <AlertCircle size={20} />;
			case "error":
				return <AlertCircle size={20} />;
			default:
				return <Info size={20} />;
		}
	};

	const getClassName = () => {
		const baseClass = "notification-card";
		switch (type) {
			case "subscription":
				return `${baseClass} notification-subscription`;
			case "warning":
				return `${baseClass} notification-warning`;
			case "error":
				return `${baseClass} notification-error`;
			default:
				return `${baseClass} notification-info`;
		}
	};

	return (
		<div className={getClassName()}>
			{showCloseButton && onClose && (
				<button className="notification-close" onClick={onClose}>
					<X size={16} />
				</button>
			)}
			<div className="notification-header">
				<div className="notification-icon">{getIcon()}</div>
				<h3 className="notification-title">{title}</h3>
			</div>
			<p className="notification-message">{message}</p>
			{actionButton && (
				<button
					className="notification-action"
					onClick={actionButton.onClick}
				>
					{actionButton.label}
				</button>
			)}
		</div>
	);
};