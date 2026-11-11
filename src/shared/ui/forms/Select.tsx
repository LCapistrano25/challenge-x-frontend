import { forwardRef, useId, type SelectHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';
import field from './Field.module.css';
import styles from './Select.module.css';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label: string;
  options: SelectOption[];
  placeholder?: string;
  hint?: string;
  error?: string;
}

// Usa o <select> nativo de propósito: é acessível e abre o seletor do próprio celular.
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, options, placeholder, hint, error, id, className, value, defaultValue, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined;

  // Com placeholder, o campo começa vazio em vez de já mostrar a primeira opção.
  const inicial =
    value === undefined ? (defaultValue ?? (placeholder ? '' : undefined)) : undefined;

  return (
    <div className={cn(field.field, className)}>
      <label htmlFor={inputId} className={field.label}>
        {label}
      </label>
      <select
        ref={ref}
        id={inputId}
        value={value}
        defaultValue={inicial}
        className={cn(field.input, styles.select, error && field.invalid)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
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
});
