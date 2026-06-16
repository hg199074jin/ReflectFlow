/**
 * Trigger a browser file download via a temporary anchor element.
 * Accepts either a string (with mimeType) or an existing Blob.
 */
export function downloadFile(filename: string, content: string, mimeType: string): void;
export function downloadFile(filename: string, blob: Blob): void;
export function downloadFile(filename: string, contentOrBlob: string | Blob, mimeType?: string): void {
  const blob = typeof contentOrBlob === 'string'
    ? new Blob([contentOrBlob], { type: mimeType })
    : contentOrBlob;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** @deprecated Use downloadFile instead */
export const downloadBlob = downloadFile;
