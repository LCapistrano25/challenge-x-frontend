import type { Stage } from '../types';
import {
  INVALID_POINTS,
  TOTAL_CENTS,
  formatPoints,
  fromCents,
  parsePoints,
  pointsLabel,
  toCents,
  toDecimal,
} from './score';
import { sortStages, stagePoints } from './stages';

/** Etapas que compõem a nota de 0 a 10 (pontuadas; a FINAL fica de fora). */
export const scoredStages = (stages: readonly Stage[]) =>
  sortStages(stages).filter((stage) => stage.scored);

export const distributionValues = (stages: readonly Stage[]) =>
  Object.fromEntries(
    scoredStages(stages).map((stage) => [stage.id, formatPoints(stagePoints(stage))]),
  ) as Record<number, string>;

export interface DistributionCheck {
  /** Erro por etapa (chave: id). */
  errors: Record<number, string>;
  total: number;
  exact: boolean;
  /** Título e orientação do aviso abaixo dos campos (null quando a soma está exata). */
  problem: { title: string; detail: string } | null;
}

/**
 * Pontuações da distribuição: cada etapa > 0 e acima da soma dos próprios critérios; o total
 * precisa ser exatamente 10,0 para salvar (RF09).
 */
export function checkDistribution(
  stages: readonly Stage[],
  values: Record<number, string>,
  criteriaTotals: ReadonlyMap<number, number>,
  changedId?: number,
): DistributionCheck {
  const errors: Record<number, string> = {};
  let totalCents = 0;
  for (const stage of scoredStages(stages)) {
    const raw = values[stage.id] ?? '';
    const points = parsePoints(raw);
    if (raw.trim() === '') errors[stage.id] = 'Informe a pontuação.';
    else if (points === null) errors[stage.id] = INVALID_POINTS;
    else if (points <= 0) errors[stage.id] = 'Use um número maior que zero.';
    else {
      totalCents += toCents(points);
      const criteria = criteriaTotals.get(stage.id) ?? 0;
      if (toCents(points) < toCents(criteria)) {
        errors[stage.id] = `Os critérios desta etapa somam ${formatPoints(criteria)}.`;
      }
    }
  }

  const total = fromCents(totalCents);
  const diff = totalCents - TOTAL_CENTS;
  const invalidField = Object.keys(errors).length > 0;
  let problem: DistributionCheck['problem'] = null;

  if (!invalidField && diff !== 0) {
    const amount = pointsLabel(fromCents(Math.abs(diff)));
    problem = {
      title: `Não é possível salvar: soma de ${pointsLabel(total)}`,
      detail:
        `${diff > 0 ? 'Reduza' : 'Acrescente'} ${amount} na distribuição. O total precisa ser ` +
        'exatamente 10,0; a configuração salva continua válida.',
    };
    // O aviso curto fica no campo alterado, como no Figma ("A soma excede o total.").
    const target = changedId ?? scoredStages(stages).at(-1)?.id;
    if (target !== undefined && !errors[target]) {
      errors[target] = diff > 0 ? 'A soma excede o total.' : 'A soma está abaixo do total.';
    }
  } else if (invalidField) {
    problem = {
      title: 'Não é possível salvar: revise as pontuações',
      detail: 'Corrija os campos destacados. A configuração salva continua válida.',
    };
  }

  return { errors, total, exact: !invalidField && diff === 0, problem };
}

/** "2,0 + 3,0 + 3,0 + 2,0 = 10,0" */
export function distributionFormula(stages: readonly Stage[]): string {
  const scored = scoredStages(stages);
  if (scored.length === 0) return '';
  const parts = scored.map((stage) => formatPoints(stagePoints(stage)));
  const total = fromCents(scored.reduce((sum, stage) => sum + toCents(stagePoints(stage)), 0));
  return `${parts.join(' + ')} = ${formatPoints(total)}`;
}

/**
 * PATCHes da nova distribuição, só das etapas alteradas. As reduções vão antes dos aumentos:
 * a API recusa cada gravação que faça as etapas passarem de 10 pontos.
 */
export function planDistribution(
  stages: readonly Stage[],
  values: Record<number, string>,
): { stageId: number; max_score: string; delta: number }[] {
  return scoredStages(stages)
    .map((stage) => {
      const points = parsePoints(values[stage.id] ?? '') ?? 0;
      return {
        stageId: stage.id,
        max_score: toDecimal(points),
        delta: toCents(points) - toCents(stagePoints(stage)),
      };
    })
    .filter((change) => change.delta !== 0)
    .sort((a, b) => a.delta - b.delta);
}
