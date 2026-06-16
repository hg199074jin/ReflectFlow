import { useState } from 'react';
import { endOfMonth, format } from 'date-fns';
import { useTimelineStore } from '../../store';
import { createMarkdownZip } from '../../services/export/zip';
import { exportNodeAsPng } from '../../services/export/png';
import { downloadFile } from '../../services/export/download';
import { Button } from '../primitives/Button';
import { Input } from '../primitives/Input';

interface ExportDialogProps {
  onClose: () => void;
}

export function ExportDialog({ onClose }: ExportDialogProps) {
  const { entries, settings, selectedMonth, view, reviewCases, previewPlans, principles } = useTimelineStore();
  const [startDate, setStartDate] = useState(`${selectedMonth}-01`);
  const defaultEndDate = format(endOfMonth(new Date(`${selectedMonth}-01`)), 'yyyy-MM-dd');
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [includeReviewCases, setIncludeReviewCases] = useState(true);
  const [includePreviewPlans, setIncludePreviewPlans] = useState(true);
  const [includePrinciples, setIncludePrinciples] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExportMarkdown = async () => {
    setLoading(true);
    setError(null);
    try {
      const filtered = Object.values(entries).filter(
        (e) => e.date >= startDate && e.date <= endDate,
      );
      if (filtered.length === 0) {
        setError('选定范围内没有记录');
        return;
      }
      const blob = await createMarkdownZip(filtered, settings.export, {
        reviewCases: Object.values(reviewCases),
        previewPlans: Object.values(previewPlans),
        principles: Object.values(principles),
        options: {
          includeReviewCases,
          includePreviewPlans,
          includePrinciples,
        },
      });
      downloadFile(`timeline-export-${new Date().toISOString().slice(0, 10)}.zip`, blob);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '导出失败');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPng = async () => {
    setLoading(true);
    setError(null);
    try {
      const viewNode = document.querySelector('.view-container') as HTMLElement;
      if (!viewNode) {
        setError('View not found');
        return;
      }
      await exportNodeAsPng(viewNode, `timeline-${view}`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PNG export failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" role="dialog" aria-label="Export" onClick={(e) => e.stopPropagation()}>
        <h2 className="dialog-title">导出</h2>
        <div className="settings-form">
          <Input
            label="开始日期"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="结束日期"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <div className="export-options">
            <label className="export-option">
              <input
                type="checkbox"
                checked={includeReviewCases}
                onChange={(e) => setIncludeReviewCases(e.target.checked)}
              />
              <span>包含复盘案例</span>
            </label>
            <label className="export-option">
              <input
                type="checkbox"
                checked={includePreviewPlans}
                onChange={(e) => setIncludePreviewPlans(e.target.checked)}
              />
              <span>包含事前沙盘</span>
            </label>
            <label className="export-option">
              <input
                type="checkbox"
                checked={includePrinciples}
                onChange={(e) => setIncludePrinciples(e.target.checked)}
              />
              <span>包含原则库</span>
            </label>
          </div>
          {error && <p className="input-error-text">{error}</p>}
        </div>
        <div className="dialog-actions">
          <Button variant="secondary" onClick={onClose}>取消</Button>
          <Button variant="secondary" onClick={handleExportMarkdown} loading={loading}>
            导出 Markdown
          </Button>
          <Button onClick={handleExportPng} loading={loading}>
            导出 PNG
          </Button>
        </div>
      </div>
    </div>
  );
}
