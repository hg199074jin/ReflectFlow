import { useState, useMemo } from 'react';
import { useTimelineStore } from '../../store';
import { Button } from '../../components/primitives/Button';
import { Select } from '../../components/primitives/Select';
import { Input } from '../../components/primitives/Input';
import { ReportPreview } from './ReportPreview';
import { REPORT_TEMPLATES, getReportTemplate } from './templates';
import { buildLocalReport } from './reportBuilder';
import type { GeneratedReport } from '../../lib/schema';

export function ReportsView() {
  const { entries, goals, reports, saveGeneratedReport } = useTimelineStore();
  const [selectedTemplate, setSelectedTemplate] = useState(REPORT_TEMPLATES[0]?.id || 'boss-weekly');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [previewReport, setPreviewReport] = useState<GeneratedReport | null>(null);
  const savedReports = useMemo(() => {
    return Object.values(reports).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [reports]);

  const template = getReportTemplate(selectedTemplate);

  const handleGenerateLocal = () => {
    if (!template) return;

    // Filter entries and goals for the period
    const periodEntries = Object.values(entries).filter(
      (e) => e.date >= startDate && e.date <= endDate
    );
    const periodGoals = Object.values(goals).filter(
      (g) => g.startDate >= startDate && g.endDate <= endDate
    );

    const report = buildLocalReport({
      template,
      entries: periodEntries,
      goals: periodGoals,
      startDate,
      endDate,
    });

    saveGeneratedReport(report);
    setPreviewReport(report);
  };

  const handleGenerateAI = async () => {
    // TODO: Implement AI report generation
    handleGenerateLocal();
  };

  return (
    <div className="reports-view">
      <div className="reports-header">
        <h2 className="reports-title">Report Center</h2>
      </div>

      <div className="reports-generator">
        <h3>Generate New Report</h3>
        <div className="reports-form">
          <Select
            label="Template"
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
          >
            {REPORT_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </Select>
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
          <div className="reports-actions">
            <Button variant="secondary" onClick={handleGenerateLocal}>
              Generate Local Draft
            </Button>
            <Button onClick={handleGenerateAI}>
              Generate with AI
            </Button>
          </div>
        </div>
        {template && (
          <p className="reports-template-desc">{template.description}</p>
        )}
      </div>

      <div className="reports-history">
        <h3>Saved Reports</h3>
        {savedReports.length === 0 ? (
          <p className="reports-empty">No reports generated yet.</p>
        ) : (
          <div className="reports-list">
            {savedReports.map((report) => (
              <div
                key={report.id}
                className="reports-item"
                onClick={() => setPreviewReport(report)}
              >
                <span className="reports-item-title">{report.title}</span>
                <span className="reports-item-date">
                  {new Date(report.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {previewReport && (
        <ReportPreview
          report={previewReport}
          onClose={() => setPreviewReport(null)}
        />
      )}
    </div>
  );
}
