import { Link } from 'react-router-dom';
import { cn } from '@/shared/lib/cn';
import { Avatar, toneAt } from '@/shared/ui';
import { formatRelativeTime } from '../lib/relative-time';
import type { Notification } from '../types';
import styles from './NotificationsCard.module.css';

export interface NotificationsCardProps {
  notifications: Notification[];
  className?: string;
}

/** Lista curta das notificações mais recentes (GET /api/notifications). */
export function NotificationsCard({ notifications, className }: NotificationsCardProps) {
  return (
    <section className={cn(styles.card, className)} aria-labelledby="notifications-title">
      <h2 id="notifications-title" className={styles.title}>
        Notificações
      </h2>
      {notifications.length === 0 ? (
        <p className={styles.empty}>Nenhuma notificação por enquanto.</p>
      ) : (
        <ul className={styles.list}>
          {notifications.map((item, index) => (
            <li key={item.id} className={cn(styles.item, !item.read_at && styles.unread)}>
              <span className={styles.icon}>
                <Avatar name={item.title} tone={toneAt(index)} />
                {!item.read_at && <span className="sr-only">Não lida.</span>}
              </span>
              <span className={styles.text}>
                <span className={styles.name}>
                  {item.link ? (
                    <Link to={item.link} className={styles.link}>
                      {item.title}
                    </Link>
                  ) : (
                    item.title
                  )}
                </span>
                <span className={styles.message}>{item.message}</span>
              </span>
              <time className={styles.time} dateTime={item.created_at}>
                {formatRelativeTime(item.created_at)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
