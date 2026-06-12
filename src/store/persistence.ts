import { openDB, type IDBPDatabase } from 'idb';
import { entrySchema, settingsSchema, type Entry, type Settings } from '../lib/schema';

const DB_NAME = 'timeline-db';
const DB_VERSION = 1;
const ENTRIES_STORE = 'entries';
const SETTINGS_STORE = 'settings';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(ENTRIES_STORE)) {
          db.createObjectStore(ENTRIES_STORE, { keyPath: 'date' });
        }
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          db.createObjectStore(SETTINGS_STORE, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export async function loadEntries(): Promise<Entry[]> {
  const db = await getDB();
  const raw = await db.getAll(ENTRIES_STORE);
  // Validate each entry, skip invalid ones
  return raw.filter((item) => {
    try {
      entrySchema.parse(item);
      return true;
    } catch {
      return false;
    }
  });
}

export async function saveEntry(entry: Entry): Promise<void> {
  const db = await getDB();
  await db.put(ENTRIES_STORE, entry);
}

export async function deleteEntry(dateKey: string): Promise<void> {
  const db = await getDB();
  await db.delete(ENTRIES_STORE, dateKey);
}

const DEFAULT_SETTINGS: Settings = {
  llm: {
    provider: 'openai-compatible',
    apiKey: '',
    model: 'gpt-4o-mini',
    baseUrl: 'https://api.openai.com/v1',
  },
  export: {
    folderStructure: 'year-month',
    includeAI: true,
  },
};

export async function loadSettings(): Promise<Settings> {
  const db = await getDB();
  const raw = await db.get(SETTINGS_STORE, 'settings');
  if (!raw) return DEFAULT_SETTINGS;
  try {
    return settingsSchema.parse(raw);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  const db = await getDB();
  await db.put(SETTINGS_STORE, { id: 'settings', ...settings });
}

export async function clearAllData(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction([ENTRIES_STORE, SETTINGS_STORE], 'readwrite');
  await Promise.all([
    tx.objectStore(ENTRIES_STORE).clear(),
    tx.objectStore(SETTINGS_STORE).clear(),
    tx.done,
  ]);
}
