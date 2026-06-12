# $99 Pro Upgrade 功能计划文档

**日期：** 2026-06-13
**状态：** Draft
**项目：** Daily Check-in Timeline

## 1. 背景

当前应用已经具备每日记录、每日复盘、周复盘、月度统计、AI 总结、Markdown/PNG 导出和本地 IndexedDB 持久化能力。它适合作为个人本地复盘工具，但如果希望支撑每月 99 美元的付费价值，需要从“记录工具”升级为“复盘产出与工作洞察系统”。

本计划只覆盖用户指定要做的增强功能，不包含以下三类：

1. 云端账号 + 同步 + 订阅。
2. PDF / Word / PPT 导出。
3. 客户/项目维度的商业管理系统。

其中“项目自动归类”仍保留，但它只用于把日志 bullet 归为工作主题并生成时间线，不引入客户台账、项目主数据、合同、计费或交付管理。

## 2. 目标

把当前工具升级为一个本地优先的 Pro 版复盘系统，使用户能够：

1. 设定月目标、周目标和每日目标，并把每日记录自动关联到目标。
2. 自动归类工作主题，形成可浏览、可追溯的主题时间线。
3. 生成专业的周报、月报、复盘报告和投资人/老板汇报草稿。
4. 通过 AI 追问发现问题根因，而不是只得到一段总结。
5. 看到长期趋势，例如重复拖延点、精力投入偏差、目标偏离、停滞主题。
6. 在每一条 AI 结论后追溯到原始日志证据。
7. 使用内置报告模板库快速切换报告口径。

## 3. 不做范围

本阶段明确不做：

1. 账号、登录、注册、权限、云同步、跨设备实时同步。
2. Stripe、Paddle、Lemon Squeezy 等订阅支付能力。
3. PDF、Word、PPT 文件导出。
4. 客户、合同、计费、发票、交付物、CRM 或客户项目台账。
5. 多人协作、团队成员管理、团队权限、团队日报聚合。
6. 模板市场或在线模板分发。

如果将来要进入商业化 SaaS 阶段，这些能力应作为独立项目重新设计。

## 4. 用户价值

### 4.1 当前价值

当前应用回答的问题是：“我今天做了什么？”

### 4.2 Pro 版价值

Pro 版应回答：

1. 我本月真正推进了哪些目标？
2. 哪些事情占用了大量时间但没有带来结果？
3. 哪些主题连续停滞？
4. 我反复掉进哪些坑？
5. 下周最重要的调整是什么？
6. 我能否一键生成可以发给老板、合伙人或自己复盘使用的报告？
7. AI 的判断依据来自哪些原始记录？

## 5. 功能范围

### 5.1 目标系统

新增目标层级：

1. 月目标：描述本月最重要的 1-5 个目标。
2. 周目标：描述本周重点和预计推进事项。
3. 每日目标：沿用现有每日复盘里的 target 字段，但增强为可聚合数据。

每个目标应包含：

1. 标题。
2. 周期类型：month 或 week。
3. 周期起止日期。
4. 状态：active、done、paused、dropped。
5. 关联 bullet 列表。
6. AI 生成的进展摘要。
7. 用户备注。

目标关联方式分两种：

1. 用户手动选择 bullet 关联目标。
2. AI 根据 bullet 内容自动建议关联目标，用户确认后保存。

目标系统的第一版不做复杂 OKR，不做 Key Result 数值追踪，只做轻量目标闭环。

### 5.2 项目/主题自动归类接通

当前代码中已经有 AI 项目分类 prompt 和 store action，但 Gantt/Stats 里的 “Classify Projects” 按钮尚未接入实际行为。本阶段要完成：

1. 选择月份后，收集当月所有 bullet。
2. 调用 OpenAI-compatible provider 的 classifyProjects。
3. 将返回的主题分类写回 entry.ai.projects。
4. Gantt 视图展示主题推进时间线。
5. Stats 视图展示主题数量、活跃天数、停滞主题。
6. 允许用户手动重命名主题、合并主题、移除错误 bullet。

这里的“项目”更准确地称为“工作主题”，避免与客户/项目管理系统混淆。

### 5.3 专业报告生成

新增报告中心，支持基于本地数据生成：

1. 周报。
2. 月报。
3. 目标复盘报告。
4. 主题进展报告。
5. 个人成长复盘报告。

报告输出方式：

1. 页面内预览。
2. Markdown 文本复制。
3. Markdown zip 继续沿用现有导出系统。
4. PNG 截图继续沿用现有导出系统。

不做 PDF、Word、PPT 导出。

报告必须带证据引用。每个关键结论至少能追溯到相关日期和 bullet。

### 5.4 AI 深度复盘助手

现有 AI 能生成每日复盘和引导问题。本阶段增强为“复盘助手”：

1. 根据每日记录生成 3-5 个追问。
2. 根据周复盘生成关键事件追问。
3. 根据月度趋势生成下月调整建议。
4. 根据目标偏差生成根因追问。
5. 根据重复标签生成模式识别。

AI 输出不应直接覆盖用户复盘，而应以“建议卡片”形式呈现，用户可以采纳、忽略或复制。

### 5.5 长期趋势分析

新增本地趋势分析模块，定期从 entries、reviews、goals、projects 中派生洞察：

1. 投入分布：work、study、side 的 bullet 数量和活跃天数。
2. 目标偏离：有目标但缺少关联推进的周期。
3. 主题停滞：某主题多日没有新 bullet。
4. 复盘质量：每日复盘质量评分趋势。
5. 常见标签：success、failure、insight、habit 等出现频率。
6. 重复问题：AI 从复盘文本中归纳反复出现的问题。
7. 成功模式：AI 从高质量复盘和 success 标签中归纳有效做法。

趋势分析先做本地派生和按需 AI 生成，不引入后台任务。

### 5.6 报告模板库

新增内置模板库，不做在线市场。第一批模板：

1. 给老板看的周报。
2. 给合伙人的月度复盘。
3. 给自己的深度复盘。
4. 目标完成复盘。
5. 工作主题推进报告。

模板由结构化配置定义，包括：

1. 模板 id。
2. 名称。
3. 适用周期：week 或 month。
4. 章节列表。
5. AI prompt builder。
6. 是否需要证据引用。

用户可以选择模板生成报告，但第一版不支持用户自定义模板编辑器。

### 5.7 时间线证据链

每个 AI 生成的报告或趋势洞察都应尽量附带 evidence refs：

1. date。
2. entryId。
3. bulletId。
4. bullet text。
5. category。

UI 展示时：

1. 报告正文显示自然语言结论。
2. 每个结论后显示 “查看依据”。
3. 展开后显示相关日期和原始 bullet。

这可以显著提升用户对 AI 输出的信任度，也是 $99 价值感的关键。

## 6. 信息架构

新增或调整页面：

1. Check-in：保持每日录入为第一入口。
2. Browse：继续包含 Timeline、Gantt、Stats、复盘。
3. Goals：新增目标管理页。
4. Reports：新增报告中心。
5. Insights：新增趋势洞察页。

导航建议：

1. 录入。
2. 查看。
3. 目标。
4. 报告。
5. 洞察。

Settings 和 Export 仍放在顶部操作区。

## 7. 数据模型草案

### 7.1 Goal

```ts
type GoalPeriod = 'week' | 'month';
type GoalStatus = 'active' | 'done' | 'paused' | 'dropped';

interface Goal {
  id: string;
  title: string;
  period: GoalPeriod;
  startDate: string;
  endDate: string;
  status: GoalStatus;
  linkedBullets: Array<{ entryId: string; bulletId: string }>;
  notes?: string;
  ai?: {
    progressSummary?: string;
    risk?: string;
    nextAction?: string;
  };
  createdAt: string;
  updatedAt: string;
}
```

### 7.2 Report

```ts
interface GeneratedReport {
  id: string;
  templateId: string;
  title: string;
  period: 'week' | 'month';
  startDate: string;
  endDate: string;
  content: string;
  sections: ReportSection[];
  createdAt: string;
  updatedAt: string;
}

interface ReportSection {
  id: string;
  title: string;
  content: string;
  evidenceRefs: EvidenceRef[];
}
```

### 7.3 EvidenceRef

```ts
interface EvidenceRef {
  entryId: string;
  date: string;
  category: Category;
  bulletId: string;
  text: string;
}
```

### 7.4 Insight

```ts
type InsightType =
  | 'goal-drift'
  | 'stalled-theme'
  | 'recurring-problem'
  | 'success-pattern'
  | 'review-quality'
  | 'activity-distribution';

interface Insight {
  id: string;
  type: InsightType;
  title: string;
  summary: string;
  severity: 'info' | 'warning' | 'critical';
  periodStart: string;
  periodEnd: string;
  evidenceRefs: EvidenceRef[];
  createdAt: string;
}
```

## 8. AI 设计原则

1. AI 只生成建议，用户保存后才成为正式记录。
2. AI 输出必须尽可能引用原始 bullet。
3. AI 错误不能破坏已有数据。
4. AI 请求失败时保留当前页面状态。
5. 生成报告前先展示数据范围和模板，避免用户误生成。
6. 对大型月份数据应做 prompt 裁剪，避免一次塞入过多内容。

## 9. 验收标准

1. 用户可以创建、编辑、完成、暂停和放弃周/月目标。
2. 用户可以把 bullet 关联到目标。
3. 用户点击 Classify Projects 后，Gantt 视图出现主题时间线。
4. 用户可以生成周报和月报，并在页面内预览。
5. 报告中的核心结论可以展开查看原始证据。
6. 用户可以在 Insights 页面看到趋势洞察。
7. 所有新数据均保存在 IndexedDB。
8. 刷新页面后目标、报告和洞察仍然存在。
9. 单元测试覆盖 schema、store、AI prompt、报告生成和核心 UI。
10. `npm test` 和 `npm run build` 通过，或记录本机 npm 环境替代命令。

## 10. 风险

1. 本地 IndexedDB 数据结构升级需要谨慎处理旧数据兼容。
2. AI 报告 prompt 容易过长，需要摘要和裁剪策略。
3. 自动主题分类可能不稳定，需要手动纠错能力。
4. 新页面较多，必须控制 UI 复杂度。
5. 如果不做云同步，商业价值仍偏向单机 Pro 工具，而不是 SaaS。

## 11. 推荐实施顺序

1. 数据模型和 IndexedDB 升级。
2. 目标系统。
3. 项目/主题分类接通。
4. 证据链基础能力。
5. 报告模板和报告中心。
6. AI 深度复盘助手。
7. 趋势洞察。
8. UI 收敛、测试补齐、README 更新。
