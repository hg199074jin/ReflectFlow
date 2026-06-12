# Daily Check-in Timeline — Design Spec

**Date:** 2026-06-13
**Status:** Draft, awaiting user sign-off
**Project codename:** 26.06_Timeline

## 1. Purpose

A single-user, browser-based daily check-in tool that:

1. Lets the user record each day's bullets across three categories — **work**, **study**, **side**.
2. Displays these records as a **reverse-chronological card flow** as the default timeline view.
3. Uses an LLM to (a) summarize each day, (b) summarize each week, (c) classify bullets into projects/phases, (d) generate a shareable timeline artifact.
4. Stores data **locally in the browser**, with **Markdown export** for backup/version control.
5. Supports multiple LLM providers behind a single abstraction.

## 2. Goals & Non-Goals

### Goals
- Daily record entry completes in under 60 seconds.
- Local-first storage; no account, no backend, no server-side processing of journal content.
- User controls their LLM provider and API key.
- Three timeline views — card flow (default), Gantt-by-project, stats dashboard.
- Exportable as Markdown files (per day) and as a long-image (PNG) of the current view.

### Non-Goals (v1)
- Multi-user, authentication, cross-device sync.
- Push notifications, reminders, email digests.
- Real-time collaboration, comments, sharing links.
- Bullet start/end times or duration tracking.
- Mobile-native app, PWA install.
- Server-side LLM proxy.

## 3. User Personas & Primary Flows

**Persona:** solo knowledge worker, comfortable with Markdown, Git, and the command line, prefers local-first tools.

### Primary flow: morning check-in
1. Open app in browser → previous day's card visible at top, today already selected.
2. Type bullets into one or more category textareas.
3. Click **Save** (or wait 500 ms — autosave).
4. Optionally click **Generate reflection** — LLM returns a one-paragraph summary that appears below the bullets.

### Primary flow: weekly review
1. Open app on Sunday evening.
2. Switch to **Stats** view → see category density heatmap and streak calendar for the month.
3. Click **Generate week summary** on the current week → LLM returns a structured week-in-review block, stored on the week's entries.
4. Click **Export** → choose Markdown (per-day .md files, zipped) or PNG of stats view.

### Primary flow: project retrospective
1. Switch to **Gantt** view → see bullets grouped by LLM-detected projects across the month.
2. Adjust project assignments inline if the LLM got them wrong.
3. Export the Gantt view as PNG for sharing.

## 4. Architecture

Single-page React application running entirely in the browser.

```
┌──────────────────────────────────────────────────────────┐
│  Browser SPA (React 18 + Vite + TS)                      │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Components  │  │  Zustand     │  │  IndexedDB   │    │
│  │  (UI)        │←→│  Store       │←→│  (idb)       │    │
│  └──────────────┘  └──────┬───────┘  └──────────────┘    │
│                           │                              │
│                  ┌────────▼─────────┐                    │
│                  │  LLM Provider    │                    │
│                  │  Abstraction     │                    │
│                  │  ┌────────────┐  │                    │
│                  │  │ Anthropic  │  │                    │
│                  │  │ OpenAI     │  │                    │
│                  │  │ Ollama     │  │                    │
│                  │  │ CLI Relay  │  │                    │
                  │  └──────┬─────┘  │                    │
                  │         │ HTTP   │                    │
                  │  ┌──────▼─────┐  │                    │
                  │  │ Local CLI  │  │                    │
                  │  │ Relay      │  │                    │
                  │  │ (user-run) │  │                    │
                  │  └────────────┘  │                    │
│                  │  └────────────┘  │                    │
│                  └──────────────────┘                    │
│                                                          │
│  Export: client-side download (md / zip / png)           │
└──────────────────────────────────────────────────────────┘
```

> **CLI Relay note:** browsers cannot spawn processes, so `claude-code-cli`
> is reached via a small local HTTP shim the user starts manually
> (e.g. on `http://localhost:7321`). The browser calls the relay; the relay
> forwards to the user's local Claude Code CLI. Building the relay itself is
> **out of scope for v1**; the spec assumes the relay exists at a
> configurable `baseUrl`.

### Constraints
- No backend. LLM calls go directly from browser to provider using user's API key.
- API keys stored in IndexedDB; UI labels them sensitive and never logs them.
- All persistence is local; clearing browser data destroys records (export regularly).

## 5. Components

### Page-level
- `<TimelineCardsView>` — default view; reverse-chronological day cards for the selected month.
- `<TimelineGanttView>` — project-grouped horizontal bars for the selected month.
- `<StatsPanel>` — heatmap, streak calendar, monthly stats for the selected month.
- `<SettingsDialog>` — provider, API key, model, baseUrl, export preferences.
- `<ExportDialog>` — Markdown (zip) / PNG / range picker.

### Composite
- `<DayCard>` — single day card; collapsed shows summary, expanded shows the three category sections plus AI reflection block.
- `<EntryEditor>` — three textareas (work/study/side); buttons to add/delete bullet lines; markdown preview toggle.
- `<AISection>` — renders AI-generated content with a "regenerate" button and a copy-to-clipboard button.
- `<MonthNav>` — month picker, view-mode toggle (cards / gantt / stats), streak badge.
- `<StreakBadge>` — count of consecutive days with entries ending today.
- `<HeatmapCalendar>` — month grid colored by per-day bullet count (density, not streaks).
- `<StreakCalendar>` — separate compact strip showing the last N days as filled/empty cells (the "streak" visual; not a heatmap).
- `<GanttChart>` — visx-based horizontal bars, one row per project, one bar per bullet.

### Primitives
- `<MarkdownRender>` — `react-markdown` with `remark-gfm`.
- `<MarkdownEditor>` — textarea in v1; `@uiw/react-md-editor` upgrade in v2.
- `<Toast>`, `<ConfirmDialog>`, `<Button>`, `<Input>`, `<Select>` — UI primitives.

## 6. Data Model

```ts
type Category = 'work' | 'study' | 'side';

interface Bullet {
  id: string;               // uuid v4
  text: string;             // markdown line
}

interface AIData {
  reflection?: string;                                       // one-paragraph day reflection
  weekSummary?: { weekStart: string; content: string };      // ISO date of Monday
  // Note: weekSummary is denormalized across every entry in the target week.
  // Rationale: avoids a separate weeks table; each entry is fully readable
  // on its own when exported. Trades write amplification for simpler reads
  // and exports. Update all entries in the week on regeneration.
  projects?: Array<{
    name: string;
    category: Category;
    bulletRefs: Array<{ entryId: string; bulletId: string }>;
  }>;
  lastError?: string;        // transient error from last AI call
}

interface Entry {
  id: string;               // uuid v4
  date: string;             // 'YYYY-MM-DD' in user's local timezone
  bullets: Record<Category, Bullet[]>;
  ai?: AIData;
  createdAt: string;        // ISO datetime
  updatedAt: string;        // ISO datetime
}

interface Settings {
  llm: {
    provider: 'anthropic' | 'openai' | 'ollama' | 'claude-code-cli';
    apiKey?: string;
    model: string;
    baseUrl?: string;
  };
  export: {
    folderStructure: 'flat' | 'year-month';
    includeAI: boolean;
  };
}

interface AppState {
  entries: Record<string, Entry>;       // keyed by date
  settings: Settings;
  selectedMonth: string;                // 'YYYY-MM'
  view: 'cards' | 'gantt' | 'stats';
  aiInFlight: Record<string, true>;     // keyed by date or weekStart
}
```

### Storage
- IndexedDB database `timeline-db`, version 1.
- Object store `entries` (keyPath: `date`).
- Object store `settings` (single record, keyPath: `'singleton'`).
- Migration policy: bump `version` and add an `upgrade` handler in `idb` open call.

### Markdown-on-disk format

`flat` structure:
```
journal/
  2026-06-13.md
  2026-06-12.md
```

`year-month` structure:
```
journal/
  2026/
    06/
      2026-06-13.md
      2026-06-12.md
```

Each file:
```markdown
# 2026-06-13

## 工作
- bullet one
- bullet two

## 学习
- bullet one

## 副业
- bullet one

## 复盘 (AI)
> ...reflection text...

## 本周小结 (AI)
> ...week summary text...
```

## 7. Data Flow

### Edit a day
1. User edits textarea → local state updates immediately.
2. Debounce 500 ms.
3. Store writes updated `Entry` to Zustand and IndexedDB.
4. Card re-renders.

### Generate AI reflection
1. User clicks **Generate reflection** on `<DayCard>`.
2. Store sets `aiInFlight[date] = true`.
3. `llmService.generateReflection(entry)` → provider abstraction.
4. Provider builds prompt from bullets, calls API, returns string.
5. Store writes `ai.reflection`, clears `aiInFlight[date]`, persists to IndexedDB.
6. UI updates.

### Generate AI week summary
1. User clicks **Generate week summary** on a week header (the header belongs to a specific calendar week — Monday to Sunday in the user's locale).
2. The target week is **determined by the click location**, not by `selectedMonth`. Cross-month weeks are supported: clicking a week that starts 2026-06-29 collects entries from 2026-06-29 through 2026-07-05 even if only June is currently selected.
3. Store collects all entries whose date falls within that Monday–Sunday range (entries without a record are treated as empty).
4. Calls provider with aggregated bullets.
5. Stores result on every entry that falls in the week (`ai.weekSummary` denormalized — see Section 6).

### Classify projects
1. User clicks **Classify projects** in Stats or Gantt view.
2. Provider receives all bullets for the selected month, each annotated with its global bullet ID and its `entryId` so the response can reference them precisely.
3. Provider returns `Array<{ name: string; bulletIds: string[] }>` — `bulletIds` are the same global IDs passed in.
4. Store maps `bulletIds` back to `bulletRefs: { entryId, bulletId }` using the bullet → entry index, and writes the result to each affected entry's `ai.projects`.

### Export Markdown
1. User picks date range in `<ExportDialog>`.
2. App serializes each entry to Markdown using template above.
3. `jszip` packages files per the `folderStructure` setting.
4. Browser triggers download as `timeline-export-YYYY-MM-DD.zip`.

### Export long-image
1. User clicks **Export PNG**.
2. `html-to-image` converts the current view's root DOM node to PNG blob.
3. Browser triggers download as `timeline-cards-YYYY-MM-DD.png` (or `gantt-…` / `stats-…`).

### Switch LLM provider
1. User changes provider in `<SettingsDialog>`.
2. Settings saved → IndexedDB updated.
3. On next AI call, the provider factory constructs the new provider instance from current settings.

## 8. Error Handling

| Failure | Behavior |
|---|---|
| IndexedDB quota exceeded | Catch on write; toast: "Storage full — export your journal before continuing"; disable further writes until user exports. |
| API key missing or invalid | Validate on settings save (probe model list call). On AI click: detect missing key, redirect to settings with inline error. |
| LLM network/timeout | One retry with exponential backoff (1 s, 3 s). On second failure, toast with the error message; AI button returns to usable state. |
| LLM response malformed | Validate with Zod schema. On failure: store `ai.lastError`, show "could not parse — retry" inline. |
| Markdown zip too large | Stream entries into the zip in batches; show progress bar; abort if > 50 MB with a clear message. |
| PNG export fails | Catch error; toast: "Image export failed — try a narrower date range"; preserve view state. |

## 9. LLM Provider Abstraction

```ts
interface LLMProvider {
  id: 'anthropic' | 'openai' | 'ollama' | 'claude-code-cli';
  listModels(): Promise<string[]>;
  generateText(prompt: string, opts?: { model?: string; maxTokens?: number }): Promise<string>;
  classifyProjects(bullets: Bullet[]): Promise<Array<{ name: string; bulletIds: string[] }>>;
}
```

Concretely, each provider:
- Builds provider-specific request body.
- Calls its endpoint (browser fetch with `Authorization` header for cloud providers; localhost for Ollama).
- Maps response into the unified string/array shape.
- Throws `LLMError` (subclasses: `AuthError`, `RateLimitError`, `NetworkError`, `SchemaError`).

Factory:
```ts
function createProvider(settings: Settings['llm']): LLMProvider { ... }
```

## 10. Testing Strategy

### Unit (Vitest)
- `date.ts` — week boundaries, month boundaries, streak calculation.
- `markdownExport.ts` — roundtrip entry → md → parsed back to entry structure (allow loose parsing).
- `llm/*.test.ts` — provider implementations with mocked `fetch`.
- `zod schemas` — valid and invalid LLM response fixtures.

### Integration
- `store.test.ts` — full CRUD on entries using `fake-indexeddb`.
- `aiFlow.test.ts` — mock provider, click "Generate reflection" → assert entry updated and persisted.
- `export.test.ts` — generate zip, extract in test, assert file contents.

### End-to-end (Playwright, smoke only)
- Launch dev server, open page, add a day, click Generate, switch views, export Markdown, assert zip downloaded.

### Manual verification checklist
- [ ] First-run: app loads with empty state.
- [ ] Add bullets in all three categories → save → reload page → data persists.
- [ ] Switch provider in settings → generate reflection → result appears.
- [ ] Export Markdown → unzip → files match spec format.
- [ ] Export PNG → image opens.
- [ ] Switch views (cards → gantt → stats) → each renders without errors.
- [ ] DevTools console clean (no warnings or errors).

## 11. Dependencies

Runtime:
- react, react-dom
- zustand
- idb
- date-fns
- zod
- react-markdown, remark-gfm
- @uiw/react-md-editor
- jszip
- html-to-image
- @visx/heatmap, @visx/group, @visx/scale (for stats heatmap; Gantt can be plain SVG)
- clsx

Dev:
- vite, typescript
- @types/react, @types/react-dom
- @vitejs/plugin-react
- vitest, @testing-library/react, @testing-library/jest-dom
- fake-indexeddb
- @playwright/test
- eslint, prettier (optional)

## 12. File / Module Layout

```
src/
  main.tsx
  App.tsx
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
      MarkdownRender.tsx
      MarkdownEditor.tsx
      Button.tsx
      Input.tsx
      Select.tsx
      Toast.tsx
      ConfirmDialog.tsx
  store/
    index.ts                 # Zustand root store
    entries.ts               # entry CRUD + persistence
    settings.ts              # settings CRUD
    ai.ts                    # AI in-flight tracking
  services/
    llm/
      index.ts               # factory
      types.ts               # LLMProvider interface
      anthropic.ts
      openai.ts
      ollama.ts
      claude-code-cli.ts
    export/
      markdown.ts
      png.ts
  lib/
    date.ts
    markdown.ts
    schema.ts                # Zod schemas
    prompts.ts               # prompt templates per task
  test/
    setup.ts
    fixtures/
```

## 13. Out of Scope (re-affirmed)

The following are explicitly not in v1 to avoid scope creep:
- Push notifications, reminders, habit tracking, streaks beyond a visual badge.
- Bullet duration or start/end times.
- Multi-user, accounts, sync, sharing.
- Server-side proxy for LLM calls.
- Mobile-native apps, PWA install.
- Real-time collaboration.
- Comments, mentions, reactions.

## 14. Open Risks

1. **Browser CORS for direct LLM calls.** Anthropic and OpenAI both support browser CORS; Ollama needs `--cors-allow-origin` flag (documented in README).
2. **Long-image rendering quality.** `html-to-image` uses SVG foreignObject, which fails for some CSS features. Mitigation: provide a "narrow date range" hint in error message; keep critical visual content CSS-only.
3. **IndexedDB quota** varies by browser (typically 60% of disk). Users with years of dense entries may hit it; export-as-Markdown is the mitigation.
4. **LLM cost.** Daily calls + weekly summary + project classification can add up. Settings expose model choice so user can pick a cheaper model.
5. **Provider abstraction scope.** If user picks a provider we don't yet support, factory throws a clear "provider not implemented" error rather than failing silently.

## 15. Sign-off

Awaiting user review of this written spec before proceeding to implementation planning.