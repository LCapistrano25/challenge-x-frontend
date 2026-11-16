import { ButtonLink } from '@/shared/ui';
import type { EditionSummary } from '@/shared/types/api';
import styles from './PublicContent.module.css';

export interface EditionHeroProps {
  edition: EditionSummary;
  /** PublicEdition.notice_url — sem edital publicado, o botão de download some. */
  noticeUrl: string | null;
  description?: string;
}

/** Destaque da edição vigente com acesso ao edital e à vitrine de projetos. */
export function EditionHero({
  edition,
  noticeUrl,
  description = 'Acompanhe o edital, o cronograma e os projetos da edição vigente, sem precisar de login.',
}: EditionHeroProps) {
  return (
    <section className={styles.hero} aria-labelledby="edition-hero">
      <h2 id="edition-hero" className={styles.heroTitle}>
        Desafio X
      </h2>
      <p className={styles.heroEdition}>Edição {edition.year}</p>
      <p className={styles.heroText}>{description}</p>
      <div className={styles.actions}>
        {noticeUrl && (
          <ButtonLink to={noticeUrl} size="large" target="_blank" rel="noopener noreferrer">
            Baixar edital em PDF
          </ButtonLink>
        )}
        <ButtonLink to="/projetos" variant="secondary" size="large">
          Ver projetos
        </ButtonLink>
      </div>
      {noticeUrl && (
        <p className={styles.heroNote}>
          Edital oficial {edition.year}, em PDF, para consulta e impressão.
        </p>
      )}
    </section>
  );
}
