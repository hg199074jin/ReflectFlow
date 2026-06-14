import { useState } from 'react';
import { useTimelineStore } from '../../store';
import type { Principle } from '../../lib/schema';
import { VERIFICATION_STATUS_LABELS } from '../../lib/schema';
import { filterPrinciples, getPrincipleStats } from './principleUtils';
import { PrincipleCard } from './PrincipleCard';

export function PrinciplesView() {
  const { principles, upsertPrinciple, deletePrinciple } = useTimelineStore();
  const [statusFilter, setStatusFilter] = useState<Principle['verificationStatus'] | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const allPrinciples = Object.values(principles);
  const filteredPrinciples = filterPrinciples(allPrinciples, {
    verificationStatus: statusFilter === 'all' ? undefined : statusFilter,
    searchQuery,
  });

  const stats = getPrincipleStats(allPrinciples);

  const handleStatusChange = (principleId: string, newStatus: Principle['verificationStatus']) => {
    const principle = principles[principleId];
    if (!principle) return;

    upsertPrinciple({
      ...principle,
      verificationStatus: newStatus,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDelete = (principleId: string) => {
    if (confirm('确定删除此原则？')) {
      deletePrinciple(principleId);
    }
  };

  return (
    <div className="principles-view">
      <div className="principles-header">
        <h2>原则库</h2>
        <div className="principles-stats">
          <span>共 {stats.total} 条原则</span>
          <span>已验证 {stats.byStatus.validated} 条</span>
        </div>
      </div>

      <p className="principles-description">
        原则库保存通过质量检查的复盘结论，用于指导未来的行动。
      </p>

      <div className="principles-filters">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索原则..."
          className="principles-search"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as Principle['verificationStatus'] | 'all')}
        >
          <option value="all">全部状态</option>
          {Object.entries(VERIFICATION_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="principles-list">
        {filteredPrinciples.length === 0 ? (
          <div className="principles-empty">
            <p>暂无原则</p>
            <p className="hint">在复盘案例中将高质量结论沉淀为原则</p>
          </div>
        ) : (
          filteredPrinciples.map((principle) => (
            <PrincipleCard
              key={principle.id}
              principle={principle}
              onStatusChange={(newStatus) => handleStatusChange(principle.id, newStatus)}
              onDelete={() => handleDelete(principle.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
