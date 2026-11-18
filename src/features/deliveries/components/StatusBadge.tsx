import { cn } from '@/shared/lib/cn';
import { STATUS_LABEL } from '../lib/delivery-view';
import type { DeliveryStatus } from '../types';
import styles from './StatusBadge.module.css';

export function StatusBadge({ status }: { status: DeliveryStatus }) {
  return <span className={cn(styles.badge, styles[status])}>{STATUS_LABEL[status]}</span>;
}
