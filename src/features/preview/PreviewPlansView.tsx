import { useState } from 'react';
import { useTimelineStore } from '../../store';
import { createEmptyPreviewPlan, getPreviewPlanCompletion } from './previewUtils';
import { PreviewPlanEditor } from './PreviewPlanEditor';

export function PreviewPlansView() {
  const { previewPlans, upsertPreviewPlan, deletePreviewPlan } = useTimelineStore();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [newPlanStartDate, setNewPlanStartDate] = useState('');
  const [newPlanEndDate, setNewPlanEndDate] = useState('');

  const allPlans = Object.values(previewPlans).sort(
    (a, b) => b.updatedAt.localeCompare(a.updatedAt)
  );

  const selectedPlan = selectedPlanId ? previewPlans[selectedPlanId] : null;

  const handleCreatePlan = () => {
    if (!newPlanTitle.trim() || !newPlanStartDate || !newPlanEndDate) return;

    const newPlan = createEmptyPreviewPlan({
      title: newPlanTitle,
      startDate: newPlanStartDate,
      endDate: newPlanEndDate,
    });

    upsertPreviewPlan(newPlan);
    setSelectedPlanId(newPlan.id);
    setShowCreateForm(false);
    setNewPlanTitle('');
    setNewPlanStartDate('');
    setNewPlanEndDate('');
  };

  const handleDeletePlan = (planId: string) => {
    if (confirm('确定删除此事前沙盘？')) {
      deletePreviewPlan(planId);
      if (selectedPlanId === planId) {
        setSelectedPlanId(null);
      }
    }
  };

  if (selectedPlan) {
    return (
      <PreviewPlanEditor
        previewPlan={selectedPlan}
        onBack={() => setSelectedPlanId(null)}
      />
    );
  }

  return (
    <div className="preview-plans-view">
      <div className="preview-plans-header">
        <h2>事前沙盘</h2>
        <button
          className="btn-primary"
          onClick={() => setShowCreateForm(true)}
        >
          新建沙盘
        </button>
      </div>

      <p className="preview-plans-description">
        事前沙盘是 PDF 循环的第一步：在开始重要事项前，明确目的、目标、策略、假设、风险和预案。
      </p>

      {showCreateForm && (
        <div className="preview-plan-create-form">
          <h3>新建事前沙盘</h3>
          <div className="form-group">
            <label>标题</label>
            <input
              type="text"
              value={newPlanTitle}
              onChange={(e) => setNewPlanTitle(e.target.value)}
              placeholder="输入沙盘标题"
            />
          </div>
          <div className="form-group">
            <label>开始日期</label>
            <input
              type="date"
              value={newPlanStartDate}
              onChange={(e) => setNewPlanStartDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>结束日期</label>
            <input
              type="date"
              value={newPlanEndDate}
              onChange={(e) => setNewPlanEndDate(e.target.value)}
            />
          </div>
          <div className="form-actions">
            <button className="btn-primary" onClick={handleCreatePlan}>
              创建
            </button>
            <button className="btn-secondary" onClick={() => setShowCreateForm(false)}>
              取消
            </button>
          </div>
        </div>
      )}

      <div className="preview-plans-list">
        {allPlans.length === 0 ? (
          <div className="preview-plans-empty">
            <p>暂无事前沙盘</p>
            <p className="hint">点击"新建沙盘"开始第一次事前推演</p>
          </div>
        ) : (
          allPlans.map((plan) => {
            const completion = getPreviewPlanCompletion(plan);
            return (
              <div
                key={plan.id}
                className="preview-plan-card"
                onClick={() => setSelectedPlanId(plan.id)}
              >
                <div className="preview-plan-card-header">
                  <h3 className="preview-plan-title">{plan.title}</h3>
                  <span className="preview-plan-completion">
                    {completion.completed}/{completion.total} 完成
                  </span>
                </div>
                <div className="preview-plan-meta">
                  <span>{plan.startDate} ~ {plan.endDate}</span>
                  <span>{plan.goals.length} 个目标</span>
                  <span>{plan.strategies.length} 个策略</span>
                </div>
                <div className="preview-plan-progress">
                  <div
                    className="preview-plan-progress-bar"
                    style={{ width: `${completion.percentage}%` }}
                  />
                </div>
                <button
                  className="btn-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePlan(plan.id);
                  }}
                >
                  删除
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
