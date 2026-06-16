import type { Goal, GoalPlan, GoalFinalReport, DailyGoalTarget, GapReason } from './schema';

/**
 * AI 补全目标定义
 * 根据用户提供的目标基本信息，生成成功标准、约束条件、风险点、验收方式和澄清问题。
 */
export function buildCompleteGoalDefinitionPrompt(goal: Goal): string {
  return `你是 ReflectFlow 的目标定义教练。

用户正在创建一个目标，但可能不知道如何填写成功标准、约束条件、风险点和验收方式。

请根据用户提供的信息，帮助用户把模糊目标转化为可执行、可复盘、可验收的目标定义。

要求：
1. 不要泛泛而谈；
2. 成功标准必须可观察、可判断；
3. 约束条件必须贴近用户的时间、资源、能力和现实环境；
4. 风险点必须与目标执行过程相关；
5. 验收方式必须清楚说明"怎样才算完成"；
6. 输出 JSON，不要输出 Markdown；
7. 如果信息不足，可以给出合理假设，但必须标记为"建议"。

用户目标信息：
目标名称：${goal.title}
当前起点：${goal.currentState ?? '（未填写）'}
期望结果：${goal.desiredOutcome ?? '（未填写）'}
截止日期：${goal.endDate}
可投入时间：${goal.availableTime ?? '（未填写）'}

请输出以下 JSON：

{
  "successCriteria": [
    "..."
  ],
  "constraints": [
    "..."
  ],
  "risks": [
    "..."
  ],
  "acceptanceMethod": "...",
  "clarificationQuestions": [
    "..."
  ]
}`;
}

/**
 * AI 拆解目标
 * 根据目标定义，拆解为阶段性里程碑和未来 7 天的每日牵引目标。
 */
export function buildDecomposeGoalPrompt(goal: Goal): string {
  const goalInfo = [
    `目标名称：${goal.title}`,
    goal.currentState ? `当前起点：${goal.currentState}` : null,
    goal.desiredOutcome ? `期望结果：${goal.desiredOutcome}` : null,
    `截止日期：${goal.endDate}`,
    goal.availableTime ? `可投入时间：${goal.availableTime}` : null,
    goal.successCriteria?.length
      ? `成功标准：\n${goal.successCriteria.map((c) => `- ${c}`).join('\n')}`
      : null,
    goal.constraints?.length
      ? `约束条件：\n${goal.constraints.map((c) => `- ${c}`).join('\n')}`
      : null,
    goal.risks?.length
      ? `风险点：\n${goal.risks.map((r) => `- ${r}`).join('\n')}`
      : null,
    goal.acceptanceMethod ? `验收方式：${goal.acceptanceMethod}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  return `你是 ReflectFlow 的目标拆解与每日复盘教练。

你的任务是根据用户的目标定义，将目标拆解为阶段性里程碑，并生成未来 7 天的每日牵引目标。

请注意：
1. 不要一次性生成整个目标周期内的所有每日任务；
2. 只生成未来 7 天每日目标；
3. 每日目标必须足够小，能在用户设定的可投入时间内完成；
4. 每日目标必须包含最低完成标准；
5. 每日目标必须包含预期产出；
6. 每日目标必须包含复盘问题；
7. 每日目标必须服务于阶段性里程碑；
8. 不要生成空泛目标，如"继续优化""努力学习"；
9. 所有任务都应可复盘、可判断是否完成；
10. 输出 JSON，不要输出 Markdown。

目标信息：
${goalInfo}

请输出以下 JSON：

{
  "summary": "...",
  "milestones": [
    {
      "title": "...",
      "description": "...",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "expectedOutput": "...",
      "successCriteria": ["..."]
    }
  ],
  "dailyTargets": [
    {
      "date": "YYYY-MM-DD",
      "plannedTask": "...",
      "minimumStandard": "...",
      "expectedOutput": "...",
      "reviewQuestions": [
        "...",
        "...",
        "..."
      ],
      "deviationCriteria": [
        "..."
      ]
    }
  ]
}`;
}

/** 差距原因中文映射 */
const GAP_REASON_LABELS: Record<GapReason, string> = {
  not_enough_time: '时间不足',
  task_too_large: '任务过大',
  technical_blocker: '技术阻碍',
  priority_conflict: '优先级冲突',
  low_energy: '精力不足',
  unclear_goal: '目标不清',
  external_interruption: '外部干扰',
  other: '其他原因',
};

/**
 * 每日复盘调整
 * 根据目标、实际完成情况、差距和原因，生成明日调整建议。
 */
export function buildDailyAdjustmentPrompt(
  goal: Goal,
  actualProgress: string,
  gap?: string,
  gapReasons?: GapReason[],
): string {
  const goalInfo = [
    `目标名称：${goal.title}`,
    `截止日期：${goal.endDate}`,
    goal.currentState ? `当前起点：${goal.currentState}` : null,
    goal.desiredOutcome ? `期望结果：${goal.desiredOutcome}` : null,
    goal.availableTime ? `可投入时间：${goal.availableTime}` : null,
    goal.successCriteria?.length
      ? `成功标准：\n${goal.successCriteria.map((c) => `- ${c}`).join('\n')}`
      : null,
  ]
    .filter(Boolean)
    .join('\n');

  const gapReasonsText =
    gapReasons && gapReasons.length > 0
      ? gapReasons.map((r) => `- ${GAP_REASON_LABELS[r] ?? r}`).join('\n')
      : '（未填写）';

  return `你是 ReflectFlow 的每日复盘教练。

用户今天围绕一个目标进行了执行，现在需要根据实际完成情况判断差距，并提出明日调整建议。

要求：
1. 不要简单鼓励；
2. 必须指出实际完成情况与最低完成标准之间的差距；
3. 必须分析差距原因；
4. 明日调整建议必须具体、可执行；
5. 如果任务过大，应建议缩小任务粒度；
6. 如果目标不清，应建议重新定义目标；
7. 输出 JSON，不要输出 Markdown。

目标：
${goalInfo}

实际完成情况：
${actualProgress}

差距：
${gap ?? '（未填写）'}

差距原因：
${gapReasonsText}

请输出：

{
  "nextAdjustment": "...",
  "shouldReduceScope": true,
  "shouldChangePlan": false,
  "suggestedTomorrowTask": "..."
}`;
}

/**
 * 目标质量评估
 * 根据目标的各个维度评估目标质量，输出 10 个维度的评分以及总分。
 */
export function buildGoalQualityPrompt(goal: Goal): string {
  const goalInfo = JSON.stringify(goal, null, 2);

  return `你是 ReflectFlow 的目标质量评估教练。

请根据以下目标信息，从 10 个维度评估目标质量，每个维度 0-10 分，总分 0-100 分。

评估维度：
1. 具体性 (specificityScore)：目标是否足够具体，不含模糊表述
2. 可衡量性 (measurabilityScore)：是否有明确的衡量标准或指标
3. 时间约束 (timeBoundScore)：是否有清晰的截止日期和阶段性时间节点
4. 现状描述 (currentStateScore)：是否清楚描述了当前起点
5. 成功标准 (successCriteriaScore)：成功标准是否可观察、可判断
6. 约束条件 (constraintsScore)：是否列出了现实约束
7. 可拆解性 (decomposabilityScore)：目标是否可以拆解为可执行的小任务
8. 现实性 (realismScore)：目标在给定时间和资源下是否现实可行
9. 冲突性 (conflictScore)：目标是否存在内部矛盾或与其他目标的冲突
10. 复盘价值 (reviewValueScore)：目标完成后的复盘价值和经验沉淀潜力

要求：
1. 评分必须有依据，不要随意给分；
2. strengths 列出目标做得好的方面；
3. weaknesses 列出目标需要改进的地方；
4. suggestions 给出具体可操作的改进建议；
5. 输出 JSON，不要输出 Markdown。

目标信息：
${goalInfo}

请输出以下 JSON：

{
  "totalScore": 0-100,
  "specificityScore": 0-10,
  "measurabilityScore": 0-10,
  "timeBoundScore": 0-10,
  "currentStateScore": 0-10,
  "successCriteriaScore": 0-10,
  "constraintsScore": 0-10,
  "decomposabilityScore": 0-10,
  "realismScore": 0-10,
  "conflictScore": 0-10,
  "reviewValueScore": 0-10,
  "strengths": ["..."],
  "weaknesses": ["..."],
  "suggestions": ["..."]
}`;
}

/**
 * 目标冲突检测
 * 分析所有活跃目标，检测时间、精力、优先级、资源、方向、身份和长短目标之间的冲突。
 */
/**
 * 周复盘目标校准
 * 根据本周的目标执行情况，生成周复盘校准建议。
 */
export function buildWeeklyGoalReviewPrompt(
  weekStart: string,
  weekEnd: string,
  goals: Goal[],
  dailyTargets: DailyGoalTarget[],
): string {
  return `你是 ReflectFlow 的周复盘目标校准教练。
请根据本周的目标执行情况，生成周复盘校准建议。

本周时间：${weekStart} 至 ${weekEnd}
目标列表：${JSON.stringify(goals, null, 2)}
本周每日目标：${JSON.stringify(dailyTargets, null, 2)}

请输出以下 JSON：
{
  "completionSummary": "...",
  "completedTargets": 0,
  "missedTargets": 0,
  "adjustedTargets": 0,
  "mainDeviations": ["..."],
  "recurringBlockers": ["..."],
  "effectiveActions": ["..."],
  "ineffectiveActions": ["..."],
  "nextWeekSuggestions": ["..."],
  "goalsToPrioritize": ["..."],
  "goalsToPause": ["..."]
}`;
}

export function buildConflictDetectionPrompt(goals: Goal[]): string {
  const goalsInfo = JSON.stringify(goals, null, 2);

  return `你是 ReflectFlow 的目标冲突检测教练。

请分析以下所有活跃目标，检测是否存在冲突。

冲突类型包括：
- time_conflict：时间冲突，多个目标争夺同一时间段
- energy_conflict：精力冲突，多个目标同时消耗大量精力
- priority_conflict：优先级冲突，多个高优先级目标难以同时推进
- resource_conflict：资源冲突，多个目标需要相同的稀缺资源
- direction_conflict：方向冲突，多个目标的方向或路径相互矛盾
- identity_conflict：身份冲突，目标与用户当前身份或角色不匹配
- short_long_term_conflict：短长期冲突，短期目标与长期目标相互矛盾

要求：
1. 只报告真实存在的冲突，不要臆造；
2. 每个冲突必须有明确的证据；
3. severity 根据冲突的紧迫程度和影响范围判断；
4. suggestion 必须给出具体可操作的解决方案；
5. 如果没有冲突，返回空数组；
6. 输出 JSON，不要输出 Markdown。

目标列表：
${goalsInfo}

请输出以下 JSON：

{
  "conflicts": [
    {
      "goalIds": ["目标ID1", "目标ID2"],
      "type": "time_conflict | energy_conflict | priority_conflict | resource_conflict | direction_conflict | identity_conflict | short_long_term_conflict",
      "severity": "low | medium | high",
      "description": "冲突描述",
      "evidence": ["证据1", "证据2"],
      "suggestion": "解决建议"
    }
  ]
}`;
}

/**
 * 目标结案报告
 * 根据目标执行情况和计划，生成一份完整的目标结案报告。
 */
export function buildGoalFinalReportPrompt(goal: Goal, plan?: GoalPlan): string {
  return `你是 ReflectFlow 的目标结案报告教练。
请根据以下目标执行情况，生成一份完整的目标结案报告。

目标信息：
${JSON.stringify(goal, null, 2)}

${plan ? `目标计划：\n${JSON.stringify(plan, null, 2)}` : ''}

请输出以下 JSON：
{
  "title": "...",
  "originalGoal": "...",
  "successCriteria": ["..."],
  "finalOutcome": "...",
  "completionLevel": "completed" | "partially_completed" | "failed" | "abandoned",
  "keyActions": ["..."],
  "majorDeviations": ["..."],
  "rootCauses": ["..."],
  "adjustments": ["..."],
  "effectiveActions": ["..."],
  "ineffectiveActions": ["..."],
  "principles": ["..."],
  "nextTimeSuggestions": ["..."]
}`;
}

/**
 * 目标原则沉淀
 * 根据目标结案报告，提炼可复用的经验原则。
 */
export function buildPrincipleExtractionPrompt(goal: Goal, report: GoalFinalReport): string {
  return `你是 ReflectFlow 的原则沉淀教练。
请根据以下目标结案报告，提炼可复用的经验原则。

目标：${JSON.stringify(goal, null, 2)}
结案报告：${JSON.stringify(report, null, 2)}

请输出以下 JSON：
{
  "principles": [
    {
      "principleTitle": "...",
      "principleContent": "...",
      "sourceEvidence": ["..."],
      "applicableScenarios": ["..."],
      "boundaryConditions": ["..."],
      "counterExamples": ["..."],
      "confidence": "low" | "medium" | "high"
    }
  ]
}`;
}
