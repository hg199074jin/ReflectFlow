import type { Entry } from '../../lib/schema';

/** Serialize an Entry to Markdown format */
export function entryToMarkdown(entry: Entry, opts: { includeAI: boolean }): string {
  const lines: string[] = [`# ${entry.date}`, ''];

  // Work
  if (entry.bullets.work.length > 0) {
    lines.push('## Work');
    for (const b of entry.bullets.work) {
      lines.push(`- ${b.text}`);
    }
    lines.push('');
  }

  // Study
  if (entry.bullets.study.length > 0) {
    lines.push('## Study');
    for (const b of entry.bullets.study) {
      lines.push(`- ${b.text}`);
    }
    lines.push('');
  }

  // Side
  if (entry.bullets.side.length > 0) {
    lines.push('## Side');
    for (const b of entry.bullets.side) {
      lines.push(`- ${b.text}`);
    }
    lines.push('');
  }

  // AI sections
  if (opts.includeAI && entry.ai) {
    if (entry.ai.reflection) {
      lines.push('## Reflection (AI)');
      lines.push(`> ${entry.ai.reflection}`);
      lines.push('');
    }
    if (entry.ai.weekSummary) {
      lines.push('## Week Summary (AI)');
      lines.push(`> ${entry.ai.weekSummary.content}`);
      lines.push('');
    }
  }

  return lines.join('\n');
}

/** Get the export file path for an entry */
export function entryExportPath(entry: Entry, folderStructure: 'flat' | 'year-month'): string {
  if (folderStructure === 'flat') {
    return `journal/${entry.date}.md`;
  }
  const [year, month] = entry.date.split('-');
  return `journal/${year}/${month}/${entry.date}.md`;
}
