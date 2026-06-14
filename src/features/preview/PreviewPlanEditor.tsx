import { useState } from 'react';
import { useTimelineStore } from '../../store';
import type { PreviewPlan } from '../../lib/schema';

interface PreviewPlanEditorProps {
  previewPlan: PreviewPlan;
  onBack: () => void;
}

export function PreviewPlanEditor({ previewPlan, onBack }: PreviewPlanEditorProps) {
  const { upsertPreviewPlan } = useTimelineStore();
  const [title, setTitle] = useState(previewPlan.title);

  const handleUpdate = (updates: Partial<PreviewPlan>) => {
    upsertPreviewPlan({
      ...previewPlan,
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSaveTitle = () => {
    if (title.trim() && title !== previewPlan.title) {
      handleUpdate({ title: title.trim() });
    }
  };

  const handleAddItem = (field: 'goals' | 'strategies' | 'assumptions' | 'risks' | 'contingencies') => {
    handleUpdate({
      [field]: [...previewPlan[field], ''],
    });
  };

  const handleUpdateItem = (field: 'goals' | 'strategies' | 'assumptions' | 'risks' | 'contingencies', index: number, value: string) => {
    const newItems = [...previewPlan[field]];
    newItems[index] = value;
    handleUpdate({ [field]: newItems });
  };

  const handleRemoveItem = (field: 'goals' | 'strategies' | 'assumptions' | 'risks' | 'contingencies', index: number) => {
    handleUpdate({
      [field]: previewPlan[field].filter((_, i) => i !== index),
    });
  };

  return (
    <div className="preview-plan-editor">
      <div className="preview-plan-editor-header">
        <button className="btn-back" onClick={onBack}>
          ← 返回
        </button>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleSaveTitle}
          className="preview-plan-title-input"
        />
        <div className="preview-plan-meta">
          <span>{previewPlan.startDate} ~ {previewPlan.endDate}</span>
        </div>
      </div>

      <div className="preview-plan-sections">
        {/* Purpose */}
        <div className="preview-plan-section">
          <h3>目的（为什么做）</h3>
          <textarea
            value={previewPlan.purpose}
            onChange={(e) => handleUpdate({ purpose: e.target.value })}
            placeholder="明确做这件事的根本原因..."
            rows={3}
          />
        </div>

        {/* Goals */}
        <div className="preview-plan-section">
          <h3>目标（做到什么算成功）</h3>
          <div className="list-editor">
            {previewPlan.goals.map((goal, index) => (
              <div key={index} className="list-item">
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => handleUpdateItem('goals', index, e.target.value)}
                  placeholder="输入目标"
                />
                <button onClick={() => handleRemoveItem('goals', index)}>
                  删除
                </button>
              </div>
            ))}
            <button className="btn-add" onClick={() => handleAddItem('goals')}>
              + 添加目标
            </button>
          </div>
        </div>

        {/* Strategies */}
        <div className="preview-plan-section">
          <h3>策略（准备用什么打法）</h3>
          <div className="list-editor">
            {previewPlan.strategies.map((strategy, index) => (
              <div key={index} className="list-item">
                <input
                  type="text"
                  value={strategy}
                  onChange={(e) => handleUpdateItem('strategies', index, e.target.value)}
                  placeholder="输入策略"
                />
                <button onClick={() => handleRemoveItem('strategies', index)}>
                  删除
                </button>
              </div>
            ))}
            <button className="btn-add" onClick={() => handleAddItem('strategies')}>
              + 添加策略
            </button>
          </div>
        </div>

        {/* Assumptions */}
        <div className="preview-plan-section">
          <h3>假设（我相信什么因果关系）</h3>
          <div className="list-editor">
            {previewPlan.assumptions.map((assumption, index) => (
              <div key={index} className="list-item">
                <input
                  type="text"
                  value={assumption}
                  onChange={(e) => handleUpdateItem('assumptions', index, e.target.value)}
                  placeholder="输入假设"
                />
                <button onClick={() => handleRemoveItem('assumptions', index)}>
                  删除
                </button>
              </div>
            ))}
            <button className="btn-add" onClick={() => handleAddItem('assumptions')}>
              + 添加假设
            </button>
          </div>
        </div>

        {/* Risks */}
        <div className="preview-plan-section">
          <h3>风险（可能在哪里偏离）</h3>
          <div className="list-editor">
            {previewPlan.risks.map((risk, index) => (
              <div key={index} className="list-item">
                <input
                  type="text"
                  value={risk}
                  onChange={(e) => handleUpdateItem('risks', index, e.target.value)}
                  placeholder="输入风险"
                />
                <button onClick={() => handleRemoveItem('risks', index)}>
                  删除
                </button>
              </div>
            ))}
            <button className="btn-add" onClick={() => handleAddItem('risks')}>
              + 添加风险
            </button>
          </div>
        </div>

        {/* Contingencies */}
        <div className="preview-plan-section">
          <h3>预案（如果偏离怎么处理）</h3>
          <div className="list-editor">
            {previewPlan.contingencies.map((contingency, index) => (
              <div key={index} className="list-item">
                <input
                  type="text"
                  value={contingency}
                  onChange={(e) => handleUpdateItem('contingencies', index, e.target.value)}
                  placeholder="输入预案"
                />
                <button onClick={() => handleRemoveItem('contingencies', index)}>
                  删除
                </button>
              </div>
            ))}
            <button className="btn-add" onClick={() => handleAddItem('contingencies')}>
              + 添加预案
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
