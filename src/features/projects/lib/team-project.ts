import type { EditionSummary } from '@/shared/types/api';
import type { Project } from '../types';

/* --- Rotas do projeto e das entregas (task #13) --- */

export const TEAM_PROJECT_PATH = '/academico/projeto';
/** Edição dos dados cadastrais (só a liderança): reaproveita o formulário do cadastro. */
export const EDIT_PROJECT_PATH = '/academico/projeto/novo?editar=1';

/** "Enviar entrega" / "Atualizar entrega" da etapa. */
export const submitDeliveryPath = (stageId: number) =>
  `/academico/projeto/entrega?etapa=${stageId}`;

/** Confirmação "Entrega da etapa realizada!" de uma versão. */
export const deliveryConfirmationPath = (stageId: number, versionId: number) =>
  `/academico/projeto/entrega/confirmacao?etapa=${stageId}&versao=${versionId}`;

/* --- Textos do projeto --- */

/** "Líder: Ana Maria · Orientadora: Profa. Carla Mendes" */
export function describeResponsibles(
  leaderName: string | null,
  project: Pick<Project, 'advisor_name'>,
) {
  const leader = `Líder: ${leaderName ?? 'sem líder'}`;
  return project.advisor_name ? `${leader} · Orientadora: ${project.advisor_name}` : leader;
}

/** "Campus sede · Edição 2027 · DX-2027-018" (local de aplicação, edição e código da equipe). */
export function describeProjectContext(
  project: Pick<Project, 'location'>,
  team: { code: string },
  edition: Pick<EditionSummary, 'year'> | null | undefined,
) {
  return [project.location, edition ? `Edição ${edition.year}` : null, team.code]
    .filter(Boolean)
    .join(' · ');
}
