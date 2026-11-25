import { useState, type FormEvent } from 'react';
import { Button, ButtonLink, EmptyState, Select, TextField, Textarea, notify } from '@/shared/ui';
import { cn } from '@/shared/lib/cn';
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
import { useEvaluationSetup, useUpdateCriterion } from '../hooks/useEvaluationSetup';
import { buildCriterionRows, stageComposition } from '../lib/criteria';
import { isEditionEditable, lockedReason } from '../lib/editions';
import { describeSetupError } from '../lib/errors';
import {
  RUBRIC_LEVELS,
  RUBRIC_LEVEL_LABEL,
  isLevelOverMax,
  isRubricComplete,
  joinList,
  levelText,
  parseRubric,
  serializeRubric,
  validateRubricLevel,
  type RubricLevelErrors,
  type RubricLevelKey,
} from '../lib/rubric';
import { decimalToNumber, formatPoints, parsePoints } from '../lib/score';
import { stagePoints } from '../lib/stages';

const DESCRIPTOR_LIMIT = 500;

interface Selection {
  criterionId: number;
  level: RubricLevelKey;
}

/**
 * Rubricas de avaliação (Figma: 04 - Administrador › "Avaliações - rubricas"): matriz de níveis
 * por critério da etapa e edição de pontuação e descritor de cada nível.
 */
export function RubricsPage() {
  useSetupHeader('Rubricas de avaliação', 'AVALIAÇÕES');
  const editionState = useAdminEdition();
  const { edition } = editionState;
  const setup = useEvaluationSetup(edition?.id);
  const updateCriterion = useUpdateCriterion();

  const [stageChoice, setStageChoice] = useState<string>('');
  const [selection, setSelection] = useState<Selection | null>(null);
  // Rascunho do nível em edição; `null` = mostra o que está salvo.
  const [draft, setDraft] = useState<{ points: string; descriptor: string } | null>(null);
  const [errors, setErrors] = useState<RubricLevelErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const blocked = setupStateView(editionState, setup);
  const editable = isEditionEditable(edition);
  const { stages, criteria, stageCriteria } = setup;
  const scored = stages.filter((stage) => stage.scored);
  // Sem escolha, mostra a última etapa pontuada (no Figma, a apresentação final).
  const stage = scored.find((item) => String(item.id) === stageChoice) ?? scored.at(-1);
  const items = stage ? (stageCriteria.get(stage.id) ?? []) : [];
  const matrix = items.flatMap((item) => {
    const criterion = criteria.find((c) => c.id === item.criterion.id);
    return criterion
      ? [{ criterion, rubric: parseRubric(criterion.rubric), max: decimalToNumber(item.max_score) }]
      : [];
  });

  // Seleção padrão: nível Excelente do primeiro critério da matriz.
  const active =
    selection && matrix.some((row) => row.criterion.id === selection.criterionId)
      ? selection
      : matrix[0]
        ? { criterionId: matrix[0].criterion.id, level: 'EXCELLENT' as const }
        : null;
  const activeRow = matrix.find((row) => row.criterion.id === active?.criterionId);
  const savedLevel = activeRow && active ? activeRow.rubric.levels[active.level] : undefined;
  const pristine = draft === null;
  const formValues = draft ?? {
    points: savedLevel ? formatPoints(savedLevel.points) : '',
    descriptor: savedLevel?.descriptor ?? '',
  };

  const pending = buildCriterionRows(criteria, stages, stageCriteria).filter(
    (row) => row.stage && !isRubricComplete(row.rubric, row.maxScore),
  );

  function choose(next: Selection) {
    setSelection(next);
    setDraft(null);
    setErrors({});
    setSubmitError(null);
  }

  function edit(field: 'points' | 'descriptor', value: string) {
    setDraft({ ...formValues, [field]: value });
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeRow || !active || updateCriterion.isPending) return;
    const found = validateRubricLevel(activeRow.rubric, active.level, formValues, activeRow.max);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const rubric = serializeRubric({
      ...activeRow.rubric,
      levels: {
        ...activeRow.rubric.levels,
        [active.level]: {
          points: parsePoints(formValues.points)!,
          descriptor: formValues.descriptor.trim(),
        },
      },
    });
    try {
      await updateCriterion.mutateAsync({ criterionId: activeRow.criterion.id, input: { rubric } });
      notify.success(
        `Rubrica de ${activeRow.criterion.name} (${RUBRIC_LEVEL_LABEL[active.level]}) salva.`,
      );
      setDraft(null);
    } catch (error) {
      setSubmitError(describeSetupError(error, 'Não foi possível salvar a rubrica.'));
    }
  }

  function cancel() {
    if (active) choose(active);
  }

  return (
    <div className={styles.page}>
      <SetupContext
        crumbs={[
          { label: 'Início', to: '/admin' },
          { label: 'Avaliações', to: '/admin/criterios-rubricas' },
          { label: 'Rubricas de avaliação' },
        ]}
        description="Níveis, descritores e pontos para orientar a banca com critérios claros."
        sections={<EvaluationSections />}
      />

      {blocked ?? (
        <>
          {!editable && edition && (
            <Notice tone="info" title="Configuração somente para consulta">
              {lockedReason(edition)}
            </Notice>
          )}

          {!stage ? (
            <EmptyState
              title="Nenhuma etapa pontuada"
              description="Cadastre as etapas pontuadas e vincule critérios para montar as rubricas."
              action={
                <ButtonLink to="/admin/etapas" variant="secondary" size="small">
                  Ir para Etapas
                </ButtonLink>
              }
            />
          ) : (
            <SetupCard
              title={`Matriz da etapa ${stage.name}`}
              subtitle={[
                stage.name,
                `Máximo ${formatPoints(stagePoints(stage))} pontos`,
                stageComposition(items),
              ]
                .filter(Boolean)
                .join(' • ')}
              aside={
                scored.length > 1 ? (
                  <div className={styles.filters} style={{ gridTemplateColumns: '11.5625rem' }}>
                    <Select
                      label="Etapa"
                      options={scored.map((item) => ({
                        value: String(item.id),
                        label: item.name,
                      }))}
                      value={String(stage.id)}
                      onChange={(event) => {
                        setStageChoice(event.target.value);
                        setSelection(null);
                        setDraft(null);
                      }}
                    />
                  </div>
                ) : undefined
              }
            >
              {matrix.length === 0 ? (
                <EmptyState
                  title="Nenhum critério vinculado à etapa"
                  description="Vincule critérios à etapa em Critérios de avaliação."
                  action={
                    <ButtonLink to="/admin/criterios-rubricas" variant="secondary" size="small">
                      Ir para Critérios
                    </ButtonLink>
                  }
                />
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th scope="col">Critério</th>
                        {RUBRIC_LEVELS.map((level) => (
                          <th key={level.key} scope="col">
                            {level.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {matrix.map((row) => (
                        <tr key={row.criterion.id}>
                          <td>{row.criterion.name}</td>
                          {RUBRIC_LEVELS.map((level) => {
                            const value = row.rubric.levels[level.key];
                            const over = isLevelOverMax(value, row.max);
                            const selected =
                              active?.criterionId === row.criterion.id &&
                              active.level === level.key;
                            const description = over
                              ? `${levelText(value)} (acima do máximo de ${formatPoints(row.max!)})`
                              : levelText(value);
                            return (
                              <td key={level.key}>
                                <button
                                  type="button"
                                  className={cn(
                                    styles.levelCell,
                                    active?.level === level.key && styles.levelSelected,
                                    !value && styles.levelEmpty,
                                    over && styles.levelOver,
                                  )}
                                  aria-pressed={selected}
                                  aria-label={`${row.criterion.name}, ${level.label}: ${description}`}
                                  title={over ? 'Pontuação acima do máximo do critério' : undefined}
                                  disabled={!editable}
                                  onClick={() =>
                                    choose({ criterionId: row.criterion.id, level: level.key })
                                  }
                                >
                                  {levelText(value)}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SetupCard>
          )}

          {editable && activeRow && active && (
            <SetupCard
              as="form"
              title="Gerenciar nível da rubrica"
              subtitle={`${activeRow.criterion.name} • ${RUBRIC_LEVEL_LABEL[active.level]}`}
              onSubmit={handleSubmit}
              noValidate
            >
              <div className={styles.fields}>
                <div className={styles.row}>
                  <Select
                    label="Critério *"
                    options={matrix.map((row) => ({
                      value: String(row.criterion.id),
                      label: row.criterion.name,
                    }))}
                    value={String(active.criterionId)}
                    onChange={(event) =>
                      choose({ criterionId: Number(event.target.value), level: active.level })
                    }
                  />
                  <Select
                    label="Nível *"
                    options={RUBRIC_LEVELS.map((level) => ({
                      value: level.key,
                      label: level.label,
                    }))}
                    value={active.level}
                    onChange={(event) =>
                      choose({
                        criterionId: active.criterionId,
                        level: event.target.value as RubricLevelKey,
                      })
                    }
                  />
                  <TextField
                    label="Pontuação *"
                    inputMode="decimal"
                    placeholder="0,0"
                    value={formValues.points}
                    error={errors.points}
                    hint={
                      activeRow.max !== null
                        ? `Intervalo permitido: 0,0 a ${formatPoints(activeRow.max)}.`
                        : undefined
                    }
                    onChange={(event) => edit('points', event.target.value)}
                  />
                </div>
                <Textarea
                  label="Descritor *"
                  placeholder="Descreva o desempenho esperado neste nível"
                  rows={3}
                  maxLength={DESCRIPTOR_LIMIT}
                  value={formValues.descriptor}
                  error={errors.descriptor}
                  onChange={(event) => edit('descriptor', event.target.value)}
                />
              </div>
              <div className={styles.actions}>
                <div className={styles.buttons}>
                  <Button
                    type="button"
                    variant="secondary"
                    size="large"
                    onClick={cancel}
                    disabled={pristine}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" size="large" loading={updateCriterion.isPending}>
                    {updateCriterion.isPending ? 'Salvando…' : 'Salvar rubrica'}
                  </Button>
                </div>
                {submitError && (
                  <p role="alert" className={styles.actionsError}>
                    {submitError}
                  </p>
                )}
              </div>
            </SetupCard>
          )}

          {pending.length > 0 ? (
            <Notice
              tone="warning"
              title={`${pending.length} ${
                pending.length === 1 ? 'rubrica aguarda revisão' : 'rubricas aguardam revisão'
              }`}
            >
              {joinList(pending.map((row) => `${row.criterion.name} (${row.stage!.name})`))}.
              Conclua a revisão antes de publicar a edição.
            </Notice>
          ) : (
            matrix.length > 0 && (
              <Notice tone="success" title="Rubricas revisadas">
                Todos os critérios vinculados às etapas têm os quatro níveis descritos.
              </Notice>
            )
          )}
        </>
      )}

      <SetupFooter edition={edition} />
    </div>
  );
}
