import { useRef, useState, type FormEvent } from 'react';
import { Button, EmptyState, Pagination, Select, TextField, notify } from '@/shared/ui';
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
import {
  useCreateCriterion,
  useEvaluationSetup,
  useSetStageCriteria,
  useUpdateCriterion,
} from '../hooks/useEvaluationSetup';
import {
  buildCriterionRows,
  emptyCriterionForm,
  filterCriterionRows,
  planCriterionLink,
  rowToCriterionForm,
  stageCriteriaTotal,
  validateCriterionForm,
  type CriterionFormErrors,
  type CriterionFormValues,
  type CriterionRow,
} from '../lib/criteria';
import { isEditionEditable, lockedReason } from '../lib/editions';
import { describeSetupError, setupErrorCode } from '../lib/errors';
import { parseRubric, rubricStatusLabel, serializeRubric } from '../lib/rubric';
import { formatPoints, parsePoints } from '../lib/score';
import { stagePoints } from '../lib/stages';

const PAGE_SIZE = 10;
type Mode = { kind: 'create' } | { kind: 'edit'; row: CriterionRow } | null;

/**
 * Critérios de avaliação da edição (Figma: 04 - Administrador › "Avaliações - critérios").
 * O vínculo com a etapa e a pontuação máxima vêm da matriz de cada etapa (RF08); a descrição
 * fica na rubrica do critério (RF06).
 */
export function CriteriaRubricsPage() {
  useSetupHeader('Critérios de avaliação', 'AVALIAÇÕES');
  const editionState = useAdminEdition();
  const { edition } = editionState;
  const setup = useEvaluationSetup(edition?.id);
  const createCriterion = useCreateCriterion(edition?.id);
  const updateCriterion = useUpdateCriterion();
  const setStageCriteria = useSetStageCriteria();

  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [page, setPage] = useState(1);
  const [mode, setMode] = useState<Mode>(null);
  const [values, setValues] = useState<CriterionFormValues>(emptyCriterionForm);
  const [errors, setErrors] = useState<CriterionFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const blocked = setupStateView(editionState, setup);
  const editable = isEditionEditable(edition);
  const { stages, criteria, stageCriteria } = setup;
  const scoredStages = stages.filter((stage) => stage.scored);

  const rows = buildCriterionRows(criteria, stages, stageCriteria);
  const filtered = filterCriterionRows(rows, search, stageFilter);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const saving =
    createCriterion.isPending || updateCriterion.isPending || setStageCriteria.isPending;

  const stageOptions = [
    { value: '', label: 'Todas as etapas' },
    ...scoredStages.map((stage) => ({ value: String(stage.id), label: stage.name })),
    { value: 'none', label: 'Sem etapa' },
  ];
  // O aviso de limite acompanha a etapa do formulário só enquanto ele está aberto.
  const formStage = mode ? stages.find((stage) => String(stage.id) === values.stageId) : undefined;

  function open(next: Mode) {
    setMode(next);
    setValues(next?.kind === 'edit' ? rowToCriterionForm(next.row) : emptyCriterionForm());
    setErrors({});
    setSubmitError(null);
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
      formRef.current?.querySelector('input')?.focus();
    });
  }

  function update(field: keyof CriterionFormValues, value: string) {
    setValues((currentValues) => ({ ...currentValues, [field]: value }));
    setErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }));
    setSubmitError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!mode || saving) return;
    const editingRow = mode.kind === 'edit' ? mode.row : null;
    const found = validateCriterionForm(values, {
      criteria,
      stages,
      stageCriteria,
      criterionId: editingRow?.criterion.id ?? null,
    });
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const name = values.name.trim();
    const rubric = serializeRubric({
      ...(editingRow?.rubric ?? parseRubric(null)),
      description: values.description,
    });

    let criterionId = editingRow?.criterion.id;
    try {
      if (!editingRow) {
        criterionId = (await createCriterion.mutateAsync({ name, rubric })).id;
      } else if (name !== editingRow.criterion.name || rubric !== editingRow.criterion.rubric) {
        await updateCriterion.mutateAsync({
          criterionId: editingRow.criterion.id,
          input: { name, rubric },
        });
      }
    } catch (error) {
      if (setupErrorCode(error) === 'criterion_name_taken') {
        setErrors({ name: 'Já existe critério com este nome na edição.' });
      } else {
        setSubmitError(describeSetupError(error, 'Não foi possível salvar o critério.'));
      }
      return;
    }

    const changes = planCriterionLink(
      criterionId!,
      { stageId: editingRow?.stage?.id ?? null, maxScore: editingRow?.maxScore ?? null },
      { stageId: Number(values.stageId), maxScore: parsePoints(values.maxScore)! },
      stageCriteria,
    );
    try {
      if (changes.length > 0) await setStageCriteria.mutateAsync(changes);
    } catch (error) {
      setSubmitError(
        `Critério salvo, mas a pontuação na etapa não foi gravada: ${describeSetupError(
          error,
          'tente novamente.',
        )}`,
      );
      // O critério já existe: as próximas tentativas são edição dele.
      if (!editingRow) setMode(null);
      return;
    }

    notify.success(editingRow ? `Critério ${name} atualizado.` : `Critério ${name} cadastrado.`);
    setMode(null);
  }

  const limitText = formStage
    ? `A soma dos critérios de ${formStage.name} deve respeitar o máximo de ${formatPoints(
        stagePoints(formStage),
      )} pontos da etapa (hoje: ${formatPoints(
        stageCriteriaTotal(stageCriteria.get(formStage.id) ?? []),
      )}).`
    : 'A soma dos critérios de cada etapa deve respeitar a pontuação máxima da etapa.';

  return (
    <div className={styles.page}>
      <SetupContext
        crumbs={[
          { label: 'Início', to: '/admin' },
          { label: 'Avaliações' },
          { label: 'Critérios de avaliação' },
        ]}
        description="Defina critérios vinculados às etapas e mantenha uma avaliação comparável."
        action={
          editable && !blocked ? (
            <Button size="large" onClick={() => open({ kind: 'create' })}>
              Adicionar critério
            </Button>
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

          <SetupCard title="Critérios da edição" subtitle={<EvaluationSections />}>
            <div className={styles.filters}>
              <TextField
                label="Buscar"
                type="search"
                placeholder="Buscar critério"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
              <Select
                label="Filtrar por"
                options={stageOptions}
                value={stageFilter}
                onChange={(event) => {
                  setStageFilter(event.target.value);
                  setPage(1);
                }}
              />
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                title={
                  rows.length === 0 ? 'Nenhum critério cadastrado' : 'Nenhum critério encontrado'
                }
                description={
                  rows.length === 0
                    ? 'Adicione os critérios que a banca usará para avaliar as etapas.'
                    : 'Ajuste a busca ou o filtro de etapa.'
                }
              />
            ) : (
              <div>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th scope="col">Critério</th>
                        <th scope="col">Etapa</th>
                        <th scope="col">Máximo</th>
                        <th scope="col">Rubrica</th>
                        <th scope="col">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((row) => (
                        <tr
                          key={row.key}
                          className={
                            mode?.kind === 'edit' && mode.row.key === row.key
                              ? styles.selectedRow
                              : undefined
                          }
                        >
                          <td>{row.criterion.name}</td>
                          <td>
                            {row.stage?.name ?? <span className={styles.muted}>Sem etapa</span>}
                          </td>
                          <td>{row.maxScore === null ? '—' : formatPoints(row.maxScore)}</td>
                          <td>{rubricStatusLabel(row.rubric, row.maxScore)}</td>
                          <td>
                            <button
                              type="button"
                              className={styles.link}
                              disabled={!editable}
                              aria-label={`Editar ${row.criterion.name}`}
                              onClick={() => open({ kind: 'edit', row })}
                            >
                              Editar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className={styles.tableFooter}>
                  <span>
                    {(current - 1) * PAGE_SIZE + 1}–{(current - 1) * PAGE_SIZE + visible.length} de{' '}
                    {filtered.length} {filtered.length === 1 ? 'critério' : 'critérios'}
                  </span>
                  <Pagination page={current} pageCount={pageCount} onPageChange={setPage} />
                </div>
              </div>
            )}
          </SetupCard>

          {mode && editable && (
            <SetupCard
              as="form"
              ref={formRef}
              title="Gerenciar critério"
              subtitle={
                mode.kind === 'edit'
                  ? `Critério selecionado: ${mode.row.criterion.name}`
                  : 'Novo critério da edição'
              }
              onSubmit={handleSubmit}
              noValidate
            >
              <div className={styles.fields}>
                <div className={styles.row}>
                  <TextField
                    label="Nome do critério *"
                    placeholder="Informe o nome"
                    maxLength={150}
                    value={values.name}
                    error={errors.name}
                    onChange={(event) => update('name', event.target.value)}
                  />
                  <Select
                    label="Etapa *"
                    placeholder="Selecione a etapa"
                    options={scoredStages.map((stage) => ({
                      value: String(stage.id),
                      label: stage.name,
                    }))}
                    value={values.stageId}
                    error={errors.stageId}
                    onChange={(event) => update('stageId', event.target.value)}
                  />
                  <TextField
                    label="Pontuação máxima *"
                    placeholder="0,0"
                    inputMode="decimal"
                    value={values.maxScore}
                    error={errors.maxScore}
                    onChange={(event) => update('maxScore', event.target.value)}
                  />
                </div>
                <TextField
                  label="Descrição"
                  placeholder="Descreva o que o critério avalia"
                  value={values.description}
                  onChange={(event) => update('description', event.target.value)}
                />
              </div>
              <div className={styles.actions}>
                <div className={styles.buttons}>
                  <Button
                    type="button"
                    variant="secondary"
                    size="large"
                    onClick={() => setMode(null)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" size="large" loading={saving}>
                    {saving ? 'Salvando…' : 'Salvar critério'}
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

          <Notice tone="info" title="Limites por etapa">
            {limitText}
          </Notice>
        </>
      )}

      <SetupFooter edition={edition} />
    </div>
  );
}
