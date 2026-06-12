# $99 Pro Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the local-first Pro upgrade features: goals, project/theme classification wiring, report templates, report generation, evidence chains, AI review coaching, and trend insights.

**Architecture:** Keep the existing React + TypeScript + Zustand + IndexedDB architecture. Add focused domain modules for goals, reports, insights, evidence refs, and report templates while preserving the current local-first storage model and OpenAI-compatible LLM provider.

**Tech Stack:** React 19, TypeScript, Vite, Zustand, idb, zod, date-fns, react-markdown, Vitest, Testing Library, fake-indexeddb, Playwright.

---

## Scope

### In Scope

- Goal system for week and month goals.
- AI-assisted bullet-to-goal suggestions.
- Project/theme classification button wiring.
- Manual theme rename, merge, and bullet removal.
- Built-in report template library.
- Report center with Markdown preview and copy.
- Evidence refs for AI conclusions and generated reports.
- AI review coaching cards.
- Local trend insight generation.
- IndexedDB persistence for new domain objects.
- Unit and component tests for the new behavior.

### Out of Scope

- Cloud account, login, sync, subscription, payments.
- PDF, Word, PPT export.
- Customer/project commercial management.
- Team collaboration.
- Online template marketplace.

## Existing Project Context

Relevant current files:

- `src/App.tsx`: top-level navigation and view switching.
- `src/store/index.ts`: Zustand root store and app actions.
- `src/store/persistence.ts`: IndexedDB layer, currently DB version 2.
- `src/lib/schema.ts`: Zod schemas and core types.
- `src/lib/prompts.ts`: AI prompt builders.
- `src/services/llm/openaiCompatible.ts`: OpenAI-compatible provider.
- `src/components/views/TimelineGanttView.tsx`: contains inactive Classify Projects button.
- `src/components/views/StatsPanel.tsx`: contains inactive Classify Projects button.
- `src/components/stats/GanttChart.tsx`: renders `entry.ai.projects`.
- `src/components/views/WeeklyReviewView.tsx`: existing weekly review.
- `src/components/views/MonthlyReviewReport.tsx`: existing monthly review stats.
- `src/services/export/markdown.ts`: current Markdown export.

## New File Structure

Create:

```text
src/features/goals/
  goalUtils.ts
  goalUtils.test.ts
  GoalEditor.tsx
  GoalEditor.test.tsx
  GoalsView.tsx
  GoalsView.test.tsx
  GoalProgressPanel.tsx

src/features/projects/
  projectUtils.ts
  projectUtils.test.ts
  ThemeManagementPanel.tsx
  ThemeManagementPanel.test.tsx

src/features/evidence/
  evidence.ts
  evidence.test.ts
  EvidenceList.tsx
  EvidenceList.test.tsx

src/features/reports/
  templates.ts
  templates.test.ts
  reportBuilder.ts
  reportBuilder.test.ts
  ReportsView.tsx
  ReportsView.test.tsx
  ReportPreview.tsx

src/features/insights/
  insightUtils.ts
  insightUtils.test.ts
  InsightsView.tsx
  InsightsView.test.tsx

src/features/coach/
  coachingPrompts.ts
  coachingPrompts.test.ts
  ReviewCoachPanel.tsx
  ReviewCoachPanel.test.tsx
```

Modify:

```text
src/App.tsx
src/lib/schema.ts
src/lib/prompts.ts
src/services/llm/types.ts
src/services/llm/openaiCompatible.ts
src/store/index.ts
src/store/index.test.ts
src/store/persistence.ts
src/store/persistence.test.ts
src/components/views/StatsPanel.tsx
src/components/views/TimelineGanttView.tsx
src/components/views/MonthlyReviewReport.tsx
src/components/views/WeeklyReviewView.tsx
src/styles.css
README.md
```

## Validation Commands

Preferred commands:

```bash
npm test
npm run build
```

If local `npm` is broken, use direct local binaries:

```powershell
& 'D:\nodejs\node.exe' 'E:\副业\Project\26.06_Timeline\node_modules\vitest\vitest.mjs' run
& 'D:\nodejs\node.exe' 'E:\副业\Project\26.06_Timeline\node_modules\typescript\bin\tsc' -b
& 'D:\nodejs\node.exe' 'E:\副业\Project\26.06_Timeline\node_modules\vite\bin\vite.js' build
```

---

### Task 1: Extend Schemas and IndexedDB Persistence

**Files:**

- Modify: `src/lib/schema.ts`
- Modify: `src/store/persistence.ts`
- Modify: `src/store/persistence.test.ts`
- Modify: `src/test/fixtures.ts`

- [ ] **Step 1: Write failing schema tests**

Add tests for `goalSchema`, `generatedReportSchema`, `evidenceRefSchema`, and `insightSchema`.

Run:

```bash
npm test -- src/lib/schema.test.ts
```

Expected: FAIL because the schemas do not exist.

- [ ] **Step 2: Add new schema types**

Add to `src/lib/schema.ts`:

```ts
export const goalPeriodSchema = z.enum(['week', 'month']);
export const goalStatusSchema = z.enum(['active', 'done', 'paused', 'dropped']);

export const evidenceRefSchema = z.object({
  entryId: z.string(),
  date: z.string(),
  category: categorySchema,
  bulletId: z.string(),
  text: z.string(),
});
export type EvidenceRef = z.infer<typeof evidenceRefSchema>;

export const goalSchema = z.object({
  id: z.string(),
  title: z.string(),
  period: goalPeriodSchema,
  startDate: z.string(),
  endDate: z.string(),
  status: goalStatusSchema,
  linkedBullets: z.array(projectRefSchema),
  notes: z.string().optional(),
  ai: z.object({
    progressSummary: z.string().optional(),
    risk: z.string().optional(),
    nextAction: z.string().optional(),
  }).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Goal = z.infer<typeof goalSchema>;

export const reportSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  evidenceRefs: z.array(evidenceRefSchema),
});

export const generatedReportSchema = z.object({
  id: z.string(),
  templateId: z.string(),
  title: z.string(),
  period: z.enum(['week', 'month']),
  startDate: z.string(),
  endDate: z.string(),
  content: z.string(),
  sections: z.array(reportSectionSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type GeneratedReport = z.infer<typeof generatedReportSchema>;

export const insightSchema = z.object({
  id: z.string(),
  type: z.enum([
    'goal-drift',
    'stalled-theme',
    'recurring-problem',
    'success-pattern',
    'review-quality',
    'activity-distribution',
  ]),
  title: z.string(),
  summary: z.string(),
  severity: z.enum(['info', 'warning', 'critical']),
  periodStart: z.string(),
  periodEnd: z.string(),
  evidenceRefs: z.array(evidenceRefSchema),
  createdAt: z.string(),
});
export type Insight = z.infer<typeof insightSchema>;
```

- [ ] **Step 3: Write failing persistence tests**

Cover:

- Save and load goals.
- Save and load generated reports.
- Save and load insights.
- Invalid records are ignored.
- Existing entries/settings/weeklyReviews still load.

Run:

```bash
npm test -- src/store/persistence.test.ts
```

Expected: FAIL because persistence functions and stores do not exist.

- [ ] **Step 4: Upgrade IndexedDB**

In `src/store/persistence.ts`:

- Bump `DB_VERSION` from 2 to 3.
- Add stores:
  - `goals` keyPath `id`
  - `reports` keyPath `id`
  - `insights` keyPath `id`
- Add functions:
  - `loadGoals()`
  - `saveGoal(goal)`
  - `deleteGoal(id)`
  - `loadReports()`
  - `saveReport(report)`
  - `deleteReport(id)`
  - `loadInsights()`
  - `saveInsight(insight)`
  - `clearInsights()`

- [ ] **Step 5: Run persistence tests**

Run:

```bash
npm test -- src/lib/schema.test.ts src/store/persistence.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/schema.ts src/lib/schema.test.ts src/store/persistence.ts src/store/persistence.test.ts src/test/fixtures.ts
git commit -m "feat: add pro data schemas and persistence"
```

---

### Task 2: Extend Zustand Store for Goals, Reports, and Insights

**Files:**

- Modify: `src/store/index.ts`
- Modify: `src/store/index.test.ts`

- [ ] **Step 1: Write failing store tests**

Cover:

- `initialize()` loads goals, reports, and insights.
- `upsertGoal()` creates and updates goals.
- `deleteGoal()` removes a goal.
- `linkBulletToGoal()` deduplicates bullet refs.
- `unlinkBulletFromGoal()` removes one ref.
- `saveGeneratedReport()` stores reports.
- `saveInsights()` replaces insights for a period.

Run:

```bash
npm test -- src/store/index.test.ts
```

Expected: FAIL.

- [ ] **Step 2: Add state fields**

Extend `AppState`:

```ts
goals: Record<string, Goal>;
reports: Record<string, GeneratedReport>;
insights: Record<string, Insight>;
```

- [ ] **Step 3: Add actions**

Add actions:

```ts
upsertGoal: (goal: Goal) => Promise<void>;
deleteGoal: (goalId: string) => Promise<void>;
linkBulletToGoal: (goalId: string, ref: { entryId: string; bulletId: string }) => Promise<void>;
unlinkBulletFromGoal: (goalId: string, bulletId: string) => Promise<void>;
saveGeneratedReport: (report: GeneratedReport) => Promise<void>;
deleteGeneratedReport: (reportId: string) => Promise<void>;
saveInsights: (insights: Insight[]) => Promise<void>;
```

- [ ] **Step 4: Add selectors**

Export:

```ts
getGoalsForPeriod(period: 'week' | 'month', startDate: string, endDate: string): Goal[];
getReportsForPeriod(startDate: string, endDate: string): GeneratedReport[];
getInsightsForPeriod(startDate: string, endDate: string): Insight[];
```

- [ ] **Step 5: Run store tests**

Run:

```bash
npm test -- src/store/index.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/store/index.ts src/store/index.test.ts
git commit -m "feat: manage pro domain state"
```

---

### Task 3: Build Evidence Ref Utilities

**Files:**

- Create: `src/features/evidence/evidence.ts`
- Create: `src/features/evidence/evidence.test.ts`
- Create: `src/features/evidence/EvidenceList.tsx`
- Create: `src/features/evidence/EvidenceList.test.tsx`

- [ ] **Step 1: Write failing utility tests**

Cover:

- Build evidence refs from bullet ids.
- Ignore missing bullet ids.
- Preserve date, category, entryId, bulletId, and text.

Run:

```bash
npm test -- src/features/evidence/evidence.test.ts
```

Expected: FAIL.

- [ ] **Step 2: Implement evidence helpers**

Create:

```ts
export function buildEvidenceRefs(
  entries: Record<string, Entry>,
  refs: Array<{ entryId: string; bulletId: string }>,
): EvidenceRef[] {
  // Find matching entry by entryId, then scan work/study/side bullets.
}

export function getAllEvidenceRefs(entries: Record<string, Entry>): EvidenceRef[] {
  // Flatten all bullets into evidence refs.
}
```

- [ ] **Step 3: Write component tests**

Cover:

- Empty evidence list renders a quiet empty state.
- Evidence rows show date, category, and text.

- [ ] **Step 4: Implement EvidenceList**

Render evidence compactly:

- Date.
- Category.
- Bullet text.

- [ ] **Step 5: Run tests**

```bash
npm test -- src/features/evidence
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/evidence
git commit -m "feat: add evidence references"
```

---

### Task 4: Add Goal System UI and Logic

**Files:**

- Create: `src/features/goals/goalUtils.ts`
- Create: `src/features/goals/goalUtils.test.ts`
- Create: `src/features/goals/GoalEditor.tsx`
- Create: `src/features/goals/GoalEditor.test.tsx`
- Create: `src/features/goals/GoalProgressPanel.tsx`
- Create: `src/features/goals/GoalsView.tsx`
- Create: `src/features/goals/GoalsView.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write goal utility tests**

Cover:

- Create default week goal.
- Create default month goal.
- Calculate progress from linked bullets.
- Mark stale goals with no linked bullets in period.

Run:

```bash
npm test -- src/features/goals/goalUtils.test.ts
```

Expected: FAIL.

- [ ] **Step 2: Implement goal utilities**

Add helpers:

```ts
createEmptyGoal(input): Goal;
calculateGoalProgress(goal, entries): { linkedCount: number; activeDays: number };
isGoalStale(goal, entries): boolean;
```

- [ ] **Step 3: Write GoalEditor tests**

Cover:

- Title editing.
- Notes editing.
- Status change.
- Save calls `upsertGoal`.
- Delete calls `deleteGoal`.

- [ ] **Step 4: Implement GoalEditor**

Keep it simple:

- Text input for title.
- Select for period.
- Date inputs for start/end.
- Select for status.
- Markdown textarea for notes.
- Save and Delete buttons.

- [ ] **Step 5: Write GoalsView tests**

Cover:

- Renders active goals.
- Creates a new week goal.
- Creates a new month goal.
- Shows progress count.

- [ ] **Step 6: Implement GoalsView**

Add a new app mode or browse tab named `Goals`.

Recommendation:

- Extend `AppMode` to include `'goals'`, or add a top-level nav button.
- Keep current `checkin` and `browse` behavior unchanged.

- [ ] **Step 7: Run tests**

```bash
npm test -- src/features/goals src/App.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/features/goals src/App.tsx src/styles.css src/lib/schema.ts
git commit -m "feat: add local goal tracking"
```

---

### Task 5: Wire Project/Theme Classification

**Files:**

- Create: `src/features/projects/projectUtils.ts`
- Create: `src/features/projects/projectUtils.test.ts`
- Create: `src/features/projects/ThemeManagementPanel.tsx`
- Create: `src/features/projects/ThemeManagementPanel.test.tsx`
- Modify: `src/components/views/StatsPanel.tsx`
- Modify: `src/components/views/TimelineGanttView.tsx`
- Modify: `src/store/index.ts`
- Modify: `src/store/index.test.ts`

- [ ] **Step 1: Write project utility tests**

Cover:

- Map provider `bulletIds` to `{ entryId, bulletId }`.
- Ignore unknown bullet ids.
- Merge themes by target name.
- Rename a theme across entries.
- Remove a bullet ref from a theme.

Run:

```bash
npm test -- src/features/projects/projectUtils.test.ts
```

Expected: FAIL.

- [ ] **Step 2: Implement project utilities**

Add:

```ts
mapClassifiedProjectsToRefs(projects, classifiableBullets)
renameTheme(entries, oldName, newName)
mergeThemes(entries, sourceName, targetName)
removeBulletFromTheme(entries, themeName, bulletId)
```

- [ ] **Step 3: Add store actions**

Add:

```ts
classifyProjectsForMonth: (month: string) => Promise<void>;
renameProjectTheme: (oldName: string, newName: string) => Promise<void>;
mergeProjectThemes: (sourceName: string, targetName: string) => Promise<void>;
removeBulletFromProjectTheme: (themeName: string, bulletId: string) => Promise<void>;
```

Use the existing OpenAI-compatible provider and current settings.

- [ ] **Step 4: Update StatsPanel**

The “Classify Projects” button should:

- Show loading state.
- Disable when there are no bullets.
- Show inline error on provider failure.
- Call `classifyProjectsForMonth(selectedMonth)`.

- [ ] **Step 5: Update TimelineGanttView**

Mirror the same classification behavior as StatsPanel.

- [ ] **Step 6: Add ThemeManagementPanel**

Allow:

- Rename theme.
- Merge theme into another theme.
- Remove bullet from theme.

- [ ] **Step 7: Run tests**

```bash
npm test -- src/features/projects src/components/views/StatsPanel.test.tsx src/components/views/TimelineGanttView.test.tsx src/store/index.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/features/projects src/components/views/StatsPanel.tsx src/components/views/TimelineGanttView.tsx src/store/index.ts src/store/index.test.ts
git commit -m "feat: wire theme classification"
```

---

### Task 6: Add Report Template Library

**Files:**

- Create: `src/features/reports/templates.ts`
- Create: `src/features/reports/templates.test.ts`
- Modify: `src/lib/prompts.ts`
- Modify: `src/lib/prompts.test.ts`

- [ ] **Step 1: Write template tests**

Cover:

- Built-in templates include boss weekly report, partner monthly review, personal deep review, goal review, theme progress report.
- Each template has id, name, period, sections, and prompt builder.
- Template lookup by id returns the expected template.

Run:

```bash
npm test -- src/features/reports/templates.test.ts
```

Expected: FAIL.

- [ ] **Step 2: Implement templates**

Create:

```ts
export interface ReportTemplate {
  id: string;
  name: string;
  period: 'week' | 'month';
  description: string;
  sections: Array<{ id: string; title: string }>;
  requiresEvidence: boolean;
}

export const REPORT_TEMPLATES: ReportTemplate[] = [...]
export function getReportTemplate(id: string): ReportTemplate | undefined
```

- [ ] **Step 3: Add prompt builders**

Add prompt builder functions:

```ts
buildReportPrompt(template, entries, goals, insights, evidenceRefs)
buildReportSectionPrompt(section, context)
```

Prompts must instruct the model to return JSON:

```json
{
  "title": "Report title",
  "sections": [
    {
      "title": "Section title",
      "content": "Section content",
      "evidenceBulletIds": ["bullet-id"]
    }
  ]
}
```

- [ ] **Step 4: Run tests**

```bash
npm test -- src/features/reports/templates.test.ts src/lib/prompts.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/reports/templates.ts src/features/reports/templates.test.ts src/lib/prompts.ts src/lib/prompts.test.ts
git commit -m "feat: add built-in report templates"
```

---

### Task 7: Add Report Builder and LLM Report Generation

**Files:**

- Create: `src/features/reports/reportBuilder.ts`
- Create: `src/features/reports/reportBuilder.test.ts`
- Modify: `src/services/llm/types.ts`
- Modify: `src/services/llm/openaiCompatible.ts`
- Modify: `src/services/llm/openaiCompatible.test.ts`

- [ ] **Step 1: Write report builder tests**

Cover:

- Build deterministic non-AI report from entries and goals.
- Parse valid LLM report JSON.
- Attach evidence refs from returned bullet ids.
- Throw SchemaError on malformed JSON.

Run:

```bash
npm test -- src/features/reports/reportBuilder.test.ts
```

Expected: FAIL.

- [ ] **Step 2: Implement report builder**

Add:

```ts
buildLocalReport(input): GeneratedReport;
parseAIReportResponse(raw, context): GeneratedReport;
```

Use `createId()` and `buildEvidenceRefs()`.

- [ ] **Step 3: Extend LLMProvider**

Add:

```ts
generateReport(input: ReportGenerationInput): Promise<GeneratedReport>;
```

Define `ReportGenerationInput` in `src/services/llm/types.ts`.

- [ ] **Step 4: Implement OpenAI-compatible report generation**

In `openaiCompatible.ts`:

- Build prompt with template and period data.
- Call chat completions.
- Extract JSON.
- Parse into GeneratedReport.
- Clean `<think>` artifacts using existing `cleanResponse`.

- [ ] **Step 5: Run tests**

```bash
npm test -- src/features/reports/reportBuilder.test.ts src/services/llm/openaiCompatible.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/reports/reportBuilder.ts src/features/reports/reportBuilder.test.ts src/services/llm src/lib/prompts.ts
git commit -m "feat: generate evidence-backed reports"
```

---

### Task 8: Build Reports UI

**Files:**

- Create: `src/features/reports/ReportsView.tsx`
- Create: `src/features/reports/ReportsView.test.tsx`
- Create: `src/features/reports/ReportPreview.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write ReportsView tests**

Cover:

- Renders template selector.
- Renders week/month date range controls.
- Generate button calls provider.
- Generated report is saved to store.
- Report preview shows evidence toggles.
- Copy Markdown button writes report content to clipboard.

Run:

```bash
npm test -- src/features/reports/ReportsView.test.tsx
```

Expected: FAIL.

- [ ] **Step 2: Implement ReportPreview**

Render:

- Report title.
- Sections.
- Evidence toggles using `EvidenceList`.
- Copy Markdown button.

- [ ] **Step 3: Implement ReportsView**

Controls:

- Template selector.
- Period selector.
- Start/end date.
- Generate with AI.
- Generate local draft.
- Saved report history.

- [ ] **Step 4: Add navigation**

Add top-level Reports nav in `src/App.tsx`.

- [ ] **Step 5: Run tests**

```bash
npm test -- src/features/reports src/App.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/reports src/App.tsx src/styles.css
git commit -m "feat: add report center"
```

---

### Task 9: Add AI Review Coach

**Files:**

- Create: `src/features/coach/coachingPrompts.ts`
- Create: `src/features/coach/coachingPrompts.test.ts`
- Create: `src/features/coach/ReviewCoachPanel.tsx`
- Create: `src/features/coach/ReviewCoachPanel.test.tsx`
- Modify: `src/services/llm/types.ts`
- Modify: `src/services/llm/openaiCompatible.ts`
- Modify: `src/components/views/WeeklyReviewView.tsx`
- Modify: `src/components/cards/ReviewEditor.tsx`

- [ ] **Step 1: Write coaching prompt tests**

Cover:

- Daily coaching prompt includes target, gap, reason, lesson, and bullets.
- Weekly coaching prompt includes goals, completed, not completed, key events.
- Prompt asks for questions, not conclusions.

Run:

```bash
npm test -- src/features/coach/coachingPrompts.test.ts
```

Expected: FAIL.

- [ ] **Step 2: Implement coaching prompts**

Add:

```ts
buildDailyCoachPrompt(entry): string;
buildWeeklyCoachPrompt(weeklyReview, entries, goals): string;
```

- [ ] **Step 3: Extend LLMProvider**

Add:

```ts
generateCoachingQuestions(input): Promise<string[]>;
```

- [ ] **Step 4: Implement ReviewCoachPanel**

Render:

- Generate questions button.
- Loading state.
- Error state.
- Question cards.
- Copy question.
- Dismiss question locally.

- [ ] **Step 5: Integrate into daily and weekly review**

Add `ReviewCoachPanel` below:

- Daily `ReviewEditor`.
- `WeeklyReviewView`.

- [ ] **Step 6: Run tests**

```bash
npm test -- src/features/coach src/services/llm/openaiCompatible.test.ts src/components/cards src/components/views/WeeklyReviewView.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/features/coach src/services/llm src/components/cards/ReviewEditor.tsx src/components/views/WeeklyReviewView.tsx
git commit -m "feat: add ai review coach"
```

---

### Task 10: Add Trend Insights

**Files:**

- Create: `src/features/insights/insightUtils.ts`
- Create: `src/features/insights/insightUtils.test.ts`
- Create: `src/features/insights/InsightsView.tsx`
- Create: `src/features/insights/InsightsView.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write insight utility tests**

Cover:

- Activity distribution insight.
- Review quality insight.
- Goal drift insight.
- Stalled theme insight.
- Tag frequency insight.
- Evidence refs attached where possible.

Run:

```bash
npm test -- src/features/insights/insightUtils.test.ts
```

Expected: FAIL.

- [ ] **Step 2: Implement deterministic insights**

Add:

```ts
generateActivityDistributionInsight(entries, period): Insight[];
generateReviewQualityInsight(entries, period): Insight[];
generateGoalDriftInsight(goals, entries, period): Insight[];
generateStalledThemeInsight(entries, period): Insight[];
generateTagFrequencyInsight(entries, period): Insight[];
generateInsights(input): Insight[];
```

- [ ] **Step 3: Write InsightsView tests**

Cover:

- Renders insight cards.
- Filters by severity.
- Regenerate button saves insights.
- Evidence expansion works.

- [ ] **Step 4: Implement InsightsView**

Layout:

- Period selector.
- Regenerate insights button.
- Severity filters.
- Insight cards with evidence.

- [ ] **Step 5: Add navigation**

Add top-level Insights nav in `src/App.tsx`.

- [ ] **Step 6: Run tests**

```bash
npm test -- src/features/insights src/App.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/features/insights src/App.tsx src/styles.css
git commit -m "feat: add local trend insights"
```

---

### Task 11: Enhance Monthly and Weekly Review Surfaces

**Files:**

- Modify: `src/components/views/MonthlyReviewReport.tsx`
- Modify: `src/components/views/WeeklyReviewView.tsx`
- Modify: `src/components/views/ReviewHistory.tsx`
- Test: existing related component tests or new tests if missing.

- [ ] **Step 1: Write tests for enhanced review surfaces**

Cover:

- Monthly report links to ReportsView.
- Monthly report shows top insights.
- Weekly review shows linked goals.
- Review history can show evidence-backed entries.

- [ ] **Step 2: Add linked goals summary to weekly review**

Show:

- Active goals in the current week.
- Linked bullet count.
- Quick link to Goals view.

- [ ] **Step 3: Add insights summary to monthly report**

Show:

- Top 3 insights for selected month.
- Link to Insights view.

- [ ] **Step 4: Add report generation shortcuts**

Buttons:

- Generate weekly report.
- Generate monthly report.

They should navigate to ReportsView with prefilled period/template.

- [ ] **Step 5: Run tests**

```bash
npm test -- src/components/views
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/views
git commit -m "feat: connect reviews to goals reports and insights"
```

---

### Task 12: Update Markdown Export for New Local Artifacts

**Files:**

- Modify: `src/services/export/markdown.ts`
- Modify: `src/services/export/markdown.test.ts`
- Modify: `src/components/dialogs/ExportDialog.tsx`
- Modify: `src/components/dialogs/ExportDialog.test.tsx`

- [ ] **Step 1: Write failing export tests**

Cover:

- Entry export can include linked goals.
- Report export serializes generated reports as Markdown.
- Insight export serializes insight summaries and evidence.
- Existing entry export behavior remains unchanged by default.

- [ ] **Step 2: Extend Markdown serializers**

Add:

```ts
goalToMarkdown(goal, evidence): string;
reportToMarkdown(report): string;
insightToMarkdown(insight): string;
```

- [ ] **Step 3: Extend ExportDialog without PDF/Word/PPT**

Add checkboxes:

- Include goals.
- Include generated reports.
- Include insights.

Keep output as Markdown zip only.

- [ ] **Step 4: Run tests**

```bash
npm test -- src/services/export/markdown.test.ts src/components/dialogs/ExportDialog.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/export src/components/dialogs/ExportDialog.tsx src/components/dialogs/ExportDialog.test.tsx
git commit -m "feat: export pro artifacts as markdown"
```

---

### Task 13: End-to-End Smoke and Documentation

**Files:**

- Modify: `e2e/smoke.spec.ts`
- Modify: `README.md`

- [ ] **Step 1: Extend smoke test**

Cover:

- Create a goal.
- Add a bullet.
- Link bullet to goal.
- Run theme classification with mocked provider if possible.
- Generate local report.
- Generate insights.
- Reload and verify persistence.

- [ ] **Step 2: Update README**

Document:

- Pro local features.
- What remains local-only.
- Excluded cloud/subscription/PDF/Word/PPT/customer-project features.
- Backup recommendation.
- OpenAI-compatible AI settings.

- [ ] **Step 3: Run full unit suite**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 4: Run build**

```bash
npm run build
```

Expected: PASS. Chunk-size warnings are acceptable if no functional build failure occurs.

- [ ] **Step 5: Run e2e**

```bash
npm run e2e
```

Expected: PASS, or document Playwright/browser environment blocker.

- [ ] **Step 6: Commit**

```bash
git add e2e README.md
git commit -m "docs: document pro local workflow"
```

---

## Final Acceptance Criteria

- Goal system works for week and month goals.
- Bullet-to-goal linking works.
- Project/theme classification is wired to the existing AI provider.
- Gantt view displays classified themes.
- Theme rename, merge, and bullet removal work.
- ReportsView can generate and save reports.
- Reports include evidence refs.
- InsightsView displays deterministic trend insights.
- AI review coach generates follow-up questions.
- Markdown export can include goals, reports, and insights.
- All new data persists through IndexedDB after reload.
- `npm test` passes.
- `npm run build` passes.
- No cloud account, sync, subscription, PDF/Word/PPT export, or customer/project management features are introduced.

## Execution Recommendation

Use subagent-driven development for Tasks 1-13, one task per fresh implementation agent, with review after each task. If implementing inline, execute no more than two tasks per checkpoint and run the targeted tests before continuing.
