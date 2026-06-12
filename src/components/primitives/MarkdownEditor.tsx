import { clsx } from 'clsx';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export function MarkdownEditor({ value, onChange, placeholder, rows = 4, className }: MarkdownEditorProps) {
  return (
    <textarea
      className={clsx('markdown-editor', className)}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
    />
  );
}
