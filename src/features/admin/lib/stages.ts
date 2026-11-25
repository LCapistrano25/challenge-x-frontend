import type { Stage, StageCreate, StageKind } from '../types';
import {
  endOfDayIso,
  formatDay,
  formatDayMonth,
  previousDay,
  startOfDayIso,
  toDateInput,
  todayInput,
} from './dates';
import {
  INVALID_POINTS,
  TOTAL_CENTS,
  decimalToNumber,
  formatPoints,
  fromCents,
  parsePoints,
  toCents,
  toDecimal,
} from './score';

export const STAGE_NAME_LIMIT = 100;

export const STAGE_KIND_LABEL: Record<StageKind, string> = {
  FORMATION: 'Formação',
  SUBMISSION: 'Entrega',
  FINAL: 'Final (não pontuada)',
};

export const STAGE_KIND_OPTIONS = (Object.keys(STAGE_KIND_LABEL) as StageKind[]).map((kind) => ({
  value: kind,
  label: STAGE_KIND_LABEL[kind],
}));

export type StageStatus = 'PLANNED' | 'OPEN' | 'EVALUATING' | 'DONE';

export const STAGE_STATUS_LABEL: Record<StageStatus, string> = {
  PLANNED: 'Planejada',
  OPEN: 'Em andamento',
  EVALUATING: 'Em avaliação',
  DONE: 'Encerrada',
};

/** A API não guarda status da etapa: ele decorre das datas (entrega e avaliação). */
export function stageStatus(
  dates: { startDay: string; endDay: string; evaluationDay: string },
  today: string = todayInput(),
): StageStatus {
  if (!dates.startDay || today < dates.startDay) return 'PLANNED';
  if (!dates.endDay || today <= dates.endDay) return 'OPEN';
  if (dates.evaluationDay && today <= dates.evaluationDay) return 'EVALUATING';
  return 'DONE';
}

export const stageDays = (stage: Stage) => ({
  startDay: toDateInput(stage.starts_at),
  endDay: toDateInput(stage.ends_at),
  evaluationDay: toDateInput(stage.evaluation_ends_at),
});

export const sortStages = (stages: readonly Stage[]) =>
  [...stages].sort((a, b) => a.order - b.order);

export const stagePoints = (stage: Stage) =>
  stage.scored ? (decimalToNumber(stage.max_score) ?? 0) : 0;

/** Soma das pontuações máximas das etapas pontuadas (em pontos). */
export function stagesTotal(stages: readonly Stage[], exceptId?: number): number {
  return fromCents(
    stages
      .filter((stage) => stage.id !== exceptId)
      .reduce((total, stage) => total + toCents(stagePoints(stage)), 0),
  );
}

/** "1 · Ideação" */
export const stageTitle = (stage: Pick<Stage, 'order' | 'name'>) =>
  `${stage.order} · ${stage.name}`;

/** Situação do total em relação aos 10,0 pontos exigidos na publicação. */
export function totalSituation(total: number): { exact: boolean; text: string } {
  const diff = toCents(total) - TOTAL_CENTS;
  if (diff === 0) return { exact: true, text: 'Soma exata atendida' };
  if (diff > 0) return { exact: false, text: `Excede em ${formatPoints(fromCents(diff))}` };
  return { exact: false, text: `Faltam ${formatPoints(fromCents(-diff))} para 10,0` };
}

/** Problemas de cronologia entre etapas vizinhas (sobreposição ou prazo fora de ordem). */
export function chronologyIssues(stages: readonly Stage[]): string[] {
  const issues: string[] = [];
  const sorted = sortStages(stages);
  sorted.forEach((stage, index) => {
    const { startDay, endDay, evaluationDay } = stageDays(stage);
    if (evaluationDay && evaluationDay <= endDay) {
      issues.push(`${stage.name}: a avaliação termina antes do fim da entrega.`);
    }
    const next = sorted[index + 1];
    if (next && toDateInput(next.starts_at) <= endDay) {
      issues.push(`${stage.name} termina depois do início de ${next.name}.`);
    }
    if (endDay < startDay) issues.push(`${stage.name}: o fim é anterior ao início.`);
  });
  return issues;
}

/** "Ideação até 19/03; Desenvolvimento até 30/04; Entrega até 14/05/2027." */
export function scheduleSummary(stages: readonly Stage[]): string {
  const sorted = sortStages(stages);
  if (sorted.length === 0) return '';
  const parts = sorted.map((stage, index) => {
    const endDay = toDateInput(stage.ends_at);
    const last = index === sorted.length - 1;
    return `${stage.name} até ${last ? formatDay(endDay) : formatDayMonth(endDay)}`;
  });
  return `${parts.join('; ')}.`;
}

/** Último prazo de avaliação entre as etapas pontuadas (indicador "Avaliação técnica"). */
export function technicalEvaluation(
  stages: readonly Stage[],
): { day: string; stages: Stage[] } | null {
  const scored = sortStages(stages).filter((stage) => stage.scored && stage.evaluation_ends_at);
  if (scored.length === 0) return null;
  const day = scored
    .map((stage) => toDateInput(stage.evaluation_ends_at))
    .reduce((latest, current) => (current > latest ? current : latest));
  return { day, stages: scored };
}

/* ------------------------------------------------------------------------------------------ */
/* Formulário de cadastro e edição                                                             */
/* ------------------------------------------------------------------------------------------ */

export interface StageFormValues {
  name: string;
  order: string;
  kind: StageKind;
  startDay: string;
  endDay: string;
  evaluationDay: string;
  maxScore: string;
  criterionIds: string[];
}

export type StageFormField = keyof StageFormValues;
export type StageFormErrors = Partial<Record<StageFormField, string>>;

export const emptyStageForm = (order: number): StageFormValues => ({
  name: '',
  order: String(order),
  kind: 'SUBMISSION',
  startDay: '',
  endDay: '',
  evaluationDay: '',
  maxScore: '',
  criterionIds: [],
});

export function stageToForm(stage: Stage, criterionIds: string[]): StageFormValues {
  const points = decimalToNumber(stage.max_score);
  return {
    name: stage.name,
    order: String(stage.order),
    kind: stage.kind,
    ...stageDays(stage),
    maxScore: points === null ? '' : formatPoints(points),
    criterionIds,
  };
}

/** A etapa FINAL não compõe a nota (P-20); as demais são pontuadas. */
export const isScoredKind = (kind: StageKind) => kind !== 'FINAL';

export interface StageValidationContext {
  /** Demais etapas da edição (sem a que está sendo editada). */
  others: readonly Stage[];
  /** Soma dos critérios já vinculados à etapa em edição. */
  criteriaTotal?: number;
}

export interface StageValidation {
  errors: StageFormErrors;
  /** Mensagem do aviso "Cronologia inválida", quando a data é a causa do bloqueio. */
  chronology: string | null;
  /** Total das etapas pontuadas com o valor digitado (para o aviso de distribuição). */
  total: number;
}

/**
 * Valida nome, posição, datas (início < fim < avaliação técnica, sem sobrepor as etapas
 * vizinhas) e pontuação (o total das etapas não passa de 10,0 e a etapa comporta seus
 * critérios). O prazo posterior à avaliação técnica é rejeitado.
 */
export function validateStageForm(
  values: StageFormValues,
  { others, criteriaTotal = 0 }: StageValidationContext,
): StageValidation {
  const errors: StageFormErrors = {};
  let chronology: string | null = null;
  const scored = isScoredKind(values.kind);

  const name = values.name.trim();
  if (!name) errors.name = 'Informe o nome da etapa.';
  else if (name.length > STAGE_NAME_LIMIT) {
    errors.name = `Use até ${STAGE_NAME_LIMIT} caracteres.`;
  }

  const order = Number(values.order);
  if (!/^\d+$/.test(values.order.trim()) || order < 1) {
    errors.order = 'Informe a posição na sequência (1, 2, 3…).';
  } else {
    const taken = others.find((stage) => stage.order === order);
    if (taken) errors.order = `A posição ${order} já é da etapa ${taken.name}.`;
  }

  const { startDay, endDay, evaluationDay } = values;
  if (!startDay) errors.startDay = 'Informe o início.';
  if (!endDay) errors.endDay = 'Informe o fim.';
  if (startDay && endDay && endDay < startDay) {
    errors.endDay = 'Deve ocorrer depois do início.';
  }
  if (scored && !evaluationDay) errors.evaluationDay = 'Informe o prazo da avaliação técnica.';

  if (scored && evaluationDay && endDay && endDay >= evaluationDay) {
    errors.endDay = `Deve ocorrer antes de ${formatDay(evaluationDay)}.`;
    const lastDay = previousDay(evaluationDay);
    chronology =
      `O prazo proposto de ${formatDayMonth(endDay)} é posterior à avaliação técnica. ` +
      (startDay && startDay <= lastDay
        ? `Defina uma data entre ${formatDayMonth(startDay)} e ${formatDay(lastDay)}.`
        : `Defina uma data anterior a ${formatDay(evaluationDay)}.`);
  }

  // Vizinhas na sequência: a etapa começa depois da anterior e termina antes da próxima.
  if (!errors.order && startDay && endDay) {
    const sorted = sortStages(others);
    const previous = [...sorted].reverse().find((stage) => stage.order < order);
    const next = sorted.find((stage) => stage.order > order);
    const previousEnd = previous ? toDateInput(previous.ends_at) : '';
    const nextStart = next ? toDateInput(next.starts_at) : '';
    if (previous && startDay <= previousEnd && !errors.startDay) {
      errors.startDay = `Deve ocorrer depois de ${formatDay(previousEnd)} (fim de ${previous.name}).`;
      chronology ??= `${name || 'A etapa'} começaria antes do fim de ${previous.name}.`;
    }
    if (next && endDay >= nextStart && !errors.endDay) {
      errors.endDay = `Deve ocorrer antes de ${formatDay(nextStart)} (início de ${next.name}).`;
      chronology ??= `${name || 'A etapa'} terminaria depois do início de ${next.name}.`;
    }
  }

  const othersTotal = stagesTotal(others);
  let total = othersTotal;
  if (scored) {
    const points = parsePoints(values.maxScore);
    if (values.maxScore.trim() === '') errors.maxScore = 'Informe a pontuação máxima.';
    else if (points === null) errors.maxScore = INVALID_POINTS;
    else if (points <= 0) errors.maxScore = 'Use um número maior que zero.';
    else {
      total = fromCents(toCents(othersTotal) + toCents(points));
      if (toCents(total) > TOTAL_CENTS) {
        errors.maxScore = `A soma das etapas passaria de 10,0 (ficaria ${formatPoints(total)}).`;
      } else if (toCents(points) < toCents(criteriaTotal)) {
        errors.maxScore = `Os critérios desta etapa somam ${formatPoints(criteriaTotal)}.`;
      }
    }
    if (values.criterionIds.length === 0) errors.criterionIds = 'Selecione ao menos um critério.';
  }

  return { errors, chronology, total };
}

/** Corpo do POST/PATCH a partir do formulário já validado. */
export function formToStagePayload(values: StageFormValues): StageCreate {
  const scored = isScoredKind(values.kind);
  const points = parsePoints(values.maxScore);
  return {
    order: Number(values.order),
    name: values.name.trim(),
    kind: values.kind,
    starts_at: startOfDayIso(values.startDay),
    ends_at: endOfDayIso(values.endDay),
    evaluation_ends_at: scored && values.evaluationDay ? endOfDayIso(values.evaluationDay) : null,
    scored,
    max_score: scored && points !== null ? toDecimal(points) : null,
  };
}
