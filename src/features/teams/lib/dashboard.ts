import type { IncompleteRequirement, StudentDashboard } from '../types';

/**
 * Fim do prazo de formação: a etapa FORMATION em andamento; se não houver, a próxima;
 * se todas terminaram, a última (o prazo aparece como encerrado).
 */
export function getFormationDeadline(dashboard: Pick<StudentDashboard, 'stages'>): string | null {
  const formation = dashboard.stages
    .map((item) => item.stage)
    .filter((stage) => stage.type === 'FORMATION')
    .sort((a, b) => a.position - b.position);

  const current =
    formation.find((stage) => stage.phase_status === 'OPEN') ??
    formation.find((stage) => stage.phase_status === 'UPCOMING') ??
    formation[formation.length - 1];

  return current?.ends_at ?? null;
}

const REQUIREMENT_LABEL: Record<IncompleteRequirement, string> = {
  MIN_MEMBERS: 'a equipe ainda não tem o número mínimo de integrantes',
  CHALLENGE_NOT_SELECTED: 'o desafio do projeto ainda não foi escolhido',
  PROJECT_DATA_MISSING: 'faltam dados obrigatórios do projeto',
};

export const describeRequirement = (requirement: IncompleteRequirement) =>
  REQUIREMENT_LABEL[requirement];
