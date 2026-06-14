import type { ReviewCase, ReviewSteps, EvidenceRef } from '../../lib/schema';

/**
 * Facilitator advice result
 */
export interface FacilitatorAdvice {
  canProceed: boolean;
  missingFacts: string[];
  recommendedAction: string;
  warnings: string[];
}

/**
 * Build prompt for AI facilitator
 * The facilitator controls the review process flow
 */
export function buildFacilitatorPrompt(input: {
  reviewCase: ReviewCase;
  currentStep: keyof ReviewSteps;
  evidence: EvidenceRef[];
}): string {
  const { reviewCase, currentStep, evidence } = input;

  const stepLabels: Record<keyof ReviewSteps, string> = {
    process: '梳理过程',
    expectation: '回顾目标',
    evaluation: '评估结果',
    causeAnalysis: '分析原因',
    learning: '总结经验',
  };

  const stepLabel = stepLabels[currentStep];
  const stepData = reviewCase.steps[currentStep];

  const evidenceText = evidence.map((e) => `- [${e.date}] ${e.text}`).join('\n');

  return `你是一个复盘引导人。你的职责是保证复盘流程不跑偏，确保每一步都完成到位。

## 当前复盘案例
- 标题：${reviewCase.title}
- 类型：${reviewCase.type}
- 当前步骤：${stepLabel}

## 当前步骤数据
${JSON.stringify(stepData, null, 2)}

## 已有事实
${evidenceText || '暂无'}

## 你的任务
请评估当前步骤是否可以进入下一步，并给出建议。

## 评估标准

### 梳理过程
- 是否有足够的时间线记录
- 是否标记了关键事实
- 是否识别了缺失事实

### 回顾目标
- 是否明确了目的（为什么做）
- 是否列出了具体目标
- 是否列出了具体举措

### 评估结果
- 是否有预期-结果-偏差矩阵
- 每一行是否有明确的状态标记

### 分析原因
- 是否有 why/why not 追问链
- 是否分析了可控性
- 是否分析了亮点（不只是问题）

### 总结经验
- 是否有具体洞察
- 是否有可复用的规律
- 是否有边界条件说明

## 输出格式
请以 JSON 格式输出：
{
  "canProceed": true/false,
  "missingFacts": ["缺失的事实1", "缺失的事实2"],
  "recommendedAction": "建议的下一步操作",
  "warnings": ["警告1", "警告2"]
}

注意：
- 只输出 JSON，不要有其他内容
- 如果当前步骤不完整，canProceed 应为 false
- missingFacts 列出缺失的关键信息
- warnings 列出可能的问题（如过早跳到原因分析、只有观点没有证据等）`;
}

/**
 * Assess facilitator advice based on current step completion
 */
export function assessStepReadiness(reviewCase: ReviewCase, currentStep: keyof ReviewSteps): FacilitatorAdvice {
  const missingFacts: string[] = [];
  const warnings: string[] = [];
  let canProceed = true;
  let recommendedAction = '';

  switch (currentStep) {
    case 'process': {
      const process = reviewCase.steps.process;
      if (process.keyFacts.length === 0) {
        missingFacts.push('没有标记任何关键事实');
        canProceed = false;
      }
      if (!process.timelineNotes?.trim()) {
        warnings.push('建议记录过程笔记');
      }
      if (process.missingFacts.length > 0) {
        warnings.push(`有 ${process.missingFacts.length} 项缺失事实待补充`);
      }
      recommendedAction = '标记关键事实，记录过程笔记';
      break;
    }
    case 'expectation': {
      const expectation = reviewCase.steps.expectation;
      if (!expectation.purpose?.trim()) {
        missingFacts.push('没有明确目的（为什么做）');
        canProceed = false;
      }
      if (expectation.goals.length === 0) {
        missingFacts.push('没有列出具体目标');
        canProceed = false;
      }
      if (expectation.measures.length === 0) {
        warnings.push('建议列出具体举措');
      }
      recommendedAction = '明确目的、目标和举措';
      break;
    }
    case 'evaluation': {
      const evaluation = reviewCase.steps.evaluation;
      if (evaluation.rows.length === 0) {
        missingFacts.push('没有预期-结果-偏差矩阵');
        canProceed = false;
      }
      const unclearRows = evaluation.rows.filter((r) => r.status === 'unclear');
      if (unclearRows.length > 0) {
        warnings.push(`有 ${unclearRows.length} 行状态不明确`);
      }
      recommendedAction = '完善偏差矩阵，明确每一行的状态';
      break;
    }
    case 'causeAnalysis': {
      const causeAnalysis = reviewCase.steps.causeAnalysis;
      if (causeAnalysis.whys.length === 0) {
        missingFacts.push('没有 why 追问链');
        canProceed = false;
      }
      if (causeAnalysis.whys.length > 0) {
        const maxDepth = Math.max(...causeAnalysis.whys.map((w) => w.depth));
        if (maxDepth < 3) {
          warnings.push(`Why 追问深度不足（当前 ${maxDepth} 层，建议至少 3 层）`);
        }
      }
      if (causeAnalysis.controllability.length === 0) {
        warnings.push('建议分析可控性');
      }
      if (causeAnalysis.brightSpots.length === 0) {
        warnings.push('建议分析亮点（不只是问题）');
      }
      recommendedAction = '深入 why 追问，分析可控性和亮点';
      break;
    }
    case 'learning': {
      const learning = reviewCase.steps.learning;
      if (learning.insights.length === 0) {
        missingFacts.push('没有总结洞察');
        canProceed = false;
      }
      if (learning.rules.length === 0) {
        warnings.push('建议总结可复用的规律');
      }
      if (learning.boundaries.length === 0) {
        warnings.push('建议说明边界条件');
      }
      recommendedAction = '总结洞察、规律和边界条件';
      break;
    }
  }

  return {
    canProceed,
    missingFacts,
    recommendedAction,
    warnings,
  };
}
