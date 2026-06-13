import { clsx } from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md';
  loading?: boolean;
}

export function Button({ children, variant = 'primary', size = 'md', loading, disabled, className, ...props }: ButtonProps) {
  return (
    <button
      className={clsx('btn', `btn-${variant}`, size === 'sm' && 'btn-sm', loading && 'btn-loading', className)}
      disabled={disabled || loading}
      {...props}
    >
      {children}
    </button>
  );
}
