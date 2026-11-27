import { useId, type FormHTMLAttributes, type ReactNode, type Ref } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { cn } from '@/shared/lib/cn';
import { IconAlert, IconCheckCircle, IconInfo, Select } from '@/shared/ui';
import { selectAdminEdition, useAdminEdition } from '../../hooks/useAdminEdition';
import { EDITION_STATUS_LABEL, editionLabel } from '../../lib/editions';
import type { AdminEdition } from '../../types';
import styles from './Setup.module.css';

/** Seletor "Edição atual" e a situação da edição, à direita do título (Figma: "Edição atual"). */
export function EditionPicker() {
  const { editions, edition } = useAdminEdition();
  if (!edition) return null;
  const situationClass =
    edition.status === 'PUBLISHED'
      ? styles.situationPublished
      : edition.status === 'CLOSED'
        ? styles.situationClosed
        : undefined;
  return (
    <div className={styles.edition}>
      <Select
        label="Edição atual"
        value={String(edition.id)}
        options={editions.map((item) => ({
          value: String(item.id),
          label: editionLabel(item, editions),
        }))}
        onChange={(event) => selectAdminEdition(Number(event.target.value))}
      />
      <span className={cn(styles.situation, situationClass)}>
        {EDITION_STATUS_LABEL[edition.status]}
      </span>
    </div>
  );
}

export interface Crumb {
  label: string;
  to?: string;
}

/** Trilha ("Início / Etapas / Etapas da edição"), orientação e ação principal. */
export function SetupContext({
  crumbs,
  description,
  action,
  sections,
}: {
  crumbs: Crumb[];
  description: ReactNode;
  action?: ReactNode;
  /** Navegação entre as telas irmãs (ex.: Critérios / Rubricas / Pontuações). */
  sections?: ReactNode;
}) {
  return (
    <div className={styles.context}>
      <div className={styles.contextText}>
        <nav aria-label="Trilha de navegação">
          <ol className={styles.breadcrumb}>
            {crumbs.map((crumb, index) => (
              <li key={`${index}-${crumb.label}`}>
                {crumb.to && index < crumbs.length - 1 ? (
                  <Link to={crumb.to}>{crumb.label}</Link>
                ) : (
                  <span aria-current={index === crumbs.length - 1 ? 'page' : undefined}>
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <p className={styles.description}>{description}</p>
        {sections}
      </div>
      {action}
    </div>
  );
}

/** Bloco de gestão: cartão branco com título e subtítulo. Com `as="form"`, vira o formulário. */
export function SetupCard({
  title,
  subtitle,
  aside,
  children,
  as = 'section',
  ref,
  ...formProps
}: {
  title: string;
  subtitle?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  as?: 'section' | 'form';
  ref?: Ref<HTMLFormElement>;
} & Omit<FormHTMLAttributes<HTMLFormElement>, 'title'>) {
  const headingId = `card-${useId().replace(/:/g, '')}`;
  const content = (
    <>
      <div className={styles.cardHeader}>
        <div>
          <h2 id={headingId} className={styles.cardTitle}>
            {title}
          </h2>
          {subtitle && <div className={styles.cardSubtitle}>{subtitle}</div>}
        </div>
        {aside}
      </div>
      {children}
    </>
  );
  return as === 'form' ? (
    <form ref={ref} className={styles.card} aria-labelledby={headingId} {...formProps}>
      {content}
    </form>
  ) : (
    <section className={styles.card} aria-labelledby={headingId}>
      {content}
    </section>
  );
}

type NoticeTone = 'success' | 'warning' | 'danger' | 'info';
const NOTICE_ICON = {
  success: IconCheckCircle,
  warning: IconAlert,
  danger: IconAlert,
  info: IconInfo,
};

/** Mensagem de orientação (Figma): título curto e explicação em uma linha. */
export function Notice({
  tone,
  title,
  children,
}: {
  tone: NoticeTone;
  title: string;
  children?: ReactNode;
}) {
  const Icon = NOTICE_ICON[tone];
  return (
    <div className={cn(styles.notice, styles[tone])} role={tone === 'danger' ? 'alert' : 'status'}>
      <Icon size={20} className={styles.noticeIcon} />
      <div>
        <strong className={styles.noticeTitle}>{title}</strong>
        {children && <p className={styles.noticeText}>{children}</p>}
      </div>
    </div>
  );
}

/** Rodapé de contexto: "Desafio X • edição • Administração" e quem faz a gestão. */
export function SetupFooter({ edition }: { edition?: AdminEdition }) {
  const { user } = useAuth();
  return (
    <footer className={styles.footer}>
      <span>
        Desafio X{edition ? ` • Edição ${edition.year}/${edition.semester}` : ''} • Administração
      </span>
      {user && <span>Gestão: {user.name}</span>}
    </footer>
  );
}

/** Indicador do resumo (Figma: "Indicador"). */
export function Indicator({
  label,
  value,
  caption,
}: {
  label: string;
  value: ReactNode;
  caption?: ReactNode;
}) {
  return (
    <div className={styles.indicator}>
      <span className={styles.indicatorLabel}>{label}</span>
      <strong className={styles.indicatorValue}>{value}</strong>
      {caption && <span className={styles.indicatorCaption}>{caption}</span>}
    </div>
  );
}

const SECTIONS = [
  { to: '/admin/criterios-rubricas', label: 'Critérios', end: true },
  { to: '/admin/criterios-rubricas/rubricas', label: 'Rubricas' },
  { to: '/admin/criterios-rubricas/pontuacoes', label: 'Pontuações' },
];

/** "Critérios / Rubricas / Pontuações": as telas de Avaliações. */
export function EvaluationSections() {
  return (
    <nav aria-label="Seções de avaliações">
      <ul className={styles.sections}>
        {SECTIONS.map((section) => (
          <li key={section.to}>
            <NavLink to={section.to} end={section.end}>
              {section.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
