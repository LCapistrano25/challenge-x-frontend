import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import styles from './Badge.module.css';

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'progress';

export interface BadgeProps {
  children: ReactNode;
  /**
   * neutral: cinza ("Em breve") · brand: azul sobre Background 50 (tags de notícia)
   * success: verde ("Concluída") · progress: azul claro ("Em andamento")
   */
  tone?: BadgeTone;
  /** tag: cantos de 4px (notícias) · pill: totalmente arredondado (cronograma). */
  shape?: 'tag' | 'pill';
  className?: string;
}

/** Selo/etiqueta de texto curto (Figma: "Badge" das notícias e status das etapas). */
export function Badge({ children, tone = 'neutral', shape = 'pill', className }: BadgeProps) {
  return (
    <span className={cn(styles.badge, styles[tone], styles[shape], className)}>{children}</span>
  );
}
