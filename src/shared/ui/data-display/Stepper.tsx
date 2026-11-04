import type { CSSProperties } from 'react';
import { cn } from '@/shared/lib/cn';
import { IconCheck } from '../icons';
import styles from './Stepper.module.css';

export type StepStatus = 'done' | 'current' | 'upcoming';

export interface Step {
  id: string;
  label: string;
  date: string; // já formatada, ex.: "15/05"
  status: StepStatus; // quem define é o backend (status automático por data)
  progress?: number; // 0 a 100, só para a etapa atual: preenche a linha até a próxima
}

const ROTULO: Record<StepStatus, string> = {
  done: 'Concluída',
  current: 'Em andamento',
  upcoming: 'Em breve',
};

// Horizontal no desktop, vertical no celular.
export function Stepper({ steps, label = 'Cronograma' }: { steps: Step[]; label?: string }) {
  return (
    <ol className={styles.stepper} aria-label={label}>
      {steps.map((s) => (
        <li
          key={s.id}
          className={cn(styles.step, styles[s.status])}
          style={
            s.progress !== undefined ? ({ '--p': `${s.progress}%` } as CSSProperties) : undefined
          }
          aria-current={s.status === 'current' ? 'step' : undefined}
        >
          <span className={styles.dot}>
            {s.status === 'done' && <IconCheck size={15} strokeWidth={3.2} />}
          </span>
          <time className={styles.date}>{s.date}</time>
          <span className={styles.name}>{s.label}</span>
          <span className={styles.state}>{ROTULO[s.status]}</span>
        </li>
      ))}
    </ol>
  );
}
