import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import styles from './MyTeam.module.css';

export type TeamTagTone = 'primary' | 'neutral' | 'attention';

const TONE_CLASS: Record<TeamTagTone, string | undefined> = {
  primary: styles.tagPrimary,
  neutral: styles.tagNeutral,
  attention: styles.tagAttention,
};

/** Figma: "Situação" — etiqueta arredondada (Líder, Participante, Sem líder, Solicitação…). */
export function TeamTag({ tone, children }: { tone: TeamTagTone; children: ReactNode }) {
  return <span className={cn(styles.tag, TONE_CLASS[tone])}>{children}</span>;
}
