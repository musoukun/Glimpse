export interface AttachedFile {
	id: string;
	name: string;
	type: "image" | "text";
	mimeType: string;
	size: number;
	data: string; // base64エンコードされたデータ
	url?: string; // プレビュー用のblobURL
}

export interface AttachedScreenshot {
	id: string;
	data: string; // base64エンコードされた画像データ
	timestamp: number;
	url: string; // プレビュー用のblobURL
}

export const SUPPORTED_MIME_TYPES = {
	image: ["image/png", "image/jpeg", "image/webp", "image/gif", "image/bmp"],
	text: [
		"text/plain",
		"text/markdown",
		"text/javascript",
		"text/typescript",
		"text/css",
		"text/html",
		"text/xml",
		"text/csv",
		"application/json",
		"application/xml",
	],
};

export const FILE_SIZE_LIMITS = {
	image: 7 * 1024 * 1024, // 7MB
	text: 10 * 1024 * 1024, // 10MB
};

export const MAX_FILE_COUNTS = {
	screenshots: 5,
	attachedFile: 1,
};
