import { describe, it, expect, beforeEach } from 'vitest';
import { saveEntry, loadEntries, deleteEntry, saveSettings, loadSettings, clearAllData } from './persistence';
import { makeEntry, defaultSettings } from '../test/fixtures';

describe('persistence', () => {
  beforeEach(async () => {
    await clearAllData();
  });

  describe('entries', () => {
    it('saves and loads an entry', async () => {
      const entry = makeEntry();
      await saveEntry(entry);
      const loaded = await loadEntries();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].id).toBe(entry.id);
      expect(loaded[0].date).toBe(entry.date);
    });

    it('saves multiple entries', async () => {
      await saveEntry(makeEntry({ id: 'e1', date: '2026-06-12' }));
      await saveEntry(makeEntry({ id: 'e2', date: '2026-06-13' }));
      const loaded = await loadEntries();
      expect(loaded).toHaveLength(2);
    });

    it('updates existing entry on same date', async () => {
      await saveEntry(makeEntry({ date: '2026-06-13', bullets: { work: [{ id: 'b1', text: 'old' }], study: [], side: [] } }));
      await saveEntry(makeEntry({ date: '2026-06-13', bullets: { work: [{ id: 'b2', text: 'new' }], study: [], side: [] } }));
      const loaded = await loadEntries();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].bullets.work[0].text).toBe('new');
    });

    it('deletes an entry', async () => {
      await saveEntry(makeEntry({ id: 'e1', date: '2026-06-12' }));
      await saveEntry(makeEntry({ id: 'e2', date: '2026-06-13' }));
      await deleteEntry('2026-06-12');
      const loaded = await loadEntries();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].date).toBe('2026-06-13');
    });

    it('returns empty array for empty DB', async () => {
      const loaded = await loadEntries();
      expect(loaded).toEqual([]);
    });
  });

  describe('settings', () => {
    it('saves and loads settings', async () => {
      await saveSettings(defaultSettings);
      const loaded = await loadSettings();
      expect(loaded.llm.provider).toBe('openai-compatible');
      expect(loaded.llm.model).toBe('gpt-4o-mini');
      expect(loaded.export.folderStructure).toBe('year-month');
    });

    it('returns default settings when empty', async () => {
      const loaded = await loadSettings();
      expect(loaded.llm.provider).toBe('openai-compatible');
      expect(loaded.llm.model).toBe('gpt-4o-mini');
      expect(loaded.llm.baseUrl).toBe('https://api.openai.com/v1');
    });
  });

  describe('clearAllData', () => {
    it('removes all entries and settings', async () => {
      await saveEntry(makeEntry());
      await saveSettings(defaultSettings);
      await clearAllData();
      const entries = await loadEntries();
      expect(entries).toEqual([]);
    });
  });
});
