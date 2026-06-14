import { useState } from 'react';
import { useTimelineStore } from '../../store';
import type { ReviewCase, ReviewSteps, EvidenceRef } from '../../lib/schema';
import { createId } from '../../lib/ids';
import { buildReviewEvidence, isStepCompleted, getStepCompletionCount } from './reviewCaseUtils';
import { FactTimeline } from './FactTimeline';
import { Button } from '../../components/primitives/Button';

interface ReviewStepWizardProps {
  reviewCase: ReviewCase;
}

const STEPS: Array<{ key: keyof ReviewSteps; label: string; description: string }> = [
  { key: 'process', label: '梳理过程', description: '以事实为基础，按时间线还原过程' },
  { key: 'expectation', label: '回顾目标', description: '还原目的、目标、举措的一致性' },
  { key: 'evaluation', label: '评估结果', description: '比较结果与目标，找到正向或负向偏差' },
  { key: 'causeAnalysis', label: '分析原因', description: '聚焦解决而不是停留在问题本身' },
  { key: 'learning', label: '总结经验', description: '形成新洞察，并转成行动计划' },
];

export function ReviewStepWizard({ reviewCase }: ReviewStepWizardProps) {
  const { upsertReviewCase, entries } = useTimelineStore();
  const [currentStep, setCurrentStep] = useState<keyof ReviewSteps>('process');

  const stepCompletion = getStepCompletionCount(reviewCase);
  const currentStepIndex = STEPS.findIndex((s) => s.key === currentStep);

  const handleUpdateStep = (step: keyof ReviewSteps, data: Partial<ReviewSteps[keyof ReviewSteps]>) => {
    const updatedCase: ReviewCase = {
      ...reviewCase,
      steps: {
        ...reviewCase.steps,
        [step]: {
          ...reviewCase.steps[step],
          ...data,
        },
      },
      updatedAt: new Date().toISOString(),
    };
    upsertReviewCase(updatedCase);
  };

  const handleAddEvidence = (ref: EvidenceRef) => {
    const currentFacts = reviewCase.steps.process.keyFacts;
    const exists = currentFacts.some((f) => f.bulletId === ref.bulletId);
    if (!exists) {
      handleUpdateStep('process', {
        keyFacts: [...currentFacts, ref],
      });
    }
  };

  const handleRemoveEvidence = (bulletId: string) => {
    handleUpdateStep('process', {
      keyFacts: reviewCase.steps.process.keyFacts.filter((f) => f.bulletId !== bulletId),
    });
  };

  const handleAddMissingFact = (fact: string) => {
    if (fact.trim()) {
      handleUpdateStep('process', {
        missingFacts: [...reviewCase.steps.process.missingFacts, fact.trim()],
      });
    }
  };

  const handleRemoveMissingFact = (index: number) => {
    handleUpdateStep('process', {
      missingFacts: reviewCase.steps.process.missingFacts.filter((_, i) => i !== index),
    });
  };

  const renderProcessStep = () => {
    const entriesList = Object.values(entries);
    const evidence = buildReviewEvidence({
      entries: entriesList,
      startDate: reviewCase.startDate,
      endDate: reviewCase.endDate,
    });

    return (
      <div className="step-content">
        <h3>梳理过程</h3>
        <p className="step-description">以事实为基础，按时间线还原过程</p>

        <div className="fact-timeline-section">
          <h4>事实时间线</h4>
          <FactTimeline
            evidenceRefs={evidence}
            missingFacts={reviewCase.steps.process.missingFacts}
            keyFactIds={new Set(reviewCase.steps.process.keyFacts.map((f) => f.bulletId))}
            onToggleKeyFact={(ref) => {
              const isKey = reviewCase.steps.process.keyFacts.some((f) => f.bulletId === ref.bulletId);
              if (isKey) {
                handleRemoveEvidence(ref.bulletId);
              } else {
                handleAddEvidence(ref);
              }
            }}
          />
        </div>

        <div className="timeline-notes-section">
          <h4>过程笔记</h4>
          <textarea
            value={reviewCase.steps.process.timelineNotes || ''}
            onChange={(e) => handleUpdateStep('process', { timelineNotes: e.target.value })}
            placeholder="记录过程中的关键观察..."
            rows={4}
          />
        </div>

        <div className="missing-facts-section">
          <h4>缺失事实</h4>
          <div className="missing-facts-list">
            {reviewCase.steps.process.missingFacts.map((fact, index) => (
              <div key={index} className="missing-fact-item">
                <span>{fact}</span>
                <Button variant="ghost" size="sm" onClick={() => handleRemoveMissingFact(index)}>删除</Button>
              </div>
            ))}
          </div>
          <div className="add-missing-fact">
            <input
              type="text"
              placeholder="添加缺失事实..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddMissingFact(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderExpectationStep = () => {
    const { purpose, goals, measures, assumptions } = reviewCase.steps.expectation;

    return (
      <div className="step-content">
        <h3>回顾目标</h3>
        <p className="step-description">还原目的、目标、举措的一致性</p>

        <div className="expectation-section">
          <div className="form-group">
            <label>目的（为什么做）</label>
            <textarea
              value={purpose || ''}
              onChange={(e) => handleUpdateStep('expectation', { purpose: e.target.value })}
              placeholder="最初为什么要做这件事？"
              rows={2}
            />
          </div>

          <div className="form-group">
            <label>目标（做到什么算成功）</label>
            <div className="list-editor">
              {goals.map((goal, index) => (
                <div key={index} className="list-item">
                  <input
                    type="text"
                    value={goal}
                    onChange={(e) => {
                      const newGoals = [...goals];
                      newGoals[index] = e.target.value;
                      handleUpdateStep('expectation', { goals: newGoals });
                    }}
                  />
                  <Button variant="ghost" size="sm" onClick={() => handleUpdateStep('expectation', { goals: goals.filter((_, i) => i !== index) })}>
                    删除
                  </Button>
                </div>
              ))}
              <button
                className="btn-add"
                onClick={() => handleUpdateStep('expectation', { goals: [...goals, ''] })}
              >
                + 添加目标
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>举措（准备用什么打法）</label>
            <div className="list-editor">
              {measures.map((measure, index) => (
                <div key={index} className="list-item">
                  <input
                    type="text"
                    value={measure}
                    onChange={(e) => {
                      const newMeasures = [...measures];
                      newMeasures[index] = e.target.value;
                      handleUpdateStep('expectation', { measures: newMeasures });
                    }}
                  />
                  <Button variant="ghost" size="sm" onClick={() => handleUpdateStep('expectation', { measures: measures.filter((_, i) => i !== index) })}>
                    删除
                  </Button>
                </div>
              ))}
              <button
                className="btn-add"
                onClick={() => handleUpdateStep('expectation', { measures: [...measures, ''] })}
              >
                + 添加举措
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>假设（我相信什么因果关系）</label>
            <div className="list-editor">
              {assumptions.map((assumption, index) => (
                <div key={index} className="list-item">
                  <input
                    type="text"
                    value={assumption}
                    onChange={(e) => {
                      const newAssumptions = [...assumptions];
                      newAssumptions[index] = e.target.value;
                      handleUpdateStep('expectation', { assumptions: newAssumptions });
                    }}
                  />
                  <Button variant="ghost" size="sm" onClick={() => handleUpdateStep('expectation', { assumptions: assumptions.filter((_, i) => i !== index) })}>
                    删除
                  </Button>
                </div>
              ))}
              <button
                className="btn-add"
                onClick={() => handleUpdateStep('expectation', { assumptions: [...assumptions, ''] })}
              >
                + 添加假设
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEvaluationStep = () => {
    const { rows } = reviewCase.steps.evaluation;

    return (
      <div className="step-content">
        <h3>评估结果</h3>
        <p className="step-description">比较结果与目标，找到正向或负向偏差</p>

        <div className="deviation-matrix">
          <table>
            <thead>
              <tr>
                <th>层次</th>
                <th>预期</th>
                <th>结果</th>
                <th>偏差</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id}>
                  <td>
                    <select
                      value={row.level}
                      onChange={(e) => {
                        const newRows = [...rows];
                        newRows[index] = { ...row, level: e.target.value as 'purpose' | 'goal' | 'measure' };
                        handleUpdateStep('evaluation', { rows: newRows });
                      }}
                    >
                      <option value="purpose">目的</option>
                      <option value="goal">目标</option>
                      <option value="measure">举措</option>
                    </select>
                  </td>
                  <td>
                    <input
                      type="text"
                      value={row.expectation}
                      onChange={(e) => {
                        const newRows = [...rows];
                        newRows[index] = { ...row, expectation: e.target.value };
                        handleUpdateStep('evaluation', { rows: newRows });
                      }}
                      placeholder="预期"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={row.result}
                      onChange={(e) => {
                        const newRows = [...rows];
                        newRows[index] = { ...row, result: e.target.value };
                        handleUpdateStep('evaluation', { rows: newRows });
                      }}
                      placeholder="结果"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={row.deviation}
                      onChange={(e) => {
                        const newRows = [...rows];
                        newRows[index] = { ...row, deviation: e.target.value };
                        handleUpdateStep('evaluation', { rows: newRows });
                      }}
                      placeholder="偏差"
                    />
                  </td>
                  <td>
                    <select
                      value={row.status}
                      onChange={(e) => {
                        const newRows = [...rows];
                        newRows[index] = { ...row, status: e.target.value as any };
                        handleUpdateStep('evaluation', { rows: newRows });
                      }}
                    >
                      <option value="met">达成</option>
                      <option value="missed">未达成</option>
                      <option value="exceeded">超预期</option>
                      <option value="unclear">目标不清</option>
                      <option value="not-measurable">无法评估</option>
                    </select>
                  </td>
                  <td>
                    <Button variant="ghost" size="sm" onClick={() => handleUpdateStep('evaluation', { rows: rows.filter((_, i) => i !== index) })}>
                      删除
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            className="btn-add"
            onClick={() => {
              const newRow = {
                id: createId(),
                level: 'goal' as const,
                expectation: '',
                result: '',
                deviation: '',
                status: 'unclear' as const,
                evidenceRefs: [],
              };
              handleUpdateStep('evaluation', { rows: [...rows, newRow] });
            }}
          >
            + 添加偏差行
          </button>
        </div>
      </div>
    );
  };

  const renderCauseAnalysisStep = () => {
    const { whys, controllability, brightSpots } = reviewCase.steps.causeAnalysis;

    return (
      <div className="step-content">
        <h3>分析原因</h3>
        <p className="step-description">聚焦解决而不是停留在问题本身</p>

        <div className="why-chain-section">
          <h4>Why 追问链</h4>
          {whys.map((why, index) => (
            <div key={why.id} className="why-item">
              <div className="why-question">
                <span className="why-depth">第 {why.depth} 层</span>
                <input
                  type="text"
                  value={why.question}
                  onChange={(e) => {
                    const newWhys = [...whys];
                    newWhys[index] = { ...why, question: e.target.value };
                    handleUpdateStep('causeAnalysis', { whys: newWhys });
                  }}
                  placeholder="问：为什么？"
                />
              </div>
              <div className="why-answer">
                <input
                  type="text"
                  value={why.answer}
                  onChange={(e) => {
                    const newWhys = [...whys];
                    newWhys[index] = { ...why, answer: e.target.value };
                    handleUpdateStep('causeAnalysis', { whys: newWhys });
                  }}
                  placeholder="答：因为..."
                />
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleUpdateStep('causeAnalysis', { whys: whys.filter((_, i) => i !== index) })}>
                删除
              </Button>
            </div>
          ))}
          <button
            className="btn-add"
            onClick={() => {
              const newWhy = {
                id: createId(),
                question: '',
                answer: '',
                depth: whys.length + 1,
                parentId: whys.length > 0 ? whys[whys.length - 1]?.id : undefined,
              };
              handleUpdateStep('causeAnalysis', { whys: [...whys, newWhy] });
            }}
          >
            + 添加追问
          </button>
        </div>

        <div className="controllability-section">
          <h4>可控性分析</h4>
          {controllability.map((item, index) => (
            <div key={item.id} className="cause-item">
              <input
                type="text"
                value={item.title}
                onChange={(e) => {
                  const newItems = [...controllability];
                  newItems[index] = { ...item, title: e.target.value };
                  handleUpdateStep('causeAnalysis', { controllability: newItems });
                }}
                placeholder="原因标题"
              />
              <select
                value={item.controllability}
                onChange={(e) => {
                  const newItems = [...controllability];
                  newItems[index] = { ...item, controllability: e.target.value as any };
                  handleUpdateStep('causeAnalysis', { controllability: newItems });
                }}
              >
                <option value="controllable">可控</option>
                <option value="influenceable">可影响</option>
                <option value="uncontrollable">不可控</option>
              </select>
              <Button variant="ghost" size="sm" onClick={() => handleUpdateStep('causeAnalysis', { controllability: controllability.filter((_, i) => i !== index) })}>
                删除
              </Button>
            </div>
          ))}
          <button
            className="btn-add"
            onClick={() => {
              const newItem = {
                id: createId(),
                title: '',
                description: '',
                controllability: 'controllable' as const,
                source: 'mixed' as const,
                evidenceRefs: [],
              };
              handleUpdateStep('causeAnalysis', { controllability: [...controllability, newItem] });
            }}
          >
            + 添加原因
          </button>
        </div>

        <div className="bright-spots-section">
          <h4>亮点分析</h4>
          {brightSpots.map((item, index) => (
            <div key={item.id} className="cause-item">
              <input
                type="text"
                value={item.title}
                onChange={(e) => {
                  const newItems = [...brightSpots];
                  newItems[index] = { ...item, title: e.target.value };
                  handleUpdateStep('causeAnalysis', { brightSpots: newItems });
                }}
                placeholder="亮点标题"
              />
              <Button variant="ghost" size="sm" onClick={() => handleUpdateStep('causeAnalysis', { brightSpots: brightSpots.filter((_, i) => i !== index) })}>
                删除
              </Button>
            </div>
          ))}
          <button
            className="btn-add"
            onClick={() => {
              const newItem = {
                id: createId(),
                title: '',
                description: '',
                controllability: 'controllable' as const,
                source: 'mixed' as const,
                evidenceRefs: [],
              };
              handleUpdateStep('causeAnalysis', { brightSpots: [...brightSpots, newItem] });
            }}
          >
            + 添加亮点
          </button>
        </div>
      </div>
    );
  };

  const renderLearningStep = () => {
    const { insights, rules, boundaries } = reviewCase.steps.learning;

    return (
      <div className="step-content">
        <h3>总结经验</h3>
        <p className="step-description">形成新洞察，并转成行动计划</p>

        <div className="insights-section">
          <h4>洞察</h4>
          {insights.map((insight, index) => (
            <div key={index} className="list-item">
              <input
                type="text"
                value={insight}
                onChange={(e) => {
                  const newInsights = [...insights];
                  newInsights[index] = e.target.value;
                  handleUpdateStep('learning', { insights: newInsights });
                }}
              />
              <Button variant="ghost" size="sm" onClick={() => handleUpdateStep('learning', { insights: insights.filter((_, i) => i !== index) })}>
                删除
              </Button>
            </div>
          ))}
          <button
            className="btn-add"
            onClick={() => handleUpdateStep('learning', { insights: [...insights, ''] })}
          >
            + 添加洞察
          </button>
        </div>

        <div className="rules-section">
          <h4>规律</h4>
          {rules.map((rule, index) => (
            <div key={index} className="list-item">
              <input
                type="text"
                value={rule}
                onChange={(e) => {
                  const newRules = [...rules];
                  newRules[index] = e.target.value;
                  handleUpdateStep('learning', { rules: newRules });
                }}
              />
              <Button variant="ghost" size="sm" onClick={() => handleUpdateStep('learning', { rules: rules.filter((_, i) => i !== index) })}>
                删除
              </Button>
            </div>
          ))}
          <button
            className="btn-add"
            onClick={() => handleUpdateStep('learning', { rules: [...rules, ''] })}
          >
            + 添加规律
          </button>
        </div>

        <div className="boundaries-section">
          <h4>边界条件</h4>
          {boundaries.map((boundary, index) => (
            <div key={index} className="list-item">
              <input
                type="text"
                value={boundary}
                onChange={(e) => {
                  const newBoundaries = [...boundaries];
                  newBoundaries[index] = e.target.value;
                  handleUpdateStep('learning', { boundaries: newBoundaries });
                }}
              />
              <Button variant="ghost" size="sm" onClick={() => handleUpdateStep('learning', { boundaries: boundaries.filter((_, i) => i !== index) })}>
                删除
              </Button>
            </div>
          ))}
          <button
            className="btn-add"
            onClick={() => handleUpdateStep('learning', { boundaries: [...boundaries, ''] })}
          >
            + 添加边界条件
          </button>
        </div>
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'process':
        return renderProcessStep();
      case 'expectation':
        return renderExpectationStep();
      case 'evaluation':
        return renderEvaluationStep();
      case 'causeAnalysis':
        return renderCauseAnalysisStep();
      case 'learning':
        return renderLearningStep();
      default:
        return null;
    }
  };

  return (
    <div className="review-step-wizard">
      <div className="step-progress">
        <div className="step-progress-bar">
          <div
            className="step-progress-fill"
            style={{ width: `${(stepCompletion / 5) * 100}%` }}
          />
        </div>
        <span className="step-progress-text">{stepCompletion}/5 步完成</span>
      </div>

      <div className="step-navigation">
        {STEPS.map((step, index) => {
          const isCompleted = isStepCompleted(reviewCase, step.key);
          const isCurrent = step.key === currentStep;

          return (
            <button
              key={step.key}
              className={`step-nav-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
              onClick={() => setCurrentStep(step.key)}
            >
              <span className="step-number">{index + 1}</span>
              <span className="step-label">{step.label}</span>
              {isCompleted && <span className="step-check">✓</span>}
            </button>
          );
        })}
      </div>

      <div className="step-content-area">
        {renderCurrentStep()}
      </div>

      <div className="step-actions">
        {currentStepIndex > 0 && STEPS[currentStepIndex - 1] && (
          <Button
            variant="secondary"
            onClick={() => setCurrentStep(STEPS[currentStepIndex - 1]!.key)}
          >
            上一步
          </Button>
        )}
        {currentStepIndex < STEPS.length - 1 && STEPS[currentStepIndex + 1] && (
          <Button
            variant="primary"
            onClick={() => setCurrentStep(STEPS[currentStepIndex + 1]!.key)}
          >
            下一步
          </Button>
        )}
      </div>
    </div>
  );
}
