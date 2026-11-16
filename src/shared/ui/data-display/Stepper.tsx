import type { CSSProperties } from 'react';
import { cn } from '@/shared/lib/cn';
import { IconCheck } from '../icons';
import { Badge, type BadgeTone } from './Badge';
import styles from './Stepper.module.css';
import timeline from './Stepper.timeline.module.css';

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

const BADGE_TONE: Record<StepStatus, BadgeTone> = {
  done: 'success',
  current: 'progress',
  upcoming: 'neutral',
};

export interface StepperProps {
  steps: Step[];
  label?: string;
  /**
   * default: visual original (ponto, data e nome).
   * timeline: cronograma do Figma — data acima, trilho verde/cinza, nome e selo abaixo.
   */
  variant?: 'default' | 'timeline';
}

/** Variante "timeline" (Figma: componente Cronograma). */
function TimelineStepper({ steps, label }: { steps: Step[]; label: string }) {
  return (
    <ol
      className={timeline.timeline}
      aria-label={label}
      style={{ '--steps': steps.length } as CSSProperties}
    >
      {steps.map((s) => (
        <li
          key={s.id}
          className={cn(timeline.step, timeline[s.status])}
          aria-current={s.status === 'current' ? 'step' : undefined}
        >
          <time className={timeline.date}>{s.date}</time>
          <span className={timeline.marker} aria-hidden="true">
            {s.status === 'done' && <IconCheck size={18} strokeWidth={2.5} />}
          </span>
          <span className={timeline.body}>
            <span className={timeline.label}>{s.label}</span>
            <Badge tone={BADGE_TONE[s.status]}>{ROTULO[s.status]}</Badge>
          </span>
        </li>
      ))}
    </ol>
  );
}

// Horizontal no desktop, vertical no celular.
export function Stepper({ steps, label = 'Cronograma', variant = 'default' }: StepperProps) {
  if (variant === 'timeline') return <TimelineStepper steps={steps} label={label} />;

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
