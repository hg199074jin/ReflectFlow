import JSZip from 'jszip';
import type { Entry, Settings, ReviewCase, PreviewPlan, Principle } from '../../lib/schema';
import {
  entryToMarkdown, entryExportPath,
  reviewCaseToMarkdown, reviewCaseExportPath,
  previewPlanToMarkdown, previewPlanExportPath,
  principleToMarkdown, principleExportPath,
} from './markdown';

export interface ExportOptions {
  includeReviewCases?: boolean;
  includePreviewPlans?: boolean;
  includePrinciples?: boolean;
}

/** Create a zip blob containing markdown files for all entries */
export async function createMarkdownZip(
  entries: Entry[],
  settings: Settings['export'],
  extras?: {
    reviewCases?: ReviewCase[];
    previewPlans?: PreviewPlan[];
    principles?: Principle[];
    options?: ExportOptions;
  },
): Promise<Blob> {
  const zip = new JSZip();

  for (const entry of entries) {
    const content = entryToMarkdown(entry, { includeAI: settings.includeAI });
    const path = entryExportPath(entry, settings.folderStructure);
    zip.file(path, content);
  }

  // Include review cases if requested
  if (extras?.options?.includeReviewCases && extras.reviewCases) {
    for (const rc of extras.reviewCases) {
      const content = reviewCaseToMarkdown(rc);
      const path = reviewCaseExportPath(rc);
      zip.file(path, content);
    }
  }

  // Include preview plans if requested
  if (extras?.options?.includePreviewPlans && extras.previewPlans) {
    for (const plan of extras.previewPlans) {
      const content = previewPlanToMarkdown(plan);
      const path = previewPlanExportPath(plan);
      zip.file(path, content);
    }
  }

  // Include principles if requested
  if (extras?.options?.includePrinciples && extras.principles) {
    for (const principle of extras.principles) {
      const content = principleToMarkdown(principle);
      const path = principleExportPath(principle);
      zip.file(path, content);
    }
  }

  return zip.generateAsync({ type: 'blob', mimeType: 'application/zip' });
}
