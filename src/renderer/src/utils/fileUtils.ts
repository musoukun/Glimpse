// Partタイプの定義
interface Part {
  inlineData: {
    data: string;
    mimeType: string;
  };
}

/**
 * Converts a File object into a Part object suitable for multimodal requests.
 * Reads the file as a base64-encoded string and includes its MIME type.
 *
 * @param file The File object (e.g., from an <input type="file"> element).
 * @returns A Promise resolving to a Part object containing inline base64 data and MIME type.
 * @throws An error if the file cannot be read or processed.
 */
export async function fileToGenerativePart(file: File): Promise<Part> {
  const base64EncodedDataPromise = new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // The FileReader result includes the Data URL prefix (e.g., "data:image/jpeg;base64,").
      // We only need the actual base64 data part after the comma.
      const base64String = reader.result as string;
      if (base64String && base64String.includes(",")) {
        resolve(base64String.split(",")[1]);
      } else {
        reject(new Error("Invalid file data format received from FileReader."));
      }
    };
    reader.onerror = (errorEvent) => {
      reject(
        new Error(
          `FileReader error: ${errorEvent?.target?.error?.message || "Unknown error"}`,
        ),
      );
    };
    // Start reading the file
    reader.readAsDataURL(file);
  });

  try {
    const base64EncodedData = await base64EncodedDataPromise;
    return {
      inlineData: {
        data: base64EncodedData,
        mimeType: file.type,
      },
    };
  } catch (error) {
    console.error("Error converting file to Generative Part:", error);
    throw new Error(
      `Failed to process the file "${file.name}". Please ensure it's a valid file.`,
    );
  }
}

/**
 * Base64データからファイルサイズを推定する関数
 */
export function estimateBase64FileSize(base64Data: string): number {
  // Base64は4文字で3バイトを表現するため、実際のサイズは約3/4
  return Math.floor((base64Data.length * 3) / 4);
}

/**
 * ファイルサイズを人間が読みやすい形式に変換する関数
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 