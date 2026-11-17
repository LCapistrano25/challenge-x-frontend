import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import styles from './MemberEvaluation.module.css';

export type EvaluationTagTone = 'primary' | 'neutral' | 'positive';

const TONE_CLASS: Record<EvaluationTagTone, string | undefined> = {
  primary: styles.tagPrimary,
  neutral: styles.tagNeutral,
  positive: styles.tagPositive,
};

/** Figma: "Situação" — etiqueta arredondada. */
export function EvaluationTag({
  tone,
  children,
}: {
  tone: EvaluationTagTone;
  children: ReactNode;
}) {
  return <span className={cn(styles.tag, TONE_CLASS[tone])}>{children}</span>;
}
