import { cn } from '@/shared/lib/cn';
import styles from './ProgressBar.module.css';

export interface ProgressBarProps {
  value: number; // 0 a 100
  label: string; // descrição para leitor de tela
  size?: 'sm' | 'md';
  className?: string;
}

export function ProgressBar({ value, label, size = 'md', className }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn(styles.bar, styles[size], className)}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
    >
      <i className={styles.fill} style={{ width: `${pct}%` }} />
    </div>
  );
}
