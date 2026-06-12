import { useState } from 'react';
import { useTimelineStore } from '../../store';
import { createMarkdownZip } from '../../services/export/zip';
import { exportNodeAsPng } from '../../services/export/png';
import { Button } from '../primitives/Button';
import { Input } from '../primitives/Input';

interface ExportDialogProps {
  onClose: () => void;
}

export function ExportDialog({ onClose }: ExportDialogProps) {
  const { entries, settings, selectedMonth, view } = useTimelineStore();
  const [startDate, setStartDate] = useState(`${selectedMonth}-01`);
  const [endDate, setEndDate] = useState(`${selectedMonth}-31`);
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
        setError('No entries in selected range');
        return;
      }
      const blob = await createMarkdownZip(filtered, settings.export);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `timeline-export-${new Date().toISOString().slice(0, 10)}.zip`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
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
        <h2 className="dialog-title">Export</h2>
        <div className="settings-form">
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          {error && <p className="input-error-text">{error}</p>}
        </div>
        <div className="dialog-actions">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="secondary" onClick={handleExportMarkdown} loading={loading}>
            Export Markdown
          </Button>
          <Button onClick={handleExportPng} loading={loading}>
            Export PNG
          </Button>
        </div>
      </div>
    </div>
  );
}
