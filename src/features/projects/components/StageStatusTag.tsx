import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import type { StageTone } from '../lib/deliverables';
import styles from './TeamProject.module.css';

const TONE_CLASS: Record<StageTone, string | undefined> = {
  neutral: styles.tagNeutral,
  primary: styles.tagPrimary,
  positive: styles.tagPositive,
  attention: styles.tagAttention,
  danger: styles.tagDanger,
};

/** Figma: "Situação" — etiqueta arredondada (Aprovada, Ajustes solicitados, Em andamento…). */
export function StageStatusTag({ tone, children }: { tone: StageTone; children: ReactNode }) {
  return <span className={cn(styles.tag, TONE_CLASS[tone])}>{children}</span>;
}
