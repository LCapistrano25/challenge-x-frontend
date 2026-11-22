import type {
  FinalEvaluationStatus,
  FinalistMaterial,
  FinalistProjectDetail,
  FinalistRow,
} from '@/features/evaluations';
import type { EditionSummary } from '@/shared/types/api';

/**
 * Banca do avaliador externo (tasks #17 a #19), com os projetos do Figma (06 - Avaliador).
 * Formatos de docs/api/openapi.yaml (FinalistRow) e das propostas do README de evaluations.
 */

/** Conta de avaliador sem projetos atribuídos (estado "Sem projetos atribuídos"). */
export const EVALUATOR_WITHOUT_PANEL = 'avaliador.sem-banca@exemplo.com';

/** Mesma edição vigente de GET /api/public/editions/current (fixtures/academic-home). */
const EDITION: EditionSummary = {
  id: 3,
  year: 2026,
  semester: 1,
  name: 'Desafio X 2026/1',
  status: 'IN_PROGRESS',
};

const ES = { id: 1, name: 'Engenharia de Software', slug: 'ES' };
const SI = { id: 2, name: 'Sistemas de Informação', slug: 'SI' };

const SDG = {
  4: { id: 4, number: 4, title: 'Educação de qualidade' },
  9: { id: 9, number: 9, title: 'Indústria, inovação e infraestrutura' },
  10: { id: 10, number: 10, title: 'Redução das desigualdades' },
  11: { id: 11, number: 11, title: 'Cidades e comunidades sustentáveis' },
};

/** 23/10/2026 e 26/10/2026, às 23h59 de Brasília. */
const DEADLINE_A = '2026-10-24T02:59:00Z';
const DEADLINE_B = '2026-10-27T02:59:00Z';

/** Pontuação máxima do formulário final: 5 critérios de 20 pontos. */
export const MAX_TOTAL_SCORE = '100.00';

interface SeedProject {
  id: number;
  title: string;
  summary: string;
  team: { id: number; name: string; code: string };
  course: typeof ES;
  sdg: (typeof SDG)[keyof typeof SDG];
  deadline: string;
  members: string[];
  code: string;
}

const PROJECTS: SeedProject[] = [
  {
    id: 40,
    title: 'Portal de Extensão',
    summary: 'Conecta estudantes e comunidade a oportunidades de extensão universitária.',
    team: { id: 12, name: 'Equipe Aurora', code: 'DXA7K2' },
    course: ES,
    sdg: SDG[10],
    deadline: DEADLINE_A,
    members: ['Ana Costa', 'Bruno Lima', 'Carla Souza', 'Diego Melo'],
    code: 'DX-2026-014',
  },
  {
    id: 41,
    title: 'Biblioteca Conectada',
    summary: 'Empréstimo e reserva de livros entre bibliotecas comunitárias da cidade.',
    team: { id: 13, name: 'Equipe Nexo', code: 'NX42PA' },
    course: ES,
    sdg: SDG[4],
    deadline: DEADLINE_A,
    members: ['Eduarda Pires', 'Felipe Rocha', 'Gabriel Nunes'],
    code: 'DX-2026-017',
  },
  {
    id: 42,
    title: 'Mapa de Acessibilidade',
    summary: 'Mapeamento colaborativo de rotas acessíveis no centro da cidade.',
    team: { id: 14, name: 'Equipe Ponte', code: 'PT93LM' },
    course: ES,
    sdg: SDG[11],
    deadline: DEADLINE_B,
    members: ['Helena Dias', 'Igor Matos', 'Júlia Prado'],
    code: 'DX-2026-021',
  },
  {
    id: 43,
    title: 'Agenda Comunitária',
    summary: 'Calendário de eventos e serviços gratuitos oferecidos nos bairros.',
    team: { id: 15, name: 'Equipe Elo', code: 'EL55QR' },
    course: ES,
    sdg: SDG[11],
    deadline: DEADLINE_B,
    members: ['Karina Lopes', 'Lucas Freitas', 'Marina Alves'],
    code: 'DX-2026-026',
  },
  {
    id: 44,
    title: 'Gestão de Laboratórios',
    summary: 'Reserva de laboratórios e controle de equipamentos do campus.',
    team: { id: 16, name: 'Equipe Prisma', code: 'PR18ST' },
    course: SI,
    sdg: SDG[9],
    deadline: DEADLINE_A,
    members: ['Nicolas Araújo', 'Olívia Campos', 'Pedro Teixeira'],
    code: 'DX-2026-030',
  },
  {
    id: 45,
    title: 'Rede de Voluntariado',
    summary: 'Aproxima voluntários de instituições sociais com demandas abertas.',
    team: { id: 17, name: 'Equipe Raiz', code: 'RZ27UV' },
    course: ES,
    sdg: SDG[10],
    deadline: DEADLINE_A,
    members: ['Quésia Moura', 'Rafael Barros', 'Sofia Ribeiro'],
    code: 'DX-2026-033',
  },
];

interface MockFinalistState {
  status: FinalEvaluationStatus;
  total: string | null;
  finalizedAt: string | null;
}

const initialState = (): Map<number, MockFinalistState> =>
  new Map([
    [40, { status: 'IN_PROGRESS', total: null, finalizedAt: null }],
    [41, { status: 'PENDING', total: null, finalizedAt: null }],
    [42, { status: 'PENDING', total: null, finalizedAt: null }],
    [43, { status: 'PENDING', total: null, finalizedAt: null }],
    [44, { status: 'FINALIZED', total: '86.00', finalizedAt: '2026-10-21T13:15:00Z' }],
    [45, { status: 'FINALIZED', total: '92.00', finalizedAt: '2026-10-20T19:08:00Z' }],
  ]);

let state = initialState();

export function resetEvaluatorMock() {
  state = initialState();
}

const findProject = (projectId: number) => PROJECTS.find((project) => project.id === projectId);

function toRow(project: SeedProject): FinalistRow {
  const current = state.get(project.id)!;
  return {
    project: {
      id: project.id,
      edition: EDITION,
      title: project.title,
      summary: project.summary,
      course: project.course,
      sdg: project.sdg,
      category: { id: 2, name: 'Protótipos e Artefatos' },
      members: project.members.map((name) => ({ name })),
    },
    team: project.team,
    my_evaluation_status: current.status,
    evaluation_deadline: project.deadline,
    my_total_score: current.total,
    max_total_score: MAX_TOTAL_SCORE,
    finalized_at: current.finalizedAt,
  };
}

/** GET /api/evaluator/finalists */
export function buildFinalists(email: string | undefined, courseId?: number): FinalistRow[] {
  if (email === EVALUATOR_WITHOUT_PANEL) return [];
  return PROJECTS.filter((project) => courseId === undefined || project.course.id === courseId).map(
    toRow,
  );
}

const MATERIALS = (projectId: number): FinalistMaterial[] => [
  {
    id: projectId * 10 + 1,
    name: 'Relatório final.pdf',
    kind: 'FILE',
    url: `/mock/finalistas/${projectId}/relatorio-final.pdf`,
    format: 'PDF',
    size_bytes: 2_516_582,
  },
  {
    id: projectId * 10 + 2,
    name: 'Apresentação da equipe.pdf',
    kind: 'FILE',
    url: `/mock/finalistas/${projectId}/apresentacao-da-equipe.pdf`,
    format: 'PDF',
    size_bytes: 5_033_165,
  },
  {
    id: projectId * 10 + 3,
    name: 'Protótipo navegável',
    kind: 'LINK',
    url: 'https://www.figma.com/',
    format: 'Figma',
    size_bytes: null,
  },
];

const RESPONSIBILITIES = [
  'Pesquisa e experiência do usuário',
  'Desenvolvimento front-end',
  'Desenvolvimento back-end',
  'Testes e documentação',
];

/** PROPOSTA: GET /api/evaluator/finalists/{project_id} */
export function buildFinalistProject(
  email: string | undefined,
  projectId: number,
): FinalistProjectDetail | null {
  const project = findProject(projectId);
  if (!project || email === EVALUATOR_WITHOUT_PANEL) return null;
  const portal = project.id === 40;
  return {
    ...toRow(project),
    code: project.code,
    description: portal
      ? 'O Portal de Extensão reúne ações universitárias em um único ambiente acessível. A comunidade pode descobrir atividades gratuitas, consultar requisitos e se inscrever em oficinas e atendimentos, aproximando o conhecimento acadêmico das necessidades locais.\n\nO diagnóstico incluiu entrevistas com 32 moradores e estudantes. A equipe desenvolveu um protótipo navegável, validado em duas rodadas de testes com 12 participantes, para reduzir barreiras de acesso e tornar o processo de inscrição mais claro.'
      : `${project.summary} A equipe levantou as necessidades do público com entrevistas e validou um protótipo navegável com usuários.`,
    objective: portal
      ? 'Ampliar a participação da comunidade nas ações de extensão. No piloto, 10 de 12 participantes concluíram a inscrição sem apoio. A próxima etapa prevê acompanhar adesão e permanência nas atividades.'
      : 'Validar a solução com o público-alvo e acompanhar os indicadores definidos no piloto.',
    advisor: 'Prof.ª Juliana Ribeiro',
    technologies: ['React', 'Node.js', 'PostgreSQL', 'Figma'],
    team_members: project.members.map((name, index) => ({
      name,
      course: project.course.name,
      role: index === 0 ? 'LEADER' : 'MEMBER',
      responsibility: RESPONSIBILITIES[index % RESPONSIBILITIES.length] ?? null,
    })),
    materials: MATERIALS(project.id),
    submitted_at: '2026-10-20T17:32:00Z',
  };
}
