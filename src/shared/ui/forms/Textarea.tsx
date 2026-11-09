import { forwardRef, useId, useState, type ChangeEvent, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';
import field from '../Input.module.css'; // reaproveita o visual de campo do Input
import styles from './Textarea.module.css';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    label,
    hint,
    error,
    id,
    className,
    maxLength,
    value,
    defaultValue,
    onChange,
    rows = 4,
    ...rest
  },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined;

  // Contador de caracteres (funciona controlado ou não).
  const [digitados, setDigitados] = useState(String(defaultValue ?? '').length);
  const total = value !== undefined ? String(value).length : digitados;

  function handleChange(e: ChangeEvent<HTMLTextAreaElement>) {
    setDigitados(e.target.value.length);
    onChange?.(e);
  }

  return (
    <div className={cn(field.field, className)}>
      <label htmlFor={inputId} className={field.label}>
        {label}
      </label>
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        maxLength={maxLength}
        value={value}
        defaultValue={defaultValue}
        onChange={handleChange}
        className={cn(field.input, styles.textarea, error && field.invalid)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
      <div className={styles.footer}>
        <div>
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
        {maxLength && (
          <span className={styles.counter}>
            {total}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
});
