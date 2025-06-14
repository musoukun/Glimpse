import { useState, useCallback } from "react";

interface Toast {
	id: string;
	message: string;
	timestamp: number;
}

export const useErrorToast = () => {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const removeToast = useCallback((id: string) => {
		setToasts((prev) => prev.filter((toast) => toast.id !== id));
	}, []);

	const showError = useCallback((message: string) => {
		const id = Date.now().toString();
		const newToast: Toast = {
			id,
			message,
			timestamp: Date.now(),
		};

		setToasts((prev) => [...prev, newToast]);

		// 5秒後に自動削除
		setTimeout(() => {
			removeToast(id);
		}, 5000);
	}, [removeToast]);

	const clearAllToasts = useCallback(() => {
		setToasts([]);
	}, []);

	return {
		toasts,
		showError,
		removeToast,
		clearAllToasts,
	};
};
