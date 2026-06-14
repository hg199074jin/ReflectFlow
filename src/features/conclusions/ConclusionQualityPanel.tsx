import type { ConclusionQuality } from '../../lib/schema';
import {
  getQualityVerdictLabel,
  getRiskLabel,
  getRecommendedAction,
} from './conclusionQuality';

interface ConclusionQualityPanelProps {
  quality: ConclusionQuality;
  onPromote?: () => void;
  showPromoteButton?: boolean;
}

export function ConclusionQualityPanel({
  quality,
  onPromote,
  showPromoteButton = false,
}: ConclusionQualityPanelProps) {
  const verdictLabel = getQualityVerdictLabel(quality.verdict);
  const recommendedAction = getRecommendedAction(quality);

  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#5E7B6A';
    if (score >= 60) return '#C4956A';
    return '#C47A6A';
  };

  const getVerdictColor = (verdict: ConclusionQuality['verdict']): string => {
    switch (verdict) {
      case 'ready':
        return '#5E7B6A';
      case 'needs-evidence':
        return '#C4956A';
      case 'needs-deeper-why':
        return '#C4956A';
      case 'observation-only':
        return '#C47A6A';
    }
  };

  return (
    <div className="conclusion-quality-panel">
      <div className="quality-header">
        <h4>结论质量检查</h4>
        <div
          className="quality-score"
          style={{ color: getScoreColor(quality.score) }}
        >
          {quality.score}分
        </div>
      </div>

      <div className="quality-verdict" style={{ color: getVerdictColor(quality.verdict) }}>
        <span className="verdict-label">{verdictLabel}</span>
      </div>

      <div className="quality-checks">
        <div className="quality-check-item">
          <span className="check-label">偶发因素风险</span>
          <span className={`check-value risk-${quality.accidentalFactorRisk}`}>
            {getRiskLabel(quality.accidentalFactorRisk)}
          </span>
        </div>
        <div className="quality-check-item">
          <span className="check-label">指向人风险</span>
          <span className={`check-value risk-${quality.pointsToPersonRisk}`}>
            {getRiskLabel(quality.pointsToPersonRisk)}
          </span>
        </div>
        <div className="quality-check-item">
          <span className="check-label">Why 追问深度</span>
          <span className={`check-value ${quality.whyDepth >= 3 ? 'good' : 'warning'}`}>
            {quality.whyDepth} 层
          </span>
        </div>
        <div className="quality-check-item">
          <span className="check-label">交叉验证</span>
          <span className={`check-value ${quality.hasCrossValidation ? 'good' : 'warning'}`}>
            {quality.hasCrossValidation ? '有' : '无'}
          </span>
        </div>
      </div>

      <div className="quality-recommendation">
        <p>{recommendedAction}</p>
      </div>

      {showPromoteButton && quality.verdict === 'ready' && onPromote && (
        <button className="btn-promote" onClick={onPromote}>
          沉淀为原则
        </button>
      )}
    </div>
  );
}
