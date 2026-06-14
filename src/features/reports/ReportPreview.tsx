import { useState } from 'react';
import { Button } from '../../components/primitives/Button';
import { MarkdownRender } from '../../components/primitives/MarkdownRender';
import { EvidenceList } from '../evidence/EvidenceList';
import type { GeneratedReport, ReportSection } from '../../lib/schema';

interface ReportPreviewProps {
  report: GeneratedReport;
  onClose: () => void;
}

export function ReportPreview({ report, onClose }: ReportPreviewProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [copySuccess, setCopySuccess] = useState(false);

  const toggleSection = (sectionId: string) => {
    const next = new Set(expandedSections);
    if (next.has(sectionId)) {
      next.delete(sectionId);
    } else {
      next.add(sectionId);
    }
    setExpandedSections(next);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(report.content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog report-preview-dialog" role="dialog" aria-label="Report Preview" onClick={(e) => e.stopPropagation()}>
        <div className="report-preview-header">
          <h2 className="report-preview-title">{report.title}</h2>
          <div className="report-preview-meta">
            <span>{report.period === 'week' ? '周报' : '月报'}</span>
            <span>{report.startDate} ~ {report.endDate}</span>
          </div>
        </div>

        <div className="report-preview-content">
          {report.sections.map((section) => (
            <ReportSectionCard
              key={section.id}
              section={section}
              expanded={expandedSections.has(section.id)}
              onToggle={() => toggleSection(section.id)}
            />
          ))}
        </div>

        <div className="report-preview-actions">
          <Button variant="secondary" onClick={handleCopy}>
            {copySuccess ? '已复制！' : '复制 Markdown'}
          </Button>
          <Button onClick={onClose}>关闭</Button>
        </div>
      </div>
    </div>
  );
}

function ReportSectionCard({
  section,
  expanded,
  onToggle,
}: {
  section: ReportSection;
  expanded: boolean;
  onToggle: () => void;
}) {
  const hasEvidence = section.evidenceRefs.length > 0;

  return (
    <div className="report-section-card">
      <div className="report-section-header" onClick={onToggle}>
        <h3 className="report-section-title">{section.title}</h3>
        {hasEvidence && (
          <span className="report-section-evidence-count">
            {section.evidenceRefs.length} 条证据
          </span>
        )}
        <span className={`report-section-toggle ${expanded ? 'expanded' : ''}`}>
          ▼
        </span>
      </div>
      <div className="report-section-content">
        <MarkdownRender content={section.content} />
      </div>
      {expanded && hasEvidence && (
        <div className="report-section-evidence">
          <h4>证据</h4>
          <EvidenceList evidence={section.evidenceRefs} />
        </div>
      )}
    </div>
  );
}
