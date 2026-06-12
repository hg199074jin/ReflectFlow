import { toPng } from 'html-to-image';

/** Export a DOM node as PNG and trigger download */
export async function exportNodeAsPng(node: HTMLElement, filePrefix: string): Promise<void> {
  const dataUrl = await toPng(node, { quality: 0.95 });
  const link = document.createElement('a');
  link.download = `${filePrefix}-${new Date().toISOString().slice(0, 10)}.png`;
  link.href = dataUrl;
  link.click();
}
