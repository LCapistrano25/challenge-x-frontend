import { useState } from 'react';
import { Button, ButtonLink } from '@/shared/ui';
import {
  STAGE_STATUS_LABEL,
  STAGE_STATUS_TONE,
  countPendingActions,
  describePendingActions,
  describeResubmission,
  describeStageMaterial,
  formatDeadline,
  getStageView,
} from '../lib/deliverables';
import type { StageDeliverable } from '../types';
import { StageDetailsDialog } from './StageDetailsDialog';
import { StageStatusTag } from './StageStatusTag';
import styles from './TeamProject.module.css';

export interface StageDeliveryListProps {
  items: StageDeliverable[];
  /** Rota de "Enviar entrega" / "Atualizar entrega" da etapa. */
  submitHref: (stageId: number) => string;
  now?: Date;
}

/** Figma: "Entregas por etapa" (551:12480 · 555:8646) — status, prazo, envio e reenvio. */
export function StageDeliveryList({ items, submitHref, now = new Date() }: StageDeliveryListProps) {
  const [details, setDetails] = useState<StageDeliverable | null>(null);
  const ordered = [...items].sort((a, b) => a.stage.position - b.stage.position);
  const pending = countPendingActions(items, now);

  return (
    <section className={styles.card} aria-labelledby="stage-deliveries-title">
      <div className={styles.cardHeader}>
        <h2 id="stage-deliveries-title" className={styles.h3}>
          Entregas por etapa
        </h2>
        <StageStatusTag tone={pending > 0 ? 'attention' : 'positive'}>
          {describePendingActions(pending)}
        </StageStatusTag>
      </div>
      <p className={styles.text}>
        Todos os horários seguem o horário de Brasília. Cada novo envio mantém o histórico de
        versões.
      </p>

      {ordered.length === 0 ? (
        <p className={styles.text}>A edição ainda não tem etapas com entrega.</p>
      ) : (
        <ul className={styles.stageList}>
          {ordered.map((item) => {
            const view = getStageView(item, now);
            const material = describeStageMaterial(item, view);
            const resubmission = describeResubmission(item, view);
            const name = item.stage.name;
            return (
              <li key={item.stage.id} className={styles.stage} aria-label={name}>
                <div className={styles.stageRow}>
                  <div className={styles.stageName}>
                    <h3 className={styles.h3}>{name}</h3>
                    {item.description && <p className={styles.text}>{item.description}</p>}
                  </div>
                  <div className={styles.stageDeadline}>
                    <p className={styles.caption}>Prazo da etapa</p>
                    <p className={`${styles.text} ${styles.strong}`}>
                      {formatDeadline(item.stage.ends_at)}
                    </p>
                  </div>
                  <div className={styles.stageStatus}>
                    <StageStatusTag tone={STAGE_STATUS_TONE[view.status]}>
                      {STAGE_STATUS_LABEL[view.status]}
                    </StageStatusTag>
                  </div>
                  <div className={styles.stageAction}>
                    {view.action.kind === 'submit' ? (
                      <ButtonLink
                        to={submitHref(item.stage.id)}
                        variant={view.action.primary ? 'primary' : 'secondary'}
                        size="large"
                        className={styles.action}
                        aria-label={`${view.action.label}: ${name}`}
                      >
                        {view.action.label}
                      </ButtonLink>
                    ) : (
                      <Button
                        variant="secondary"
                        size="large"
                        className={styles.action}
                        onClick={() => setDetails(item)}
                        aria-label={`${view.action.label}: ${name}`}
                      >
                        {view.action.label}
                      </Button>
                    )}
                  </div>
                </div>

                <div className={styles.materialRow}>
                  <div className={styles.material}>
                    <p className={`${styles.text} ${styles.strong}`}>{material.title}</p>
                    <p className={styles.caption}>{material.detail}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="large"
                    className={styles.action}
                    onClick={() => setDetails(item)}
                    aria-label={`Ver detalhes: ${name}`}
                  >
                    Ver detalhes
                  </Button>
                </div>

                {resubmission && (
                  <div className={`${styles.notice} ${styles.noticeAttention}`} role="note">
                    <p className={styles.noticeTitle}>Atenção ao reenvio</p>
                    <p>{resubmission}</p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <p className={styles.caption}>
        Integrantes podem enviar arquivos. Apenas a liderança pode editar os dados cadastrais do
        projeto.
      </p>

      <StageDetailsDialog item={details} onOpenChange={(open) => !open && setDetails(null)} />
    </section>
  );
}
