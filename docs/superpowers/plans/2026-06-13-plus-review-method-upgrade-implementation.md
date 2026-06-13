# Plus Review Method Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Plus review-method layer: structured review cases, PDF-loop preview plans, deviation analysis, AI facilitator/questioner/quality checker, and a reusable principle library.

**Architecture:** Preserve the current React + TypeScript + Zustand + IndexedDB local-first architecture. Extend the existing Plus modules instead of replacing them, and introduce focused domains for review cases, preview plans, conclusion quality, and principles. AI remains OpenAI-compatible and optional; deterministic local behavior must exist for core review flows.

**Tech Stack:** React 19, TypeScript, Vite, Zustand, idb, zod, date-fns, react-markdown, Vitest, Testing Library, fake-indexeddb, Playwright.

---

## Current Implementation Status

The current codebase already includes a partial Plus implementation:

- `src/features/goals`: local goal CRUD and progress display.
- `src/features/reports`: report templates, local report builder, report preview.
- `src/features/insights`: deterministic local insight generation.
- `src/features/evidence`: evidence ref helpers and UI.
- `src/features/projects`: AI theme classification and basic theme list.
- `src/features/coach`: daily AI question panel.
- `src/lib/schema.ts`: `Goal`, `GeneratedReport`, `EvidenceRef`, `Insight`.
- `src/store/persistence.ts`: IndexedDB version 3 with goals, reports, insights stores.
- `src/store/index.ts`: goals, reports, insights state and actions.
- `src/App.tsx`: Goals, Reports, Insights tabs are wired.

Validation already performed:

```powershell
& 'D:\nodejs\node.exe' 'E:\副业\Project\26.06_Timeline\node_modules\typescript\bin\tsc' -b
& 'D:\nodejs\node.exe' 'E:\副业\Project\26.06_Timeline\node_modules\vitest\vitest.mjs' run
```

Result:

- TypeScript build passed.
- Vitest passed: 19 test files, 116 tests.

Known gaps to preserve in this plan:

- AI report generation is still TODO and falls back to local draft.
- Weekly review coach does not use a weekly-specific prompt.
- Goal-to-bullet linking has store actions but incomplete user workflow.
- Theme management lacks robust merge/remove/view-evidence behavior.
- Insights often lack evidence refs.
- Export does not yet include all Plus artifacts.
- No structured review case, no PDF-loop preview, no conclusion quality checker, no principle library.

## Scope

### In Scope

- Structured review cases based on the two review books.
- Five-step review wizard: process, expectation, evaluation, cause analysis, learning.
- PDF loop: Preview, Do, FuPan.
- Evidence-backed fact timeline.
- Expectation-result-deviation matrix.
- AI questioner and AI facilitator prompts.
- Conclusion quality checker.
- Principle / review knowledge library.
- Report and insight upgrades to consume review cases and principles.
- Markdown export for new local artifacts.
- Tests and README updates.

### Out of Scope

- Cloud account, sync, subscription, payments.
- PDF, Word, PPT export.
- Customer/project commercial management.
- Team collaboration and permissions.
- Online template marketplace.

## File Structure

Create:

```text
src/features/reviewCases/
  reviewCaseTypes.ts
  reviewCaseUtils.ts
  reviewCaseUtils.test.ts
  ReviewCasesView.tsx
  ReviewCasesView.test.tsx
  ReviewCaseEditor.tsx
  ReviewCaseEditor.test.tsx
  ReviewStepWizard.tsx
  ReviewStepWizard.test.tsx
  FactTimeline.tsx
  FactTimeline.test.tsx
  DeviationMatrix.tsx
  DeviationMatrix.test.tsx

src/features/preview/
  previewUtils.ts
  previewUtils.test.ts
  PreviewPlansView.tsx
  PreviewPlansView.test.tsx
  PreviewPlanEditor.tsx
  PreviewPlanEditor.test.tsx

src/features/conclusions/
  conclusionQuality.ts
  conclusionQuality.test.ts
  ConclusionQualityPanel.tsx
  ConclusionQualityPanel.test.tsx

src/features/principles/
  principleUtils.ts
  principleUtils.test.ts
  PrinciplesView.tsx
  PrinciplesView.test.tsx
  PrincipleCard.tsx

src/features/coach/
  facilitatorPrompts.ts
  facilitatorPrompts.test.ts
  questionerPrompts.ts
  questionerPrompts.test.ts
```

Modify:

```text
src/App.tsx
src/lib/schema.ts
src/lib/prompts.ts
src/lib/prompts.test.ts
src/services/llm/types.ts
src/services/llm/openaiCompatible.ts
src/services/llm/openaiCompatible.test.ts
src/store/index.ts
src/store/index.test.ts
src/store/persistence.ts
src/store/persistence.test.ts
src/features/reports/templates.ts
src/features/reports/reportBuilder.ts
src/features/reports/ReportsView.tsx
src/features/insights/insightUtils.ts
src/features/insights/InsightsView.tsx
src/features/coach/ReviewCoachPanel.tsx
src/components/views/WeeklyReviewView.tsx
src/components/views/MonthlyReviewReport.tsx
src/components/dialogs/ExportDialog.tsx
src/services/export/markdown.ts
src/styles.css
README.md
```

## Validation Commands

Preferred:

```powershell
npm test
npm run build
```

Fallback when local npm is broken:

```powershell
& 'D:\nodejs\node.exe' 'E:\副业\Project\26.06_Timeline\node_modules\vitest\vitest.mjs' run
& 'D:\nodejs\node.exe' 'E:\副业\Project\26.06_Timeline\node_modules\typescript\bin\tsc' -b
& 'D:\nodejs\node.exe' 'E:\副业\Project\26.06_Timeline\node_modules\vite\bin\vite.js' build
```

---

### Task 1: Stabilize Current Plus Baseline

**Files:**

- Inspect: `src/features/goals/*`
- Inspect: `src/features/reports/*`
- Inspect: `src/features/insights/*`
- Inspect: `src/features/projects/*`
- Inspect: `src/features/coach/*`
- Inspect: `src/App.tsx`
- Inspect: `src/lib/schema.ts`

- [ ] **Step 1: Run current validation**

Run:

```powershell
& 'D:\nodejs\node.exe' 'E:\副业\Project\26.06_Timeline\node_modules\typescript\bin\tsc' -b
& 'D:\nodejs\node.exe' 'E:\副业\Project\26.06_Timeline\node_modules\vitest\vitest.mjs' run
```

Expected: PASS.

- [ ] **Step 2: Add a Plus status note to README**

Document that Plus currently includes local goals, local reports, local insights, theme classification, and AI question generation, but that the review-method layer is still being added.

- [ ] **Step 3: Run tests**

Run:

```powershell
& 'D:\nodejs\node.exe' 'E:\副业\Project\26.06_Timeline\node_modules\vitest\vitest.mjs' run
```

Expected: PASS.

- [ ] **Step 4: Commit**

```powershell
git add README.md
git commit -m "docs: clarify current plus baseline"
```

---

### Task 2: Add ReviewCase Schemas and Persistence

**Files:**

- Modify: `src/lib/schema.ts`
- Modify: `src/lib/schema.test.ts`
- Modify: `src/store/persistence.ts`
- Modify: `src/store/persistence.test.ts`
- Modify: `src/test/fixtures.ts`

- [ ] **Step 1: Write failing schema tests**

Add tests for:

- `reviewCaseSchema`
- `reviewStepsSchema`
- `reviewConclusionSchema`
- `reviewActionItemSchema`
- `previewPlanSchema`
- `principleSchema`

Run:

```powershell
& 'D:\nodejs\node.exe' 'E:\副业\Project\26.06_Timeline\node_modules\vitest\vitest.mjs' run src/lib/schema.test.ts
```

Expected: FAIL because schemas do not exist.

- [ ] **Step 2: Add schemas**

Add:

```ts
export const reviewCaseTypeSchema = z.enum(['daily', 'weekly', 'monthly', 'goal', 'theme', 'event', 'benchmark']);
export const reviewCaseStatusSchema = z.enum(['draft', 'in-review', 'completed', 'archived']);

export const deviationRowSchema = z.object({
  id: z.string(),
  level: z.enum(['purpose', 'goal', 'measure']),
  expectation: z.string(),
  result: z.string(),
  deviation: z.string(),
  status: z.enum(['met', 'missed', 'exceeded', 'unclear', 'not-measurable']),
  evidenceRefs: z.array(evidenceRefSchema),
});

export const whyChainSchema = z.object({
  id: z.string(),
  question: z.string(),
  answer: z.string(),
  depth: z.number().int().min(1),
  parentId: z.string().optional(),
});

export const causeItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  controllability: z.enum(['controllable', 'influenceable', 'uncontrollable']),
  source: z.enum(['subjective', 'objective', 'mixed']),
  evidenceRefs: z.array(evidenceRefSchema),
});

export const reviewStepsSchema = z.object({
  process: z.object({
    timelineNotes: z.string().optional(),
    keyFacts: z.array(evidenceRefSchema),
    missingFacts: z.array(z.string()),
  }),
  expectation: z.object({
    purpose: z.string().optional(),
    goals: z.array(z.string()),
    measures: z.array(z.string()),
    assumptions: z.array(z.string()),
  }),
  evaluation: z.object({
    rows: z.array(deviationRowSchema),
  }),
  causeAnalysis: z.object({
    whys: z.array(whyChainSchema),
    controllability: z.array(causeItemSchema),
    brightSpots: z.array(causeItemSchema),
  }),
  learning: z.object({
    insights: z.array(z.string()),
    rules: z.array(z.string()),
    boundaries: z.array(z.string()),
  }),
});

export const conclusionQualitySchema = z.object({
  score: z.number().min(0).max(100),
  accidentalFactorRisk: z.enum(['low', 'medium', 'high']),
  pointsToPersonRisk: z.enum(['low', 'medium', 'high']),
  whyDepth: z.number().int().min(0),
  hasCrossValidation: z.boolean(),
  verdict: z.enum(['ready', 'needs-evidence', 'needs-deeper-why', 'observation-only']),
});

export const reviewConclusionSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  evidenceRefs: z.array(evidenceRefSchema),
  quality: conclusionQualitySchema,
  boundary: z.string().optional(),
  reusableAsPrinciple: z.boolean(),
  createdAt: z.string(),
});

export const reviewActionItemSchema = z.object({
  id: z.string(),
  mode: z.enum(['start', 'stop', 'continue']),
  title: z.string(),
  dueDate: z.string().optional(),
  linkedGoalId: z.string().optional(),
  completed: z.boolean(),
});

export const reviewCaseSchema = z.object({
  id: z.string(),
  type: reviewCaseTypeSchema,
  title: z.string(),
  status: reviewCaseStatusSchema,
  startDate: z.string(),
  endDate: z.string(),
  linkedGoalIds: z.array(z.string()),
  linkedThemeNames: z.array(z.string()),
  evidenceRefs: z.array(evidenceRefSchema),
  steps: reviewStepsSchema,
  conclusions: z.array(reviewConclusionSchema),
  actionItems: z.array(reviewActionItemSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ReviewCase = z.infer<typeof reviewCaseSchema>;

export const previewPlanSchema = z.object({
  id: z.string(),
  title: z.string(),
  purpose: z.string(),
  goals: z.array(z.string()),
  strategies: z.array(z.string()),
  assumptions: z.array(z.string()),
  risks: z.array(z.string()),
  contingencies: z.array(z.string()),
  linkedGoalIds: z.array(z.string()),
  startDate: z.string(),
  endDate: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type PreviewPlan = z.infer<typeof previewPlanSchema>;

export const principleSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  sourceConclusionId: z.string(),
  sourceReviewCaseId: z.string(),
  evidenceRefs: z.array(evidenceRefSchema),
  applicableContexts: z.array(z.string()),
  boundaries: z.array(z.string()),
  verificationStatus: z.enum(['unverified', 'testing', 'validated', 'invalidated']),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Principle = z.infer<typeof principleSchema>;
```

- [ ] **Step 3: Write failing persistence tests**

Cover:

- Save/load/delete review cases.
- Save/load/delete preview plans.
- Save/load/delete principles.
- Invalid records are ignored.
- Existing goals/reports/insights persistence still passes.

- [ ] **Step 4: Upgrade IndexedDB**

In `src/store/persistence.ts`:

- Bump `DB_VERSION` from 3 to 4.
- Add stores:
  - `reviewCases`
  - `previewPlans`
  - `principles`
- Add load/save/delete functions for each.

- [ ] **Step 5: Run targeted tests**

Run:

```powershell
& 'D:\nodejs\node.exe' 'E:\副业\Project\26.06_Timeline\node_modules\vitest\vitest.mjs' run src/lib/schema.test.ts src/store/persistence.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/lib/schema.ts src/lib/schema.test.ts src/store/persistence.ts src/store/persistence.test.ts src/test/fixtures.ts
git commit -m "feat: add structured review data model"
```

---

### Task 3: Extend Store for Review Cases, Preview Plans, and Principles

**Files:**

- Modify: `src/store/index.ts`
- Modify: `src/store/index.test.ts`

- [ ] **Step 1: Write failing store tests**

Cover:

- `initialize()` loads review cases, preview plans, principles.
- `upsertReviewCase()` creates and updates.
- `deleteReviewCase()` removes one case.
- `upsertPreviewPlan()` creates and updates.
- `upsertPrinciple()` creates and updates.
- `promoteConclusionToPrinciple()` creates a principle from a conclusion.

- [ ] **Step 2: Add store fields**

Add:

```ts
reviewCases: Record<string, ReviewCase>;
previewPlans: Record<string, PreviewPlan>;
principles: Record<string, Principle>;
```

- [ ] **Step 3: Add actions**

Add:

```ts
upsertReviewCase: (reviewCase: ReviewCase) => Promise<void>;
deleteReviewCase: (reviewCaseId: string) => Promise<void>;
upsertPreviewPlan: (previewPlan: PreviewPlan) => Promise<void>;
deletePreviewPlan: (previewPlanId: string) => Promise<void>;
upsertPrinciple: (principle: Principle) => Promise<void>;
deletePrinciple: (principleId: string) => Promise<void>;
promoteConclusionToPrinciple: (reviewCaseId: string, conclusionId: string) => Promise<void>;
```

- [ ] **Step 4: Add selectors**

Add:

```ts
getReviewCasesForPeriod(startDate: string, endDate: string): ReviewCase[];
getPrinciplesByVerificationStatus(status: Principle['verificationStatus']): Principle[];
getPreviewPlansForPeriod(startDate: string, endDate: string): PreviewPlan[];
```

- [ ] **Step 5: Run tests**

Run:

```powershell
& 'D:\nodejs\node.exe' 'E:\副业\Project\26.06_Timeline\node_modules\vitest\vitest.mjs' run src/store/index.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/store/index.ts src/store/index.test.ts
git commit -m "feat: manage review method state"
```

---

### Task 4: Build Evidence-Backed Fact Timeline

**Files:**

- Create: `src/features/reviewCases/reviewCaseUtils.ts`
- Create: `src/features/reviewCases/reviewCaseUtils.test.ts`
- Create: `src/features/reviewCases/FactTimeline.tsx`
- Create: `src/features/reviewCases/FactTimeline.test.tsx`
- Modify: `src/features/evidence/evidence.ts`
- Modify: `src/features/evidence/evidence.test.ts`

- [ ] **Step 1: Write utility tests**

Cover:

- Build evidence refs for a date range.
- Build evidence refs for linked goals.
- Build evidence refs for theme names.
- Sort evidence by date.
- Mark missing facts when no evidence exists.

- [ ] **Step 2: Implement utilities**

Add:

```ts
buildReviewEvidence(input): EvidenceRef[];
groupEvidenceByDate(evidenceRefs): Array<{ date: string; refs: EvidenceRef[] }>;
createEmptyReviewCase(input): ReviewCase;
```

- [ ] **Step 3: Write FactTimeline component tests**

Cover:

- Empty state.
- Date grouped evidence.
- Key fact toggle.
- Missing fact display.

- [ ] **Step 4: Implement FactTimeline**

Render:

- Date.
- Category.
- Bullet text.
- Key fact marker.
- Missing facts.

- [ ] **Step 5: Run tests**

Run:

```powershell
& 'D:\nodejs\node.exe' 'E:\副业\Project\26.06_Timeline\node_modules\vitest\vitest.mjs' run src/features/reviewCases src/features/evidence
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/features/reviewCases src/features/evidence
git commit -m "feat: build review fact timeline"
```

---

### Task 5: Build Structured Review Wizard

**Files:**

- Create: `src/features/reviewCases/ReviewCasesView.tsx`
- Create: `src/features/reviewCases/ReviewCasesView.test.tsx`
- Create: `src/features/reviewCases/ReviewCaseEditor.tsx`
- Create: `src/features/reviewCases/ReviewCaseEditor.test.tsx`
- Create: `src/features/reviewCases/ReviewStepWizard.tsx`
- Create: `src/features/reviewCases/ReviewStepWizard.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write ReviewCasesView tests**

Cover:

- Shows existing review cases.
- Creates daily, weekly, monthly, goal, theme, event, benchmark cases.
- Opens an existing case.
- Filters by status.

- [ ] **Step 2: Implement ReviewCasesView**

Add a new top-level Browse tab or app nav item named `Reviews`.

- [ ] **Step 3: Write ReviewStepWizard tests**

Cover the five steps:

- Process.
- Expectation.
- Evaluation.
- Cause analysis.
- Learning.

Each step should save changes to store.

- [ ] **Step 4: Implement ReviewStepWizard**

Implement step navigation with completion badges:

```text
1. 梳理过程
2. 回顾目标
3. 评估结果
4. 分析原因
5. 总结经验
```

- [ ] **Step 5: Run tests**

Run:

```powershell
& 'D:\nodejs\node.exe' 'E:\副业\Project\26.06_Timeline\node_modules\vitest\vitest.mjs' run src/features/reviewCases src/App.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/features/reviewCases src/App.tsx src/styles.css
git commit -m "feat: add structured review wizard"
```

---

### Task 6: Add Expectation-Result-Deviation Matrix

**Files:**

- Create: `src/features/reviewCases/DeviationMatrix.tsx`
- Create: `src/features/reviewCases/DeviationMatrix.test.tsx`
- Modify: `src/features/reviewCases/reviewCaseUtils.ts`
- Modify: `src/features/reviewCases/reviewCaseUtils.test.ts`

- [ ] **Step 1: Write matrix utility tests**

Cover:

- Create purpose row.
- Create goal rows.
- Create measure rows.
- Detect unclear expectations.
- Preserve evidence refs per row.

- [ ] **Step 2: Implement matrix helpers**

Add:

```ts
createDeviationRow(input): DeviationRow;
evaluateDeviationStatus(expectation: string, result: string): DeviationStatus;
```

- [ ] **Step 3: Write component tests**

Cover:

- Add row.
- Edit expectation/result/deviation.
- Change status.
- Remove row.

- [ ] **Step 4: Implement DeviationMatrix**

Use compact table layout with columns:

```text
Layer | Expectation | Result | Deviation | Status | Evidence
```

- [ ] **Step 5: Run tests**

Run:

```powershell
& 'D:\nodejs\node.exe' 'E:\副业\Project\26.06_Timeline\node_modules\vitest\vitest.mjs' run src/features/reviewCases
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/features/reviewCases
git commit -m "feat: add deviation matrix"
```

---

### Task 7: Add Conclusion Quality Checker

**Files:**

- Create: `src/features/conclusions/conclusionQuality.ts`
- Create: `src/features/conclusions/conclusionQuality.test.ts`
- Create: `src/features/conclusions/ConclusionQualityPanel.tsx`
- Create: `src/features/conclusions/ConclusionQualityPanel.test.tsx`
- Modify: `src/features/reviewCases/ReviewStepWizard.tsx`

- [ ] **Step 1: Write quality utility tests**

Cover the four rules from Chen Zhong:

- Accidental-factor risk.
- Points-to-person risk.
- Why-depth below 3.
- No cross validation.

- [ ] **Step 2: Implement deterministic checker**

Add:

```ts
assessConclusionQuality(input): ConclusionQuality;
detectAccidentalFactorRisk(content: string): RiskLevel;
detectPointsToPersonRisk(content: string): RiskLevel;
countWhyDepth(whyChains: WhyChain[]): number;
```

- [ ] **Step 3: Write component tests**

Cover:

- Shows score.
- Shows verdict.
- Shows rule-level warnings.
- Recommends next action.

- [ ] **Step 4: Implement ConclusionQualityPanel**

Render:

- Score.
- Verdict.
- Four rule checks.
- Suggested fix.

- [ ] **Step 5: Integrate into learning step**

When user adds a conclusion, immediately show quality panel.

- [ ] **Step 6: Run tests**

Run:

```powershell
& 'D:\nodejs\node.exe' 'E:\副业\Project\26.06_Timeline\node_modules\vitest\vitest.mjs' run src/features/conclusions src/features/reviewCases
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add src/features/conclusions src/features/reviewCases
git commit -m "feat: check review conclusion quality"
```

---

### Task 8: Add AI Questioner and Facilitator

**Files:**

- Create: `src/features/coach/questionerPrompts.ts`
- Create: `src/features/coach/questionerPrompts.test.ts`
- Create: `src/features/coach/facilitatorPrompts.ts`
- Create: `src/features/coach/facilitatorPrompts.test.ts`
- Modify: `src/lib/prompts.ts`
- Modify: `src/lib/prompts.test.ts`
- Modify: `src/services/llm/types.ts`
- Modify: `src/services/llm/openaiCompatible.ts`
- Modify: `src/services/llm/openaiCompatible.test.ts`
- Modify: `src/features/coach/ReviewCoachPanel.tsx`
- Modify: `src/features/reviewCases/ReviewStepWizard.tsx`

- [ ] **Step 1: Write prompt tests**

Questioner prompt must include:

- Evidence facts.
- Purpose/goal/measure context.
- Deviation rows.
- Existing why chains.
- Requirement to ask questions only.

Facilitator prompt must include:

- Current step.
- Step completion criteria.
- Missing fact warnings.
- Instruction to prevent premature cause analysis.

- [ ] **Step 2: Extend LLMProvider**

Add:

```ts
generateReviewQuestions(input: ReviewQuestionInput): Promise<string[]>;
generateFacilitatorAdvice(input: ReviewFacilitatorInput): Promise<FacilitatorAdvice>;
generateConclusionQualityAdvice(input: ConclusionQualityInput): Promise<ConclusionQuality>;
generateReport(input: ReportGenerationInput): Promise<GeneratedReport>;
```

- [ ] **Step 3: Implement OpenAI-compatible methods**

Each method should:

- Build prompt.
- Call chat completions.
- Strip `<think>` artifacts.
- Parse strict JSON when structured output is expected.
- Throw `SchemaError` for malformed structured responses.

- [ ] **Step 4: Upgrade ReviewCoachPanel**

Support:

- Daily entry questions.
- Weekly review questions.
- ReviewCase questions.
- Dismiss/copy behavior remains.

- [ ] **Step 5: Add facilitator panel to wizard**

Show:

- “Can proceed” or “Needs more work”.
- Missing facts.
- Recommended next prompt.

- [ ] **Step 6: Run tests**

Run:

```powershell
& 'D:\nodejs\node.exe' 'E:\副业\Project\26.06_Timeline\node_modules\vitest\vitest.mjs' run src/features/coach src/services/llm src/lib/prompts.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add src/features/coach src/services/llm src/lib/prompts.ts src/lib/prompts.test.ts src/features/reviewCases
git commit -m "feat: add ai facilitator and questioner"
```

---

### Task 9: Add PDF-Loop Preview Plans

**Files:**

- Create: `src/features/preview/previewUtils.ts`
- Create: `src/features/preview/previewUtils.test.ts`
- Create: `src/features/preview/PreviewPlansView.tsx`
- Create: `src/features/preview/PreviewPlansView.test.tsx`
- Create: `src/features/preview/PreviewPlanEditor.tsx`
- Create: `src/features/preview/PreviewPlanEditor.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/features/reviewCases/reviewCaseUtils.ts`
- Modify: `src/styles.css`

- [ ] **Step 1: Write preview utility tests**

Cover:

- Create empty preview plan.
- Link preview plan to goals.
- Convert preview plan into review expectation.
- Compare plan assumptions with actual evidence.

- [ ] **Step 2: Implement preview utilities**

Add:

```ts
createEmptyPreviewPlan(input): PreviewPlan;
buildExpectationFromPreviewPlan(plan): ReviewSteps['expectation'];
comparePreviewWithReview(plan, reviewCase): DeviationRow[];
```

- [ ] **Step 3: Write UI tests**

Cover:

- Create preview plan.
- Edit purpose, goals, strategies, assumptions, risks, contingencies.
- Start review from preview plan.

- [ ] **Step 4: Implement PreviewPlansView and Editor**

Add a `Preview` entry near Goals or Reviews.

- [ ] **Step 5: Run tests**

Run:

```powershell
& 'D:\nodejs\node.exe' 'E:\副业\Project\26.06_Timeline\node_modules\vitest\vitest.mjs' run src/features/preview src/App.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/features/preview src/App.tsx src/features/reviewCases src/styles.css
git commit -m "feat: add preview do fupan loop"
```

---

### Task 10: Add Principle Library

**Files:**

- Create: `src/features/principles/principleUtils.ts`
- Create: `src/features/principles/principleUtils.test.ts`
- Create: `src/features/principles/PrinciplesView.tsx`
- Create: `src/features/principles/PrinciplesView.test.tsx`
- Create: `src/features/principles/PrincipleCard.tsx`
- Modify: `src/App.tsx`
- Modify: `src/features/reviewCases/ReviewStepWizard.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write principle utility tests**

Cover:

- Promote ready conclusion to principle.
- Reject low-quality conclusion unless user confirms.
- Filter by verification status.
- Update applicable contexts and boundaries.

- [ ] **Step 2: Implement utilities**

Add:

```ts
createPrincipleFromConclusion(reviewCase, conclusion): Principle;
canPromoteConclusion(conclusion): boolean;
filterPrinciples(principles, filters): Principle[];
```

- [ ] **Step 3: Write PrinciplesView tests**

Cover:

- Renders principles.
- Filters by status.
- Shows evidence.
- Updates verification status.

- [ ] **Step 4: Implement PrinciplesView**

Add `Knowledge` or `Principles` navigation entry.

- [ ] **Step 5: Add promote action in ReviewStepWizard**

Show “Save as Principle” only when conclusion quality verdict is `ready`, or allow manual override with warning.

- [ ] **Step 6: Run tests**

Run:

```powershell
& 'D:\nodejs\node.exe' 'E:\副业\Project\26.06_Timeline\node_modules\vitest\vitest.mjs' run src/features/principles src/features/reviewCases src/App.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add src/features/principles src/features/reviewCases src/App.tsx src/styles.css
git commit -m "feat: add review principle library"
```

---

### Task 11: Upgrade Reports and Insights to Use Review Cases

**Files:**

- Modify: `src/features/reports/templates.ts`
- Modify: `src/features/reports/templates.test.ts`
- Modify: `src/features/reports/reportBuilder.ts`
- Modify: `src/features/reports/reportBuilder.test.ts`
- Modify: `src/features/reports/ReportsView.tsx`
- Modify: `src/features/insights/insightUtils.ts`
- Modify: `src/features/insights/insightUtils.test.ts`
- Modify: `src/features/insights/InsightsView.tsx`

- [ ] **Step 1: Write report template tests**

Add templates:

- Structured weekly review.
- Five-step monthly review.
- Goal deviation review.
- Principle library digest.
- Preview-vs-result review.

- [ ] **Step 2: Update report builder**

Report context should include:

- Entries.
- Goals.
- Insights.
- Review cases.
- Conclusions.
- Principles.
- Preview plans.

- [ ] **Step 3: Implement AI report generation**

Replace `ReportsView` TODO. The AI button should call `provider.generateReport()` and save the generated report.

- [ ] **Step 4: Upgrade insights**

Add insights:

- Conclusions needing evidence.
- Repeated weak why-depth.
- Goals with no review cases.
- Preview plans without final review.
- Principles not validated after later action.

- [ ] **Step 5: Run tests**

Run:

```powershell
& 'D:\nodejs\node.exe' 'E:\副业\Project\26.06_Timeline\node_modules\vitest\vitest.mjs' run src/features/reports src/features/insights
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/features/reports src/features/insights
git commit -m "feat: upgrade reports and insights with review cases"
```

---

### Task 12: Export Plus Artifacts as Markdown

**Files:**

- Modify: `src/services/export/markdown.ts`
- Modify: `src/services/export/markdown.test.ts`
- Modify: `src/components/dialogs/ExportDialog.tsx`
- Modify: `src/components/dialogs/ExportDialog.test.tsx`

- [ ] **Step 1: Write failing export tests**

Cover:

- Review case Markdown.
- Preview plan Markdown.
- Principle Markdown.
- Conclusion quality Markdown.
- Existing export behavior unchanged by default.

- [ ] **Step 2: Add serializers**

Add:

```ts
reviewCaseToMarkdown(reviewCase): string;
previewPlanToMarkdown(previewPlan): string;
principleToMarkdown(principle): string;
```

- [ ] **Step 3: Extend ExportDialog**

Add checkboxes:

- Include review cases.
- Include preview plans.
- Include principles.

Keep export as Markdown zip only.

- [ ] **Step 4: Run tests**

Run:

```powershell
& 'D:\nodejs\node.exe' 'E:\副业\Project\26.06_Timeline\node_modules\vitest\vitest.mjs' run src/services/export/markdown.test.ts src/components/dialogs/ExportDialog.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/services/export src/components/dialogs/ExportDialog.tsx src/components/dialogs/ExportDialog.test.tsx
git commit -m "feat: export plus review artifacts"
```

---

### Task 13: Polish Navigation, Copy, and Documentation

**Files:**

- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Modify: `README.md`
- Modify: `e2e/smoke.spec.ts`

- [ ] **Step 1: Decide final navigation labels**

Recommended:

```text
Check-in
Timeline
Goals
Preview
Reviews
Reports
Insights
Knowledge
```

- [ ] **Step 2: Update E2E smoke test**

Cover:

- Create preview plan.
- Add daily bullet.
- Create review case from date range.
- Add deviation row.
- Add conclusion.
- Check conclusion quality.
- Save principle.
- Generate local report.
- Reload and verify persistence.

- [ ] **Step 3: Update README**

Document:

- Plus method layer.
- Five-step review.
- PDF loop meaning.
- Conclusion quality checker.
- Principle library.
- Local-only limits.
- Excluded cloud/subscription/PDF/Word/PPT/customer-project management.

- [ ] **Step 4: Run full unit suite**

Run:

```powershell
& 'D:\nodejs\node.exe' 'E:\副业\Project\26.06_Timeline\node_modules\vitest\vitest.mjs' run
```

Expected: PASS.

- [ ] **Step 5: Run typecheck and build**

Run:

```powershell
& 'D:\nodejs\node.exe' 'E:\副业\Project\26.06_Timeline\node_modules\typescript\bin\tsc' -b
& 'D:\nodejs\node.exe' 'E:\副业\Project\26.06_Timeline\node_modules\vite\bin\vite.js' build
```

Expected: PASS. Vite chunk-size warnings are acceptable.

- [ ] **Step 6: Run E2E**

Run:

```powershell
npm run e2e
```

Expected: PASS, or document Playwright/browser environment blocker.

- [ ] **Step 7: Commit**

```powershell
git add src/App.tsx src/styles.css README.md e2e/smoke.spec.ts
git commit -m "docs: document plus review workflow"
```

---

## Final Acceptance Criteria

- Current partial Plus features remain working.
- User can create a structured review case.
- User can complete five-step review flow.
- Review cases use evidence-backed fact timelines.
- User can create and compare PreviewPlan with final review.
- User can build expectation-result-deviation matrix.
- AI can act as questioner and facilitator.
- Conclusion quality checker applies the four Chen Zhong rules.
- High-quality conclusions can become reusable principles.
- Reports and insights can use review cases and principles.
- Markdown export includes review cases, preview plans, and principles.
- All new data persists in IndexedDB after reload.
- TypeScript check passes.
- Vitest suite passes.
- Vite build passes.
- No cloud account, sync, subscription, PDF/Word/PPT export, or customer/project management features are introduced.
