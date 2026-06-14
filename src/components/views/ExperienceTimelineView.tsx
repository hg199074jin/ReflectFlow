import { useEffect, useMemo, useRef, useState } from 'react';
import { useTimelineStore } from '../../store';
import { createOpenAICompatibleProvider } from '../../services/llm/openaiCompatible';
import type { Category, Entry, ReviewTag, ReviewCase, Goal, Principle } from '../../lib/schema';
import { REVIEW_TAG_LABELS } from '../../lib/schema';

/* ── Types ── */

type ExperienceNodeType = 'entry' | 'review-case' | 'goal' | 'principle';

interface ExperienceNode {
  id: string;
  date: string;
  type: ExperienceNodeType;
  title: string;
  summary: string;
  tags: string[];
  category?: Category;
  isMilestone?: boolean;
  _aiTitle?: boolean;
}

/* ── Constants ── */

const CATEGORY_LABELS: Record<Category, string> = {
  work: '工作',
  study: '学习',
  side: '副业',
};

const CATEGORY_COLORS: Record<Category, string> = {
  work: 'var(--exp-work)',
  study: 'var(--exp-study)',
  side: 'var(--exp-side)',
};

const TYPE_ICONS: Record<ExperienceNodeType, string> = {
  entry: '📝',
  'review-case': '🔍',
  goal: '🎯',
  principle: '💡',
};

const TYPE_LABELS: Record<ExperienceNodeType, string> = {
  entry: '日常记录',
  'review-case': '复盘案例',
  goal: '目标',
  principle: '原则',
};

/* ── Sample Data ── */

const SAMPLE_NODES: ExperienceNode[] = [
  {
    id: 'sample-1',
    date: '2026-06-14',
    type: 'entry',
    title: '每天记录，积攒成长的原材料',
    summary: '开始把工作、学习、副业的事项逐一记下来。不是为了打卡，而是让每天的行动变得可追溯、可复盘。',
    tags: ['工作', '习惯养成'],
    category: 'work',
    isMilestone: true,
  },
  {
    id: 'sample-2',
    date: '2026-06-10',
    type: 'entry',
    title: '第一次做周复盘',
    summary: '把一周的记录串起来看，发现了几个重复出现的问题。比每天单独看清楚多了。',
    tags: ['学习', '认知升级'],
    category: 'study',
  },
  {
    id: 'sample-3',
    date: '2026-06-05',
    type: 'principle',
    title: '先完成再完美',
    summary: '反复因为追求完美而拖延后，提炼出这条原则：先把 60 分的版本拿出来，再迭代到 80 分。',
    tags: ['经验原则'],
  },
  {
    id: 'sample-4',
    date: '2026-05-28',
    type: 'review-case',
    title: '项目延期深度复盘',
    summary: '用五步法复盘了一次项目延期：目标是什么、差距在哪、根本原因是什么、下次怎么做。',
    tags: ['项目管理', '失败教训'],
    isMilestone: true,
  },
  {
    id: 'sample-5',
    date: '2026-05-20',
    type: 'goal',
    title: '月度目标：完成副业原型',
    summary: '设定了第一个明确的月度目标，并把每天的行动关联到这个目标上，追踪进度。',
    tags: ['副业', '目标管理'],
  },
  {
    id: 'sample-6',
    date: '2026-05-15',
    type: 'entry',
    title: '记录习惯稳定下来了',
    summary: '连续记录超过两周，逐渐形成了每天晚上花 10 分钟回顾的习惯。',
    tags: ['习惯养成', '成功经验'],
    category: 'study',
  },
];

/* ── Month grouping ── */

interface MonthGroup {
  monthKey: string;
  monthLabel: string;
  nodes: ExperienceNode[];
  entryCount: number;
  reviewCount: number;
}

function groupByMonth(nodes: ExperienceNode[]): MonthGroup[] {
  const map = new Map<string, ExperienceNode[]>();
  for (const node of nodes) {
    const key = node.date.slice(0, 7);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(node);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, monthNodes]) => ({
      monthKey: key,
      monthLabel: formatMonthLabel(key),
      nodes: monthNodes.sort((a, b) => b.date.localeCompare(a.date)),
      entryCount: monthNodes.filter((n) => n.type === 'entry').length,
      reviewCount: monthNodes.filter((n) => n.type === 'review-case').length,
    }));
}

/* ── Main Component ── */

export function ExperienceTimelineView() {
  const entries = useTimelineStore((s) => s.entries);
  const reviewCases = useTimelineStore((s) => s.reviewCases);
  const goals = useTimelineStore((s) => s.goals);
  const principles = useTimelineStore((s) => s.principles);
  const settings = useTimelineStore((s) => s.settings);

  const [activeType, setActiveType] = useState<'all' | ExperienceNodeType>('all');
  const [activeCategory, setActiveCategory] = useState<'all' | Category>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // AI 标题缓存：date → 生成的标题
  const [aiTitles, setAiTitles] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const generatingRef = useRef(false);

  // 找出需要 AI 生成标题的 entry（没有 lesson/target/reflection 的）
  const entriesNeedingTitles = useMemo(() => {
    return Object.values(entries)
      .filter((entry) => {
        if (!hasEntryContent(entry)) return false;
        // 如果已有 lesson 或 target，不需要 AI 标题
        if (firstMeaningfulLine(entry.review?.lesson)) return false;
        if (firstMeaningfulLine(entry.review?.target)) return false;
        // 如果已有 AI 标题缓存
        if (aiTitles[entry.date]) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [entries, aiTitles]);

  // 触发 AI 标题生成
  useEffect(() => {
    if (entriesNeedingTitles.length === 0 || generatingRef.current) return;
    if (!settings.llm.apiKey) return; // 没配置 API key 不调用

    generatingRef.current = true;
    setIsGenerating(true);

    const items = entriesNeedingTitles.map((entry) => ({
      date: entry.date,
      bullets: getAllBullets(entry).map((b) => b.text),
      reflection: entry.ai?.reflection,
    }));

    const provider = createOpenAICompatibleProvider(settings.llm);
    provider
      .generateExperienceTitles(items)
      .then((results) => {
        if (results.length > 0) {
          const newTitles: Record<string, string> = {};
          for (const r of results) {
            newTitles[r.date] = r.title;
          }
          setAiTitles((prev) => ({ ...prev, ...newTitles }));
        }
      })
      .catch(() => {
        // 静默失败，使用本地截断标题
      })
      .finally(() => {
        generatingRef.current = false;
        setIsGenerating(false);
      });
  }, [entriesNeedingTitles, settings.llm]);

  const allNodes = useMemo(() => {
    const generated = buildAllNodes(entries, reviewCases, goals, principles, aiTitles);
    return generated.length > 0 ? generated : SAMPLE_NODES;
  }, [entries, reviewCases, goals, principles, aiTitles]);

  const hasUserEntries = Object.values(entries).some(hasEntryContent);

  const filteredNodes = useMemo(() => {
    let result = allNodes;
    if (activeType !== 'all') {
      result = result.filter((n) => n.type === activeType);
    }
    if (activeCategory !== 'all') {
      result = result.filter((n) => n.category === activeCategory);
    }
    return result;
  }, [allNodes, activeType, activeCategory]);

  const monthGroups = useMemo(() => groupByMonth(filteredNodes), [filteredNodes]);

  const stats = useMemo(() => {
    const totalEntries = Object.values(entries).filter(hasEntryContent).length;
    const totalReviews = Object.keys(reviewCases).length;
    const totalGoals = Object.keys(goals).length;
    const totalPrinciples = Object.keys(principles).length;
    return { totalEntries, totalReviews, totalGoals, totalPrinciples };
  }, [entries, reviewCases, goals, principles]);

  const typeFilters: Array<{ key: 'all' | ExperienceNodeType; label: string; icon: string }> = [
    { key: 'all', label: '全部', icon: '✦' },
    { key: 'entry', label: '记录', icon: '📝' },
    { key: 'review-case', label: '复盘', icon: '🔍' },
    { key: 'goal', label: '目标', icon: '🎯' },
    { key: 'principle', label: '原则', icon: '💡' },
  ];

  const categoryFilters: Array<{ key: 'all' | Category; label: string }> = [
    { key: 'all', label: '全部' },
    { key: 'work', label: '工作' },
    { key: 'study', label: '学习' },
    { key: 'side', label: '副业' },
  ];

  return (
    <section className="exp-view" aria-labelledby="exp-title">
      {/* Hero */}
      <header className="exp-hero">
        <div className="exp-hero-content">
          <span className="exp-hero-kicker">Experience Timeline</span>
          <h2 id="exp-title">经历线</h2>
          <p className="exp-hero-desc">
            {hasUserEntries
              ? '把每日记录、复盘、目标和原则串联成一条可阅读的成长路线。'
              : '开始记录后，你的关键经历会自动沉淀到这里，形成一条属于你的成长路线。'}
          </p>
          {hasUserEntries && (
            <div className="exp-hero-stats">
              <div className="exp-stat">
                <span className="exp-stat-num">{stats.totalEntries}</span>
                <span className="exp-stat-label">条记录</span>
              </div>
              <div className="exp-stat">
                <span className="exp-stat-num">{stats.totalReviews}</span>
                <span className="exp-stat-label">次复盘</span>
              </div>
              <div className="exp-stat">
                <span className="exp-stat-num">{stats.totalGoals}</span>
                <span className="exp-stat-label">个目标</span>
              </div>
              <div className="exp-stat">
                <span className="exp-stat-num">{stats.totalPrinciples}</span>
                <span className="exp-stat-label">条原则</span>
              </div>
            </div>
          )}
        </div>
        <div className="exp-hero-deco" aria-hidden="true" />
      </header>

      {/* Generating indicator */}
      {isGenerating && (
        <div className="exp-generating">
          <span className="exp-generating-spinner" />
          正在用 AI 提炼经历标题…
        </div>
      )}

      {/* Filter rows */}
      <div className="exp-filter-section">
        <div className="exp-filters" role="tablist" aria-label="经历类型筛选">
          {typeFilters.map((f) => (
            <button
              key={f.key}
              role="tab"
              aria-selected={activeType === f.key}
              className={`exp-filter-btn ${activeType === f.key ? 'active' : ''}`}
              onClick={() => setActiveType(f.key)}
            >
              <span className="exp-filter-icon">{f.icon}</span>
              {f.label}
            </button>
          ))}
        </div>
        <div className="exp-filters exp-cat-filters" role="tablist" aria-label="分类筛选">
          {categoryFilters.map((f) => (
            <button
              key={f.key}
              role="tab"
              aria-selected={activeCategory === f.key}
              className={`exp-filter-btn exp-cat-btn ${activeCategory === f.key ? 'active' : ''} ${f.key !== 'all' ? `exp-cat-btn-${f.key}` : ''}`}
              onClick={() => setActiveCategory(f.key)}
            >
              {f.key !== 'all' && (
                <span
                  className="exp-cat-dot"
                  style={{ background: CATEGORY_COLORS[f.key] }}
                  aria-hidden="true"
                />
              )}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="exp-timeline" role="list">
        {monthGroups.map((group) => (
          <div className="exp-month-group" key={group.monthKey}>
            <div className="exp-month-header">
              <span className="exp-month-label">{group.monthLabel}</span>
              <span className="exp-month-count">
                {group.entryCount > 0 && `${group.entryCount} 条记录`}
                {group.entryCount > 0 && group.reviewCount > 0 && ' · '}
                {group.reviewCount > 0 && `${group.reviewCount} 次复盘`}
              </span>
            </div>

            <div className="exp-nodes">
              {group.nodes.map((node, index) => {
                const side: 'left' | 'right' = index % 2 === 0 ? 'left' : 'right';
                const isExpanded = expandedId === node.id;
                return (
                  <div
                    className={`exp-node exp-node-${side} ${node.isMilestone ? 'exp-node-milestone' : ''}`}
                    key={node.id}
                    role="listitem"
                    style={{ animationDelay: `${Math.min(index * 80, 480)}ms` }}
                  >
                    <div className="exp-node-date">
                      <span>{formatDayLabel(node.date)}</span>
                    </div>

                    <div className="exp-node-dot" aria-hidden="true">
                      <span className="exp-node-icon">{TYPE_ICONS[node.type]}</span>
                    </div>

                    <div
                      className={`exp-node-card ${isExpanded ? 'exp-node-expanded' : ''} ${node.category ? `exp-node-cat-${node.category}` : ''}`}
                      onClick={() => setExpandedId(isExpanded ? null : node.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setExpandedId(isExpanded ? null : node.id);
                        }
                      }}
                    >
                      <div className="exp-node-type-badge">
                        {TYPE_LABELS[node.type]}
                        {node._aiTitle && <span className="exp-node-ai-badge">AI</span>}
                      </div>
                      <h3 className="exp-node-title">{node.title}</h3>
                      <p className="exp-node-summary">
                        {isExpanded ? node.summary : truncate(node.summary, 80)}
                      </p>
                      {node.tags.length > 0 && (
                        <div className="exp-node-tags">
                          {node.tags.map((tag) => (
                            <span key={tag} className="exp-node-tag">{tag}</span>
                          ))}
                        </div>
                      )}
                      {node.category && (
                        <div
                          className="exp-node-cat-line"
                          style={{ background: CATEGORY_COLORS[node.category] }}
                          aria-hidden="true"
                        />
                      )}
                      <span className="exp-node-expand-hint">
                        {isExpanded ? '收起' : '展开'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {filteredNodes.length === 0 && (
          <div className="exp-empty">
            <span className="exp-empty-icon">✦</span>
            <p>暂无匹配的经历节点</p>
            <p className="exp-empty-hint">试试切换筛选条件，或开始记录来积累你的经历线。</p>
          </div>
        )}
      </div>
    </section>
  );
}

/* ── Node builders ── */

function buildAllNodes(
  entries: Record<string, Entry>,
  reviewCases: Record<string, ReviewCase>,
  goals: Record<string, Goal>,
  principles: Record<string, Principle>,
  aiTitles: Record<string, string>,
): ExperienceNode[] {
  const nodes: ExperienceNode[] = [];

  for (const entry of Object.values(entries)) {
    if (!hasEntryContent(entry)) continue;
    nodes.push(buildEntryNode(entry, aiTitles));
  }

  for (const rc of Object.values(reviewCases)) {
    nodes.push(buildReviewCaseNode(rc));
  }

  for (const goal of Object.values(goals)) {
    nodes.push(buildGoalNode(goal));
  }

  for (const p of Object.values(principles)) {
    nodes.push(buildPrincipleNode(p));
  }

  nodes.sort((a, b) => b.date.localeCompare(a.date));

  const first = nodes[0];
  if (first) first.isMilestone = true;

  return nodes.slice(0, 50);
}

function buildEntryNode(entry: Entry, aiTitles: Record<string, string>): ExperienceNode {
  const lesson = firstMeaningfulLine(entry.review?.lesson);
  const target = firstMeaningfulLine(entry.review?.target);

  // 优先级：AI生成标题 > review.lesson > review.target > 第一条bullet
  const aiTitle = aiTitles[entry.date];
  const rawTitle = lesson || target || getAllBullets(entry)[0]?.text.trim() || '留下了一次记录';
  const title = aiTitle || cleanTitle(rawTitle);

  const summary = buildEntrySummary(entry);
  const tags = buildEntryTags(entry);
  const primaryCat = getPrimaryCategory(entry);

  return {
    id: `entry-${entry.id}`,
    date: entry.date,
    type: 'entry',
    title,
    summary,
    tags,
    category: primaryCat,
    isMilestone: Boolean(entry.review?.lesson || entry.ai?.reflection),
    _aiTitle: Boolean(aiTitle),
  };
}

function buildReviewCaseNode(rc: ReviewCase): ExperienceNode {
  const firstConclusion = rc.conclusions[0];
  const summary = firstConclusion
    ? firstConclusion.content
    : `从 ${rc.startDate} 到 ${rc.endDate} 的复盘，包含 ${rc.steps.evaluation.rows.length} 个偏差分析。`;

  return {
    id: `rc-${rc.id}`,
    date: rc.startDate,
    type: 'review-case',
    title: cleanTitle(rc.title),
    summary: truncate(summary, 120),
    tags: [rc.type === 'event' ? '事件复盘' : rc.type === 'theme' ? '主题复盘' : '复盘'],
    isMilestone: rc.conclusions.length > 0,
  };
}

function buildGoalNode(goal: Goal): ExperienceNode {
  const statusMap: Record<string, string> = {
    active: '进行中',
    done: '已完成',
    paused: '已暂停',
    dropped: '已放弃',
  };

  const goalStatusLabel = statusMap[goal.status] ?? '未知';

  return {
    id: `goal-${goal.id}`,
    date: goal.startDate,
    type: 'goal',
    title: cleanTitle(goal.title),
    summary: goal.notes || `${goalStatusLabel}，关联 ${goal.linkedBullets.length} 条行动记录。`,
    tags: [goalStatusLabel, goal.period === 'week' ? '周目标' : '月目标'],
    isMilestone: goal.status === 'done',
  };
}

function buildPrincipleNode(p: Principle): ExperienceNode {
  const statusMap: Record<string, string> = {
    unverified: '未验证',
    testing: '验证中',
    validated: '已验证',
    invalidated: '已失效',
  };
  const principleStatusLabel = statusMap[p.verificationStatus] ?? '未知';

  return {
    id: `principle-${p.id}`,
    date: p.createdAt.slice(0, 10),
    type: 'principle',
    title: cleanTitle(p.title),
    summary: p.content,
    tags: [principleStatusLabel],
    isMilestone: p.verificationStatus === 'validated',
  };
}

/* ── Entry helpers ── */

function hasEntryContent(entry: Entry): boolean {
  return (
    getAllBullets(entry).length > 0 ||
    Boolean(entry.review?.target || entry.review?.lesson || entry.ai?.reflection)
  );
}

function getAllBullets(entry: Entry) {
  return [...entry.bullets.work, ...entry.bullets.study, ...entry.bullets.side];
}

function getPrimaryCategory(entry: Entry): Category {
  const counts = {
    work: entry.bullets.work.length,
    study: entry.bullets.study.length,
    side: entry.bullets.side.length,
  };
  if (counts.work >= counts.study && counts.work >= counts.side) return 'work';
  if (counts.study >= counts.side) return 'study';
  return 'side';
}

function buildEntrySummary(entry: Entry): string {
  const parts: string[] = [];
  if (entry.review?.gap) parts.push(`差距：${entry.review.gap}`);
  if (entry.review?.reason) parts.push(`原因：${entry.review.reason}`);
  if (entry.ai?.reflection) parts.push(entry.ai.reflection);

  if (parts.length > 0) return truncate(parts.join(' '), 150);

  const bullets = getAllBullets(entry);
  if (bullets.length > 0) {
    return truncate(`记录了 ${bullets.length} 条事项：${bullets.map((b) => b.text).join('；')}`, 150);
  }

  return '这一天留下了一个节点。';
}

function buildEntryTags(entry: Entry): string[] {
  const tags = new Set<string>();

  (Object.entries(entry.bullets) as [Category, Entry['bullets'][Category]][]).forEach(([cat, bullets]) => {
    if (bullets.length > 0) tags.add(CATEGORY_LABELS[cat]);
  });

  entry.review?.tags?.forEach((tag: ReviewTag) => {
    tags.add(REVIEW_TAG_LABELS[tag]);
  });

  if (entry.ai?.reflection) tags.add('AI 洞察');

  return Array.from(tags).slice(0, 4);
}

/* ── Formatting helpers ── */

/**
 * 清洗标题：去掉多余的前缀符号，截断到合理长度。
 * 当 AI 标题不可用时作为降级方案。
 */
function cleanTitle(raw: string, maxLen = 28): string {
  let text = raw.replace(/^[\s\-*•·]+/, '').trim();
  if (text.length <= maxLen) return text;

  const punctIdx = findBreakPoint(text, maxLen);
  if (punctIdx > 6) {
    return text.slice(0, punctIdx + 1).trim();
  }

  const spaceIdx = text.lastIndexOf(' ', maxLen);
  if (spaceIdx > 8) {
    return text.slice(0, spaceIdx).trim() + '…';
  }

  return text.slice(0, maxLen).trim() + '…';
}

function findBreakPoint(text: string, maxLen: number): number {
  const punctuation = '，。、；：！？,.:;!?';
  let best = -1;
  for (let i = 0; i < Math.min(text.length, maxLen); i++) {
    const ch = text.charAt(i);
    if (punctuation.includes(ch)) {
      best = i;
    }
  }
  return best;
}

function formatMonthLabel(ym: string): string {
  const parts = ym.split('-');
  const year = parts[0] ?? ym;
  const month = parts[1] ?? '01';
  const monthNames = ['', '一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
  return `${year} 年 ${monthNames[parseInt(month, 10)] ?? ''}`;
}

function formatDayLabel(date: string): string {
  const parts = date.split('-');
  const month = parts[1] ?? '01';
  const day = parts[2] ?? '01';
  return `${parseInt(month, 10)}月${parseInt(day, 10)}日`;
}

function firstMeaningfulLine(value?: string): string {
  return value?.split('\n').map((l) => l.trim()).find(Boolean) || '';
}

function truncate(value: string, max: number): string {
  const oneLine = value.replace(/\s+/g, ' ').trim();
  return oneLine.length > max ? `${oneLine.slice(0, max)}…` : oneLine;
}
