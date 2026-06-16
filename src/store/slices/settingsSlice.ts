import type { Settings } from '../../lib/schema';
import type { SliceCreator } from './sliceTypes';
import { saveSettings as saveSettingsToDB } from '../persistence';

export interface SettingsSlice {
  settings: Settings;
  saveSettings: (settings: Settings) => Promise<void>;
}

export const createSettingsSlice: SliceCreator<SettingsSlice> = (set) => ({
  settings: {
    llm: { provider: 'openai-compatible', apiKey: '', model: 'gpt-4o-mini', baseUrl: 'https://api.openai.com/v1' },
    export: { folderStructure: 'year-month', includeAI: true },
  },

  saveSettings: async (settings) => {
    await saveSettingsToDB(settings);
    set({ settings });
  },
});
