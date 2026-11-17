import { Modal } from '@/shared/ui';
import {
  describeRequirements,
  formatDateAtTime,
  formatDeadline,
  formatFileSize,
} from '../lib/deliverables';
import type { StageDeliverable } from '../types';
import styles from './TeamProject.module.css';

export interface StageDetailsDialogProps {
  item: StageDeliverable | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Orientações da etapa e histórico de versões ("Ver detalhes", "Consultar envio" e
 * "Ver orientações"). Cada envio é uma versão imutável, com o comprovante (RF31).
 */
export function StageDetailsDialog({ item, onOpenChange }: StageDetailsDialogProps) {
  return (
    <Modal
      open={item !== null}
      onOpenChange={onOpenChange}
      title={item?.stage.name ?? 'Etapa'}
      description={item ? `Prazo da etapa: ${formatDeadline(item.stage.ends_at)} (Brasília)` : ''}
      size="lg"
    >
      {item && (
        <div className={styles.dialogBody}>
          <div className={`${styles.notice} ${styles.noticePrimary}`}>
            <p className={styles.noticeTitle}>O que entregar nesta etapa</p>
            <p>{item.guidance ?? item.description ?? 'Consulte o edital para as orientações.'}</p>
            <p>
              Envio de {formatDateAtTime(item.stage.starts_at)} a{' '}
              {formatDateAtTime(item.stage.ends_at)} · {describeRequirements(item.fields)}
            </p>
          </div>

          <section aria-labelledby="stage-versions-title" className={styles.fact}>
            <h3 id="stage-versions-title" className={styles.h3}>
              Histórico de versões
            </h3>
            {item.versions.length === 0 ? (
              <p className={styles.text}>Nenhum envio registrado nesta etapa.</p>
            ) : (
              <ul className={styles.versionList}>
                {item.versions.map((version) => (
                  <li key={version.id} className={styles.version}>
                    <p className={`${styles.text} ${styles.strong}`}>
                      Versão {version.version_number}
                      {version.id === item.official_version_id ? ' · versão oficial' : ''}
                    </p>
                    <p className={styles.caption}>
                      Enviada por {version.submitted_by.name} em{' '}
                      {formatDateAtTime(version.submitted_at)}
                    </p>
                    {version.items.map((entry) =>
                      entry.type === 'FILE' ? (
                        <p key={entry.id} className={styles.text}>
                          {entry.file_url ? (
                            <a href={entry.file_url} target="_blank" rel="noreferrer">
                              {entry.file_name ?? 'Arquivo enviado'}
                            </a>
                          ) : (
                            (entry.file_name ?? 'Arquivo enviado')
                          )}
                          {entry.size_bytes != null && ` · ${formatFileSize(entry.size_bytes)}`}
                        </p>
                      ) : (
                        entry.link && (
                          <p key={entry.id} className={styles.text}>
                            <a href={entry.link} target="_blank" rel="noreferrer">
                              {entry.link}
                            </a>
                          </p>
                        )
                      ),
                    )}
                    {version.notes && <p className={styles.text}>Observação: {version.notes}</p>}
                    {version.receipt && (
                      <p className={styles.caption}>
                        Comprovante {version.receipt.verification_code}
                        {version.receipt.file_url && (
                          <>
                            {' · '}
                            <a href={version.receipt.file_url} target="_blank" rel="noreferrer">
                              Baixar comprovante
                            </a>
                          </>
                        )}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </Modal>
  );
}
