import { clsx } from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
}

export function Button({ children, variant = 'primary', loading, disabled, className, ...props }: ButtonProps) {
  return (
    <button
      className={clsx('btn', `btn-${variant}`, loading && 'btn-loading', className)}
      disabled={disabled || loading}
      {...props}
    >
      {children}
    </button>
  );
}
