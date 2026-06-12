# Daily Check-in Timeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-first browser app for daily check-ins, timeline review, OpenAI-compatible AI summaries, and Markdown/PNG export.

**Architecture:** This is a browser-only React 18 + Vite + TypeScript single-page app. Data lives in Zustand state and IndexedDB, exports are generated client-side, and the only LLM integration is an OpenAI-compatible HTTP provider configured with `baseUrl`, `apiKey`, and `model`.

**Tech Stack:** React, TypeScript, Vite, Zustand, idb, date-fns, zod, react-markdown, remark-gfm, jszip, html-to-image, Vitest, Testing Library, fake-indexeddb, Playwright.

---

## Scope Notes

- The current project has docs only; implementation starts from a new Vite app scaffold in the project root.
- The design spec mentions multiple providers, but the implementation boundary is now narrower: support one OpenAI-compatible provider. Anthropic/Ollama/Claude CLI specific adapters are out of scope for this plan.
- The OpenAI-compatible provider must work with configurable endpoints such as official OpenAI, compatible local gateways, or user-run proxy services. It should not assume a hardcoded provider.
- `@uiw/react-md-editor` is not included in v1 because the spec says the Markdown editor is a textarea in v1.
- The directory is not currently a Git repository. Commit steps are included only after `git init` is done in Task 0.

## File Structure

Create the app using this structure:

```text
package.json
index.html
vite.config.ts
tsconfig.json
tsconfig.node.json
vitest.config.ts
playwright.config.ts
src/
  main.tsx
  App.tsx
  styles.css
  components/
    views/
      TimelineCardsView.tsx
      TimelineGanttView.tsx
      StatsPanel.tsx
    cards/
      DayCard.tsx
      EntryEditor.tsx
      AISection.tsx
    nav/
      MonthNav.tsx
      StreakBadge.tsx
    stats/
      HeatmapCalendar.tsx
      GanttChart.tsx
    dialogs/
      SettingsDialog.tsx
      ExportDialog.tsx
    primitives/
      Button.tsx
      Input.tsx
      Select.tsx
      Toast.tsx
      ConfirmDialog.tsx
      MarkdownRender.tsx
      MarkdownEditor.tsx
  store/
    index.ts
    persistence.ts
  services/
    llm/
      openaiCompatible.ts
      types.ts
    export/
      markdown.ts
      png.ts
      zip.ts
  lib/
    date.ts
    ids.ts
    prompts.ts
    schema.ts
    text.ts
  test/
    setup.ts
    fixtures.ts
  e2e/
    smoke.spec.ts
```

---

### Task 0: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`
- Create: `test/setup.ts`

- [ ] **Step 1: Initialize Git if absent**

Run:

```bash
git status --short
```

Expected if not initialized:

```text
fatal: not a git repository
```

Then run:

```bash
git init
```

Expected: a new local Git repository is created.

- [ ] **Step 2: Create package and config files**

Use this dependency set in `package.json`:

```json
{
  "name": "daily-checkin-timeline",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "e2e": "playwright test"
  },
  "dependencies": {
    "@vitejs/plugin-react": "latest",
    "clsx": "latest",
    "date-fns": "latest",
    "html-to-image": "latest",
    "idb": "latest",
    "jszip": "latest",
    "react": "latest",
    "react-dom": "latest",
    "react-markdown": "latest",
    "remark-gfm": "latest",
    "zustand": "latest",
    "zod": "latest"
  },
  "devDependencies": {
    "@playwright/test": "latest",
    "@testing-library/jest-dom": "latest",
    "@testing-library/react": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "fake-indexeddb": "latest",
    "jsdom": "latest",
    "typescript": "latest",
    "vite": "latest",
    "vitest": "latest"
  }
}
```

- [ ] **Step 3: Create minimal app shell**

`src/main.tsx`:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

`src/App.tsx`:

```tsx
export default function App() {
  return <main className="app-shell">Daily Check-in Timeline</main>;
}
```

- [ ] **Step 4: Install dependencies**

Run:

```bash
npm install
```

Expected: `node_modules` and `package-lock.json` are created.

- [ ] **Step 5: Verify scaffold**

Run:

```bash
npm run build
npm test
```

Expected: build succeeds and Vitest reports no failing tests.

- [ ] **Step 6: Commit**

Run:

```bash
git add package.json package-lock.json index.html vite.config.ts tsconfig.json tsconfig.node.json vitest.config.ts playwright.config.ts src test
git commit -m "chore: scaffold timeline app"
```

---

### Task 1: Core Types, Schemas, Dates, and Text Parsing

**Files:**
- Create: `src/lib/schema.ts`
- Create: `src/lib/date.ts`
- Create: `src/lib/ids.ts`
- Create: `src/lib/text.ts`
- Create: `src/test/fixtures.ts`
- Test: `src/lib/date.test.ts`
- Test: `src/lib/text.test.ts`
- Test: `src/lib/schema.test.ts`

- [ ] **Step 1: Write date tests**

Cover:
- `toDateKey(new Date(...))` returns local `YYYY-MM-DD`.
- `toMonthKey(dateKey)` returns `YYYY-MM`.
- `getMonthDays('2026-06')` includes all June days.
- `getWeekRange('2026-06-29')` returns Monday `2026-06-29` through Sunday `2026-07-05`.
- `calculateStreak(entries, today)` counts consecutive non-empty days ending today.

Run:

```bash
npm test -- src/lib/date.test.ts
```

Expected: fails because functions do not exist.

- [ ] **Step 2: Implement core schemas**

`src/lib/schema.ts` should export:

```ts
import { z } from 'zod';

export const categorySchema = z.enum(['work', 'study', 'side']);
export type Category = z.infer<typeof categorySchema>;

export const bulletSchema = z.object({
  id: z.string(),
  text: z.string(),
});
export type Bullet = z.infer<typeof bulletSchema>;

export const projectRefSchema = z.object({
  entryId: z.string(),
  bulletId: z.string(),
});

export const aiDataSchema = z.object({
  reflection: z.string().optional(),
  weekSummary: z.object({ weekStart: z.string(), content: z.string() }).optional(),
  projects: z.array(z.object({
    name: z.string(),
    category: categorySchema.optional(),
    bulletRefs: z.array(projectRefSchema),
  })).optional(),
  lastError: z.string().optional(),
}).optional();

export const entrySchema = z.object({
  id: z.string(),
  date: z.string(),
  bullets: z.record(categorySchema, z.array(bulletSchema)),
  ai: aiDataSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Entry = z.infer<typeof entrySchema>;

export const settingsSchema = z.object({
  llm: z.object({
    provider: z.literal('openai-compatible'),
    apiKey: z.string().optional(),
    model: z.string(),
    baseUrl: z.string(),
  }),
  export: z.object({
    folderStructure: z.enum(['flat', 'year-month']),
    includeAI: z.boolean(),
  }),
});
export type Settings = z.infer<typeof settingsSchema>;

export type ViewMode = 'cards' | 'gantt' | 'stats';

export interface ClassifiableBullet {
  entryId: string;
  date: string;
  category: Category;
  bulletId: string;
  text: string;
}
```

- [ ] **Step 3: Implement helpers**

Implement:
- `src/lib/ids.ts`: `createId()` using `crypto.randomUUID()` with a fallback.
- `src/lib/date.ts`: local date keys, month days, week ranges, streaks.
- `src/lib/text.ts`: `parseBulletText(text: string): Bullet[]` and `formatBulletText(bullets: Bullet[]): string`.

- [ ] **Step 4: Run tests**

Run:

```bash
npm test -- src/lib/date.test.ts src/lib/text.test.ts src/lib/schema.test.ts
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib src/test
git commit -m "feat: add core timeline types and helpers"
```

---

### Task 2: IndexedDB Persistence

**Files:**
- Create: `src/store/persistence.ts`
- Test: `src/store/persistence.test.ts`
- Modify: `test/setup.ts`

- [ ] **Step 1: Write persistence tests**

Use `fake-indexeddb` in `test/setup.ts`.

Test:
- `saveEntry` then `loadEntries`.
- `deleteEntry`.
- `saveSettings` then `loadSettings`.
- empty DB returns defaults.

Run:

```bash
npm test -- src/store/persistence.test.ts
```

Expected: fails because persistence module does not exist.

- [ ] **Step 2: Implement IndexedDB layer**

`src/store/persistence.ts` responsibilities:
- Open DB `timeline-db`, version 1.
- Store `entries` keyed by `date`.
- Store `settings` keyed by `id`, with singleton id `settings`.
- Export `loadEntries`, `saveEntry`, `deleteEntry`, `loadSettings`, `saveSettings`, `clearAllData`.

Use `idb` and validate loaded records with Zod schemas before returning them.

- [ ] **Step 3: Run tests**

```bash
npm test -- src/store/persistence.test.ts
```

Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add src/store/persistence.ts src/store/persistence.test.ts test/setup.ts
git commit -m "feat: persist entries and settings locally"
```

---

### Task 3: Zustand Store and App Actions

**Files:**
- Create: `src/store/index.ts`
- Test: `src/store/index.test.ts`

- [ ] **Step 1: Write store tests**

Test:
- `initialize()` loads entries and settings.
- `upsertEntryText(date, category, text)` creates or updates entries.
- `setView`, `setSelectedMonth`, and `saveSettings`.
- `setAIInFlight(key, true/false)`.
- `setReflection(date, content)` persists AI output.
- `setWeekSummary(weekStart, content)` denormalizes summary to all entries in week.
- `setProjects(projects)` maps project refs onto affected entries.

Run:

```bash
npm test -- src/store/index.test.ts
```

Expected: fails because store module does not exist.

- [ ] **Step 2: Implement store**

Use Zustand with one root store. Keep async persistence inside actions. Export:
- `useTimelineStore`
- `getEntryByDate(date)`
- `getEntriesForMonth(month)`
- `getEntriesForWeek(weekStart)`
- `getClassifiableBullets(month)`

Default settings:

```ts
{
  llm: {
    provider: 'openai-compatible',
    apiKey: '',
    model: 'gpt-4o-mini',
    baseUrl: 'https://api.openai.com/v1'
  },
  export: {
    folderStructure: 'year-month',
    includeAI: true
  }
}
```

- [ ] **Step 3: Run tests**

```bash
npm test -- src/store/index.test.ts
```

Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add src/store/index.ts src/store/index.test.ts
git commit -m "feat: add timeline app store"
```

---

### Task 4: Markdown and Zip Export

**Files:**
- Create: `src/services/export/markdown.ts`
- Create: `src/services/export/zip.ts`
- Test: `src/services/export/markdown.test.ts`
- Test: `src/services/export/zip.test.ts`

- [ ] **Step 1: Write export tests**

Test:
- One entry serializes to headings `# YYYY-MM-DD`, `## Work`, `## Study`, `## Side`.
- AI sections are included only when `includeAI` is true.
- `flat` structure uses `journal/YYYY-MM-DD.md`.
- `year-month` structure uses `journal/YYYY/MM/YYYY-MM-DD.md`.
- Zip contains expected file names and content.

Run:

```bash
npm test -- src/services/export/markdown.test.ts src/services/export/zip.test.ts
```

Expected: fails because export service does not exist.

- [ ] **Step 2: Implement Markdown serializer**

Export:

```ts
export function entryToMarkdown(entry: Entry, opts: { includeAI: boolean }): string;
export function entryExportPath(entry: Entry, folderStructure: 'flat' | 'year-month'): string;
```

Use English headings in v1 to avoid encoding ambiguity:
- Work
- Study
- Side
- Reflection (AI)
- Week Summary (AI)

- [ ] **Step 3: Implement zip service**

Export:

```ts
export async function createMarkdownZip(
  entries: Entry[],
  settings: Settings['export'],
): Promise<Blob>;
```

Use `jszip`.

- [ ] **Step 4: Run tests**

```bash
npm test -- src/services/export/markdown.test.ts src/services/export/zip.test.ts
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/services/export
git commit -m "feat: export journal entries as markdown zip"
```

---

### Task 5: OpenAI-Compatible LLM Service

**Files:**
- Create: `src/services/llm/types.ts`
- Create: `src/services/llm/openaiCompatible.ts`
- Create: `src/lib/prompts.ts`
- Test: `src/services/llm/openaiCompatible.test.ts`
- Test: `src/lib/prompts.test.ts`

- [ ] **Step 1: Write LLM tests with mocked fetch**

Test:
- `generateReflection(entry)` posts to `${baseUrl}/chat/completions`.
- Authorization header is included only when `apiKey` is present.
- Response content is read from `choices[0].message.content`.
- `generateWeekSummary(entries, weekStart)` aggregates dates and categories.
- `classifyProjects(bullets)` validates JSON and returns bullet IDs.
- non-2xx responses throw `LLMError`.
- malformed project JSON throws `SchemaError`.

Run:

```bash
npm test -- src/services/llm/openaiCompatible.test.ts src/lib/prompts.test.ts
```

Expected: fails because modules do not exist.

- [ ] **Step 2: Implement provider types**

`src/services/llm/types.ts`:

```ts
import type { ClassifiableBullet, Entry, Settings } from '../../lib/schema';

export interface LLMProvider {
  generateReflection(entry: Entry): Promise<string>;
  generateWeekSummary(entries: Entry[], weekStart: string): Promise<string>;
  classifyProjects(bullets: ClassifiableBullet[]): Promise<Array<{ name: string; bulletIds: string[] }>>;
}

export type LLMSettings = Settings['llm'];

export class LLMError extends Error {}
export class AuthError extends LLMError {}
export class RateLimitError extends LLMError {}
export class NetworkError extends LLMError {}
export class SchemaError extends LLMError {}
```

- [ ] **Step 3: Implement prompts**

`src/lib/prompts.ts` exports:
- `buildReflectionPrompt(entry)`
- `buildWeekSummaryPrompt(entries, weekStart)`
- `buildProjectClassificationPrompt(bullets)`

Project classification prompt must require JSON only:

```json
{
  "projects": [
    { "name": "Project name", "bulletIds": ["bullet-id"] }
  ]
}
```

- [ ] **Step 4: Implement OpenAI-compatible provider**

`src/services/llm/openaiCompatible.ts` exports:

```ts
export function createOpenAICompatibleProvider(settings: LLMSettings): LLMProvider;
```

Request shape:

```ts
{
  model: settings.model,
  messages: [
    { role: 'system', content: 'You summarize a private daily work journal. Be concise and structured.' },
    { role: 'user', content: prompt }
  ],
  temperature: 0.2
}
```

Endpoint:

```ts
`${settings.baseUrl.replace(/\/$/, '')}/chat/completions`
```

- [ ] **Step 5: Run tests**

```bash
npm test -- src/services/llm/openaiCompatible.test.ts src/lib/prompts.test.ts
```

Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/services/llm src/lib/prompts.ts src/lib/prompts.test.ts
git commit -m "feat: add openai compatible llm provider"
```

---

### Task 6: UI Primitives and App Shell

**Files:**
- Create: `src/components/primitives/Button.tsx`
- Create: `src/components/primitives/Input.tsx`
- Create: `src/components/primitives/Select.tsx`
- Create: `src/components/primitives/Toast.tsx`
- Create: `src/components/primitives/ConfirmDialog.tsx`
- Create: `src/components/primitives/MarkdownRender.tsx`
- Create: `src/components/primitives/MarkdownEditor.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Test: `src/components/primitives/primitives.test.tsx`

- [ ] **Step 1: Write primitive render tests**

Test:
- Button renders disabled/loading state.
- Input shows label and error text.
- Select renders options.
- MarkdownRender renders GFM lists.
- MarkdownEditor is a textarea and calls `onChange`.

Run:

```bash
npm test -- src/components/primitives/primitives.test.tsx
```

Expected: fails because primitives do not exist.

- [ ] **Step 2: Implement primitives**

Keep primitives small and controlled. Do not add a UI library.

- [ ] **Step 3: Implement base visual system**

`src/styles.css` should include:
- readable light theme
- dense app layout
- responsive columns
- card radius <= 8px
- no decorative gradient/orb background
- textarea and button focus states

- [ ] **Step 4: Run tests**

```bash
npm test -- src/components/primitives/primitives.test.tsx
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/primitives src/App.tsx src/styles.css
git commit -m "feat: add ui primitives and shell styling"
```

---

### Task 7: Cards View, Day Cards, and Entry Editing

**Files:**
- Create: `src/components/views/TimelineCardsView.tsx`
- Create: `src/components/cards/DayCard.tsx`
- Create: `src/components/cards/EntryEditor.tsx`
- Create: `src/components/cards/AISection.tsx`
- Create: `src/components/nav/MonthNav.tsx`
- Create: `src/components/nav/StreakBadge.tsx`
- Modify: `src/App.tsx`
- Test: `src/components/views/TimelineCardsView.test.tsx`

- [ ] **Step 1: Write cards view tests**

Test:
- selected month days render reverse-chronologically.
- today's entry is editable.
- typing bullet text updates store.
- reload simulation keeps persisted text.
- empty state is shown for no bullets.

Run:

```bash
npm test -- src/components/views/TimelineCardsView.test.tsx
```

Expected: fails because components do not exist.

- [ ] **Step 2: Implement MonthNav and StreakBadge**

Controls:
- previous month
- next month
- month input
- segmented view toggle: cards, gantt, stats
- streak badge

- [ ] **Step 3: Implement EntryEditor**

Render three textarea sections:
- Work
- Study
- Side

Textarea format is one bullet per line. Convert lines to `Bullet[]` with `parseBulletText`.

- [ ] **Step 4: Implement DayCard and TimelineCardsView**

Default:
- selected month days in reverse order
- today expanded
- days with content expanded
- empty days collapsed but available

- [ ] **Step 5: Run tests**

```bash
npm test -- src/components/views/TimelineCardsView.test.tsx
```

Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/views/TimelineCardsView.tsx src/components/cards src/components/nav src/App.tsx
git commit -m "feat: add timeline card editing flow"
```

---

### Task 8: Settings Dialog and AI Actions

**Files:**
- Create: `src/components/dialogs/SettingsDialog.tsx`
- Modify: `src/components/cards/AISection.tsx`
- Modify: `src/components/cards/DayCard.tsx`
- Modify: `src/App.tsx`
- Test: `src/components/dialogs/SettingsDialog.test.tsx`
- Test: `src/components/cards/AISection.test.tsx`

- [ ] **Step 1: Write settings and AI tests**

Test:
- settings dialog saves `baseUrl`, `apiKey`, and `model`.
- missing `baseUrl` or `model` shows inline error.
- Generate reflection calls mocked provider and persists output.
- AI errors show inline error and clear loading state.
- copy button writes reflection to clipboard.

Run:

```bash
npm test -- src/components/dialogs/SettingsDialog.test.tsx src/components/cards/AISection.test.tsx
```

Expected: fails because dialog and AI action are incomplete.

- [ ] **Step 2: Implement SettingsDialog**

Fields:
- Base URL
- API key
- Model
- Include AI in export
- Folder structure

Copy text should say the key is stored locally in browser storage.

- [ ] **Step 3: Implement AI action wiring**

Use `createOpenAICompatibleProvider(store.settings.llm)` directly from the UI action or through a small store action. Set `aiInFlight[date]` before request and clear it in `finally`.

- [ ] **Step 4: Run tests**

```bash
npm test -- src/components/dialogs/SettingsDialog.test.tsx src/components/cards/AISection.test.tsx
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/dialogs/SettingsDialog.tsx src/components/cards src/App.tsx
git commit -m "feat: configure llm settings and reflections"
```

---

### Task 9: Stats and Gantt Views

**Files:**
- Create: `src/components/views/StatsPanel.tsx`
- Create: `src/components/views/TimelineGanttView.tsx`
- Create: `src/components/stats/HeatmapCalendar.tsx`
- Create: `src/components/stats/GanttChart.tsx`
- Modify: `src/App.tsx`
- Test: `src/components/views/StatsPanel.test.tsx`
- Test: `src/components/views/TimelineGanttView.test.tsx`

- [ ] **Step 1: Write stats and gantt tests**

Test:
- heatmap renders one cell per selected month day.
- density is based on bullet count.
- stats show monthly totals by category.
- classify projects button calls mocked provider.
- Gantt groups bullet refs by project name.
- manual project assignment update changes rendered project.

Run:

```bash
npm test -- src/components/views/StatsPanel.test.tsx src/components/views/TimelineGanttView.test.tsx
```

Expected: fails because views do not exist.

- [ ] **Step 2: Implement StatsPanel and HeatmapCalendar**

Keep the visual simple:
- CSS grid calendar
- density classes from 0 to 4
- monthly totals
- current streak
- Generate week summary for week rows
- Classify projects for current month

- [ ] **Step 3: Implement GanttChart**

Use plain SVG for v1:
- one row per project
- one bar per bullet ref
- x-position by date in selected month
- accessible labels with date and bullet text

- [ ] **Step 4: Run tests**

```bash
npm test -- src/components/views/StatsPanel.test.tsx src/components/views/TimelineGanttView.test.tsx
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/views/StatsPanel.tsx src/components/views/TimelineGanttView.tsx src/components/stats src/App.tsx
git commit -m "feat: add stats and project gantt views"
```

---

### Task 10: Export Dialog and PNG Export

**Files:**
- Create: `src/components/dialogs/ExportDialog.tsx`
- Create: `src/services/export/png.ts`
- Modify: `src/App.tsx`
- Test: `src/components/dialogs/ExportDialog.test.tsx`
- Test: `src/services/export/png.test.ts`

- [ ] **Step 1: Write export dialog tests**

Test:
- date range filters entries.
- Markdown export calls zip service and triggers download.
- PNG export calls `html-to-image`.
- export errors show a toast and preserve state.

Run:

```bash
npm test -- src/components/dialogs/ExportDialog.test.tsx src/services/export/png.test.ts
```

Expected: fails because dialog and png service do not exist.

- [ ] **Step 2: Implement PNG service**

Export:

```ts
export async function exportNodeAsPng(node: HTMLElement, filePrefix: string): Promise<void>;
```

Use `html-to-image` and a temporary `<a download>`.

- [ ] **Step 3: Implement ExportDialog**

Controls:
- start date
- end date
- Markdown zip button
- PNG current view button
- include AI checkbox
- folder structure select

- [ ] **Step 4: Run tests**

```bash
npm test -- src/components/dialogs/ExportDialog.test.tsx src/services/export/png.test.ts
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/dialogs/ExportDialog.tsx src/services/export/png.ts src/App.tsx
git commit -m "feat: export timeline views"
```

---

### Task 11: End-to-End Smoke, README, and Final Verification

**Files:**
- Create: `e2e/smoke.spec.ts`
- Create: `README.md`
- Modify: `playwright.config.ts`

- [ ] **Step 1: Write Playwright smoke test**

Test:
- app loads empty state
- add work/study/side bullets
- reload and verify persistence
- open settings and save OpenAI-compatible config
- switch cards/stats/gantt views
- export Markdown zip and verify a download occurs

Run:

```bash
npm run e2e
```

Expected initially: may fail until selectors are stable.

- [ ] **Step 2: Add stable selectors or accessible names**

Prefer accessible roles and labels. Add `aria-label` only where visible text is insufficient.

- [ ] **Step 3: Write README**

Include:
- install command
- dev command
- build/test commands
- local-first storage warning
- OpenAI-compatible settings examples
- Markdown export backup recommendation

- [ ] **Step 4: Run full verification**

Run:

```bash
npm test
npm run build
npm run e2e
```

Expected: all pass.

- [ ] **Step 5: Manual browser verification**

Run:

```bash
npm run dev
```

Open the printed local URL and verify:
- first-run empty state
- add bullets and reload persistence
- settings save
- reflection with a configured compatible endpoint
- Markdown export
- PNG export
- cards, stats, and gantt layouts at desktop and mobile widths
- no console errors

- [ ] **Step 6: Commit**

```bash
git add e2e README.md playwright.config.ts src
git commit -m "test: add smoke coverage and usage docs"
```

---

## Final Acceptance Criteria

- `npm test` passes.
- `npm run build` passes.
- `npm run e2e` passes or any environmental blocker is documented.
- Daily entry edit takes one screen and supports Work, Study, Side categories.
- Data persists after reload through IndexedDB.
- AI reflection, week summary, and project classification use the OpenAI-compatible provider only.
- Markdown zip export produces one `.md` file per day.
- PNG export downloads the current view.
- Cards, stats, and gantt views render without overlap on desktop and mobile.

## Known Follow-Ups Outside This Plan

- Provider-specific adapters for Anthropic, Ollama, or Claude CLI.
- Rich Markdown editor upgrade.
- PWA install and cross-device sync.
- Server-side hosted proxy.
- Multi-user or account support.
