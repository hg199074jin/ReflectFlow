import { clsx } from 'clsx';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, id, className, ...props }: InputProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className={clsx('input-wrapper', error && 'input-error', className)}>
      <label htmlFor={inputId} className="input-label">{label}</label>
      <input id={inputId} className="input-field" aria-invalid={!!error} {...props} />
      {error && <span className="input-error-text">{error}</span>}
    </div>
  );
}
