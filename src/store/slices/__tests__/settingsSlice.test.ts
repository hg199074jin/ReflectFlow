import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import type { StateCreator, StoreApi } from 'zustand';
import { createSettingsSlice, type SettingsSlice } from '../settingsSlice';
import type { Settings } from '../../../lib/schema';
import 'fake-indexeddb/auto';

describe('settingsSlice', () => {
  let store: StoreApi<SettingsSlice>;

  beforeEach(() => {
    store = create<SettingsSlice>(
      createSettingsSlice as StateCreator<SettingsSlice, [], [], SettingsSlice>
    );
  });

  it('has default settings on init', () => {
    const settings = store.getState().settings;
    expect(settings.llm.provider).toBe('openai-compatible');
    expect(settings.llm.model).toBe('gpt-4o-mini');
    expect(settings.export.folderStructure).toBe('year-month');
    expect(settings.export.includeAI).toBe(true);
  });

  it('saveSettings updates the settings state', async () => {
    const newSettings: Settings = {
      llm: { provider: 'openai-compatible', apiKey: 'sk-test', model: 'gpt-4', baseUrl: 'https://custom.api.com/v1' },
      export: { folderStructure: 'flat', includeAI: false },
    };
    await store.getState().saveSettings(newSettings);
    expect(store.getState().settings.llm.apiKey).toBe('sk-test');
    expect(store.getState().settings.llm.model).toBe('gpt-4');
    expect(store.getState().settings.export.folderStructure).toBe('flat');
    expect(store.getState().settings.export.includeAI).toBe(false);
  });
});
