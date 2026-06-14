import { useState } from 'react';
import { useTimelineStore } from '../../store';
import type { ReviewCaseType, ReviewCaseStatus } from '../../lib/schema';
import {
  REVIEW_CASE_TYPE_LABELS,
  REVIEW_CASE_STATUS_LABELS,
} from '../../lib/schema';
import { createReviewCaseFromEntries } from './reviewCaseUtils';
import { ReviewCaseEditor } from './ReviewCaseEditor';

const CASE_TYPE_OPTIONS: ReviewCaseType[] = [
  'daily', 'weekly', 'monthly', 'goal', 'theme', 'event', 'benchmark',
];

const STATUS_FILTER_OPTIONS: Array<{ value: ReviewCaseStatus | 'all'; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'draft', label: '草稿' },
  { value: 'in-review', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'archived', label: '已归档' },
];

export function ReviewCasesView() {
  const { reviewCases, entries, upsertReviewCase, deleteReviewCase } = useTimelineStore();
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ReviewCaseStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ReviewCaseType | 'all'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCaseType, setNewCaseType] = useState<ReviewCaseType>('daily');
  const [newCaseTitle, setNewCaseTitle] = useState('');
  const [newCaseStartDate, setNewCaseStartDate] = useState('');
  const [newCaseEndDate, setNewCaseEndDate] = useState('');

  const allCases = Object.values(reviewCases);
  const filteredCases = allCases.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (typeFilter !== 'all' && c.type !== typeFilter) return false;
    return true;
  }).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const selectedCase = selectedCaseId ? reviewCases[selectedCaseId] : null;

  const handleCreateCase = () => {
    if (!newCaseTitle.trim() || !newCaseStartDate || !newCaseEndDate) return;

    const newCase = createReviewCaseFromEntries({
      type: newCaseType,
      title: newCaseTitle,
      startDate: newCaseStartDate,
      endDate: newCaseEndDate,
      entries: Object.values(entries),
    });

    upsertReviewCase(newCase);
    setSelectedCaseId(newCase.id);
    setShowCreateForm(false);
    setNewCaseTitle('');
    setNewCaseStartDate('');
    setNewCaseEndDate('');
  };

  const handleDeleteCase = (caseId: string) => {
    if (confirm('确定删除此复盘案例？')) {
      deleteReviewCase(caseId);
      if (selectedCaseId === caseId) {
        setSelectedCaseId(null);
      }
    }
  };

  if (selectedCase) {
    return (
      <ReviewCaseEditor
        reviewCase={selectedCase}
        onBack={() => setSelectedCaseId(null)}
      />
    );
  }

  return (
    <div className="review-cases-view">
      <div className="review-cases-header">
        <h2>复盘案例</h2>
        <button
          className="btn-primary"
          onClick={() => setShowCreateForm(true)}
        >
          新建复盘
        </button>
      </div>

      {showCreateForm && (
        <div className="review-case-create-form">
          <h3>新建复盘案例</h3>
          <div className="form-group">
            <label>类型</label>
            <select
              value={newCaseType}
              onChange={(e) => setNewCaseType(e.target.value as ReviewCaseType)}
            >
              {CASE_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {REVIEW_CASE_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>标题</label>
            <input
              type="text"
              value={newCaseTitle}
              onChange={(e) => setNewCaseTitle(e.target.value)}
              placeholder="输入复盘标题"
            />
          </div>
          <div className="form-group">
            <label>开始日期</label>
            <input
              type="date"
              value={newCaseStartDate}
              onChange={(e) => setNewCaseStartDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>结束日期</label>
            <input
              type="date"
              value={newCaseEndDate}
              onChange={(e) => setNewCaseEndDate(e.target.value)}
            />
          </div>
          <div className="form-actions">
            <button className="btn-primary" onClick={handleCreateCase}>
              创建
            </button>
            <button className="btn-secondary" onClick={() => setShowCreateForm(false)}>
              取消
            </button>
          </div>
        </div>
      )}

      <div className="review-cases-filters">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ReviewCaseStatus | 'all')}
        >
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as ReviewCaseType | 'all')}
        >
          <option value="all">全部类型</option>
          {CASE_TYPE_OPTIONS.map((type) => (
            <option key={type} value={type}>
              {REVIEW_CASE_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </div>

      <div className="review-cases-list">
        {filteredCases.length === 0 ? (
          <div className="review-cases-empty">
            <p>暂无复盘案例</p>
            <p className="hint">点击"新建复盘"开始第一次结构化复盘</p>
          </div>
        ) : (
          filteredCases.map((reviewCase) => (
            <div
              key={reviewCase.id}
              className="review-case-card"
              onClick={() => setSelectedCaseId(reviewCase.id)}
            >
              <div className="review-case-card-header">
                <span className="review-case-type">
                  {REVIEW_CASE_TYPE_LABELS[reviewCase.type]}
                </span>
                <span className={`review-case-status status-${reviewCase.status}`}>
                  {REVIEW_CASE_STATUS_LABELS[reviewCase.status]}
                </span>
              </div>
              <h3 className="review-case-title">{reviewCase.title}</h3>
              <div className="review-case-meta">
                <span>{reviewCase.startDate} ~ {reviewCase.endDate}</span>
                <span>{reviewCase.conclusions.length} 条结论</span>
              </div>
              <button
                className="btn-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteCase(reviewCase.id);
                }}
              >
                删除
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
