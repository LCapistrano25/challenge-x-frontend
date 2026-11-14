import { ButtonLink } from '@/shared/ui';
import { cn } from '@/shared/lib/cn';
import type { EditionSummary } from '@/shared/types/api';
import { IconFileText } from './icons';
import styles from './PublicContent.module.css';

export interface EditalCardProps {
  edition: EditionSummary;
  noticeUrl: string;
  className?: string;
}

/** Card de download do edital oficial da edição. */
export function EditalCard({ edition, noticeUrl, className }: EditalCardProps) {
  return (
    <section className={cn(styles.card, styles.notice, className)} aria-labelledby="notice-title">
      <div className={styles.noticeHeader}>
        <IconFileText className={styles.icon} />
        <div className={styles.noticeText}>
          <h2 id="notice-title" className={styles.cardTitle}>
            Baixar edital em PDF
          </h2>
          <p className={styles.cardText}>
            Versão oficial da edição {edition.year} para consulta e impressão.
          </p>
        </div>
      </div>
      <ButtonLink to={noticeUrl} size="large" target="_blank" rel="noopener noreferrer">
        Baixar edital em PDF
      </ButtonLink>
    </section>
  );
}
