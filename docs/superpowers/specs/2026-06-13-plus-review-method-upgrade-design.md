# Plus Review Method Upgrade 计划文档

**日期：** 2026-06-13
**状态：** Draft
**项目：** Daily Check-in Timeline

## 1. 背景

当前代码已经开始实现一批 Pro/Plus 能力：目标、报告、洞察、证据引用、主题分类、AI 复盘追问等模块已经存在，并且 `tsc -b` 与 Vitest 全量测试可以通过。也就是说，软件已经从“每日记录工具”走到了“本地复盘工作台”的半成品阶段。

但从《复盘》（沈磊）和《复盘：对过去的事情做思维演练》（陈中）的角度看，当前 Plus 还缺少真正能支撑高客单价的核心：它还没有把复盘变成一套严谨的方法流程。现有功能更像是“记录 + 总结 + 一些统计”，而两本书强调的是“还原事实、校验目标、比较偏差、追问原因、沉淀规律、再进入行动”的完整学习闭环。

本计划文档用于定义 Plus 版本的新升级方向：把软件从“复盘记录工具”升级为“结构化复盘与思维演练系统”。

## 2. 当前代码实现盘点

### 2.1 已实现或基本实现

1. Plus 导航入口：`Goals`、`Reports`、`Insights` 已经出现在 Browse 页签。
2. 数据模型：`Goal`、`GeneratedReport`、`EvidenceRef`、`Insight` 已在 `src/lib/schema.ts` 中定义。
3. IndexedDB：数据库版本已升级到 3，并新增 `goals`、`reports`、`insights` 三个 store。
4. Zustand 状态：已加载并保存 goals、reports、insights。
5. 目标页面：已有目标创建、编辑、状态、周期、进度展示的基础 UI。
6. 报告页面：已有模板选择、日期范围、本地报告草稿、报告预览和历史记录。
7. 洞察页面：已有本地趋势洞察生成、严重程度筛选、洞察卡片。
8. 证据引用：已有从 bullet 引用构造 `EvidenceRef` 的工具。
9. 主题分类：已有 AI 分类调用、bullet 映射、主题列表与重命名入口。
10. AI 复盘教练：每日复盘编辑器已经接入问题生成面板。
11. 验证情况：直接运行本地 TypeScript 编译通过；直接运行 Vitest 通过 19 个测试文件、116 个测试。

### 2.2 部分实现但不足以作为 Plus 卖点

1. `Generate with AI` 报告按钮目前只是调用本地报告草稿，`src/features/reports/ReportsView.tsx` 中仍有 TODO。
2. `LLMProvider` 只包含每日总结、每日问题、周总结、主题分类，没有报告生成、周复盘教练、结论质检等 Plus API。
3. 目标与 bullet 的关联已有 store action，但缺少完整 UI；用户还不能自然地在每日记录中把事项挂到目标上。
4. AI 目标关联建议尚未实现。
5. 主题分类已能触发，但主题管理只做了重命名雏形，没有可靠的合并、移除 bullet、查看依据。
6. 报告模板仍偏普通周报/月报，没有体现两本书里的复盘步骤、结论校验、案例佐证、行动闭环。
7. 洞察多数没有 evidenceRefs，用户很难追溯“为什么得出这个洞察”。
8. 周复盘教练没有真正使用周复盘专属 prompt，而是临时拿周内第一天 entry 生成问题。
9. Markdown 导出尚未覆盖 goals、reports、insights、复盘结论库等 Plus 资产。

### 2.3 尚未实现的关键 Plus 能力

1. 沈磊“五步法”复盘向导：梳理过程、回顾目标、评估结果、分析原因、总结经验。
2. 陈中“思维演练”能力：目标-结果、情景再现、得失分析、规律总结。
3. PDF 环：Preview、Do、FuPan，也就是事前沙盘、执行记录、事后复盘。
4. 复盘结论质量检查：是否落在偶发因素、是否指向人而非事、是否经过至少 3 次 why/why not、是否交叉验证。
5. 复盘角色系统：引导人、设问人、叙述人。当前 AI 只会“提问”，还没有承担流程引导和结论质检。
6. 复盘归档与知识化：当前保存报告，但没有把结论、规律、边界条件、行动计划沉淀为可复用资产。

### 2.4 当前未实现或半实现的原 Pro 功能补齐清单

以下内容来自原 `$99 Pro Upgrade` 设计方向。它们不属于两本书新增的方法论能力，但属于当前 Plus 版本在商业化体验上必须补齐的基础能力。

| 功能 | 当前状态 | 需要补齐 |
| --- | --- | --- |
| 目标系统 | 已有目标 CRUD、状态、周期、进度显示 | 缺少在每日 bullet 上关联目标的入口；缺少 AI 自动建议 bullet 关联目标；缺少目标风险、下一步行动、进度摘要生成 |
| 目标与每日记录联动 | Store 中已有 `linkBulletToGoal` / `unlinkBulletFromGoal` | UI 没有完整暴露；用户无法在日常录入或时间线中自然完成关联 |
| 项目/主题自动归类 | 已有 AI 分类按钮和 `classifyProjects` 调用 | 缺少稳定的 store 级 `classifyProjectsForMonth` action；主题重命名逻辑不可靠；缺少合并主题、移除错误 bullet、查看主题证据 |
| Gantt/Stats 主题展示 | Gantt 和 Stats 已接入 `ThemeManagementPanel` | 缺少分类后结果质量校验；缺少主题活跃天数、停滞主题、主题贡献统计 |
| 专业报告生成 | 已有模板、本地报告草稿、报告预览、报告历史 | `Generate with AI` 仍是 TODO，实际回退到本地草稿；LLMProvider 没有 `generateReport`；报告缺少高质量证据引用和结构化 JSON 解析 |
| 报告模板库 | 已有 boss weekly、partner monthly、personal deep、goal review、theme progress | 模板仍偏普通报告，没有纳入复盘五步法、偏差矩阵、结论质检、行动闭环等 Plus 方法论 |
| AI 深度复盘助手 | 每日 ReviewEditor 已接入 AI Review Coach | 周复盘没有真正使用周复盘 prompt；没有目标偏差追问、主题停滞追问、连续 why/why not 追问链 |
| 长期趋势分析 | 已有 activity distribution、review quality、goal drift、stalled theme、tag frequency | 大部分洞察缺 evidenceRefs；缺少重复问题的语义归纳；缺少成功模式提炼；缺少与目标、主题、报告、复盘案例的联动 |
| 时间线证据链 | 已有 `EvidenceRef` 和 `EvidenceList` | 证据链没有贯穿报告、洞察、目标、主题和复盘结论；缺少“查看依据”的统一交互 |
| Markdown 导出 | 现有导出仍主要面向 entries 和已有 Markdown zip | 未覆盖 goals、generated reports、insights、主题分类、后续 ReviewCase、PreviewPlan、Principle |
| 月复盘/周复盘表面增强 | 已有 WeeklyReviewView、MonthlyReviewReport | 缺少从周/月复盘一键生成报告；缺少展示关联目标、Top insights、主题进展、复盘案例入口 |
| AI 错误与加载体验 | 部分按钮有 loading 和错误 | 缺少统一错误提示、重试、失败后保留当前输入、AI 不可用时的本地 fallback 说明 |
| E2E 验证 | 当前单元测试通过 | 缺少覆盖目标创建、主题分类、报告生成、洞察生成、刷新持久化的完整 smoke 测试 |

这些补齐项应作为 Plus 升级的“地基任务”。如果直接开发两本书提炼出的复盘方法论，而不先补齐这些半成品，用户会感到产品概念很强，但关键路径不顺。

### 2.5 Pro 补齐与 Plus 方法论的关系

建议把原 Pro 半成品补齐分成两类处理：

1. **必须先修的地基能力**
   - AI 报告生成真正接通。
   - 目标与 bullet 的 UI 关联。
   - 主题分类的重命名、合并、移除、证据查看。
   - evidence refs 贯穿报告和洞察。
   - Markdown 导出覆盖 Plus 资产。

2. **可并入方法论升级一起做的能力**
   - 周/月复盘增强可以并入 ReviewCase。
   - AI 深度追问可以并入 AI 设问人。
   - 目标偏差洞察可以并入偏差矩阵。
   - 成功模式、重复问题可以并入结论库和原则库。
   - 报告模板升级可以直接基于五步复盘和结论质检重做。

最终 Plus 应当把这些能力整合成一条路径：

```text
Preview 事前推演
  -> Check-in 执行记录
  -> Goals / Themes 自动关联
  -> ReviewCase 结构化复盘
  -> Conclusion Quality 结论质检
  -> Principle 规律沉淀
  -> Reports / Insights 输出和反馈
```

## 3. Plus 升级定位

Plus 不再只是“帮我写总结”，而是回答这些问题：

1. 这件事真实发生了什么？
2. 当初的目的、目标、举措是什么？
3. 结果和预期差在哪里？
4. 这个差距来自执行问题、目标问题、策略问题，还是外部条件变化？
5. 我是否过早下结论？
6. 这个结论能不能被其他案例验证？
7. 下次遇到同类事情，我应该继续做什么、停止做什么、开始做什么？

## 4. 方法论提炼

### 4.1 来自《复盘》（沈磊）

1. 复盘的本质是“预期-结果”的比较。
2. 好复盘依赖“五反”：反馈、反思、反本、反应、反复。
3. 复盘五步法：
   - 梳理过程：以事实为基础，按时间线还原过程。
   - 回顾目标：还原目的、目标、举措的一致性。
   - 评估结果：比较结果与目标，找到正向或负向偏差。
   - 分析原因：聚焦解决而不是停留在问题本身。
   - 总结经验：形成新洞察，并转成行动计划。
4. 复盘五原则：
   - 实事求是。
   - 开放心态。
   - 反思自我。
   - 坦诚表达。
   - 集思广益。
5. 评估结果不能只看目标达成，还要向上评估目的，向下评估举措。
6. 分析原因既要看问题，也要看亮点；成功也值得复盘。

### 4.2 来自《复盘：对过去的事情做思维演练》（陈中）

1. 复盘区别于总结的关键是“推演”，不是静态罗列经验。
2. 基础四步：目标-结果、情景再现、得失分析、规律总结。
3. 复盘三种类型：
   - 自我复盘。
   - 团队复盘。
   - 复盘他人或标杆。
4. 复盘三种角色：
   - 引导人：保证流程不跑偏。
   - 设问人：通过问题推动思考。
   - 叙述人：还原过程和当时的思考。
5. 两种方法：
   - 情境重现法。
   - 关键点法。
6. 结论质量四条标准：
   - 结论是否落在偶发因素上。
   - 结论是指向人，还是指向事和机制。
   - 是否经过至少 3 次连续 why 或 why not。
   - 是否经过交叉验证。
7. PDF 环：Preview、Do、FuPan。事前沙盘、事中执行、事后复盘构成完整做事闭环。
8. 复盘必须归档，否则规律停留在脑中，很快会散掉。

## 5. Plus 功能范围

### 5.1 结构化复盘向导

新增 `ReviewCase` 概念，用于承载一次完整复盘。它可以来自一天、一周、一个月、一个目标、一个主题，或用户手动创建的关键事件。

每个复盘案例包含五个步骤：

1. 梳理过程：自动拉取相关日期、bullet、目标、主题、周复盘、月度数据，形成事实时间线。
2. 回顾目标：填写或选择目的、目标、举措；允许从目标系统中引用。
3. 评估结果：生成“预期-结果-偏差”矩阵。
4. 分析原因：提供 why/why not 追问、可控/不可控分类、主观/客观分类、问题/亮点双视角。
5. 总结经验：产出洞察、边界条件、行动计划、Start/Stop/Continue 清单。

### 5.2 PDF 环：事前沙盘、执行、事后复盘

新增 `Preview` 或“事前推演”模块。用户在开始重要事项前，可以创建一个沙盘：

1. 目的：为什么做。
2. 目标：做到什么算成功。
3. 举措：准备用什么打法。
4. 假设：我相信什么因果关系。
5. 风险：可能在哪里偏离。
6. 预案：如果偏离怎么处理。

执行阶段继续沿用当前每日 check-in。复盘阶段把事前沙盘、执行记录、最终结果放在同一个页面比较。

### 5.3 事实证据时间线

升级当前 evidence refs，形成“事实包”：

1. 自动收集指定范围内所有 bullet。
2. 标注日期、类别、目标、主题、是否正向结果、是否负向偏差。
3. 支持用户手动把某条 bullet 标为关键节点。
4. 在报告、洞察、结论后显示“查看依据”。

### 5.4 预期-结果-偏差矩阵

新增矩阵组件，用于把目的、目标、举措三个层次和结果对齐：

1. 目的层：最初为什么做，最终是否仍然服务这个目的。
2. 目标层：数字、交付、状态是否达成。
3. 举措层：原定做法是否执行，执行效果如何。

每一行都可以标记为：

1. 达成。
2. 未达成。
3. 超预期。
4. 目标不清。
5. 无法评估。

### 5.5 AI 设问人

把当前 AI 问题生成升级为“设问人”：

1. 针对事实缺口提问。
2. 针对目的不清提问。
3. 针对目标与结果偏差提问。
4. 连续生成 why/why not 链。
5. 对“我觉得”“可能是”“没办法”等弱结论继续追问。

AI 只提出问题，不直接覆盖用户结论。

### 5.6 AI 引导人

AI 引导人的职责不是回答，而是控制复盘流程：

1. 当前步骤是否完成。
2. 是否过早跳到原因分析。
3. 是否缺事实。
4. 是否把手段当目标。
5. 是否只有观点没有证据。
6. 是否可以进入下一步。

### 5.7 结论质量检查器

对每条复盘结论生成质量评分：

1. 偶发性检查：结论是否只归因于运气、天气、某个人状态等不可复用因素。
2. 指向性检查：结论是否只指向某个人，而没有沉淀到流程、机制、策略、能力、资源配置。
3. 追问深度：是否至少有 3 层 why/why not。
4. 交叉验证：是否能用其他日期、其他目标、其他主题或历史案例验证。
5. 边界条件：这个结论适用于什么情况，不适用于什么情况。

输出分为：

1. 可沉淀。
2. 需要补证据。
3. 需要继续追问。
4. 仅作当次观察。

### 5.8 复盘结论库

新增本地知识库，保存通过质检的结论：

1. 标题。
2. 结论正文。
3. 来源复盘案例。
4. 证据引用。
5. 适用场景。
6. 边界条件。
7. 后续行动。
8. 验证状态：未验证、验证中、已验证、已失效。

这会把复盘从“写完就结束”升级为“形成个人工作原则”。

### 5.9 行动计划与验证闭环

复盘输出必须落到行动：

1. Start Doing。
2. Stop Doing。
3. Continue Doing。
4. 责任对象：个人本地场景中默认为自己。
5. 截止日期。
6. 关联目标。
7. 下次复盘自动提醒检查。

### 5.10 标杆复盘

在不做客户/项目管理、不做云协作的前提下，可以支持个人“复盘他人/标杆”：

1. 用户手动录入一个外部案例。
2. 标注观察到的关键行为。
3. 用关键点法推演成功/失败因素。
4. 生成“我可以借鉴什么，不应该盲目照搬什么”。

## 6. 信息架构调整

建议 Plus 导航调整为：

1. Check-in：每日输入与执行记录。
2. Timeline：浏览事实记录。
3. Goals：目标系统。
4. Reviews：结构化复盘案例。
5. Reports：报告中心。
6. Insights：趋势洞察。
7. Knowledge：复盘结论库。

其中 Reviews 是 Plus 核心入口，不应再藏在 Browse 里的普通 review 面板中。

## 7. 数据模型草案

### 7.1 ReviewCase

```ts
type ReviewCaseType = 'daily' | 'weekly' | 'monthly' | 'goal' | 'theme' | 'event' | 'benchmark';
type ReviewCaseStatus = 'draft' | 'in-review' | 'completed' | 'archived';

interface ReviewCase {
  id: string;
  type: ReviewCaseType;
  title: string;
  status: ReviewCaseStatus;
  startDate: string;
  endDate: string;
  linkedGoalIds: string[];
  linkedThemeNames: string[];
  evidenceRefs: EvidenceRef[];
  steps: ReviewSteps;
  conclusions: ReviewConclusion[];
  actionItems: ReviewActionItem[];
  createdAt: string;
  updatedAt: string;
}
```

### 7.2 ReviewSteps

```ts
interface ReviewSteps {
  process: {
    timelineNotes: string;
    keyFacts: EvidenceRef[];
    missingFacts: string[];
  };
  expectation: {
    purpose: string;
    goals: string[];
    measures: string[];
    assumptions: string[];
  };
  evaluation: {
    rows: DeviationRow[];
  };
  causeAnalysis: {
    whys: WhyChain[];
    controllability: CauseItem[];
    brightSpots: CauseItem[];
  };
  learning: {
    insights: string[];
    rules: string[];
    boundaries: string[];
  };
}
```

### 7.3 ReviewConclusion

```ts
interface ReviewConclusion {
  id: string;
  title: string;
  content: string;
  evidenceRefs: EvidenceRef[];
  quality: ConclusionQuality;
  boundary: string;
  reusableAsPrinciple: boolean;
  createdAt: string;
}

interface ConclusionQuality {
  score: number;
  accidentalFactorRisk: 'low' | 'medium' | 'high';
  pointsToPersonRisk: 'low' | 'medium' | 'high';
  whyDepth: number;
  hasCrossValidation: boolean;
  verdict: 'ready' | 'needs-evidence' | 'needs-deeper-why' | 'observation-only';
}
```

### 7.4 PreviewPlan

```ts
interface PreviewPlan {
  id: string;
  title: string;
  purpose: string;
  goals: string[];
  strategies: string[];
  assumptions: string[];
  risks: string[];
  contingencies: string[];
  linkedGoalIds: string[];
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}
```

### 7.5 Principle

```ts
interface Principle {
  id: string;
  title: string;
  content: string;
  sourceConclusionId: string;
  sourceReviewCaseId: string;
  evidenceRefs: EvidenceRef[];
  applicableContexts: string[];
  boundaries: string[];
  verificationStatus: 'unverified' | 'testing' | 'validated' | 'invalidated';
  createdAt: string;
  updatedAt: string;
}
```

## 8. AI 设计原则

1. AI 不替用户下最终结论，而是承担引导人、设问人、质检员三个角色。
2. 每条 AI 洞察必须尽量绑定 evidence refs。
3. AI 生成结论时必须同时给出不确定性和需要补充的事实。
4. AI 追问要优先使用事实、目标、偏差，而不是泛泛问“你有什么感受”。
5. AI 质检必须标出结论风险：偶发、指人、追问不足、未验证。
6. AI 报告应基于 ReviewCase 和 Principle，而不只是直接汇总 bullet。

## 9. 验收标准

1. 用户可以创建一次结构化复盘案例。
2. 复盘案例能从日期范围、目标、主题中自动拉取证据。
3. 用户可以完成五步复盘流程。
4. 系统能生成预期-结果-偏差矩阵。
5. AI 能生成 why/why not 追问链。
6. 系统能对复盘结论做质量检查。
7. 用户可以把高质量结论沉淀为 Principle。
8. 用户可以创建事前沙盘，并在事后与执行记录对比。
9. Reports 可以使用复盘案例和结论库生成更专业的报告。
10. 所有新增数据都保存在 IndexedDB，刷新后仍存在。
11. 现有 goals、reports、insights 功能继续可用。
12. `tsc -b`、Vitest、build 均通过。

## 10. 不做范围

本 Plus 阶段仍不做：

1. 云端账号、同步、订阅、支付。
2. PDF / Word / PPT 导出。
3. 客户/项目商业管理系统。
4. 多人在线协作和团队权限。
5. 在线模板市场。

## 11. 推荐实施顺序

1. 先修整当前 Plus 半成品，确保命名、文案、测试、导出逻辑稳定。
2. 新增 ReviewCase 数据模型和持久化。
3. 新增结构化复盘向导。
4. 新增预期-结果-偏差矩阵。
5. 新增 AI 设问人和引导人。
6. 新增结论质量检查器。
7. 新增事前沙盘 PreviewPlan。
8. 新增复盘结论库 Principle。
9. 升级 Reports 和 Insights，让它们消费 ReviewCase / Principle。
10. 补齐导出、测试、README。
