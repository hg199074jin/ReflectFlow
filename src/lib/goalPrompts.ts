import type { Goal, GapReason } from './schema';

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
