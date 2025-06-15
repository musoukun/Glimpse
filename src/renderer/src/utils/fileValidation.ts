import { SUPPORTED_MIME_TYPES, FILE_SIZE_LIMITS } from '../types/attachment';

/**
 * ファイルタイプが許可されているかチェック
 */
export function isAllowedFileType(mimeType: string): boolean {
  const allowedTypes = [
    ...SUPPORTED_MIME_TYPES.image,
    ...SUPPORTED_MIME_TYPES.text,
  ];
  
  return allowedTypes.includes(mimeType);
}

/**
 * ファイル拡張子からファイルタイプを判定
 */
export function getFileTypeFromMimeType(mimeType: string): 'image' | 'text' | null {
  if (SUPPORTED_MIME_TYPES.image.includes(mimeType)) {
    return 'image';
  }
  if (SUPPORTED_MIME_TYPES.text.includes(mimeType)) {
    return 'text';
  }
  return null;
}

/**
 * ファイルサイズが制限内かチェック
 */
export function isFileSizeAllowed(size: number, type: 'image' | 'text'): boolean {
  const limit = FILE_SIZE_LIMITS[type];
  return size <= limit;
}

/**
 * ファイルサイズを人間が読みやすい形式に変換
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * ファイルバリデーションエラーメッセージを生成
 */
export function getFileValidationError(
  mimeType: string,
  fileSize: number,
  fileName: string
): string | null {
  // ファイルタイプチェック
  if (!isAllowedFileType(mimeType)) {
    return `${fileName} は許可されていないファイル形式です。画像ファイル（PNG、JPEG、GIF等）またはテキストファイル（TXT、MD、JSON等）のみアップロード可能です。`;
  }
  
  // ファイルサイズチェック
  const fileType = getFileTypeFromMimeType(mimeType);
  if (fileType && !isFileSizeAllowed(fileSize, fileType)) {
    const maxSize = formatFileSize(FILE_SIZE_LIMITS[fileType]);
    return `${fileName} のサイズが大きすぎます。${fileType === 'image' ? '画像' : 'テキスト'}ファイルは最大${maxSize}までです。`;
  }
  
  return null;
}