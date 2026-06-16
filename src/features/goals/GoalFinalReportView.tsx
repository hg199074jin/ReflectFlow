import { useState, useMemo } from 'react';
import { useTimelineStore } from '../../store';
import { generateGoalFinalReport, extractGoalPrinciples } from '../../services/goalAI';
import { createId } from '../../lib/ids';
import { Button } from '../../components/primitives/Button';
import { downloadBlob } from '../../services/export/download';
import type { Goal, GoalFinalReport, GoalPrincipleExtraction } from '../../lib/schema';
import type { GoalFinalReportResult } from '../../services/goalAI';

interface Props {
  goal: Goal;
}

/** 完成等级中文映射 */
const COMPLETION_LEVEL_LABELS: Record<string, string> = {
  completed: '已完成',
  partially_completed: '部分完成',
  failed: '未完成',
  abandoned: '已放弃',
};

/** 完成等级颜色 */
const COMPLETION_LEVEL_COLORS: Record<string, string> = {
  completed: '#22c55e',
  partially_completed: '#eab308',
  failed: '#ef4444',
  abandoned: '#94a3b8',
};

/** 置信度中文映射 */
const CONFIDENCE_LABELS: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
};

/** 报告 Markdown 生成的通用数据形状 */
interface ReportMarkdownData {
  title: string;
  completionLevel: string;
  startDate: string;
  endDate: string;
  originalGoal: string;
  successCriteria: string[];
  finalOutcome: string;
  keyActions: string[];
  majorDeviations: string[];
  rootCauses: string[];
  adjustments: string[];
  effectiveActions: string[];
  ineffectiveActions: string[];
  principles: string[];
  nextTimeSuggestions: string[];
}

/** 从标准化数据生成 Markdown 文本 */
function buildReportMarkdownCore(data: ReportMarkdownData): string {
  const lines: string[] = [];
  lines.push(`# ${data.title}`);
  lines.push('');
  lines.push(`**完成等级：** ${COMPLETION_LEVEL_LABELS[data.completionLevel] ?? data.completionLevel}`);
  lines.push(`**时间范围：** ${data.startDate} ~ ${data.endDate}`);
  lines.push('');
  for (const [label, items] of [
    ['原始目标', [data.originalGoal]],
    ['成功标准', data.successCriteria],
    ['最终结果', [data.finalOutcome]],
    ['关键行动', data.keyActions],
    ['主要偏差', data.majorDeviations],
    ['根本原因', data.rootCauses],
    ['调整措施', data.adjustments],
    ['有效行动', data.effectiveActions],
    ['无效行动', data.ineffectiveActions],
    ['经验原则', data.principles],
    ['下次建议', data.nextTimeSuggestions],
  ] as const) {
    lines.push(`## ${label}`);
    if (items.length === 1) {
      lines.push(items[0]);
    } else {
      for (const item of items) lines.push(`- ${item}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

/** 从持久化报告生成 Markdown */
function buildReportMarkdown(report: GoalFinalReport): string {
  return buildReportMarkdownCore({
    title: report.title,
    completionLevel: report.completionLevel,
    startDate: report.period.startDate,
    endDate: report.period.endDate,
    originalGoal: report.originalGoal,
    successCriteria: report.successCriteria,
    finalOutcome: report.finalOutcome,
    keyActions: report.keyActions,
    majorDeviations: report.majorDeviations,
    rootCauses: report.rootCauses,
    adjustments: report.adjustments,
    effectiveActions: report.effectiveActions,
    ineffectiveActions: report.ineffectiveActions,
    principles: report.principles,
    nextTimeSuggestions: report.nextTimeSuggestions,
  });
}

export function GoalFinalReportView({ goal }: Props) {
  const settings = useTimelineStore((s) => s.settings);
  const goalPlans = useTimelineStore((s) => s.goalPlans);
  const goalFinalReports = useTimelineStore((s) => s.goalFinalReports);
  const goalPrincipleExtractions = useTimelineStore((s) => s.goalPrincipleExtractions);
  const upsertGoalFinalReport = useTimelineStore((s) => s.upsertGoalFinalReport);
  const upsertGoalPrincipleExtraction = useTimelineStore((s) => s.upsertGoalPrincipleExtraction);
  const upsertPrinciple = useTimelineStore((s) => s.upsertPrinciple);

  const [streaming, setStreaming] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);

  // 查找已有的结案报告
  const existingReport = useMemo(
    () => Object.values(goalFinalReports).find((r) => r.goalId === goal.id),
    [goalFinalReports, goal.id],
  );

  // 查找已有的原则提取
  const existingExtractions = useMemo(
    () => Object.values(goalPrincipleExtractions).filter((e) => e.goalId === goal.id),
    [goalPrincipleExtractions, goal.id],
  );

  const [report, setReport] = useState<GoalFinalReport | null>(existingReport ?? null);

  // 查找关联的计划
  const plan = useMemo(
    () => Object.values(goalPlans).find((p) => p.goalId === goal.id),
    [goalPlans, goal.id],
  );

  const handleGenerate = async () => {
    setStreaming(true);
    setError(null);
    try {
      const result = await generateGoalFinalReport(goal, plan, settings.llm);
      if (result.success) {
        const now = new Date().toISOString();
        const markdown = buildReportMarkdownFromResult(result.data, goal);
        const newReport: GoalFinalReport = {
          id: existingReport?.id ?? createId(),
          goalId: goal.id,
          title: result.data.title,
          period: { startDate: goal.startDate, endDate: goal.endDate },
          originalGoal: result.data.originalGoal,
          successCriteria: result.data.successCriteria,
          finalOutcome: result.data.finalOutcome,
          completionLevel: result.data.completionLevel,
          keyActions: result.data.keyActions,
          majorDeviations: result.data.majorDeviations,
          rootCauses: result.data.rootCauses,
          adjustments: result.data.adjustments,
          effectiveActions: result.data.effectiveActions,
          ineffectiveActions: result.data.ineffectiveActions,
          principles: result.data.principles,
          nextTimeSuggestions: result.data.nextTimeSuggestions,
          markdown,
          createdAt: existingReport?.createdAt ?? now,
        };
        setReport(newReport);
        upsertGoalFinalReport(newReport);
      } else {
        setError('解析失败：' + result.error);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '未知错误');
    } finally {
      setStreaming(false);
    }
  };

  const handleExportMarkdown = () => {
    if (!report) return;
    const md = report.markdown || buildReportMarkdown(report);
    downloadBlob(`${goal.title}-结案报告.md`, md, 'text/markdown;charset=utf-8');
  };

  const handleExtractPrinciples = async () => {
    if (!report) return;
    setExtracting(true);
    setExtractError(null);
    try {
      const result = await extractGoalPrinciples(goal, report, settings.llm);
      if (result.success) {
        const now = new Date().toISOString();
        // 保存每个提取的原则
        for (const p of result.data.principles) {
          const extraction: GoalPrincipleExtraction = {
            id: createId(),
            goalId: goal.id,
            principleTitle: p.principleTitle,
            principleContent: p.principleContent,
            sourceEvidence: p.sourceEvidence,
            applicableScenarios: p.applicableScenarios,
            boundaryConditions: p.boundaryConditions,
            counterExamples: p.counterExamples,
            confidence: p.confidence,
            createdAt: now,
          };
          upsertGoalPrincipleExtraction(extraction);
        }
      } else {
        setExtractError('解析失败：' + result.error);
      }
    } catch (e) {
      setExtractError(e instanceof Error ? e.message : '未知错误');
    } finally {
      setExtracting(false);
    }
  };

  const handleAdoptPrinciple = (extraction: GoalPrincipleExtraction) => {
    const now = new Date().toISOString();
    upsertPrinciple({
      id: createId(),
      title: extraction.principleTitle,
      content: extraction.principleContent,
      sourceConclusionId: '',
      sourceReviewCaseId: '',
      evidenceRefs: [],
      applicableContexts: extraction.applicableScenarios,
      boundaries: extraction.boundaryConditions,
      verificationStatus: 'unverified',
      createdAt: now,
      updatedAt: now,
    });
  };

  const canGenerate = goal.status === 'done' || goal.status === 'dropped' || goal.status === 'paused';

  if (!canGenerate && !report) {
    return (
      <div className="goal-final-report-view">
        <h3>目标结案报告</h3>
        <p className="goal-report-empty">目标结束后可生成结案报告。</p>
      </div>
    );
  }

  return (
    <div className="goal-final-report-view">
      <h3>目标结案报告</h3>

      {!report && !streaming && (
        <p className="goal-report-empty">尚未生成结案报告，点击下方按钮生成。</p>
      )}

      {report && (
        <>
          {/* 报告头部 */}
          <div className="report-header">
            <h4>{report.title}</h4>
            <span
              className="report-completion-badge"
              style={{ color: COMPLETION_LEVEL_COLORS[report.completionLevel] }}
            >
              {COMPLETION_LEVEL_LABELS[report.completionLevel] ?? report.completionLevel}
            </span>
          </div>

          {/* 原始目标 */}
          <div className="report-section">
            <strong>原始目标：</strong>
            <p>{report.originalGoal}</p>
          </div>

          {/* 成功标准 */}
          {report.successCriteria.length > 0 && (
            <div className="report-section">
              <strong>成功标准：</strong>
              <ul>
                {report.successCriteria.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 最终结果 */}
          <div className="report-section">
            <strong>最终结果：</strong>
            <p>{report.finalOutcome}</p>
          </div>

          {/* 关键行动 */}
          {report.keyActions.length > 0 && (
            <div className="report-section">
              <strong>关键行动：</strong>
              <ul>
                {report.keyActions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 主要偏差 */}
          {report.majorDeviations.length > 0 && (
            <div className="report-section">
              <strong>主要偏差：</strong>
              <ul>
                {report.majorDeviations.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 根本原因 */}
          {report.rootCauses.length > 0 && (
            <div className="report-section">
              <strong>根本原因：</strong>
              <ul>
                {report.rootCauses.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 调整措施 */}
          {report.adjustments.length > 0 && (
            <div className="report-section">
              <strong>调整措施：</strong>
              <ul>
                {report.adjustments.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 有效行动 */}
          {report.effectiveActions.length > 0 && (
            <div className="report-section">
              <strong>有效行动：</strong>
              <ul>
                {report.effectiveActions.map((a, i) => (
                  <li key={i} className="report-effective">{a}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 无效行动 */}
          {report.ineffectiveActions.length > 0 && (
            <div className="report-section">
              <strong>无效行动：</strong>
              <ul>
                {report.ineffectiveActions.map((a, i) => (
                  <li key={i} className="report-ineffective">{a}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 经验原则 */}
          {report.principles.length > 0 && (
            <div className="report-section">
              <strong>经验原则：</strong>
              <ul>
                {report.principles.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 下次建议 */}
          {report.nextTimeSuggestions.length > 0 && (
            <div className="report-section">
              <strong>下次建议：</strong>
              <ul>
                {report.nextTimeSuggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="report-actions">
            <Button onClick={handleExportMarkdown} variant="secondary">
              导出 Markdown
            </Button>
            <Button onClick={handleExtractPrinciples} disabled={extracting} variant="secondary">
              {extracting ? '提取中...' : 'AI 提炼原则'}
            </Button>
            {canGenerate && (
              <Button onClick={handleGenerate} disabled={streaming} variant="ghost">
                {streaming ? '生成中...' : '重新生成'}
              </Button>
            )}
          </div>
        </>
      )}

      {!report && canGenerate && (
        <Button onClick={handleGenerate} disabled={streaming} variant="secondary">
          {streaming ? '生成中...' : 'AI 生成结案报告'}
        </Button>
      )}

      {error && <div className="goal-report-error">{error}</div>}
      {extractError && <div className="goal-report-error">{extractError}</div>}

      {/* 已提取的原则 */}
      {existingExtractions.length > 0 && (
        <div className="goal-extracted-principles">
          <h4>已提炼原则</h4>
          {existingExtractions.map((ext) => (
            <div key={ext.id} className="extracted-principle-item">
              <div className="principle-header">
                <strong>{ext.principleTitle}</strong>
                <span className={`principle-confidence confidence-${ext.confidence}`}>
                  置信度：{CONFIDENCE_LABELS[ext.confidence] ?? ext.confidence}
                </span>
              </div>
              <p>{ext.principleContent}</p>
              {ext.applicableScenarios.length > 0 && (
                <div className="principle-meta">
                  <strong>适用场景：</strong>
                  <span>{ext.applicableScenarios.join('、')}</span>
                </div>
              )}
              {ext.boundaryConditions.length > 0 && (
                <div className="principle-meta">
                  <strong>边界条件：</strong>
                  <span>{ext.boundaryConditions.join('、')}</span>
                </div>
              )}
              <Button
                onClick={() => handleAdoptPrinciple(ext)}
                variant="ghost"
                size="sm"
              >
                纳入原则库
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** 从 AI 结果生成 Markdown（报告对象尚未持久化时使用） */
function buildReportMarkdownFromResult(data: GoalFinalReportResult, goal: Goal): string {
  return buildReportMarkdownCore({
    title: data.title,
    completionLevel: data.completionLevel,
    startDate: goal.startDate,
    endDate: goal.endDate,
    originalGoal: data.originalGoal,
    successCriteria: data.successCriteria,
    finalOutcome: data.finalOutcome,
    keyActions: data.keyActions,
    majorDeviations: data.majorDeviations,
    rootCauses: data.rootCauses,
    adjustments: data.adjustments,
    effectiveActions: data.effectiveActions,
    ineffectiveActions: data.ineffectiveActions,
    principles: data.principles,
    nextTimeSuggestions: data.nextTimeSuggestions,
  });
}
