import { describe, it, expect } from 'vitest';
import { createMarkdownZip } from './zip';
import { makeEntry, makeEntryWithAi, defaultSettings } from '../../test/fixtures';
import JSZip from 'jszip';

describe('createMarkdownZip', () => {
  it('creates a zip with markdown files', async () => {
    const entries = [
      makeEntry({ id: 'e1', date: '2026-06-12' }),
      makeEntry({ id: 'e2', date: '2026-06-13' }),
    ];
    const blob = await createMarkdownZip(entries, defaultSettings.export);
    const zip = await JSZip.loadAsync(blob);
    const files = Object.keys(zip.files);
    expect(files).toContain('journal/2026/06/2026-06-12.md');
    expect(files).toContain('journal/2026/06/2026-06-13.md');
  });

  it('uses flat structure when configured', async () => {
    const entries = [makeEntry()];
    const blob = await createMarkdownZip(entries, { ...defaultSettings.export, folderStructure: 'flat' });
    const zip = await JSZip.loadAsync(blob);
    expect(Object.keys(zip.files)).toContain('journal/2026-06-13.md');
  });

  it('includes AI content when configured', async () => {
    const entries = [makeEntryWithAi()];
    const blob = await createMarkdownZip(entries, { ...defaultSettings.export, includeAI: true });
    const zip = await JSZip.loadAsync(blob);
    const content = await zip.file('journal/2026/06/2026-06-13.md')!.async('string');
    expect(content).toContain('Reflection');
  });

  it('excludes AI content when configured', async () => {
    const entries = [makeEntryWithAi()];
    const blob = await createMarkdownZip(entries, { ...defaultSettings.export, includeAI: false });
    const zip = await JSZip.loadAsync(blob);
    const content = await zip.file('journal/2026/06/2026-06-13.md')!.async('string');
    expect(content).not.toContain('Reflection');
  });

  it('produces valid zip blob', async () => {
    const entries = [makeEntry()];
    const blob = await createMarkdownZip(entries, defaultSettings.export);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/zip');
  });
});
