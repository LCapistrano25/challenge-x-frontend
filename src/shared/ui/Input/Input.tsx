import type { InputHTMLAttributes } from 'react';
import './Input.css';

type InputSize = 'small' | 'medium' | 'large';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  inputSize?: InputSize;
  invalid?: boolean;
}

export function Input({
  inputSize = 'medium',
  invalid = false,
  className = '',
  ...props
}: InputProps) {
  const classes = ['input', `input--${inputSize}`, invalid ? 'input--invalid' : '', className]
    .filter(Boolean)
    .join(' ');

  return <input {...props} className={classes} aria-invalid={invalid || props['aria-invalid']} />;
}
