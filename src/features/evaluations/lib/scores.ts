import type { ScoreStatus, StageScoreDetail } from '../types';

const decimal = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** "2.40" → "2,40". */
export const formatScore = (value: string | number) => decimal.format(Number(value));

/**
 * RF32: a nota só aparece quando é definitiva. PARTIAL (abaixo do mínimo de avaliadores) é
 * exibido como pendente e sem o valor parcial (P-33).
 */
export const isFinal = (stage: Pick<StageScoreDetail, 'status' | 'value'>) =>
  stage.status === 'FINALIZED' && stage.value != null;

export const SCORE_STATUS_LABEL: Record<ScoreStatus, string> = {
  FINALIZED: 'Definitiva',
  PARTIAL: 'Pendente',
  PENDING: 'Pendente',
};

/** Texto abaixo da nota: avaliações recebidas, entrega não realizada ou etapa sem envio. */
export function describeStageScore(stage: StageScoreDetail) {
  if (stage.deliverable_status === 'NOT_DELIVERED') {
    return 'Entrega não realizada no prazo: a etapa recebe nota zero.';
  }
  if (isFinal(stage)) {
    const count = stage.evaluation_count;
    return `Média de ${count} ${count === 1 ? 'avaliação' : 'avaliações'} da orientação.`;
  }
  if (stage.deliverable_status === 'NOT_SUBMITTED') {
    return 'A nota aparece depois do envio e da avaliação da etapa.';
  }
  return `${stage.evaluation_count} de ${stage.min_evaluators} avaliações concluídas. A nota aparece quando todas forem finalizadas.`;
}

/** Soma das notas definitivas sobre o total de pontos das etapas pontuadas. */
export function summarizeScores(stages: StageScoreDetail[]) {
  const total = stages.reduce((sum, stage) => sum + Number(stage.points_value), 0);
  const final = stages.filter(isFinal);
  const earned = final.reduce((sum, stage) => sum + Number(stage.value), 0);
  return { earned, total, finalCount: final.length, stageCount: stages.length };
}
