import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/shared/lib/cn';
import type { FinalEvaluationStatus, FinalistMaterial } from '../types';
import {
  FINAL_STATUS_LABEL,
  FINAL_STATUS_TONE,
  describeMaterial,
  formatDateTime,
  type EvaluatorTone,
} from '../lib/finalists';
import {
  IconAlertCircle,
  IconCheckCircleOutline,
  IconDocument,
  IconDownloadFile,
  IconInfoCircle,
  IconOpenExternal,
} from './evaluator-icons';
import styles from './Evaluator.module.css';

/** "← Voltar aos projetos finalistas" */
export function BackLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className={styles.back}>
      ← {children}
    </Link>
  );
}

/** Indicador de estado (pílula) do Figma. */
export function Pill({
  tone = 'brand',
  children,
  className,
}: {
  tone?: EvaluatorTone;
  children: ReactNode;
  className?: string;
}) {
  return <span className={cn(styles.pill, styles[tone], className)}>{children}</span>;
}

export function StatusPill({ status }: { status: FinalEvaluationStatus }) {
  return <Pill tone={FINAL_STATUS_TONE[status]}>{FINAL_STATUS_LABEL[status]}</Pill>;
}

/** Título da tela: "AVALIADOR EXTERNO · EDIÇÃO 2026.2" + título + descrição. */
export function EvaluatorHeading({
  edition,
  title,
  description,
}: {
  edition?: string;
  title: string;
  description?: ReactNode;
}) {
  return (
    <div className={styles.heading}>
      <Pill>{edition ? `AVALIADOR EXTERNO · EDIÇÃO ${edition}` : 'AVALIADOR EXTERNO'}</Pill>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
  );
}

export type NoticeTone = 'info' | 'warning' | 'danger' | 'success';

const NOTICE_CLASS: Record<NoticeTone, string | undefined> = {
  info: styles.noticeInfo,
  warning: styles.noticeWarning,
  danger: styles.noticeDanger,
  success: styles.noticeSuccess,
};

const NOTICE_ICON = {
  info: IconInfoCircle,
  warning: IconAlertCircle,
  danger: IconAlertCircle,
  success: IconCheckCircleOutline,
};

/** Aviso do Figma: ícone, título na cor do tom e descrição em cinza. */
export function Notice({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: NoticeTone;
  title: string;
  children?: ReactNode;
  className?: string;
}) {
  const Icon = NOTICE_ICON[tone];
  return (
    <div
      className={cn(styles.notice, NOTICE_CLASS[tone], className)}
      role={tone === 'danger' ? 'alert' : 'status'}
    >
      <Icon />
      <div className={styles.noticeBody}>
        <p>{title}</p>
        {children && <p>{children}</p>}
      </div>
    </div>
  );
}

/** "Arquivos entregues": abre o arquivo ou o protótipo em nova aba. */
export function DeliveredFiles({
  materials,
  submittedAt,
}: {
  materials: FinalistMaterial[];
  submittedAt: string | null;
}) {
  return (
    <section className={styles.card} aria-labelledby="delivered-files">
      <h2 id="delivered-files">Arquivos entregues</h2>
      {materials.length === 0 ? (
        <p className={styles.small}>A equipe ainda não tem arquivos disponíveis para consulta.</p>
      ) : (
        <ul className={styles.materials}>
          {materials.map((material) => (
            <li key={material.id}>
              <a
                className={styles.material}
                href={material.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${material.kind === 'LINK' ? 'Abrir' : 'Baixar'} ${material.name} (${describeMaterial(material)})`}
              >
                <IconDocument />
                <span className={styles.materialInfo}>
                  <span className={styles.materialName}>{material.name}</span>
                  <span className={styles.materialMeta}>{describeMaterial(material)}</span>
                </span>
                <span className={styles.materialAction}>
                  {material.kind === 'LINK' ? <IconOpenExternal /> : <IconDownloadFile />}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
      {submittedAt && <p className={styles.small}>Enviado em {formatDateTime(submittedAt)}</p>}
    </section>
  );
}

/** Estado vazio do Figma: ícone em círculo, título, descrição e ação. */
export function EmptyCard({
  icon,
  title,
  description,
  action,
  help,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  help?: string;
}) {
  return (
    <section className={styles.empty} aria-labelledby="empty-title">
      <span className={styles.emptyIcon}>{icon}</span>
      <h2 id="empty-title">{title}</h2>
      <p>{description}</p>
      {action}
      {help && <p className={styles.emptyHelp}>{help}</p>}
    </section>
  );
}

/** "Desafio X / Avaliador externo / 2026.2" */
export function EvaluatorFooter({ edition }: { edition?: string }) {
  return (
    <p className={styles.footer}>Desafio X / Avaliador externo{edition ? ` / ${edition}` : ''}</p>
  );
}
