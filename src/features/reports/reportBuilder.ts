import type {
  Entry, Goal, GeneratedReport, ReportSection,
  EvidenceRef, ReportTemplate, ReviewCase, Principle,
} from '../../lib/schema';
import { createId } from '../../lib/ids';

interface BuildReportInput {
  template: ReportTemplate;
  entries: Entry[];
  goals: Goal[];
  reviewCases?: ReviewCase[];
  principles?: Principle[];
  startDate: string;
  endDate: string;
}

/**
 * Build a deterministic local report (no AI)
 */
export function buildLocalReport(input: BuildReportInput): GeneratedReport {
  const { template, entries, goals, reviewCases = [], principles = [], startDate, endDate } = input;
  const now = new Date().toISOString();

  // Collect all bullets
  const allBullets = entries.flatMap((e) => [
    ...e.bullets.work.map((b) => ({ ...b, date: e.date, category: 'work' as const, entryId: e.id })),
    ...e.bullets.study.map((b) => ({ ...b, date: e.date, category: 'study' as const, entryId: e.id })),
    ...e.bullets.side.map((b) => ({ ...b, date: e.date, category: 'side' as const, entryId: e.id })),
  ]);

  // Build sections based on template
  const sections: ReportSection[] = template.sections.map((section) => {
    let content = '';
    const evidenceRefs: EvidenceRef[] = [];

    switch (section.id) {
      case 'summary':
      case 'overview':
        content = `期间：${startDate} ~ ${endDate}\n记录数：${entries.length}\n事项数：${allBullets.length}\n复盘案例：${reviewCases.length}\n原则数：${principles.length}`;
        break;
      case 'achievements':
      case 'progress':
        content = allBullets.map((b) => `- [${b.date}] ${b.text}`).join('\n');
        evidenceRefs.push(...allBullets.map((b) => ({
          entryId: b.entryId,
          date: b.date,
          category: b.category,
          bulletId: b.id,
          text: b.text,
        })));
        break;
      case 'goals':
      case 'goal-status':
        if (goals.length > 0) {
          content = goals.map((g) => `- ${g.title} (${g.status})`).join('\n');
        } else {
          content = '本期未设定目标';
        }
        break;
      case 'process':
      case 'key-events':
        if (reviewCases.length > 0) {
          content = reviewCases.map((rc) => `### ${rc.title}\n${rc.steps.process.timelineNotes || '未记录'}`).join('\n\n');
        } else {
          content = '本期无复盘案例';
        }
        break;
      case 'expectation':
      case 'evaluation':
      case 'deviation-matrix':
        if (reviewCases.length > 0) {
          content = reviewCases.map((rc) => {
            const rows = rc.steps.evaluation.rows;
            if (rows.length === 0) return `### ${rc.title}\n无偏差记录`;
            return `### ${rc.title}\n${rows.map((r) => `- ${r.expectation} → ${r.result} (${r.status})`).join('\n')}`;
          }).join('\n\n');
        } else {
          content = '本期无偏差数据';
        }
        break;
      case 'cause-analysis':
      case 'root-causes':
        if (reviewCases.length > 0) {
          content = reviewCases.map((rc) => {
            const whys = rc.steps.causeAnalysis.whys;
            if (whys.length === 0) return `### ${rc.title}\n未进行原因分析`;
            return `### ${rc.title}\n${whys.map((w) => `${'  '.repeat(w.depth - 1)}Q: ${w.question}\nA: ${w.answer}`).join('\n')}`;
          }).join('\n\n');
        } else {
          content = '本期无原因分析';
        }
        break;
      case 'learning':
      case 'lessons':
        if (reviewCases.length > 0) {
          content = reviewCases.map((rc) => {
            const learning = rc.steps.learning;
            const insights = learning.insights.map((i) => `- 洞察：${i}`).join('\n');
            const rules = learning.rules.map((r) => `- 规律：${r}`).join('\n');
            return `### ${rc.title}\n${insights}\n${rules}`;
          }).join('\n\n');
        } else {
          content = '本期无经验总结';
        }
        break;
      case 'principles':
      case 'new-principles':
      case 'validated-principles':
        if (principles.length > 0) {
          content = principles.map((p) => `- **${p.title}**：${p.content}`).join('\n');
        } else {
          content = '本期无沉淀原则';
        }
        break;
      case 'actions':
        if (reviewCases.length > 0) {
          content = reviewCases.flatMap((rc) =>
            rc.actionItems.map((a) => `- [${a.mode}] ${a.title}${a.completed ? ' ✓' : ''}`)
          ).join('\n') || '本期无行动计划';
        } else {
          content = '本期无行动计划';
        }
        break;
      default:
        content = `[${section.title}] - 请使用 AI 生成详细内容`;
    }

    return {
      id: createId(),
      title: section.title,
      content,
      evidenceRefs,
    };
  });

  return {
    id: createId(),
    templateId: template.id,
    title: `${template.name} (${startDate} ~ ${endDate})`,
    period: template.period,
    startDate,
    endDate,
    content: sections.map((s) => `## ${s.title}\n\n${s.content}`).join('\n\n'),
    sections,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Parse AI report response into GeneratedReport
 */
export function parseAIReportResponse(
  raw: string,
  context: {
    template: ReportTemplate;
    startDate: string;
    endDate: string;
    entries: Entry[];
  }
): GeneratedReport {
  const { template, startDate, endDate, entries } = context;
  const now = new Date().toISOString();

  try {
    // Extract JSON from response
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');

    const parsed = JSON.parse(jsonMatch[0]) as {
      title?: string;
      sections?: Array<{
        title?: string;
        content?: string;
        evidenceBulletIds?: string[];
      }>;
    };

    // Build bullet lookup
    const bulletLookup = new Map<string, { entryId: string; date: string; category: string; text: string }>();
    for (const entry of entries) {
      for (const [category, bullets] of Object.entries(entry.bullets)) {
        for (const bullet of bullets) {
          bulletLookup.set(bullet.id, {
            entryId: entry.id,
            date: entry.date,
            category,
            text: bullet.text,
          });
        }
      }
    }

    // Build sections
    const sections: ReportSection[] = (parsed.sections || []).map((s, i) => {
      const templateSection = template.sections[i];
      const evidenceRefs: EvidenceRef[] = [];

      // Map evidence bullet ids
      if (s.evidenceBulletIds) {
        for (const bulletId of s.evidenceBulletIds) {
          const bullet = bulletLookup.get(bulletId);
          if (bullet) {
            evidenceRefs.push({
              entryId: bullet.entryId,
              date: bullet.date,
              category: bullet.category as 'work' | 'study' | 'side',
              bulletId,
              text: bullet.text,
            });
          }
        }
      }

      return {
        id: createId(),
        title: s.title || templateSection?.title || `Section ${i + 1}`,
        content: s.content || '',
        evidenceRefs,
      };
    });

    return {
      id: createId(),
      templateId: template.id,
      title: parsed.title || `${template.name} (${startDate} ~ ${endDate})`,
      period: template.period,
      startDate,
      endDate,
      content: sections.map((s) => `## ${s.title}\n\n${s.content}`).join('\n\n'),
      sections,
      createdAt: now,
      updatedAt: now,
    };
  } catch (err) {
    throw new Error(`Failed to parse AI report: ${err}`);
  }
}
