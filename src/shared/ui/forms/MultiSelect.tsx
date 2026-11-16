import { useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { IconChevronDown } from '../icons';
import field from './Field.module.css';
import styles from './MultiSelect.module.css';
import type { SelectOption } from './Select';

export interface MultiSelectProps {
  label: string;
  options: SelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
  /** Texto quando não há opções (ex.: lista ainda vazia). */
  emptyText?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

function summarize(options: SelectOption[], value: string[]): string {
  const labels = options.filter((o) => value.includes(o.value)).map((o) => o.label);
  if (labels.length <= 2) return labels.join(', ');
  return `${labels.length} selecionados`;
}

/**
 * Seleção múltipla com lista de checkboxes nativos (acessível por teclado e leitor de tela).
 * Fecha com Esc, clique fora ou quando o foco sai do componente.
 */
export function MultiSelect({
  label,
  options,
  value,
  onChange,
  placeholder = 'Selecione',
  hint,
  error,
  emptyText = 'Nenhuma opção disponível.',
  disabled,
  id,
  className,
}: MultiSelectProps) {
  const autoId = useId();
  const baseId = id ?? autoId;
  const labelId = `${baseId}-label`;
  const valueId = `${baseId}-value`;
  const panelId = `${baseId}-panel`;
  const hintId = `${baseId}-hint`;
  const errorId = `${baseId}-error`;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  function toggleOption(optionValue: string) {
    onChange(
      value.includes(optionValue)
        ? value.filter((v) => v !== optionValue)
        : [...value, optionValue],
    );
  }

  const summary = summarize(options, value);
  const describedBy = [hint && !error && hintId, error && errorId].filter(Boolean).join(' ');

  return (
    <div className={cn(field.field, className)}>
      <span id={labelId} className={field.label}>
        {label}
      </span>
      <div
        ref={rootRef}
        className={styles.root}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && open) {
            setOpen(false);
            triggerRef.current?.focus();
          }
        }}
        onBlur={(event) => {
          if (!rootRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
        }}
      >
        <button
          ref={triggerRef}
          type="button"
          id={baseId}
          className={cn(styles.trigger, error && field.invalid)}
          aria-haspopup="true"
          aria-expanded={open}
          aria-controls={panelId}
          aria-labelledby={`${labelId} ${valueId}`}
          aria-describedby={describedBy || undefined}
          aria-invalid={error ? true : undefined}
          disabled={disabled}
          onClick={() => setOpen((current) => !current)}
        >
          <span id={valueId} className={cn(styles.value, !summary && styles.placeholder)}>
            {summary || placeholder}
          </span>
          <IconChevronDown size={16} className={styles.chevron} aria-hidden="true" />
        </button>
        {open && (
          <div id={panelId} role="group" aria-labelledby={labelId} className={styles.panel}>
            {options.length === 0 && <p className={styles.empty}>{emptyText}</p>}
            {options.map((option) => (
              <label key={option.value} className={styles.option}>
                <input
                  type="checkbox"
                  checked={value.includes(option.value)}
                  disabled={option.disabled}
                  onChange={() => toggleOption(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>
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
