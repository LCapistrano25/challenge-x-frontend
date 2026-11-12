import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Ocupa toda a largura do container (ex.: botão de envio de formulário). */
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'medium',
  loading = false,
  fullWidth = false,
  className,
  type = 'button',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={cn(
        styles.button,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        className,
      )}
      // `disabled` vem depois do spread: `loading` nunca pode ser sobrescrito por props.
      disabled={loading || disabled}
      aria-busy={loading || undefined}
    />
  );
}
