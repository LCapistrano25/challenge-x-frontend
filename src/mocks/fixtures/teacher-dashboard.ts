import type {
  DeliveryEvaluationDetail,
  DeliveryStatus,
  EvaluationCriterion,
  PublishEvaluationInput,
  TeacherDashboard,
  TeacherDelivery,
} from '@/features/deliveries';
import type { PublicProjectDetail } from '@/features/public-panel';
import { buildCurrentEdition, buildProjectCanvas } from './academic-home';

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

const STATUS_LABEL_PT: Record<DeliveryStatus, string> = {
  PENDING_EVALUATION: 'Em avaliação',
  SUBMITTED: 'Em preenchimento',
  EVALUATED: 'Avaliado',
};

/**
 * Metadados do projeto de cada entrega para a tela de detalhe compartilhada (/projetos/:id).
 * project_id é o id na vitrine pública; ODS e integrantes são ilustrativos (Figma).
 */
const PROJECT_META: Record<
  string,
  { project_id: number; sdg: [number, string]; members: string[] }
> = {
  d1: {
    project_id: 501,
    sdg: [4, 'Educação de Qualidade'],
    members: ['Ana Souza', 'Bruno Lima', 'Carla Dias', 'Diego Melo'],
  },
  d2: {
    project_id: 502,
    sdg: [11, 'Cidades e Comunidades Sustentáveis'],
    members: ['Ana Souza', 'Rafael Nunes', 'Sofia Reis', 'Tiago Alves'],
  },
  d3: {
    project_id: 503,
    sdg: [10, 'Redução das Desigualdades'],
    members: ['Ana Souza', 'Marina Dias', 'Pedro Gomes', 'Lia Castro'],
  },
  d4: {
    project_id: 504,
    sdg: [16, 'Paz, Justiça e Instituições Eficazes'],
    members: ['Ana Souza', 'Caio Melo', 'Bia Santos', 'Igor Rocha'],
  },
  d5: {
    project_id: 505,
    sdg: [9, 'Indústria, Inovação e Infraestrutura'],
    members: ['Ana Souza', 'Lara Pires', 'Hugo Alves', 'Vera Lima'],
  },
  d6: {
    project_id: 506,
    sdg: [3, 'Saúde e Bem-estar'],
    members: ['Ana Souza', 'Noa Dias', 'Edu Rocha', 'Gal Costa'],
  },
};

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
    project_id: PROJECT_META[id]?.project_id ?? null,
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

/**
 * Detalhe público do projeto de uma entrega do professor (reaproveita os dados da avaliação).
 * Alimenta /projetos/:id quando o id é de um projeto de curso, fora da vitrine pública.
 */
const firstSentence = (text: string) => {
  const end = text.indexOf('. ');
  return end >= 0 ? text.slice(0, end + 1) : text;
};

const fileSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`
    : `${Math.round(bytes / 1024)} KB`;

export function buildTeacherProjectDetail(projectId: number): PublicProjectDetail | null {
  const found = Object.entries(PROJECT_META).find(([, meta]) => meta.project_id === projectId);
  if (!found) return null;
  const [deliveryId, meta] = found;
  const detail = buildDeliveryEvaluation(deliveryId);
  if (!detail) return null;
  const course = { id: 0, name: detail.course };
  const sdg = { id: meta.sdg[0], number: meta.sdg[0], title: meta.sdg[1] };
  const about = detail.team_message ?? 'Projeto da edição vigente do Desafio X.';
  return {
    id: projectId,
    edition: buildCurrentEdition().edition,
    title: detail.project_name,
    team: { name: detail.team_name },
    summary: firstSentence(about),
    about,
    objective:
      'Ampliar a participação da comunidade nas ações do projeto e acompanhar os resultados ao longo das etapas de avaliação.',
    code: `DX-${buildCurrentEdition().edition.year}-${String(projectId).padStart(3, '0')}`,
    stage_label: `Etapa ${detail.stage}`,
    status_label: STATUS_LABEL_PT[detail.status],
    advisor: 'Prof.ª Juliana Ribeiro',
    technologies: ['React', 'Node.js', 'PostgreSQL', 'Figma'],
    submitted_at: detail.submitted_at,
    canvas: buildProjectCanvas(),
    course,
    sdg,
    category: null,
    members: meta.members.map((name, index) => ({
      name,
      course: detail.course,
      role: index === 0 ? 'LEADER' : 'MEMBER',
    })),
    keywords: `${sdg.title}, ${course.name}`,
    deliverables: detail.files.map((file, index) => ({
      id: index + 1,
      label: file.name,
      type: 'FILE' as const,
      href: file.download_url,
      meta: `${file.type} · ${fileSize(file.size_bytes)}`,
    })),
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
