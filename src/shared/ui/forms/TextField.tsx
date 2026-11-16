import { useId, type InputHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';
import { Input } from '../Input/Input';
import field from './Field.module.css';

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

/** Campo de texto completo: rótulo, dica e mensagem de erro ligados ao input por ARIA. */
export function TextField({ label, hint, error, id, className, ...rest }: TextFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = [hint && !error && hintId, error && errorId].filter(Boolean).join(' ');

  return (
    <div className={cn(field.field, className)}>
      <label htmlFor={inputId} className={field.label}>
        {label}
      </label>
      <Input
        {...rest}
        id={inputId}
        invalid={Boolean(error)}
        aria-describedby={describedBy || undefined}
      />
      {hint && !error && (
        <p id={hintId} className={field.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className={field.error}>
          {error}
        </p>
      )}
    </div>
  );
}
