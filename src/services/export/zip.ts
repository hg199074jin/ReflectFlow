import JSZip from 'jszip';
import type { Entry, Settings } from '../../lib/schema';
import { entryToMarkdown, entryExportPath } from './markdown';

/** Create a zip blob containing markdown files for all entries */
export async function createMarkdownZip(
  entries: Entry[],
  settings: Settings['export'],
): Promise<Blob> {
  const zip = new JSZip();

  for (const entry of entries) {
    const content = entryToMarkdown(entry, { includeAI: settings.includeAI });
    const path = entryExportPath(entry, settings.folderStructure);
    zip.file(path, content);
  }

  return zip.generateAsync({ type: 'blob', mimeType: 'application/zip' });
}
