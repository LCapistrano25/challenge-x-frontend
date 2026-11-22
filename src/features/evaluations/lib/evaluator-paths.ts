/** Rotas da área do avaliador externo (ver app/router/routes.tsx). */
export const FINALISTS_PATH = '/avaliador';
export const MY_EVALUATIONS_PATH = '/avaliador/avaliacoes';

export const finalistPath = (projectId: number | string) => `/avaliador/projetos/${projectId}`;

export const evaluationFormPath = (projectId: number | string) =>
  `/avaliador/projetos/${projectId}/avaliar`;

/** Consulta da avaliação enviada. Até existir a tela própria, abre o detalhe do projeto. */
export const evaluationViewPath = (projectId: number | string) => finalistPath(projectId);
