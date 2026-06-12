import { useTimelineStore } from '../../store';
import { formatBulletText } from '../../lib/text';
import { MarkdownEditor } from '../primitives/MarkdownEditor';
import type { Category } from '../../lib/schema';

interface EntryEditorProps {
  date: string;
}

const categories: { key: Category; label: string }[] = [
  { key: 'work', label: 'Work' },
  { key: 'study', label: 'Study' },
  { key: 'side', label: 'Side' },
];

export function EntryEditor({ date }: EntryEditorProps) {
  const entry = useTimelineStore((s) => s.entries[date]);
  const upsertEntryText = useTimelineStore((s) => s.upsertEntryText);

  return (
    <div className="entry-editor">
      {categories.map((cat) => {
        const bullets = entry?.bullets[cat.key] ?? [];
        const text = formatBulletText(bullets);

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
