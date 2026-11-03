import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { IconAlert, IconCheckCircle, IconInfo } from '../icons';
import styles from './Alert.module.css';

export type AlertTone = 'info' | 'success' | 'warning' | 'danger';

export interface AlertProps {
  tone?: AlertTone;
  title?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

const ICONES = { info: IconInfo, success: IconCheckCircle, warning: IconAlert, danger: IconAlert };

// Mensagens fixas na tela: "prazo encerrado", "equipe incompleta", "nota pendente"...
export function Alert({ tone = 'info', title, children, action, className }: AlertProps) {
  const Icon = ICONES[tone];
  return (
    <div
      className={cn(styles.alert, styles[tone], className)}
      role={tone === 'danger' ? 'alert' : 'status'}
    >
      <Icon size={20} className={styles.icon} />
      <div className={styles.text}>
        {title && <strong className={styles.title}>{title}</strong>}
        <div>{children}</div>
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
