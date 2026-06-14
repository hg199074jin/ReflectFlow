import type { ConclusionQuality } from '../../lib/schema';

/**
 * Detect accidental factor risk in conclusion content
 * Checks if conclusion attributes success/failure to luck, weather, mood, etc.
 */
export function detectAccidentalFactorRisk(content: string): ConclusionQuality['accidentalFactorRisk'] {
  const accidentalPatterns = [
    /运气/i,
    /巧合/i,
    /碰巧/i,
    /恰好/i,
    /天气/i,
    /心情/i,
    /状态好/i,
    /状态差/i,
    /运气好/i,
    /运气差/i,
    /碰巧/i,
    /意外/i,
    /偶然/i,
  ];

  const matchCount = accidentalPatterns.filter((p) => p.test(content)).length;

  if (matchCount >= 3) return 'high';
  if (matchCount >= 1) return 'medium';
  return 'low';
}

/**
 * Detect points-to-person risk in conclusion content
 * Checks if conclusion blames/praises a person without addressing process/mechanism
 */
export function detectPointsToPersonRisk(content: string): ConclusionQuality['pointsToPersonRisk'] {
  const personPatterns = [
    /他.*错/i,
    /她.*错/i,
    /我.*错/i,
    /都是.*的错/i,
    /怪.*没/i,
    /因为.*人/i,
    /某人/i,
    /那个人/i,
    /这个人/i,
  ];

  const processPatterns = [
    /流程/i,
    /机制/i,
    /策略/i,
    /方法/i,
    /系统/i,
    /制度/i,
    /规范/i,
    /标准/i,
  ];

  const personMatchCount = personPatterns.filter((p) => p.test(content)).length;
  const processMatchCount = processPatterns.filter((p) => p.test(content)).length;

  if (personMatchCount >= 2 && processMatchCount === 0) return 'high';
  if (personMatchCount >= 1 && processMatchCount < personMatchCount) return 'medium';
  return 'low';
}

/**
 * Count the maximum depth of why chains
 */
export function countWhyDepth(whyChains: Array<{ id?: string; question: string; answer: string; depth: number }>): number {
  if (whyChains.length === 0) return 0;
  return Math.max(...whyChains.map((w) => w.depth));
}

/**
 * Check if conclusion has cross-validation
 */
export function hasCrossValidation(content: string, evidenceCount: number): boolean {
  // Simple heuristic: if there are multiple evidence refs and content mentions comparison
  const comparisonPatterns = [
    /对比/i,
    /比较/i,
    /验证/i,
    /类似/i,
    /同样/i,
    /其他.*案例/i,
    /历史.*记录/i,
  ];

  const hasComparison = comparisonPatterns.some((p) => p.test(content));
  return hasComparison && evidenceCount >= 2;
}

/**
 * Assess overall conclusion quality
 */
export function assessConclusionQuality(input: {
  content: string;
  whyChains: Array<{ id?: string; question: string; answer: string; depth: number }>;
  evidenceCount: number;
}): ConclusionQuality {
  const { content, whyChains, evidenceCount } = input;

  const accidentalFactorRisk = detectAccidentalFactorRisk(content);
  const pointsToPersonRisk = detectPointsToPersonRisk(content);
  const whyDepth = countWhyDepth(whyChains);
  const crossValidation = hasCrossValidation(content, evidenceCount);

  // Calculate score (0-100)
  let score = 100;

  // Accidental factor penalty
  if (accidentalFactorRisk === 'high') score -= 30;
  else if (accidentalFactorRisk === 'medium') score -= 15;

  // Points-to-person penalty
  if (pointsToPersonRisk === 'high') score -= 25;
  else if (pointsToPersonRisk === 'medium') score -= 10;

  // Why depth penalty
  if (whyDepth < 2) score -= 30;
  else if (whyDepth < 3) score -= 20;

  // Cross validation bonus
  if (!crossValidation) score -= 15;

  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score));

  // Determine verdict
  let verdict: ConclusionQuality['verdict'];
  if (accidentalFactorRisk === 'high' || pointsToPersonRisk === 'high') {
    verdict = 'observation-only';
  } else if (whyDepth < 3) {
    verdict = 'needs-deeper-why';
  } else if (!crossValidation) {
    verdict = 'needs-evidence';
  } else {
    verdict = 'ready';
  }

  return {
    score,
    accidentalFactorRisk,
    pointsToPersonRisk,
    whyDepth,
    hasCrossValidation: crossValidation,
    verdict,
  };
}

/**
 * Get quality verdict label
 */
export function getQualityVerdictLabel(verdict: ConclusionQuality['verdict']): string {
  const labels: Record<ConclusionQuality['verdict'], string> = {
    ready: '可沉淀',
    'needs-evidence': '需补证据',
    'needs-deeper-why': '需继续追问',
    'observation-only': '仅作观察',
  };
  return labels[verdict];
}

/**
 * Get risk level label
 */
export function getRiskLabel(risk: 'low' | 'medium' | 'high'): string {
  const labels: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
  };
  return labels[risk] || '未知';
}

/**
 * Get recommended action based on quality assessment
 */
export function getRecommendedAction(quality: ConclusionQuality): string {
  if (quality.verdict === 'ready') {
    return '结论质量良好，可沉淀为原则';
  }

  const issues: string[] = [];

  if (quality.accidentalFactorRisk === 'high') {
    issues.push('结论过度依赖偶发因素');
  }
  if (quality.pointsToPersonRisk === 'high') {
    issues.push('结论指向人而非事');
  }
  if (quality.whyDepth < 3) {
    issues.push(`Why 追问深度不足（当前 ${quality.whyDepth} 层，建议至少 3 层）`);
  }
  if (!quality.hasCrossValidation) {
    issues.push('缺少交叉验证');
  }

  return issues.join('；');
}
