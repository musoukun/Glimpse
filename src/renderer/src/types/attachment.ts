export interface AttachedFile {
	id: string;
	name: string;
	type: "image" | "document" | "video" | "audio" | "text";
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
	image: ["image/png", "image/jpeg", "image/webp"],
	document: ["application/pdf", "text/plain"],
	video: [
		"video/x-flv",
		"video/quicktime",
		"video/mpeg",
		"video/mpegs",
		"video/mpg",
		"video/mp4",
		"video/webm",
		"video/wmv",
		"video/3gpp",
	],
	audio: [
		"audio/x-aac",
		"audio/flac",
		"audio/mp3",
		"audio/m4a",
		"audio/mpeg",
		"audio/mpga",
		"audio/mp4",
		"audio/opus",
		"audio/pcm",
		"audio/wav",
		"audio/webm",
	],
	text: [
		"text/plain",
		"text/markdown",
		"text/javascript",
		"text/typescript",
		"text/css",
		"text/html",
	],
};

export const FILE_SIZE_LIMITS = {
	image: 7 * 1024 * 1024, // 7MB
	document: 50 * 1024 * 1024, // 50MB
	video: 100 * 1024 * 1024, // 100MB (仮)
	audio: 100 * 1024 * 1024, // 100MB (仮)
	text: 10 * 1024 * 1024, // 10MB
};

export const MAX_FILE_COUNTS = {
	screenshots: 5,
	attachedFile: 1,
};
