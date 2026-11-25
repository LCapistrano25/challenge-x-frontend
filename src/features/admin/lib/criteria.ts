import type { Criterion, Stage, StageCriteriaItem, StageCriterion } from '../types';
import { parseRubric, type Rubric } from './rubric';
import {
  INVALID_POINTS,
  decimalToNumber,
  formatPoints,
  fromCents,
  parsePoints,
  toCents,
  toDecimal,
} from './score';
import { sortStages, stagePoints } from './stages';

export const CRITERION_NAME_LIMIT = 150;

/** Critérios vinculados a cada etapa (chave: id da etapa). */
export type StageCriteriaMap = ReadonlyMap<number, readonly StageCriterion[]>;

/** Uma linha da tabela: o critério em uma etapa (ou sem etapa, ainda não vinculado). */
export interface CriterionRow {
  key: string;
  criterion: Criterion;
  rubric: Rubric;
  stage: Stage | null;
  maxScore: number | null;
}

export function buildCriterionRows(
  criteria: readonly Criterion[],
  stages: readonly Stage[],
  stageCriteria: StageCriteriaMap,
): CriterionRow[] {
  const rows: CriterionRow[] = [];
  const linked = new Set<number>();
  for (const stage of sortStages(stages)) {
    for (const item of stageCriteria.get(stage.id) ?? []) {
      const criterion = criteria.find((c) => c.id === item.criterion.id);
      if (!criterion) continue;
      linked.add(criterion.id);
      rows.push({
        key: `${stage.id}-${criterion.id}`,
        criterion,
        rubric: parseRubric(criterion.rubric),
        stage,
        maxScore: decimalToNumber(item.max_score),
      });
    }
  }
  for (const criterion of criteria) {
    if (linked.has(criterion.id)) continue;
    rows.push({
      key: `none-${criterion.id}`,
      criterion,
      rubric: parseRubric(criterion.rubric),
      stage: null,
      maxScore: null,
    });
  }
  return rows;
}

const normalize = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Busca por nome do critério e filtro por etapa ('' = todas, 'none' = sem etapa). */
export function filterCriterionRows(rows: readonly CriterionRow[], search: string, stage: string) {
  const term = normalize(search.trim());
  return rows.filter((row) => {
    if (term && !normalize(row.criterion.name).includes(term)) return false;
    if (stage === 'none') return row.stage === null;
    if (stage) return String(row.stage?.id) === stage;
    return true;
  });
}

/** Soma dos critérios da etapa, opcionalmente sem um deles. */
export function stageCriteriaTotal(items: readonly StageCriterion[], exceptCriterionId?: number) {
  return fromCents(
    items
      .filter((item) => item.criterion.id !== exceptCriterionId)
      .reduce((total, item) => total + toCents(decimalToNumber(item.max_score) ?? 0), 0),
  );
}

/** "Clareza 0,8 + Domínio 0,8 + Respostas 0,4" */
export const stageComposition = (items: readonly StageCriterion[]) =>
  items
    .map((item) => `${item.criterion.name} ${formatPoints(decimalToNumber(item.max_score) ?? 0)}`)
    .join(' + ');

/* ------------------------------------------------------------------------------------------ */
/* Formulário "Gerenciar critério"                                                             */
/* ------------------------------------------------------------------------------------------ */

export interface CriterionFormValues {
  name: string;
  stageId: string;
  maxScore: string;
  description: string;
}

export type CriterionFormErrors = Partial<Record<keyof CriterionFormValues, string>>;

export const emptyCriterionForm = (): CriterionFormValues => ({
  name: '',
  stageId: '',
  maxScore: '',
  description: '',
});

export function rowToCriterionForm(row: CriterionRow): CriterionFormValues {
  return {
    name: row.criterion.name,
    stageId: row.stage ? String(row.stage.id) : '',
    maxScore: row.maxScore === null ? '' : formatPoints(row.maxScore),
    description: row.rubric.description,
  };
}

export interface CriterionValidationContext {
  criteria: readonly Criterion[];
  stages: readonly Stage[];
  stageCriteria: StageCriteriaMap;
  /** Critério em edição (null no cadastro). */
  criterionId: number | null;
}

/** Nome único na edição e soma dos critérios dentro do limite da etapa (RF08). */
export function validateCriterionForm(
  values: CriterionFormValues,
  { criteria, stages, stageCriteria, criterionId }: CriterionValidationContext,
): CriterionFormErrors {
  const errors: CriterionFormErrors = {};
  const name = values.name.trim();
  if (!name) errors.name = 'Informe o nome do critério.';
  else if (name.length > CRITERION_NAME_LIMIT) {
    errors.name = `Use até ${CRITERION_NAME_LIMIT} caracteres.`;
  } else if (criteria.some((c) => c.id !== criterionId && normalize(c.name) === normalize(name))) {
    errors.name = 'Já existe critério com este nome na edição.';
  }

  const stage = stages.find((s) => String(s.id) === values.stageId);
  if (!stage) errors.stageId = 'Selecione a etapa.';

  const points = parsePoints(values.maxScore);
  if (values.maxScore.trim() === '') errors.maxScore = 'Informe a pontuação máxima.';
  else if (points === null) errors.maxScore = INVALID_POINTS;
  else if (points <= 0) errors.maxScore = 'Use um número maior que zero.';
  else if (stage) {
    const limit = stagePoints(stage);
    const others = stageCriteriaTotal(stageCriteria.get(stage.id) ?? [], criterionId ?? undefined);
    const total = fromCents(toCents(others) + toCents(points));
    if (toCents(total) > toCents(limit)) {
      errors.maxScore =
        `A soma dos critérios de ${stage.name} passaria do limite da etapa ` +
        `(${formatPoints(total)} de ${formatPoints(limit)}).`;
    }
  }
  return errors;
}

export interface StageCriteriaChange {
  stageId: number;
  items: StageCriteriaItem[];
}

const toItems = (items: readonly StageCriterion[], exceptCriterionId?: number) =>
  items
    .filter((item) => item.criterion.id !== exceptCriterionId)
    .map((item) => ({ criterion_id: item.criterion.id, max_score: item.max_score }));

/**
 * PUTs necessários para levar o critério à etapa e pontuação escolhidas. A etapa antiga é
 * atualizada antes (a soma dela só diminui), para que a nova caiba no limite.
 */
export function planCriterionLink(
  criterionId: number,
  previous: { stageId: number | null; maxScore: number | null },
  next: { stageId: number; maxScore: number },
  stageCriteria: StageCriteriaMap,
): StageCriteriaChange[] {
  const changes: StageCriteriaChange[] = [];
  if (previous.stageId !== null && previous.stageId !== next.stageId) {
    changes.push({
      stageId: previous.stageId,
      items: toItems(stageCriteria.get(previous.stageId) ?? [], criterionId),
    });
  }
  const unchanged =
    previous.stageId === next.stageId &&
    previous.maxScore !== null &&
    toCents(previous.maxScore) === toCents(next.maxScore);
  if (!unchanged) {
    const item = { criterion_id: criterionId, max_score: toDecimal(next.maxScore) };
    const current = toItems(stageCriteria.get(next.stageId) ?? []);
    const position = current.findIndex((c) => c.criterion_id === criterionId);
    // Na mesma etapa, o critério mantém a posição; em etapa nova, entra no fim.
    changes.push({
      stageId: next.stageId,
      items:
        position >= 0
          ? current.map((c, index) => (index === position ? item : c))
          : [...current, item],
    });
  }
  return changes;
}

/**
 * Critérios escolhidos no formulário da etapa. Com um só critério, ele recebe a pontuação da
 * etapa. Com vários, os que já estavam vinculados mantêm seus pontos e os novos dividem o que
 * sobra (o ajuste fino é feito em Critérios de avaliação).
 */
export function planStageCriteria(
  selectedIds: readonly number[],
  current: readonly StageCriterion[],
  stageMax: number,
): { items: StageCriteriaItem[] } | { error: string } {
  if (selectedIds.length === 0) return { items: [] };
  if (selectedIds.length === 1) {
    return { items: [{ criterion_id: selectedIds[0]!, max_score: toDecimal(stageMax) }] };
  }
  const kept = current.filter((item) => selectedIds.includes(item.criterion.id));
  const added = selectedIds.filter((id) => !kept.some((item) => item.criterion.id === id));
  const keptCents = toCents(stageCriteriaTotal(kept));
  const freeCents = toCents(stageMax) - keptCents;
  if (freeCents < 0) {
    return {
      error: `Os critérios mantidos somam ${formatPoints(fromCents(keptCents))}, acima da etapa.`,
    };
  }
  if (added.length > 0 && freeCents < added.length) {
    return {
      error:
        'Não há pontos livres na etapa para os novos critérios. ' +
        'Ajuste a pontuação dos critérios em Critérios de avaliação.',
    };
  }
  const share = added.length > 0 ? Math.floor(freeCents / added.length) : 0;
  const items: StageCriteriaItem[] = kept.map((item) => ({
    criterion_id: item.criterion.id,
    max_score: item.max_score,
  }));
  added.forEach((id, index) => {
    const last = index === added.length - 1;
    const cents = last ? freeCents - share * (added.length - 1) : share;
    items.push({ criterion_id: id, max_score: toDecimal(fromCents(cents)) });
  });
  return { items };
}

/** Mesmos critérios e pontos? (evita PUT desnecessário) */
export function sameStageCriteria(
  items: readonly StageCriteriaItem[],
  current: readonly StageCriterion[],
): boolean {
  if (items.length !== current.length) return false;
  return items.every((item) => {
    const match = current.find((c) => c.criterion.id === item.criterion_id);
    return (
      match !== undefined &&
      toCents(decimalToNumber(match.max_score) ?? 0) ===
        toCents(decimalToNumber(item.max_score) ?? 0)
    );
  });
}
