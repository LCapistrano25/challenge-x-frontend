import { ButtonLink } from '@/shared/ui';
import { cn } from '@/shared/lib/cn';
import { IconFileText, IconHelpCircle } from './icons';
import styles from './PublicContent.module.css';

export interface HelpResourcesProps {
  /**
   * PDF com as regras. A API ainda não separa regulamento e edital, então a home usa
   * PublicEdition.notice_url. Sem URL, o card de regulamento não aparece.
   */
  rulesUrl: string | null;
  /** Página de dúvidas do perfil (ex.: /academico/duvidas). */
  faqHref: string;
  className?: string;
}

/** "Precisa de Ajuda?": regulamento e canal de dúvidas. */
export function HelpResources({ rulesUrl, faqHref, className }: HelpResourcesProps) {
  return (
    <section className={cn(styles.help, className)} aria-labelledby="help-title">
      <div className={styles.sectionHeader}>
        <h2 id="help-title" className={styles.sectionTitle}>
          Precisa de Ajuda?
        </h2>
      </div>
      {rulesUrl && (
        <article className={cn(styles.card, styles.helpCard)}>
          <IconFileText className={styles.icon} />
          <h3 className={styles.cardTitle}>Regulamento</h3>
          <p className={styles.cardText}>
            Acesse o documento oficial com todas as regras e critérios de avaliação.
          </p>
          <ButtonLink to={rulesUrl} size="large" target="_blank" rel="noopener noreferrer">
            Baixar PDF
          </ButtonLink>
        </article>
      )}
      <article className={cn(styles.card, styles.helpCard)}>
        <IconHelpCircle className={styles.icon} />
        <h3 className={styles.cardTitle}>Dúvidas</h3>
        <p className={styles.cardText}>
          Canal oficial para esclarecimento de dúvidas técnicas e administrativas.
        </p>
        <ButtonLink to={faqHref} size="large">
          Perguntas Frequentes
        </ButtonLink>
      </article>
    </section>
  );
}
