import { useState, useMemo } from 'react';
import { useTimelineStore } from '../../store';
import { Button } from '../../components/primitives/Button';
import { Select } from '../../components/primitives/Select';
import { Input } from '../../components/primitives/Input';
import { ReportPreview } from './ReportPreview';
import { REPORT_TEMPLATES, getReportTemplate } from './templates';
import { buildLocalReport } from './reportBuilder';
import { createOpenAICompatibleProvider } from '../../services/llm/openaiCompatible';
import type { GeneratedReport } from '../../lib/schema';

export function ReportsView() {
  const { entries, goals, reports, reviewCases, principles, saveGeneratedReport, deleteGeneratedReport } = useTimelineStore();
  const settings = useTimelineStore((s) => s.settings);
  const [selectedTemplate, setSelectedTemplate] = useState(REPORT_TEMPLATES[0]?.id || 'boss-weekly');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [previewReport, setPreviewReport] = useState<GeneratedReport | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savedReports = useMemo(() => {
    return Object.values(reports).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [reports]);

  const template = getReportTemplate(selectedTemplate);

  const getFilteredData = () => {
    const periodEntries = Object.values(entries).filter(
      (e) => e.date >= startDate && e.date <= endDate
    );
    const periodGoals = Object.values(goals).filter(
      (g) => g.startDate >= startDate && g.endDate <= endDate
    );
    const periodReviewCases = Object.values(reviewCases).filter(
      (rc) => rc.startDate >= startDate && rc.endDate <= endDate
    );
    const periodPrinciples = Object.values(principles).filter(
      (p) => p.createdAt >= startDate && p.createdAt <= endDate
    );
    return { periodEntries, periodGoals, periodReviewCases, periodPrinciples };
  };

  const handleGenerateLocal = () => {
    if (!template) return;
    const { periodEntries, periodGoals, periodReviewCases, periodPrinciples } = getFilteredData();

    const report = buildLocalReport({
      template,
      entries: periodEntries,
      goals: periodGoals,
      reviewCases: periodReviewCases,
      principles: periodPrinciples,
      startDate,
      endDate,
    });

    saveGeneratedReport(report);
    setPreviewReport(report);
  };

  const handleGenerateAI = async () => {
    if (!template) return;
    setGenerating(true);
    setError(null);

    try {
      const { periodEntries, periodGoals, periodReviewCases, periodPrinciples } = getFilteredData();
      const provider = createOpenAICompatibleProvider(settings.llm);

      const content = await provider.generateReport({
        title: template.name,
        period: template.period,
        startDate,
        endDate,
        entries: periodEntries.map((e) => ({
          date: e.date,
          bullets: [...e.bullets.work, ...e.bullets.study, ...e.bullets.side].map((b) => b.text),
        })),
        goals: periodGoals.map((g) => ({ title: g.title, status: g.status })),
        reviewCases: periodReviewCases.map((rc) => ({
          title: rc.title,
          conclusions: rc.conclusions.map((c) => c.content),
        })),
        principles: periodPrinciples.map((p) => ({ title: p.title, content: p.content })),
      });

      const now = new Date().toISOString();
      const report: GeneratedReport = {
        id: crypto.randomUUID(),
        templateId: template.id,
        title: `${template.name} (${startDate} ~ ${endDate})`,
        period: template.period,
        startDate,
        endDate,
        content,
        sections: [{ id: 'ai-content', title: template.name, content, evidenceRefs: [] }],
        createdAt: now,
        updatedAt: now,
      };

      saveGeneratedReport(report);
      setPreviewReport(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI 生成失败');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    await deleteGeneratedReport(reportId);
    if (previewReport?.id === reportId) {
      setPreviewReport(null);
    }
  };

  return (
    <div className="reports-view">
      <div className="reports-header">
        <h2 className="reports-title">报告中心</h2>
      </div>

      <div className="reports-generator">
        <h3>生成新报告</h3>
        <div className="reports-form">
          <Select
            label="模板"
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
          >
            {REPORT_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </Select>
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
          {error && <p className="input-error-text">{error}</p>}
          <div className="reports-actions">
            <Button variant="secondary" onClick={handleGenerateLocal}>
              生成本地草稿
            </Button>
            <Button onClick={handleGenerateAI} loading={generating}>
              AI 生成报告
            </Button>
          </div>
        </div>
        {template && (
          <p className="reports-template-desc">{template.description}</p>
        )}
      </div>

      <div className="reports-history">
        <h3>已保存报告</h3>
        {savedReports.length === 0 ? (
          <p className="reports-empty">暂无已生成的报告。</p>
        ) : (
          <div className="reports-list">
            {savedReports.map((report) => (
              <div
                key={report.id}
                className="reports-item"
              >
                <span
                  className="reports-item-title"
                  onClick={() => setPreviewReport(report)}
                >
                  {report.title}
                </span>
                <div className="reports-item-actions">
                  <span className="reports-item-date">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteReport(report.id);
                    }}
                  >
                    删除
                  </Button>
                </div>
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
