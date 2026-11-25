import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ButtonLink, EmptyState, Pagination } from '@/shared/ui';
import {
  Indicator,
  Notice,
  SetupCard,
  SetupContext,
  SetupFooter,
} from '../components/setup/SetupParts';
import styles from '../components/setup/Setup.module.css';
import { setupStateView } from '../components/setup/SetupState';
import { useAdminEdition } from '../hooks/useAdminEdition';
import { useSetupHeader } from '../hooks/useSetupHeader';
import { useEvaluationSetup } from '../hooks/useEvaluationSetup';
import { formatDay, formatPeriod } from '../lib/dates';
import { isEditionEditable, lockedReason } from '../lib/editions';
import { formatPoints } from '../lib/score';
import {
  STAGE_STATUS_LABEL,
  chronologyIssues,
  scheduleSummary,
  stageDays,
  stagePoints,
  stageStatus,
  stageTitle,
  stagesTotal,
  technicalEvaluation,
  totalSituation,
} from '../lib/stages';

const PAGE_SIZE = 10;

/** Etapas da edição (Figma: 04 - Administrador › "Etapas - listagem"). */
export function StagesPage() {
  useSetupHeader('Etapas da edição', 'ETAPAS');
  const editionState = useAdminEdition();
  const { edition } = editionState;
  const setup = useEvaluationSetup(edition?.id);
  const [page, setPage] = useState(1);

  const blocked = setupStateView(editionState, setup);
  const editable = isEditionEditable(edition);
  const { stages, stageCriteria } = setup;

  const total = stagesTotal(stages);
  const situation = totalSituation(total);
  const evaluation = technicalEvaluation(stages);
  const issues = chronologyIssues(stages);
  const pageCount = Math.max(1, Math.ceil(stages.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const visible = stages.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const first = stages[0];
  const last = stages.at(-1);

  return (
    <div className={styles.page}>
      <SetupContext
        crumbs={[
          { label: 'Início', to: '/admin' },
          { label: 'Etapas' },
          { label: 'Etapas da edição' },
        ]}
        description="Organize a sequência, os prazos e as pontuações do processo avaliativo."
        action={
          editable && !blocked ? (
            <ButtonLink to="/admin/etapas/nova" size="large">
              Cadastrar etapa
            </ButtonLink>
          ) : undefined
        }
      />

      {blocked ?? (
        <>
          {!editable && edition && (
            <Notice tone="info" title="Configuração somente para consulta">
              {lockedReason(edition)}
            </Notice>
          )}

          <div className={styles.summary}>
            <Indicator
              label="Etapas configuradas"
              value={stages.length}
              caption={first && last ? `${first.name} até ${last.name}` : 'Nenhuma etapa ainda'}
            />
            <Indicator
              label="Pontuação total"
              value={`${formatPoints(total)} / 10,0`}
              caption={situation.text}
            />
            <Indicator
              label="Avaliação técnica"
              value={evaluation ? formatDay(evaluation.day) : '—'}
              caption={
                evaluation
                  ? `Consolidação das etapas ${evaluation.stages[0]!.order} a ${evaluation.stages.at(-1)!.order}`
                  : 'Sem prazo de avaliação definido'
              }
            />
          </div>

          <SetupCard
            title="Sequência de avaliação"
            subtitle={edition ? `Planejamento da edição ${edition.year}` : undefined}
          >
            {stages.length === 0 ? (
              <EmptyState
                title="Nenhuma etapa cadastrada"
                description="Cadastre as etapas na ordem em que acontecem no Desafio."
              />
            ) : (
              <div>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th scope="col">Ordem e etapa</th>
                        <th scope="col">Período de entrega</th>
                        <th scope="col">Critérios</th>
                        <th scope="col">Pontos</th>
                        <th scope="col">Status</th>
                        <th scope="col">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((stage) => {
                        const days = stageDays(stage);
                        const criteria = stageCriteria.get(stage.id) ?? [];
                        return (
                          <tr key={stage.id}>
                            <td>{stageTitle(stage)}</td>
                            <td>{formatPeriod(days.startDay, days.endDay)}</td>
                            <td>
                              {criteria.length > 0 ? (
                                criteria.map((item) => item.criterion.name).join(', ')
                              ) : (
                                <span className={styles.muted}>
                                  {stage.scored ? 'Sem critérios' : 'Não pontuada'}
                                </span>
                              )}
                            </td>
                            <td>{stage.scored ? formatPoints(stagePoints(stage)) : '—'}</td>
                            <td>{STAGE_STATUS_LABEL[stageStatus(days)]}</td>
                            <td>
                              <Link
                                className={styles.link}
                                to={`/admin/etapas/${stage.id}`}
                                aria-label={`${editable ? 'Editar' : 'Consultar'} ${stage.name}`}
                              >
                                {editable ? 'Editar' : 'Consultar'}
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className={styles.tableFooter}>
                  <span>
                    {(current - 1) * PAGE_SIZE + 1}–{(current - 1) * PAGE_SIZE + visible.length} de{' '}
                    {stages.length} {stages.length === 1 ? 'etapa' : 'etapas'}
                  </span>
                  <Pagination page={current} pageCount={pageCount} onPageChange={setPage} />
                </div>
              </div>
            )}
          </SetupCard>

          {stages.length > 0 &&
            (issues.length === 0 && situation.exact ? (
              <Notice tone="success" title="Cronologia e pontuação válidas">
                {scheduleSummary(stages)}
              </Notice>
            ) : (
              <Notice
                tone="warning"
                title={
                  issues.length > 0 ? 'Revise a cronologia das etapas' : 'Pontuação incompleta'
                }
              >
                {[
                  ...issues,
                  situation.exact
                    ? null
                    : `As etapas somam ${formatPoints(total)} de 10,0 pontos; a publicação exige a soma exata.`,
                ]
                  .filter(Boolean)
                  .join(' ')}
              </Notice>
            ))}
        </>
      )}

      <SetupFooter edition={edition} />
    </div>
  );
}
