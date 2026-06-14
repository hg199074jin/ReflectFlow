import { useTimelineStore } from '../../store';
import { MarkdownEditor } from '../primitives/MarkdownEditor';
import type { Category } from '../../lib/schema';

interface EntryEditorProps {
  date: string;
}

const categories: { key: Category; label: string }[] = [
  { key: 'work', label: '工作' },
  { key: 'study', label: '学习' },
  { key: 'side', label: '副业' },
];

export function EntryEditor({ date }: EntryEditorProps) {
  const entry = useTimelineStore((s) => s.entries[date]);
  const upsertEntryText = useTimelineStore((s) => s.upsertEntryText);

  return (
    <div className="entry-editor">
      {categories.map((cat) => {
        const text = entry?.rawText?.[cat.key] ?? '';

        return (
          <div key={cat.key} className="category-section">
            <span className="category-label">{cat.label}</span>
            <MarkdownEditor
              value={text}
              onChange={(value) => upsertEntryText(date, cat.key, value)}
              placeholder={`Add ${cat.label.toLowerCase()} bullets...`}
              rows={2}
            />
          </div>
        );
      })}
    </div>
  );
}
