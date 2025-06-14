import React from "react";
import { Info, X } from "lucide-react";

interface Announcement {
	id: string;
	type: "info" | "warning" | "success" | "error";
	title: string;
	message: string;
	dismissible: boolean;
}

interface AnnouncementBannerProps {
	announcements?: Announcement[];
	onDismiss?: (id: string) => void;
}

export const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({
	announcements = [],
	onDismiss,
}) => {
	const getTypeStyles = (type: Announcement["type"]) => {
		switch (type) {
			case "info":
				return {
					background: "rgba(122, 170, 255, 0.1)",
					border: "1px solid rgba(122, 170, 255, 0.3)",
					color: "rgba(122, 170, 255, 0.9)",
				};
			case "warning":
				return {
					background: "rgba(255, 193, 7, 0.1)",
					border: "1px solid rgba(255, 193, 7, 0.3)",
					color: "rgba(255, 193, 7, 0.9)",
				};
			case "success":
				return {
					background: "rgba(40, 167, 69, 0.1)",
					border: "1px solid rgba(40, 167, 69, 0.3)",
					color: "rgba(40, 167, 69, 0.9)",
				};
			case "error":
				return {
					background: "rgba(255, 107, 107, 0.1)",
					border: "1px solid rgba(255, 107, 107, 0.3)",
					color: "rgba(255, 107, 107, 0.9)",
				};
			default:
				return {
					background: "rgba(255, 255, 255, 0.05)",
					border: "1px solid rgba(255, 255, 255, 0.2)",
					color: "rgba(255, 255, 255, 0.8)",
				};
		}
	};

	if (!announcements || announcements.length === 0) {
		return null;
	}

	return (
		<div
			style={{
				padding: "8px",
				background: "rgba(255, 255, 255, 0.02)",
				borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
			}}
		>
			{announcements.map((announcement) => {
				const typeStyles = getTypeStyles(announcement.type);

				return (
					<div
						key={announcement.id}
						style={{
							...typeStyles,
							padding: "8px 12px",
							borderRadius: "6px",
							marginBottom:
								announcements.length > 1 ? "4px" : "0",
							display: "flex",
							alignItems: "flex-start",
							gap: "8px",
							backdropFilter: "blur(10px)",
						}}
					>
						<Info
							size={14}
							style={{ marginTop: "1px", flexShrink: 0 }}
						/>

						<div style={{ flex: 1, minWidth: 0 }}>
							<div
								style={{
									fontSize: "11px",
									fontWeight: "600",
									marginBottom: "2px",
									color: typeStyles.color,
								}}
							>
								{announcement.title}
							</div>
							<div
								style={{
									fontSize: "10px",
									lineHeight: 1.4,
									color: typeStyles.color,
									opacity: 0.9,
								}}
							>
								{announcement.message}
							</div>
						</div>

						{announcement.dismissible && onDismiss && (
							<button
								onClick={() => onDismiss(announcement.id)}
								style={{
									background: "none",
									border: "none",
									color: typeStyles.color,
									cursor: "pointer",
									padding: "2px",
									borderRadius: "3px",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									transition: "all 0.2s ease",
									flexShrink: 0,
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.background =
										"rgba(255, 255, 255, 0.1)";
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.background = "none";
								}}
								title="お知らせを閉じる"
							>
								<X size={12} />
							</button>
						)}
					</div>
				);
			})}
		</div>
	);
};
