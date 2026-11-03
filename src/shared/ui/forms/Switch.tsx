import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import styles from './Switch.module.css';

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'role'> {
  label: ReactNode;
}

// Para estados do tipo Ativo/Inativo (cursos, desafios, categorias, domínios).
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { label, id, className, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <label htmlFor={inputId} className={cn(styles.label, className)}>
      <input
        ref={ref}
        id={inputId}
        type="checkbox"
        role="switch"
        className={styles.track}
        {...rest}
      />
      <span>{label}</span>
    </label>
  );
});
