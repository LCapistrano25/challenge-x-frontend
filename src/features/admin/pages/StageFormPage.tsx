import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, ButtonLink, MultiSelect, Select, TextField, notify } from '@/shared/ui';
import {
  Notice,
  SetupCard,
  SetupContext,
  SetupFooter,
  type Crumb,
} from '../components/setup/SetupParts';
import styles from '../components/setup/Setup.module.css';
import { setupStateView } from '../components/setup/SetupState';
import { useAdminEdition } from '../hooks/useAdminEdition';
import { useSetupHeader } from '../hooks/useSetupHeader';
import {
  useCreateStage,
  useEvaluationSetup,
  useSetStageCriteria,
  useUpdateStage,
} from '../hooks/useEvaluationSetup';
import { planStageCriteria, sameStageCriteria, stageCriteriaTotal } from '../lib/criteria';
import { distributionFormula } from '../lib/distribution';
import { formatDay, formatPeriod } from '../lib/dates';
import { isEditionEditable, lockedReason } from '../lib/editions';
import { describeSetupError } from '../lib/errors';
import { TOTAL_CENTS, formatPoints, parsePoints, pointsLabel, toCents } from '../lib/score';
import {
  STAGE_KIND_OPTIONS,
  STAGE_STATUS_LABEL,
  STAGE_KIND_LABEL,
  emptyStageForm,
  formToStagePayload,
  isScoredKind,
  stageDays,
  stagePoints,
  stageStatus,
  stageToForm,
  stagesTotal,
  totalSituation,
  validateStageForm,
  type StageFormField,
  type StageFormValues,
} from '../lib/stages';
import type { AdminEdition, Stage, StageKind } from '../types';

const LIST_PATH = '/admin/etapas';
const DATE_FIELDS: StageFormField[] = ['startDay', 'endDay', 'evaluationDay'];

/**
 * Cadastro e edição de etapa (Figma: "Etapas - cadastrar" e "Etapas - editar e prazos").
 * O status não é gravado: decorre das datas da etapa.
 */
export function StageFormPage() {
  const { stageId } = useParams();
  const editing = stageId !== undefined;
  useSetupHeader(editing ? 'Editar etapa e prazos' : 'Cadastrar etapa', 'ETAPAS');

  const editionState = useAdminEdition();
  const { edition } = editionState;
  const setup = useEvaluationSetup(edition?.id);
  const stage = editing ? setup.stages.find((item) => String(item.id) === stageId) : undefined;

  const blocked = setupStateView(editionState, setup);
  const savedDays = stage ? stageDays(stage) : null;
  const crumbs = [
    { label: 'Início', to: '/admin' },
    { label: 'Etapas', to: LIST_PATH },
    { label: editing ? 'Editar etapa e prazos' : 'Cadastrar etapa' },
  ];
  const description =
    stage && savedDays
      ? `${stage.name} • ${stage.order}ª etapa • Configuração salva: ${formatPeriod(
          savedDays.startDay,
          savedDays.endDay,
        )}.`
      : 'Configure os dados e revise a distribuição de pontos antes de salvar.';

  if (blocked || !edition || (editing && !stage)) {
    return (
      <div className={styles.page}>
        <SetupContext crumbs={crumbs} description={description} />
        {blocked ?? (
          <Alert
            tone="danger"
            title="Etapa não encontrada"
            action={
              <ButtonLink to={LIST_PATH} size="small" variant="secondary">
                Voltar às etapas
              </ButtonLink>
            }
          >
            Ela pode ter sido removida ou pertencer a outra edição.
          </Alert>
        )}
        <SetupFooter edition={edition} />
      </div>
    );
  }

  const currentCriteria = stage ? (setup.stageCriteria.get(stage.id) ?? []) : [];
  const initial = stage
    ? stageToForm(
        stage,
        currentCriteria.map((item) => String(item.criterion.id)),
      )
    : emptyStageForm(Math.max(0, ...setup.stages.map((item) => item.order)) + 1);

  return (
    <StageForm
      // Um formulário novo por etapa (e por edição): o rascunho não passa de uma para outra.
      key={`${edition.id}-${stage?.id ?? 'nova'}`}
      edition={edition}
      setup={setup}
      stage={stage}
      initial={initial}
      crumbs={crumbs}
      description={description}
    />
  );
}

interface StageFormProps {
  edition: AdminEdition;
  setup: ReturnType<typeof useEvaluationSetup>;
  stage: Stage | undefined;
  initial: StageFormValues;
  crumbs: Crumb[];
  description: string;
}

function StageForm({ edition, setup, stage, initial, crumbs, description }: StageFormProps) {
  const editing = stage !== undefined;
  const navigate = useNavigate();
  const createStage = useCreateStage(edition.id);
  const updateStage = useUpdateStage();
  const setStageCriteria = useSetStageCriteria();

  const { stages, criteria, stageCriteria } = setup;
  const others = stages.filter((item) => item.id !== stage?.id);
  const currentCriteria = stage ? (stageCriteria.get(stage.id) ?? []) : [];

  const [values, setValues] = useState<StageFormValues>(initial);
  const [saved] = useState<StageFormValues>(initial);
  const [touched, setTouched] = useState<Set<StageFormField>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const editable = isEditionEditable(edition);
  const scored = isScoredKind(values.kind);
  const criteriaTotal = stageCriteriaTotal(
    currentCriteria.filter((item) => values.criterionIds.includes(String(item.criterion.id))),
  );
  const validation = validateStageForm(values, { others, criteriaTotal });
  const valid = Object.keys(validation.errors).length === 0;
  const dirty = JSON.stringify(values) !== JSON.stringify(saved);
  const datesDirty = DATE_FIELDS.some((field) => values[field] !== saved[field]);
  const saving = createStage.isPending || updateStage.isPending || setStageCriteria.isPending;

  // As datas dependem umas das outras: mexer em uma revela o erro das demais.
  const datesTouched = DATE_FIELDS.some((field) => touched.has(field));
  const errorFor = (field: StageFormField) =>
    submitted || touched.has(field) || (DATE_FIELDS.includes(field) && datesTouched)
      ? validation.errors[field]
      : undefined;

  function update<K extends StageFormField>(field: K, value: StageFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setTouched((current) => new Set(current).add(field));
    setSubmitError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setSubmitError(null);
    if (!valid || saving) return;

    const payload = formToStagePayload(values);
    const selected = values.criterionIds.map(Number);
    const points = parsePoints(values.maxScore) ?? 0;
    const plan = scored ? planStageCriteria(selected, currentCriteria, points) : { items: [] };
    if ('error' in plan) {
      setSubmitError(plan.error);
      return;
    }

    let savedStage: Stage;
    try {
      savedStage = stage
        ? await updateStage.mutateAsync({ stageId: stage.id, input: payload })
        : await createStage.mutateAsync(payload);
    } catch (error) {
      setSubmitError(describeSetupError(error, 'Não foi possível salvar a etapa.'));
      return;
    }

    if (scored && !sameStageCriteria(plan.items, currentCriteria)) {
      try {
        await setStageCriteria.mutateAsync([{ stageId: savedStage.id, items: plan.items }]);
      } catch (error) {
        notify.error(
          `Etapa salva, mas os critérios não foram vinculados: ${describeSetupError(
            error,
            'tente novamente.',
          )}`,
        );
        navigate(`${LIST_PATH}/${savedStage.id}`, { replace: true });
        return;
      }
    }

    notify.success(
      stage ? `Etapa ${payload.name} atualizada.` : `Etapa ${payload.name} cadastrada.`,
    );
    navigate(LIST_PATH);
  }

  function discard() {
    setValues(saved);
    setTouched(new Set());
    setSubmitted(false);
    setSubmitError(null);
  }

  const savedDays = stage ? stageDays(stage) : null;
  const readOnly = !editable;
  const status = STAGE_STATUS_LABEL[stageStatus(values)];
  const criterionOptions = criteria.map((criterion) => ({
    value: String(criterion.id),
    label: criterion.name,
  }));
  const othersTotal = stagesTotal(others);
  const savedTotal = stagesTotal(stages);
  const scoredOthers = others.filter((item) => item.scored);

  const nameField = (
    <TextField
      label={editing ? 'Nome *' : 'Nome da etapa *'}
      placeholder="Informe o nome"
      value={values.name}
      maxLength={100}
      disabled={readOnly}
      error={errorFor('name')}
      onChange={(event) => update('name', event.target.value)}
    />
  );
  const orderField = (
    <TextField
      label="Ordem *"
      placeholder="Informe a posição na sequência"
      inputMode="numeric"
      value={values.order}
      disabled={readOnly}
      error={errorFor('order')}
      onChange={(event) => update('order', event.target.value)}
    />
  );
  const kindField = (
    <Select
      label="Tipo *"
      options={STAGE_KIND_OPTIONS}
      value={values.kind}
      disabled={readOnly}
      onChange={(event) => update('kind', event.target.value as StageKind)}
    />
  );
  const statusField = (
    <TextField
      label="Status"
      value={status}
      readOnly
      disabled
      hint="Definido pelas datas da etapa."
    />
  );
  const criteriaField = scored && (
    <MultiSelect
      label="Critérios vinculados *"
      placeholder="Selecione os critérios"
      options={criterionOptions}
      value={values.criterionIds}
      disabled={readOnly}
      emptyText="Nenhum critério cadastrado na edição."
      error={errorFor('criterionIds')}
      hint={
        values.criterionIds.length > 1
          ? 'Os pontos de cada critério são ajustados em Critérios de avaliação.'
          : undefined
      }
      onChange={(next) => update('criterionIds', next)}
    />
  );
  const scoreField = scored && (
    <TextField
      label="Pontuação máxima *"
      placeholder="0,0"
      inputMode="decimal"
      value={values.maxScore}
      disabled={readOnly}
      error={errorFor('maxScore')}
      hint="A soma das etapas deve continuar exatamente 10,0."
      onChange={(event) => update('maxScore', event.target.value)}
    />
  );
  const dateFields = (
    <div className={styles.row}>
      <TextField
        label="Início *"
        type="date"
        value={values.startDay}
        disabled={readOnly}
        error={errorFor('startDay')}
        onChange={(event) => update('startDay', event.target.value)}
      />
      <TextField
        label="Fim *"
        type="date"
        value={values.endDay}
        disabled={readOnly}
        error={errorFor('endDay')}
        onChange={(event) => update('endDay', event.target.value)}
      />
      {scored && (
        <TextField
          label="Avaliação técnica *"
          type="date"
          value={values.evaluationDay}
          disabled={readOnly}
          error={errorFor('evaluationDay')}
          hint="Prazo para os professores avaliarem a etapa."
          onChange={(event) => update('evaluationDay', event.target.value)}
        />
      )}
    </div>
  );

  const showChronology = validation.chronology !== null && (submitted || datesTouched);
  const chronologyNotice = showChronology && (
    <Notice tone="danger" title="Cronologia inválida">
      {validation.chronology}
      {savedDays && ` O prazo salvo permanece ${formatDay(savedDays.endDay)}.`}
    </Notice>
  );

  const actionsHint = readOnly
    ? null
    : showChronology
      ? 'A ação será liberada após corrigir a inconsistência cronológica.'
      : !valid
        ? 'Preencha os campos obrigatórios e ajuste a distribuição para manter o total de 10,0.'
        : null;
  const actions = !readOnly && (
    <div className={styles.actions}>
      <div className={styles.buttons}>
        {editing ? (
          <Button
            type="button"
            variant="secondary"
            size="large"
            onClick={discard}
            disabled={!dirty}
          >
            Descartar alteração
          </Button>
        ) : (
          <ButtonLink to={LIST_PATH} variant="secondary" size="large">
            Cancelar
          </ButtonLink>
        )}
        <Button
          type="submit"
          size="large"
          loading={saving}
          disabled={!valid || (editing && !dirty)}
        >
          {saving ? 'Salvando…' : 'Salvar etapa'}
        </Button>
      </div>
      {submitError && (
        <p role="alert" className={styles.actionsError}>
          {submitError}
        </p>
      )}
      {actionsHint && <p className={styles.actionsHint}>{actionsHint}</p>}
    </div>
  );

  return (
    <form className={styles.page} onSubmit={handleSubmit} noValidate>
      <SetupContext crumbs={crumbs} description={description} />

      {readOnly && edition && (
        <Notice tone="info" title="Configuração somente para consulta">
          {lockedReason(edition)}
        </Notice>
      )}

      {editing ? (
        <>
          <SetupCard title="Dados da etapa">
            <div className={styles.fields}>
              <div className={styles.row}>
                {nameField}
                {orderField}
                {kindField}
                {statusField}
              </div>
              {scored && (
                <div className={styles.row}>
                  {criteriaField}
                  {scoreField}
                </div>
              )}
            </div>
            {scored && (
              <Notice
                tone={totalSituation(savedTotal).exact ? 'success' : 'warning'}
                title={`Distribuição salva: ${pointsLabel(savedTotal)}`}
              >
                {stages
                  .filter((item) => item.scored)
                  .map((item) => `${item.name} ${formatPoints(stagePoints(item))}`)
                  .join(' + ')}
                .
              </Notice>
            )}
          </SetupCard>

          <SetupCard
            title={`Prazos da etapa${datesDirty ? ' • alteração não salva' : ''}`}
            subtitle={
              values.evaluationDay && scored
                ? `A próxima referência é a avaliação técnica em ${formatDay(values.evaluationDay)}.`
                : `Etapa do tipo ${STAGE_KIND_LABEL[values.kind]}.`
            }
          >
            <div className={styles.fields}>{dateFields}</div>
            {chronologyNotice}
            {actions}
          </SetupCard>
        </>
      ) : (
        <>
          <SetupCard title="Dados da etapa">
            <div className={styles.fields}>
              <div className={styles.row}>
                {nameField}
                {orderField}
              </div>
              <div className={styles.row}>
                {kindField}
                {statusField}
              </div>
            </div>
          </SetupCard>

          <SetupCard title="Período e critérios">
            <div className={styles.fields}>
              {dateFields}
              {scored && (
                <div className={styles.row}>
                  {criteriaField}
                  {scoreField}
                </div>
              )}
            </div>
          </SetupCard>

          {chronologyNotice}

          {scored &&
            scoredOthers.length > 0 &&
            (toCents(othersTotal) >= TOTAL_CENTS || !totalSituation(validation.total).exact) && (
              <Notice
                tone="warning"
                title={`A edição já tem ${scoredOthers.length} ${
                  scoredOthers.length === 1 ? 'etapa' : 'etapas'
                } e ${pointsLabel(othersTotal)}`}
              >
                {toCents(othersTotal) >= TOTAL_CENTS
                  ? 'Para incluir uma etapa com pontuação, redistribua os pontos existentes em Pontuações por etapa. Salvar fica bloqueado se o novo total passar de 10,0.'
                  : `Com esta etapa, o total fica em ${formatPoints(
                      validation.total,
                    )}. A publicação da edição exige a soma exata de 10,0 (${distributionFormula(
                      others,
                    )}).`}
              </Notice>
            )}

          {actions}
        </>
      )}

      <SetupFooter edition={edition} />
    </form>
  );
}
