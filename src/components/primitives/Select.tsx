import { clsx } from 'clsx';
import type { SelectHTMLAttributes, ReactNode } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  children: ReactNode;
  error?: string;
}

export function Select({ label, children, error, id, className, ...props }: SelectProps) {
  const selectId = id || label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className={clsx('select-wrapper', error && 'select-error', className)}>
      <label htmlFor={selectId} className="select-label">{label}</label>
      <select id={selectId} className="select-field" {...props}>
        {children}
      </select>
      {error && <span className="select-error-text">{error}</span>}
    </div>
  );
}
