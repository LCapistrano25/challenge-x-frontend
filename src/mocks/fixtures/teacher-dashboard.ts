import type {
  DeliveryEvaluationDetail,
  DeliveryStatus,
  EvaluationCriterion,
  PublishEvaluationInput,
  TeacherDashboard,
  TeacherDelivery,
} from '@/features/deliveries';

const ES = 'Engenharia de Software';
const SI = 'Sistemas de Informação';

// Mesmos dados ilustrativos do Figma (Professor › Home e Avaliação), já ordenados por prioridade.
const BASE: Omit<TeacherDelivery, 'stage'>[] = [
  {
    id: 'd1',
    project_name: 'Portal de Extensão',
    team_name: 'Equipe Aurora',
    course: SI,
    submitted_at: '2026-10-06T14:32:00',
    status: 'PENDING_EVALUATION',
  },
  {
    id: 'd2',
    project_name: 'Biblioteca Conectada',
    team_name: 'Equipe Nexo',
    course: ES,
    submitted_at: '2026-10-05T18:10:00',
    status: 'PENDING_EVALUATION',
  },
  {
    id: 'd3',
    project_name: 'Mapa de Acessibilidade',
    team_name: 'Equipe Ponte',
    course: ES,
    submitted_at: '2026-10-05T10:15:00',
    status: 'PENDING_EVALUATION',
  },
  {
    id: 'd4',
    project_name: 'Agenda Comunitária',
    team_name: 'Equipe Elo',
    course: ES,
    submitted_at: '2026-10-08T09:20:00',
    status: 'SUBMITTED',
  },
  {
    id: 'd5',
    project_name: 'Gestão de Laboratórios',
    team_name: 'Equipe Prisma',
    course: SI,
    submitted_at: '2026-10-04T16:40:00',
    status: 'EVALUATED',
  },
  {
    id: 'd6',
    project_name: 'Rede de Voluntariado',
    team_name: 'Equipe Raiz',
    course: ES,
    submitted_at: '2026-10-03T11:05:00',
    status: 'EVALUATED',
  },
];

const RUBRIC: Omit<EvaluationCriterion, 'score'>[] = [
  {
    id: 'c1',
    name: 'Definição do problema',
    description: 'Clareza do problema e do público atendido.',
    max_score: 2,
  },
  {
    id: 'c2',
    name: 'Objetivos e justificativa',
    description: 'Coerência dos objetivos e relevância da proposta.',
    max_score: 3,
  },
  {
    id: 'c3',
    name: 'Planejamento e cronograma',
    description: 'Viabilidade das atividades e dos prazos.',
    max_score: 3,
  },
  {
    id: 'c4',
    name: 'Organização do material',
    description: 'Estrutura, referências e apresentação.',
    max_score: 2,
  },
];

const FEEDBACK =
  'A proposta está bem estruturada. Detalhem a distribuição de responsabilidades e os marcos do cronograma antes da próxima etapa.';

interface Published {
  scores: Record<string, number>;
  feedback: string;
}

const initialPublished = (): Map<string, Published> =>
  new Map([
    ['d5', { scores: { c1: 1.5, c2: 2.5, c3: 2, c4: 2 }, feedback: FEEDBACK }],
    ['d6', { scores: { c1: 2, c2: 2.5, c3: 2.5, c4: 1.5 }, feedback: FEEDBACK }],
  ]);

let published = initialPublished();

/** Zera as avaliações publicadas (usado entre os testes). */
export function resetTeacherMock() {
  published = initialPublished();
}

const statusOf = (id: string, base: DeliveryStatus): DeliveryStatus =>
  published.has(id) ? 'EVALUATED' : base;

export function buildTeacherDashboard(): TeacherDashboard {
  return {
    semester: '2026.2',
    stage_label: 'Etapa 2 — Proposta e planejamento',
    evaluation_deadline: '2026-10-23',
    courses: [ES, SI],
    deliveries: BASE.map((d) => ({ ...d, stage: 2, status: statusOf(d.id, d.status) })),
  };
}

const total = (scores: Record<string, number>) =>
  Math.round(Object.values(scores).reduce((sum, value) => sum + value, 0) * 100) / 100;

export function buildDeliveryEvaluation(id: string): DeliveryEvaluationDetail | null {
  const base = BASE.find((d) => d.id === id);
  if (!base) return null;
  const record = published.get(id);
  return {
    id,
    project_name: base.project_name,
    team_name: base.team_name,
    course: base.course,
    stage: 2,
    stage_label: 'Etapa 2 — Proposta e planejamento',
    deadline: '2026-10-07',
    max_score: 10,
    status: statusOf(id, base.status),
    submitted_by: 'Ana Souza',
    submitted_at: base.submitted_at,
    files: [
      {
        id: 'f1',
        name: 'Proposta_Aurora.pdf',
        type: 'PDF',
        size_bytes: 1887436,
        role: 'Documento principal',
        download_url: '/mock/Proposta_Aurora.pdf',
      },
      {
        id: 'f2',
        name: 'Cronograma_Aurora.xlsx',
        type: 'XLSX',
        size_bytes: 126976,
        role: 'Planejamento',
        download_url: '/mock/Cronograma_Aurora.xlsx',
      },
    ],
    team_message:
      'Apresentamos a proposta de um portal para divulgar ações de extensão e conectar estudantes às iniciativas da universidade. O cronograma está no segundo arquivo.',
    member_count: 4,
    leader_name: 'Ana Souza',
    criteria: RUBRIC.map((c) => ({ ...c, score: record?.scores[c.id] ?? null })),
    feedback: record?.feedback ?? null,
    total_score: record ? total(record.scores) : null,
  };
}

export type PublishResult =
  | { ok: true; detail: DeliveryEvaluationDetail }
  | { ok: false; status: 404 | 409 | 422; message: string };

export function publishDeliveryEvaluation(
  id: string,
  input: PublishEvaluationInput,
): PublishResult {
  const current = buildDeliveryEvaluation(id);
  if (!current) return { ok: false, status: 404, message: 'Entrega não encontrada.' };
  if (current.status === 'EVALUATED') {
    return { ok: false, status: 409, message: 'Esta entrega já foi avaliada.' };
  }
  const scores: Record<string, number> = {};
  for (const criterion of current.criteria) {
    const entry = input.scores.find((s) => s.criterion_id === criterion.id);
    if (!entry || entry.score < 0 || entry.score > criterion.max_score) {
      return { ok: false, status: 422, message: `Nota inválida em "${criterion.name}".` };
    }
    scores[criterion.id] = entry.score;
  }
  published.set(id, { scores, feedback: input.feedback.trim() });
  return { ok: true, detail: buildDeliveryEvaluation(id)! };
}
