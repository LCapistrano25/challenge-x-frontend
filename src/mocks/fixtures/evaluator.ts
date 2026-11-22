import type {
  FinalAnswer,
  FinalEvaluation,
  FinalEvaluationForm,
  FinalEvaluationWrite,
  FinalForm,
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

/** Formulário da etapa final publicado (5 critérios de 0 a 20, Figma). */
export const FINAL_FORM: FinalForm = {
  id: 4,
  edition_id: EDITION.id,
  title: 'Avaliação da Apresentação Final',
  published: true,
  questions: [
    {
      id: 61,
      position: 1,
      prompt: 'Relevância e impacto social',
      description: 'Contribuição para a comunidade e alinhamento ao ODS proposto.',
      type: 'SCORE',
      max_score: '20.00',
    },
    {
      id: 62,
      position: 2,
      prompt: 'Inovação e criatividade',
      description: 'Originalidade da solução e diferenciais em relação às alternativas existentes.',
      type: 'SCORE',
      max_score: '20.00',
    },
    {
      id: 63,
      position: 3,
      prompt: 'Viabilidade técnica',
      description: 'Qualidade do protótipo e possibilidade de implementação da solução.',
      type: 'SCORE',
      max_score: '20.00',
    },
    {
      id: 64,
      position: 4,
      prompt: 'Desenvolvimento e resultados',
      description: 'Coerência entre objetivos, metodologia e resultados apresentados.',
      type: 'SCORE',
      max_score: '20.00',
    },
    {
      id: 65,
      position: 5,
      prompt: 'Apresentação e comunicação',
      description: 'Clareza da apresentação, organização e domínio da equipe.',
      type: 'SCORE',
      max_score: '20.00',
    },
  ],
  created_at: '2026-10-01T12:00:00Z',
  updated_at: '2026-10-01T12:00:00Z',
};

/** Respostas do Figma (Portal de Extensão): 18 + 16 + 18 + 16 + 18 = 86. */
const FIGMA_ANSWERS: FinalAnswer[] = [
  [
    61,
    '18.00',
    'Conexão clara entre a comunidade e as ações de extensão.',
    'O diagnóstico com 32 participantes demonstra a relevância da proposta.',
  ],
  [
    62,
    '16.00',
    'A jornada unificada facilita a descoberta de oportunidades.',
    'A integração é pertinente; falta comparar a solução com alternativas existentes.',
  ],
  [
    63,
    '18.00',
    'Protótipo consistente, com fluxos de inscrição bem definidos.',
    'Arquitetura e tecnologias adequadas; ampliar testes de acessibilidade.',
  ],
  [
    64,
    '16.00',
    'O piloto apresenta resultados iniciais promissores.',
    'Os testes validam a jornada, mas os indicadores de impacto precisam de acompanhamento.',
  ],
  [
    65,
    '18.00',
    'Equipe organizada e apresentação objetiva da solução.',
    'Boa demonstração do protótipo e respostas fundamentadas às perguntas da banca.',
  ],
].map(([question_id, value, comment, answer_text]) => ({
  question_id: Number(question_id),
  type: 'SCORE' as const,
  value: String(value),
  comment: String(comment),
  answer_text: String(answer_text),
}));

const FIGMA_FEEDBACK =
  'A proposta conecta a comunidade às ações de extensão de forma clara e relevante. Recomendo ampliar os testes com usuários e detalhar os indicadores de impacto.';

function evaluation(
  id: number,
  status: FinalEvaluation['status'],
  answers: FinalAnswer[],
  finalizedAt: string | null,
  protocol: string | null,
): FinalEvaluation {
  return {
    id,
    status,
    comment: FIGMA_FEEDBACK,
    answers,
    finalized_at: finalizedAt,
    created_at: '2026-10-18T12:00:00Z',
    updated_at: finalizedAt ?? '2026-10-19T12:00:00Z',
    protocol,
  };
}

/** Troca as notas mantendo comentários e justificativas (para somar 92 no "Rede de Voluntariado"). */
const withScores = (scores: string[]) =>
  FIGMA_ANSWERS.map((answer, index) => ({ ...answer, value: scores[index] ?? answer.value }));

const initialEvaluations = (): Map<number, FinalEvaluation> =>
  new Map([
    [40, evaluation(301, 'IN_PROGRESS', FIGMA_ANSWERS, null, null)],
    [44, evaluation(302, 'FINALIZED', FIGMA_ANSWERS, '2026-10-21T13:15:00Z', 'AV-2026-030-EA')],
    [
      45,
      evaluation(
        303,
        'FINALIZED',
        withScores(['20.00', '18.00', '18.00', '18.00', '18.00']),
        '2026-10-20T19:08:00Z',
        'AV-2026-033-EA',
      ),
    ],
  ]);

let evaluations = initialEvaluations();
/** "Mapa de Acessibilidade": o primeiro envio definitivo falha (estado "Revisão · Erro de envio"). */
let failNextSubmit = new Set([42]);
let nextEvaluationId = 400;

export function resetEvaluatorMock() {
  evaluations = initialEvaluations();
  failNextSubmit = new Set([42]);
  nextEvaluationId = 400;
}

const sumOf = (answers: FinalAnswer[]) =>
  answers.reduce((sum, answer) => sum + Number(answer.value ?? 0), 0).toFixed(2);

const findProject = (projectId: number) => PROJECTS.find((project) => project.id === projectId);

function toRow(project: SeedProject): FinalistRow {
  const current = evaluations.get(project.id);
  const finalized = current?.status === 'FINALIZED';
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
    my_evaluation_status: current?.status ?? 'PENDING',
    evaluation_deadline: project.deadline,
    my_total_score: finalized ? sumOf(current.answers) : null,
    max_total_score: MAX_TOTAL_SCORE,
    finalized_at: finalized ? current.finalized_at : null,
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

/** GET /api/evaluator/finalists/{project_id}/final-evaluation */
export function buildFinalEvaluation(
  email: string | undefined,
  projectId: number,
): FinalEvaluationForm | null {
  const project = findProject(projectId);
  if (!project || email === EVALUATOR_WITHOUT_PANEL) return null;
  return {
    project: toRow(project).project,
    form: FINAL_FORM,
    evaluation: evaluations.get(projectId) ?? null,
  };
}

export type SaveFinalEvaluationResult =
  | { ok: true; evaluation: FinalEvaluation }
  | { ok: false; status: number; code: string; message: string }
  | { ok: false; network: true };

/** PUT /api/evaluator/finalists/{project_id}/final-evaluation (regras do openapi). */
export function saveFinalEvaluation(
  email: string | undefined,
  projectId: number,
  input: FinalEvaluationWrite,
): SaveFinalEvaluationResult {
  const project = findProject(projectId);
  if (!project || email === EVALUATOR_WITHOUT_PANEL) {
    return { ok: false, status: 404, code: 'not_found', message: 'Projeto não encontrado.' };
  }
  const current = evaluations.get(projectId);
  if (current?.status === 'FINALIZED') {
    return {
      ok: false,
      status: 409,
      code: 'final_evaluation_already_finalized',
      message: 'A avaliação final já foi finalizada.',
    };
  }
  const answers: FinalAnswer[] = [];
  for (const question of FINAL_FORM.questions) {
    const answer = input.answers.find((item) => item.question_id === question.id);
    const value = answer?.value ?? null;
    if (value !== null && (Number(value) < 0 || Number(value) > Number(question.max_score))) {
      return {
        ok: false,
        status: 400,
        code: 'validation_error',
        message: `A nota de ${question.prompt} deve estar entre 0 e ${Number(question.max_score)}.`,
      };
    }
    if (input.status === 'FINALIZED' && (value === null || !answer?.answer_text)) {
      return {
        ok: false,
        status: 400,
        code: 'validation_error',
        message: 'Responda a todas as perguntas antes de finalizar.',
      };
    }
    if (answer) {
      answers.push({
        question_id: question.id,
        type: question.type,
        value: value === null ? null : Number(value).toFixed(2),
        answer_text: answer.answer_text ?? null,
        comment: answer.comment ?? null,
      });
    }
  }
  if (input.status === 'FINALIZED' && failNextSubmit.delete(projectId)) {
    return { ok: false, network: true };
  }
  const now = new Date().toISOString();
  const finalized = input.status === 'FINALIZED';
  const saved: FinalEvaluation = {
    id: current?.id ?? nextEvaluationId++,
    status: input.status,
    comment: input.comment ?? null,
    answers,
    finalized_at: finalized ? now : null,
    created_at: current?.created_at ?? now,
    updated_at: now,
    protocol: finalized ? `AV-${EDITION.year}-${project.code.slice(-3)}-EA` : null,
  };
  evaluations.set(projectId, saved);
  return { ok: true, evaluation: saved };
}
