import type { InputHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';
import styles from './Input.module.css';

type InputSize = 'small' | 'medium' | 'large';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  inputSize?: InputSize;
  invalid?: boolean;
}

export function Input({ inputSize = 'medium', invalid = false, className, ...props }: InputProps) {
  return (
    <input
      {...props}
      className={cn(styles.input, styles[inputSize], invalid && styles.invalid, className)}
      aria-invalid={invalid || props['aria-invalid']}
    />
  );
}
