/**
 * Notas da equipe "Conexão Verde" (RF32), no formato de GET /api/projects/{id}/scores.
 * Etapas iguais às de buildDeliverables: 21 aprovada (nota definitiva), 22 com ajustes
 * (avaliação parcial, nota oculta), 23 em andamento e 24 em breve (sem avaliação).
 */
import type { ProjectScores } from '@/features/evaluations';

const criterion = (id: number, name: string, max: string, average: string | null) => ({
  criterion: { id, name },
  max_score: max,
  average,
});

export function buildProjectScores(project: { id: number; title: string }): ProjectScores {
  return {
    project,
    stages: [
      {
        stage: { id: 21, name: 'Pesquisa e diagnóstico', position: 1 },
        points_value: '2.00',
        status: 'FINALIZED',
        value: '1.70',
        evaluation_count: 2,
        min_evaluators: 2,
        deliverable_status: 'SUBMITTED',
        criteria: [
          criterion(31, 'Clareza do problema', '1.00', '0.90'),
          criterion(32, 'Evidências e pesquisa', '1.00', '0.80'),
        ],
        feedback: [
          {
            comment: 'Diagnóstico bem fundamentado. Ampliem a amostra de produtores entrevistados.',
            items: [],
          },
          { comment: null, items: [] },
        ],
      },
      {
        stage: { id: 22, name: 'Proposta de solução', position: 2 },
        points_value: '2.50',
        status: 'PARTIAL',
        value: null,
        evaluation_count: 1,
        min_evaluators: 2,
        deliverable_status: 'SUBMITTED',
        criteria: [
          criterion(33, 'Viabilidade', '1.25', null),
          criterion(34, 'Impacto esperado', '1.25', null),
        ],
        feedback: [],
      },
      {
        stage: { id: 23, name: 'Protótipo e validação', position: 3 },
        points_value: '3.00',
        status: 'PENDING',
        value: null,
        evaluation_count: 0,
        min_evaluators: 2,
        deliverable_status: 'NOT_SUBMITTED',
        criteria: [],
        feedback: [],
      },
      {
        stage: { id: 24, name: 'Apresentação final', position: 4 },
        points_value: '2.50',
        status: 'PENDING',
        value: null,
        evaluation_count: 0,
        min_evaluators: 2,
        deliverable_status: 'NOT_SUBMITTED',
        criteria: [],
        feedback: [],
      },
    ],
  };
}
