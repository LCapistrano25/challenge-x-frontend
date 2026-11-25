import { useState, type FormEvent } from 'react';
import { Button, ButtonLink, EmptyState, TextField, notify } from '@/shared/ui';
import {
  EvaluationSections,
  Notice,
  SetupCard,
  SetupContext,
  SetupFooter,
} from '../components/setup/SetupParts';
import styles from '../components/setup/Setup.module.css';
import { setupStateView } from '../components/setup/SetupState';
import { useAdminEdition } from '../hooks/useAdminEdition';
import { useSetupHeader } from '../hooks/useSetupHeader';
import { useEvaluationSetup, useUpdateStagesInSequence } from '../hooks/useEvaluationSetup';
import { stageCriteriaTotal } from '../lib/criteria';
import {
  checkDistribution,
  distributionFormula,
  distributionValues,
  planDistribution,
  scoredStages,
} from '../lib/distribution';
import { isEditionEditable, lockedReason } from '../lib/editions';
import { describeSetupError } from '../lib/errors';
import { TOTAL_POINTS, formatPoints, pointsLabel, shareOfTotal, toCents } from '../lib/score';
import { stagePoints, stagesTotal, totalSituation } from '../lib/stages';

const COUNT_WORDS = [
  '',
  'uma',
  'duas',
  'três',
  'quatro',
  'cinco',
  'seis',
  'sete',
  'oito',
  'nove',
  'dez',
];
const countWord = (count: number) => COUNT_WORDS[count] ?? String(count);

/**
 * Pontuações por etapa (Figma: 04 - Administrador › "Avaliações - pontuações por etapa"): a
 * distribuição dos 10,0 pontos entre as etapas pontuadas. Salvar só é liberado com a soma exata.
 */
export function ScoresPage() {
  useSetupHeader('Pontuações por etapa', 'AVALIAÇÕES');
  const editionState = useAdminEdition();
  const { edition } = editionState;
  const setup = useEvaluationSetup(edition?.id);
  const updateStages = useUpdateStagesInSequence();

  // Rascunho da distribuição; `null` = mostra o que está salvo.
  const [draft, setDraft] = useState<Record<number, string> | null>(null);
  const [changedId, setChangedId] = useState<number | undefined>();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const blocked = setupStateView(editionState, setup);
  const editable = isEditionEditable(edition);
  const { stages, stageCriteria } = setup;
  const scored = scoredStages(stages);
  const saved = distributionValues(stages);
  const values = draft ?? saved;
  const dirty = draft !== null && scored.some((stage) => draft[stage.id] !== saved[stage.id]);

  const criteriaTotals = new Map(
    scored.map((stage) => [stage.id, stageCriteriaTotal(stageCriteria.get(stage.id) ?? [])]),
  );
  const check = checkDistribution(stages, values, criteriaTotals, changedId);
  const savedTotal = stagesTotal(stages);
  const savedSituation = totalSituation(savedTotal);

  function change(stageId: number, value: string) {
    setDraft({ ...values, [stageId]: value });
    setChangedId(stageId);
    setSubmitError(null);
  }

  function discard() {
    setDraft(null);
    setChangedId(undefined);
    setSubmitError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dirty || !check.exact || updateStages.isPending) return;
    const plan = planDistribution(stages, values);
    try {
      await updateStages.mutateAsync(
        plan.map((change) => ({ stageId: change.stageId, input: { max_score: change.max_score } })),
      );
      notify.success('Pontuações salvas: 10,0 pontos distribuídos.');
      discard();
    } catch (error) {
      setSubmitError(
        describeSetupError(
          error,
          'Não foi possível salvar as pontuações. Recarregue a página e confira os valores.',
        ),
      );
    }
  }

  const showErrors = dirty;

  return (
    <div className={styles.page}>
      <SetupContext
        crumbs={[
          { label: 'Início', to: '/admin' },
          { label: 'Avaliações', to: '/admin/criterios-rubricas' },
          { label: 'Pontuações por etapa' },
        ]}
        description={`A soma ${
          scored.length === 1 ? 'da etapa' : `das ${countWord(scored.length)} etapas`
        } deve ser exatamente 10,0 pontos.`}
        sections={<EvaluationSections />}
      />

      {blocked ?? (
        <>
          {!editable && edition && (
            <Notice tone="info" title="Configuração somente para consulta">
              {lockedReason(edition)}
            </Notice>
          )}

          {scored.length === 0 ? (
            <EmptyState
              title="Nenhuma etapa pontuada"
              description="Cadastre as etapas pontuadas para distribuir os 10,0 pontos."
              action={
                <ButtonLink to="/admin/etapas" variant="secondary" size="small">
                  Ir para Etapas
                </ButtonLink>
              }
            />
          ) : (
            <>
              <SetupCard
                title="Distribuição salva"
                subtitle={edition ? `Configuração vigente da edição ${edition.year}` : undefined}
              >
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th scope="col">Etapa</th>
                        <th scope="col">Pontuação máxima</th>
                        <th scope="col">Participação no total</th>
                        <th scope="col">Situação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scored.map((stage) => {
                        const points = stagePoints(stage);
                        const criteria = criteriaTotals.get(stage.id) ?? 0;
                        const complete = toCents(criteria) === toCents(points);
                        return (
                          <tr key={stage.id}>
                            <td>{stage.name}</td>
                            <td>{formatPoints(points)}</td>
                            <td>{shareOfTotal(points)}</td>
                            <td className={complete ? styles.accent : styles.muted}>
                              {complete
                                ? 'Configurada'
                                : `Critérios: ${formatPoints(criteria)} de ${formatPoints(points)}`}
                            </td>
                          </tr>
                        );
                      })}
                      <tr>
                        <td>Total salvo</td>
                        <td>{formatPoints(savedTotal)}</td>
                        <td>{shareOfTotal(savedTotal)}</td>
                        <td className={savedSituation.exact ? styles.accent : styles.muted}>
                          {savedSituation.exact ? 'Válido' : 'Inválido'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {savedSituation.exact ? (
                  <Notice tone="success" title="Pontuação válida: 10,0 de 10,0 pontos">
                    {distributionFormula(stages)} • Soma exata obrigatória.
                  </Notice>
                ) : (
                  <Notice
                    tone="warning"
                    title={`Pontuação incompleta: ${formatPoints(savedTotal)} de 10,0 pontos`}
                  >
                    {distributionFormula(stages)} • {savedSituation.text}. A publicação exige a soma
                    exata.
                  </Notice>
                )}
              </SetupCard>

              {editable && (
                <SetupCard
                  as="form"
                  title={`Editar distribuição${dirty ? ' • alterações não salvas' : ''}`}
                  subtitle={`Ajuste a pontuação máxima de cada etapa; o total precisa fechar em ${formatPoints(
                    TOTAL_POINTS,
                  )}.`}
                  onSubmit={handleSubmit}
                  noValidate
                >
                  <div className={styles.fields}>
                    <div className={styles.row}>
                      {scored.map((stage) => (
                        <TextField
                          key={stage.id}
                          label={`${stage.name} *`}
                          inputMode="decimal"
                          value={values[stage.id] ?? ''}
                          error={showErrors ? check.errors[stage.id] : undefined}
                          onChange={(event) => change(stage.id, event.target.value)}
                        />
                      ))}
                    </div>
                  </div>

                  {showErrors && check.problem && (
                    <Notice tone="danger" title={check.problem.title}>
                      {check.problem.detail}
                    </Notice>
                  )}
                  {showErrors && check.exact && (
                    <Notice tone="success" title={`Nova soma: ${pointsLabel(check.total)}`}>
                      A distribuição fecha em 10,0. Salve para aplicar às etapas.
                    </Notice>
                  )}

                  <div className={styles.actions}>
                    <div className={styles.buttons}>
                      <Button
                        type="button"
                        variant="secondary"
                        size="large"
                        onClick={discard}
                        disabled={!dirty}
                      >
                        Descartar alterações
                      </Button>
                      <Button
                        type="submit"
                        size="large"
                        loading={updateStages.isPending}
                        disabled={!dirty || !check.exact}
                      >
                        {updateStages.isPending ? 'Salvando…' : 'Salvar pontuações'}
                      </Button>
                    </div>
                    {submitError && (
                      <p role="alert" className={styles.actionsError}>
                        {submitError}
                      </p>
                    )}
                    {dirty && !check.exact && (
                      <p className={styles.actionsHint}>
                        Salvar bloqueado até que a soma seja exatamente 10,0 pontos.
                      </p>
                    )}
                  </div>
                </SetupCard>
              )}
            </>
          )}
        </>
      )}

      <SetupFooter edition={edition} />
    </div>
  );
}
