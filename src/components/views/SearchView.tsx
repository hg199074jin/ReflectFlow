import { useState, useMemo } from 'react';
import { useTimelineStore } from '../../store';
import type { Entry, Category } from '../../lib/schema';

interface SearchResult {
  date: string;
  category: Category;
  text: string;
  matchIndex: number;
}

const CATEGORY_LABELS: Record<Category, string> = {
  work: '工作',
  study: '学习',
  side: '副业',
};

function searchEntries(entries: Record<string, Entry>, query: string): SearchResult[] {
  if (!query.trim()) return [];

  const lowerQuery = query.toLowerCase();
  const results: SearchResult[] = [];

  for (const entry of Object.values(entries)) {
    for (const [category, bullets] of Object.entries(entry.bullets) as [Category, Array<{ id: string; text: string }>][]) {
      for (const bullet of bullets) {
        const idx = bullet.text.toLowerCase().indexOf(lowerQuery);
        if (idx !== -1) {
          results.push({
            date: entry.date,
            category,
            text: bullet.text,
            matchIndex: idx,
          });
        }
      }
    }

    // Search in AI reflection
    if (entry.ai?.reflection) {
      const idx = entry.ai.reflection.toLowerCase().indexOf(lowerQuery);
      if (idx !== -1) {
        results.push({
          date: entry.date,
          category: 'work',
          text: entry.ai.reflection,
          matchIndex: idx,
        });
      }
    }

    // Search in review content
    if (entry.review) {
      const reviewFields = [entry.review.target, entry.review.gap, entry.review.reason, entry.review.lesson].filter(Boolean);
      for (const field of reviewFields) {
        if (field) {
          const idx = field.toLowerCase().indexOf(lowerQuery);
          if (idx !== -1) {
            results.push({
              date: entry.date,
              category: 'work',
              text: field,
              matchIndex: idx,
            });
          }
        }
      }
    }
  }

  // Sort by date descending
  results.sort((a, b) => b.date.localeCompare(a.date));
  return results;
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const idx = lowerText.indexOf(lowerQuery);
  if (idx === -1) return text;

  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + query.length);
  const after = text.slice(idx + query.length);

  return (
    <>
      {before}
      <mark>{match}</mark>
      {after}
    </>
  );
}

export function SearchView() {
  const entries = useTimelineStore((s) => s.entries);
  const [query, setQuery] = useState('');

  const results = useMemo(() => searchEntries(entries, query), [entries, query]);

  return (
    <div className="search-view">
      <div className="search-input-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="搜索记录、复盘、反思..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      {query.trim() && (
        <p className="search-results-count">
          找到 {results.length} 条结果
        </p>
      )}

      {query.trim() && results.length === 0 && (
        <p className="search-empty">未找到 &ldquo;{query}&rdquo; 相关结果</p>
      )}

      {results.map((result, i) => (
        <div key={`${result.date}-${result.category}-${i}`} className="search-result-item">
          <div className="search-result-date">
            {result.date}
            <span className="search-result-category">{CATEGORY_LABELS[result.category]}</span>
          </div>
          <div className="search-result-text">
            {highlightMatch(result.text, query)}
          </div>
        </div>
      ))}

      {!query.trim() && (
        <p className="search-empty">输入关键词，搜索所有记录中的内容。</p>
      )}
    </div>
  );
}
