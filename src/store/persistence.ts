import { openDB, type IDBPDatabase } from 'idb';
import { entrySchema, settingsSchema, weeklyReviewSchema, type Entry, type Settings, type WeeklyReview } from '../lib/schema';

const DB_NAME = 'timeline-db';
const DB_VERSION = 2;
const ENTRIES_STORE = 'entries';
const SETTINGS_STORE = 'settings';
const WEEKLY_REVIEWS_STORE = 'weeklyReviews';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains(ENTRIES_STORE)) {
          db.createObjectStore(ENTRIES_STORE, { keyPath: 'date' });
        }
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          db.createObjectStore(SETTINGS_STORE, { keyPath: 'id' });
        }
        // Version 2: add weeklyReviews store
        if (oldVersion < 2 && !db.objectStoreNames.contains(WEEKLY_REVIEWS_STORE)) {
          db.createObjectStore(WEEKLY_REVIEWS_STORE, { keyPath: 'weekStart' });
        }
      },
    });
  }
  return dbPromise;
}

export async function loadEntries(): Promise<Entry[]> {
  const db = await getDB();
  const raw = await db.getAll(ENTRIES_STORE);
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

export async function loadWeeklyReviews(): Promise<Record<string, WeeklyReview>> {
  const db = await getDB();
  const raw = await db.getAll(WEEKLY_REVIEWS_STORE);
  const result: Record<string, WeeklyReview> = {};
  for (const item of raw) {
    try {
      const validated = weeklyReviewSchema.parse(item);
      result[validated.weekStart] = validated;
    } catch {
      // skip invalid
    }
  }
  return result;
}

export async function saveWeeklyReview(review: WeeklyReview): Promise<void> {
  const db = await getDB();
  await db.put(WEEKLY_REVIEWS_STORE, review);
}

export async function clearAllData(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction([ENTRIES_STORE, SETTINGS_STORE, WEEKLY_REVIEWS_STORE], 'readwrite');
  await Promise.all([
    tx.objectStore(ENTRIES_STORE).clear(),
    tx.objectStore(SETTINGS_STORE).clear(),
    tx.objectStore(WEEKLY_REVIEWS_STORE).clear(),
    tx.done,
  ]);
}
