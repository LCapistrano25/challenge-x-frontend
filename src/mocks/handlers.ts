import { http, HttpResponse } from 'msw';
import {
  buildCurrentEdition,
  buildEditionNotifications,
  buildNotifications,
  buildPublicProjectDetail,
  buildStudentDashboard,
  publicProjects,
} from './fixtures/academic-home';
import {
  ARCHIVE_EDITION_IDS,
  buildArchiveProjectDetail,
  buildArchiveProjects,
  buildClosedEditions,
  buildEditionWinners,
} from './fixtures/archive';
import {
  MOCK_MAX_MEMBERS,
  STUDENT_WITHOUT_TEAM,
  buildMockJoinRequests,
  buildMockTeams,
  buildReceivedInvitations,
  toTeamListing,
} from './fixtures/teams';
import {
  LEADERLESS_MEMBER_ID,
  LEADERLESS_TEAM_ID,
  LEADER_MEMBER_ID,
  MY_TEAM_ID,
  PARTICIPANT_MEMBER_ID,
  buildLeaderlessTeam,
  buildMyTeam,
  buildMyTeamInvitations,
  buildMyTeamJoinRequests,
} from './fixtures/my-team';
import {
  buildDeliveryEvaluation,
  buildTeacherDashboard,
  buildTeacherProjectDetail,
  publishDeliveryEvaluation,
  resetTeacherMock,
} from './fixtures/teacher-dashboard';
import {
  buildTeacherLeadershipRequests,
  buildTeacherMemberNotes,
  buildTeacherProjectRows,
} from './fixtures/teacher-members';
import { buildAdminOverview } from './fixtures/admin-dashboard';
import {
  buildAdminTeamDetail,
  buildAdminTeams,
  disqualifyAdminTeam,
  resetAdminTeamsMock,
} from './fixtures/admin-teams';
import { TAKEN_PROJECT_TITLES, buildProject, buildProjectOptions } from './fixtures/project';
import {
  PROJECT_LEADER_MEMBER_ID,
  PROJECT_MEMBER_ID,
  PROJECT_TEAM_ID,
  SEEDED_PROJECT_ID,
  buildDeliverables,
  buildProjectTeam,
  buildSeededProject,
} from './fixtures/deliverables';
import type {
  DeliverableItem,
  DeliverableVersion,
  Project,
  ProjectDraft,
  StageDeliverable,
} from '@/features/projects';
import type { DeliverableSubmissionItem, PublishEvaluationInput } from '@/features/deliveries';
import { buildMemberNotes, type MockMemberNote } from './fixtures/member-notes';
import { buildProjectScores } from './fixtures/scores';
import { buildEvaluationSetup, toStageCriteria } from './fixtures/evaluation-setup';
import type { CriterionCreate, Stage, StageCreate, StageCriteriaItem } from '@/features/admin';
import {
  EVALUATOR_WITHOUT_PANEL,
  buildFinalEvaluation,
  buildFinalistProject,
  buildFinalists,
  resetEvaluatorMock,
  saveFinalEvaluation,
} from './fixtures/evaluator';
import type { FinalEvaluationWrite, MemberNoteCreate } from '@/features/evaluations';
import type { SupportTicket, SupportTicketCreate } from '@/features/support';
import type {
  Invitation,
  JoinRequest,
  LeadershipDecision,
  LeadershipRequest,
  Team,
  TeamCreate,
  TeamUpdate,
} from '@/features/teams';

/** Pagina uma lista no formato Paginated<T> da API (page/page_size). */
function paginate<T>(items: T[], url: URL) {
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('page_size') ?? 20)));
  const start = (page - 1) * pageSize;
  const results = items.slice(start, start + pageSize);
  const link = (p: number) => {
    const next = new URL(url);
    next.searchParams.set('page', String(p));
    return next.toString();
  };
  return {
    count: items.length,
    next: start + pageSize < items.length ? link(page + 1) : null,
    previous: page > 1 ? link(page - 1) : null,
    results,
  };
}

// Notificações lidas durante a sessão simulada.
const readNotifications = new Set<string>();

type MockUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  profileComplete?: boolean;
};

const initialUsers: Record<string, MockUser> = {
  'academico@exemplo.com': {
    id: '1',
    name: 'Ana Silva',
    email: 'academico@exemplo.com',
    role: 'STUDENT',
  },
  'professor@exemplo.com': {
    id: '2',
    name: 'Paulo Professor',
    email: 'professor@exemplo.com',
    role: 'TEACHER',
  },
  'avaliador@exemplo.com': {
    id: '3',
    name: 'Eva Avaliadora',
    email: 'avaliador@exemplo.com',
    role: 'EXTERNAL_EVALUATOR',
  },
  // Avaliador externo sem projetos atribuídos (task #17: estado "Sem projetos atribuídos").
  [EVALUATOR_WITHOUT_PANEL]: {
    id: '4',
    name: 'Helena Martins',
    email: EVALUATOR_WITHOUT_PANEL,
    role: 'EXTERNAL_EVALUATOR',
  },
  // Acadêmico sem equipe: abre "Encontre sua equipe" (task #10).
  'sem-equipe@exemplo.com': {
    id: '5',
    name: 'João Silva',
    email: 'sem-equipe@exemplo.com',
    role: 'STUDENT',
  },
  // Minha equipe (task #11): participante com líder e participante de equipe sem líder.
  'participante@exemplo.com': {
    id: '6',
    name: 'João Silva',
    email: 'participante@exemplo.com',
    role: 'STUDENT',
  },
  'sem-lider@exemplo.com': {
    id: '7',
    name: 'João Silva',
    email: 'sem-lider@exemplo.com',
    role: 'STUDENT',
  },
  // Projeto da equipe (task #13): equipe "Conexão Verde" com projeto e entregas cadastrados.
  'lider.projeto@exemplo.com': {
    id: '10',
    name: 'Ana Maria',
    email: 'lider.projeto@exemplo.com',
    role: 'STUDENT',
  },
  'integrante.projeto@exemplo.com': {
    id: '11',
    name: 'João Silva',
    email: 'integrante.projeto@exemplo.com',
    role: 'STUDENT',
  },
  'admin@exemplo.com': {
    id: '4',
    name: 'Adriano Admin',
    email: 'admin@exemplo.com',
    role: 'ADMIN',
  },
  'novo.aluno@exemplo.com': {
    id: '8',
    name: 'Nina Nova',
    email: 'novo.aluno@exemplo.com',
    role: 'STUDENT',
    profileComplete: false,
  },
  'novo.professor@exemplo.com': {
    id: '9',
    name: 'Nando Novo',
    email: 'novo.professor@exemplo.com',
    role: 'TEACHER',
    profileComplete: false,
  },
};

const users: Record<string, MockUser> = structuredClone(initialUsers);

// Sessão simulada em memória.
let session: MockUser | null = null;

// Formação de equipe (task #10): equipes, solicitações e a equipe criada na sessão.
let mockTeams = buildMockTeams();
let joinRequests = buildMockJoinRequests();
let receivedInvitations = buildReceivedInvitations();
let createdTeam: Team | null = null;
let nextId = 1000;

// Minha equipe (task #11): equipes com integrantes, convites, solicitações e liderança.
let myTeams = new Map<number, Team>();
let teamInvitations: Invitation[] = [];
let receivedJoinRequests: JoinRequest[] = [];
let leadershipRequests: LeadershipRequest[] = [];
// Avaliação de membro (task #14): observações registradas pelo líder.
let memberNotes: MockMemberNote[] = [];
// Integrantes na visão do professor (Figma: 05 - Professor): fila de liderança e observações.
let teacherLeadershipRequests = buildTeacherLeadershipRequests();
let teacherMemberNotes = buildTeacherMemberNotes();
// Central de dúvidas (task #14): chamados abertos na sessão.
let supportTickets: SupportTicket[] = [];

function resetMyTeams() {
  myTeams = new Map([
    [MY_TEAM_ID, buildMyTeam()],
    [LEADERLESS_TEAM_ID, buildLeaderlessTeam()],
    [PROJECT_TEAM_ID, buildProjectTeam()],
  ]);
  teamInvitations = buildMyTeamInvitations();
  receivedJoinRequests = buildMyTeamJoinRequests();
  leadershipRequests = [];
  memberNotes = buildMemberNotes();
  teacherLeadershipRequests = buildTeacherLeadershipRequests();
  teacherMemberNotes = buildTeacherMemberNotes();
  supportTickets = [];
}
resetMyTeams();

// Cadastro do projeto (task #12): projetos cadastrados e rascunhos por equipe.
let teamProjects = new Map<number, Project>();
let projectDrafts = new Map<number, ProjectDraft>();
// Projeto da equipe (task #13): entregas por etapa de cada projeto.
let projectDeliverables = new Map<number, StageDeliverable[]>();

function resetProjects() {
  teamProjects = new Map([[PROJECT_TEAM_ID, buildSeededProject()]]);
  projectDrafts = new Map();
  projectDeliverables = new Map([[SEEDED_PROJECT_ID, buildDeliverables({ seeded: true })]]);
}
resetProjects();

/** Vínculo de cada login simulado. Sem sessão (testes), vale o líder da Equipe Aurora. */
const MEMBERSHIP: Record<string, { teamId: number; memberId: number }> = {
  'academico@exemplo.com': { teamId: MY_TEAM_ID, memberId: LEADER_MEMBER_ID },
  'participante@exemplo.com': { teamId: MY_TEAM_ID, memberId: PARTICIPANT_MEMBER_ID },
  'sem-lider@exemplo.com': { teamId: LEADERLESS_TEAM_ID, memberId: LEADERLESS_MEMBER_ID },
  'lider.projeto@exemplo.com': { teamId: PROJECT_TEAM_ID, memberId: PROJECT_LEADER_MEMBER_ID },
  'integrante.projeto@exemplo.com': { teamId: PROJECT_TEAM_ID, memberId: PROJECT_MEMBER_ID },
};

/** Equipe e vínculo ativo de quem está logado (null se saiu ou foi removido). */
function currentViewer() {
  if (session && !MEMBERSHIP[session.email]) {
    // Aluno sem equipe (sem-equipe@ ou primeiro acesso): equipe criada (LEADER) ou aceita por
    // convite (MEMBER) durante a sessão.
    const member = createdTeam?.members.find(
      (m) => m.student.user_id === STUDENT_WITHOUT_TEAM.user_id,
    );
    return createdTeam && member ? { team: createdTeam, member } : null;
  }
  const link = MEMBERSHIP[session?.email ?? 'academico@exemplo.com'];
  const team = link ? myTeams.get(link.teamId) : undefined;
  const member = team?.members.find((m) => m.id === link?.memberId);
  return team && member ? { team, member } : null;
}

function saveTeam(team: Team) {
  const saved = { ...team, updated_at: new Date().toISOString() };
  myTeams.set(saved.id, saved);
  if (createdTeam?.id === saved.id) createdTeam = saved;
  return saved;
}

/** Equipe da rota acessível ao aluno logado; `leader` exige o papel LEADER. */
function viewerTeam(teamId: unknown, { leader = false } = {}) {
  const viewer = currentViewer();
  if (!viewer || viewer.team.id !== Number(teamId)) {
    return { error: apiError(404, 'not_found', 'Equipe não encontrada.') } as const;
  }
  if (leader && viewer.member.role !== 'LEADER') {
    return {
      error: apiError(403, 'forbidden', 'Somente o líder da equipe pode fazer esta ação.'),
    } as const;
  }
  return { ...viewer } as const;
}

/** Projeto da equipe de quem está logado (404 se o id não for o dela). */
function viewerProject(projectId: unknown) {
  const viewer = currentViewer();
  const project = viewer ? teamProjects.get(viewer.team.id) : undefined;
  if (!viewer || !project || project.id !== Number(projectId)) {
    return { error: apiError(404, 'not_found', 'Projeto não encontrado.') } as const;
  }
  return { ...viewer, project } as const;
}

function deliverablesOf(projectId: number) {
  let list = projectDeliverables.get(projectId);
  if (!list) {
    list = buildDeliverables();
    projectDeliverables.set(projectId, list);
  }
  return list;
}

const validationError = (details: Record<string, string[]>) =>
  HttpResponse.json(
    { error: { code: 'validation_error', message: 'Dados inválidos.', details } },
    { status: 400 },
  );

const teamRef = (team: Team) => ({ id: team.id, name: team.name, code: team.code });
const isTeamFull = (team: Team) => team.members.length >= MOCK_MAX_MEMBERS;

const apiError = (status: number, code: string, message: string, details = null) =>
  HttpResponse.json({ error: { code, message, details } }, { status });

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const courses = [
  { id: 1, name: 'Engenharia de Software' },
  { id: 2, name: 'Ciência da Computação' },
  { id: 3, name: 'Sistemas de Informação' },
  { id: 4, name: 'Design Digital' },
  { id: 5, name: 'Administração' },
];

let emailDomains = [
  { id: 1, name: 'alunos.universidade.edu.br', role: 'STUDENT' as const, active: true },
  { id: 2, name: 'docentes.universidade.edu.br', role: 'TEACHER' as const, active: true },
];

// Configuração da avaliação (task #23): etapas, critérios, rubricas e pontuações.
let evaluationSetup = buildEvaluationSetup();
let nextSetupId = 900;

const adminOnly = () =>
  !session || session.role !== 'ADMIN'
    ? apiError(403, 'forbidden', 'Acesso restrito a administradores.')
    : null;

/** A configuração congela após a publicação do edital. */
function frozenEdition(editionId: number) {
  const edition = evaluationSetup.editions.find((e) => e.id === editionId);
  if (!edition) return apiError(404, 'not_found', 'Edição não encontrada.');
  if (edition.status === 'CLOSED') {
    return apiError(409, 'edition_closed', 'A edição está encerrada e não pode ser alterada.');
  }
  if (edition.status === 'PUBLISHED') {
    return apiError(
      409,
      'edition_published',
      'A configuração está congelada após a publicação do edital.',
    );
  }
  return null;
}

const cents = (value: string | null | undefined) => Math.round(Number(value ?? 0) * 100);

const setupValidationError = (field: string, message: string) =>
  HttpResponse.json(
    { error: { code: 'validation_error', message, details: { [field]: [message] } } },
    { status: 400 },
  );

/** Regras de ensure_stage_max_score_fits (API): etapas ≤ 10 e etapa ≥ seus critérios. */
function checkStage(candidate: Stage) {
  if (candidate.ends_at <= candidate.starts_at) {
    return setupValidationError('ends_at', 'O fim deve ser posterior ao início.');
  }
  if (candidate.scored) {
    if (!candidate.evaluation_ends_at || candidate.evaluation_ends_at <= candidate.ends_at) {
      return setupValidationError(
        'evaluation_ends_at',
        'O prazo de avaliação deve ser posterior ao fim da entrega.',
      );
    }
    if (cents(candidate.max_score) <= 0) {
      return setupValidationError('max_score', 'Informe a pontuação máxima da etapa.');
    }
  }
  const others = evaluationSetup.stages.filter(
    (s) => s.edition_id === candidate.edition_id && s.id !== candidate.id,
  );
  if (others.some((s) => s.order === candidate.order)) {
    return apiError(409, 'stage_position_taken', 'Já existe etapa nesta posição.');
  }
  const total = others.reduce((sum, s) => sum + (s.scored ? cents(s.max_score) : 0), 0);
  if (candidate.scored && total + cents(candidate.max_score) > 1000) {
    return setupValidationError(
      'max_score',
      'As etapas pontuadas da edição passariam de 10 pontos.',
    );
  }
  const criteria = (evaluationSetup.links[candidate.id] ?? []).reduce(
    (sum, item) => sum + cents(item.max_score),
    0,
  );
  if (candidate.scored && criteria > cents(candidate.max_score)) {
    return setupValidationError('max_score', 'Os critérios da etapa somam mais que este valor.');
  }
  return null;
}

function resetEmailDomains() {
  emailDomains = [
    { id: 1, name: 'alunos.universidade.edu.br', role: 'STUDENT', active: true },
    { id: 2, name: 'docentes.universidade.edu.br', role: 'TEACHER', active: true },
  ];
}

export const handlers = [
  // Lista de cursos para o cadastro (GET /api/courses).
  http.get('*/api/courses', () => HttpResponse.json(courses)),

  http.get('*/api/auth/csrf', () => HttpResponse.json({ csrfToken: 'mock' })),

  // Login simulado.
  http.post('*/api/auth/sessions/password', async ({ request }) => {
    const { email, password } = (await request.json()) as {
      email: string;
      password: string;
    };

    const user = users[email];

    if (!user || password !== '123456') {
      return HttpResponse.json({ message: 'Credenciais inválidas' }, { status: 401 });
    }
    const legacyTeamFixture =
      user.email === 'participante@exemplo.com' ||
      user.email === 'sem-lider@exemplo.com' ||
      user.email === 'sem-equipe@exemplo.com' ||
      user.email === 'lider.projeto@exemplo.com' ||
      user.email === 'integrante.projeto@exemplo.com';
    if ((user.role === 'STUDENT' || user.role === 'TEACHER') && !legacyTeamFixture) {
      return HttpResponse.json(
        { message: 'Alunos e professores entram com a conta Microsoft.' },
        { status: 403 },
      );
    }

    session = user;
    return HttpResponse.json(user);
  }),

  http.post('*/auth/microsoft/mock', async ({ request }) => {
    const { email } = (await request.json()) as { email: string };
    const user = users[email];
    if (!user || (user.role !== 'STUDENT' && user.role !== 'TEACHER')) {
      return HttpResponse.json({ message: 'Conta Microsoft não encontrada.' }, { status: 404 });
    }
    session = user;
    return HttpResponse.json(user);
  }),

  http.post('*/api/auth/sessions/microsoft', async ({ request }) => {
    const { code } = (await request.json()) as { code?: string };
    if (!code || code === 'invalid') {
      return apiError(401, 'invalid_credentials', 'Credenciais inválidas.');
    }
    if (code === 'domain-error') {
      return apiError(403, 'domain_role_mismatch', 'Perfil não autorizado para este domínio.');
    }
    const emailByCode: Record<string, string> = {
      'new-student': 'novo.aluno@exemplo.com',
      'new-professor': 'novo.professor@exemplo.com',
      teacher: 'professor@exemplo.com',
    };
    const email = emailByCode[code] ?? 'academico@exemplo.com';
    const user = users[email];
    if (!user) {
      return apiError(401, 'invalid_credentials', 'Credenciais inválidas.');
    }
    session = user;
    return HttpResponse.json({
      user_id: Number(user.id) || 1,
      name: user.name,
      email: user.email,
      role: user.role,
      profile_completed: user.profileComplete !== false,
    });
  }),

  // Consulta da sessão atual.
  http.get('*/api/auth/me', () =>
    session
      ? HttpResponse.json(session)
      : HttpResponse.json({ message: 'Não autenticado' }, { status: 401 }),
  ),

  // Encerramento da sessão.
  http.post('*/api/auth/logout', () => {
    session = null;
    return new HttpResponse(null, { status: 204 });
  }),

  http.post('*/api/auth/students', async ({ request }) => {
    if (!session) {
      return apiError(401, 'not_authenticated', 'Não autenticado.');
    }
    if (session.profileComplete !== false) {
      return apiError(409, 'student_profile_exists', 'O cadastro já foi concluído.');
    }
    const body = (await request.json()) as {
      course_id?: number;
      registration_number?: string;
      term?: number;
    };
    const valid =
      courses.some((course) => course.id === body.course_id) &&
      /^[A-Z0-9]{6,11}$/.test(body.registration_number ?? '') &&
      Number.isInteger(body.term);
    if (!valid) {
      return apiError(400, 'validation_error', 'Dados inválidos.');
    }
    const updated = { ...session, profileComplete: true };
    users[updated.email] = updated;
    session = updated;
    return HttpResponse.json({ student: { user_id: Number(updated.id) } }, { status: 201 });
  }),

  http.post('*/api/auth/teachers', async ({ request }) => {
    if (!session) {
      return apiError(401, 'not_authenticated', 'Não autenticado.');
    }
    if (session.profileComplete !== false) {
      return apiError(409, 'teacher_profile_exists', 'O cadastro já foi concluído.');
    }
    const body = (await request.json()) as { course_ids?: number[] };
    const valid =
      Array.isArray(body.course_ids) &&
      body.course_ids.length > 0 &&
      body.course_ids.every((id) => courses.some((course) => course.id === id));
    if (!valid) {
      return apiError(400, 'validation_error', 'Dados inválidos.');
    }
    const updated = { ...session, profileComplete: true };
    users[updated.email] = updated;
    session = updated;
    return HttpResponse.json({ teacher: { user_id: Number(updated.id) } }, { status: 201 });
  }),

  // Home do acadêmico (task #9) — formatos de docs/api/openapi.yaml.
  // Painel inicial do professor (Figma: Professor › Home).
  http.get('*/api/teacher/dashboard', () => {
    if (session?.role !== 'TEACHER') {
      return apiError(403, 'forbidden', 'Somente professores.');
    }
    return HttpResponse.json(buildTeacherDashboard());
  }),
  http.get('*/api/teacher/deliveries/:id', ({ params }) => {
    if (session?.role !== 'TEACHER') {
      return apiError(403, 'forbidden', 'Somente professores.');
    }
    const detail = buildDeliveryEvaluation(String(params.id));
    return detail
      ? HttpResponse.json(detail)
      : apiError(404, 'not_found', 'Entrega não encontrada.');
  }),
  http.put('*/api/teacher/deliveries/:id/evaluation', async ({ params, request }) => {
    if (session?.role !== 'TEACHER') {
      return apiError(403, 'forbidden', 'Somente professores.');
    }
    const result = publishDeliveryEvaluation(
      String(params.id),
      (await request.json()) as PublishEvaluationInput,
    );
    if (!result.ok) {
      return apiError(
        result.status,
        result.status === 404 ? 'not_found' : 'invalid',
        result.message,
      );
    }
    return HttpResponse.json(result.detail);
  }),
  // Integrantes do professor (Figma: 05 - Professor › Liderança). Solicitações dos cursos
  // vinculados (RF40).
  http.get('*/api/teacher/leadership-requests', ({ request }) => {
    if (session?.role !== 'TEACHER') {
      return apiError(403, 'forbidden', 'Somente professores.');
    }
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const items = teacherLeadershipRequests.filter((r) => !status || r.status === status);
    return HttpResponse.json(paginate(items, url));
  }),
  // Decisão do professor (RF28/RF40): aprovar torna o solicitante líder; recusar mantém sem líder.
  http.post('*/api/leadership-requests/:id/decide', async ({ params, request }) => {
    if (session?.role !== 'TEACHER') {
      return apiError(403, 'forbidden', 'Somente professores.');
    }
    const found = teacherLeadershipRequests.find((r) => r.id === Number(params.id));
    if (!found) return apiError(404, 'not_found', 'Solicitação não encontrada.');
    if (found.status !== 'PENDING') {
      return apiError(409, 'leadership_request_not_pending', 'A solicitação não está pendente.');
    }
    const body = (await request.json()) as Partial<LeadershipDecision>;
    if (
      (body.status !== 'APPROVED' && body.status !== 'REJECTED') ||
      !body.decision_justification?.trim()
    ) {
      return validationError({ decision_justification: ['Campo obrigatório.'] });
    }
    const decided: LeadershipRequest = {
      ...found,
      status: body.status,
      teacher: { user_id: session.id, name: session.name },
      decision_justification: body.decision_justification.trim(),
      decided_at: new Date().toISOString(),
    };
    teacherLeadershipRequests = teacherLeadershipRequests.map((r) =>
      r.id === decided.id ? decided : r,
    );
    return HttpResponse.json(decided);
  }),
  // Acompanhamento do professor (RF37). Aqui a tela usa só as equipes dos cursos vinculados.
  http.get('*/api/teacher/projects', ({ request }) => {
    if (session?.role !== 'TEACHER') {
      return apiError(403, 'forbidden', 'Somente professores.');
    }
    return HttpResponse.json(paginate(buildTeacherProjectRows(), new URL(request.url)));
  }),
  // Avaliações registradas pela liderança (RF39): exclusivo de professor do curso e admin.
  http.get('*/api/teams/:teamId/member-notes', ({ params }) => {
    if (session?.role !== 'TEACHER' && session?.role !== 'ADMIN') {
      return apiError(403, 'forbidden', 'Somente professores do curso e administradores.');
    }
    const notes = teacherMemberNotes[Number(params.teamId)];
    if (!notes) return apiError(404, 'not_found', 'Equipe não encontrada.');
    return HttpResponse.json(notes);
  }),
  // Avaliador externo (tasks #17 a #19): banca de projetos finalistas.
  http.get('*/api/evaluator/finalists', ({ request }) => {
    if (session?.role !== 'EXTERNAL_EVALUATOR') {
      return apiError(403, 'forbidden', 'Somente avaliadores externos.');
    }
    const url = new URL(request.url);
    const courseId = url.searchParams.get('course_id');
    return HttpResponse.json(
      paginate(buildFinalists(session.email, courseId ? Number(courseId) : undefined), url),
    );
  }),
  http.get('*/api/evaluator/finalists/:projectId', ({ params }) => {
    if (session?.role !== 'EXTERNAL_EVALUATOR') {
      return apiError(403, 'forbidden', 'Somente avaliadores externos.');
    }
    const detail = buildFinalistProject(session.email, Number(params.projectId));
    return detail
      ? HttpResponse.json(detail)
      : apiError(404, 'not_found', 'Projeto não encontrado na sua banca.');
  }),
  http.get('*/api/evaluator/finalists/:projectId/final-evaluation', ({ params }) => {
    if (session?.role !== 'EXTERNAL_EVALUATOR') {
      return apiError(403, 'forbidden', 'Somente avaliadores externos.');
    }
    const form = buildFinalEvaluation(session.email, Number(params.projectId));
    return form
      ? HttpResponse.json(form)
      : apiError(404, 'not_found', 'Projeto não encontrado na sua banca.');
  }),
  http.put('*/api/evaluator/finalists/:projectId/final-evaluation', async ({ params, request }) => {
    if (session?.role !== 'EXTERNAL_EVALUATOR') {
      return apiError(403, 'forbidden', 'Somente avaliadores externos.');
    }
    const result = saveFinalEvaluation(
      session.email,
      Number(params.projectId),
      (await request.json()) as FinalEvaluationWrite,
    );
    if (result.ok) return HttpResponse.json(result.evaluation);
    // Simula a falha de conexão do Figma ("Revisão · Erro de envio").
    if ('network' in result) return HttpResponse.error();
    return apiError(result.status, result.code, result.message);
  }),
  http.get('*/api/me/dashboard', () => {
    const dashboard = buildStudentDashboard();
    const viewer = currentViewer();
    const registered = viewer ? teamProjects.get(viewer.team.id) : undefined;
    const project = registered
      ? {
          id: registered.id,
          title: registered.title,
          summary: registered.summary,
          status: registered.status,
          challenge: registered.challenge,
        }
      : dashboard.project;
    if (session?.email !== 'sem-equipe@exemplo.com' && viewer?.member.role === 'LEADER') {
      return HttpResponse.json({ ...dashboard, team: viewer.team, project });
    }
    return HttpResponse.json({
      ...dashboard,
      team: viewer?.team ?? null,
      is_leader: viewer?.member.role === 'LEADER',
      project,
      pending_actions: [],
    });
  }),

  // Encontre sua equipe (task #10) — formatos de docs/api/openapi.yaml.
  http.get('*/api/teams', ({ request }) => {
    const url = new URL(request.url);
    const search = normalize(url.searchParams.get('search') ?? '').trim();
    const area = url.searchParams.get('interest_area');
    const items = mockTeams
      .map(toTeamListing)
      .filter((team) => team.available_slots > 0)
      .filter((team) => !area || team.interest_area === area)
      .filter((team) => {
        if (!search) return true;
        const text = [
          team.name,
          team.code,
          team.description ?? '',
          ...team.courses.map((c) => c.name),
        ]
          .map(normalize)
          .join(' ');
        return (
          text.includes(search) ||
          normalize(team.code).replace(/-/g, '') === search.replace(/-/g, '')
        );
      });
    return HttpResponse.json(paginate(items, url));
  }),
  http.post('*/api/teams', async ({ request }) => {
    const body = (await request.json()) as TeamCreate;
    const name = body.name?.trim() ?? '';
    if (!name) {
      return HttpResponse.json(
        {
          error: {
            code: 'validation_error',
            message: 'Dados inválidos.',
            details: { name: ['Campo obrigatório.'] },
          },
        },
        { status: 400 },
      );
    }
    if (createdTeam) {
      return apiError(
        409,
        'student_already_in_team',
        'O aluno já participa de uma equipe nesta edição.',
      );
    }
    if (mockTeams.some((team) => normalize(team.name) === normalize(name))) {
      return apiError(409, 'team_name_taken', 'Já existe equipe com este nome na edição.');
    }
    if (!Array.isArray(body.invitations) || body.invitations.length === 0) {
      return apiError(
        400,
        'team_invitations_required',
        'Convide ao menos 1 aluno para criar a equipe.',
      );
    }
    const now = new Date().toISOString();
    const id = nextId++;
    createdTeam = {
      description: body.description ?? null,
      id,
      edition_id: 3,
      name,
      code: `DX27-${String(id).slice(-4)}`,
      status: 'ACTIVE',
      qualification: null,
      disqualification_reason: null,
      members: [
        {
          id: nextId++,
          student: { ...STUDENT_WITHOUT_TEAM, name: session?.name ?? STUDENT_WITHOUT_TEAM.name },
          role: 'LEADER',
          joined_at: now,
        },
      ],
      created_at: now,
      updated_at: now,
    };
    myTeams.set(createdTeam.id, createdTeam);
    return HttpResponse.json(createdTeam, { status: 201 });
  }),
  http.post('*/api/teams/:teamId/join-requests', ({ params }) => {
    const team = mockTeams.find((t) => t.id === Number(params.teamId));
    if (!team) return apiError(404, 'not_found', 'Equipe não encontrada.');
    if (createdTeam) {
      return apiError(
        409,
        'student_already_in_team',
        'O aluno já participa de uma equipe nesta edição.',
      );
    }
    if (toTeamListing(team).available_slots <= 0) {
      return apiError(409, 'team_full', 'A equipe atingiu o limite máximo de integrantes.');
    }
    if (joinRequests.some((r) => r.team.id === team.id && r.status === 'PENDING')) {
      return apiError(
        409,
        'join_request_pending_exists',
        'Já existe solicitação pendente para esta equipe.',
      );
    }
    const joinRequest: JoinRequest = {
      id: nextId++,
      team: { id: team.id, name: team.name, code: team.code },
      student: { ...STUDENT_WITHOUT_TEAM, name: session?.name ?? STUDENT_WITHOUT_TEAM.name },
      status: 'PENDING',
      created_at: new Date().toISOString(),
      responded_at: null,
    };
    joinRequests = [...joinRequests, joinRequest];
    return HttpResponse.json(joinRequest, { status: 201 });
  }),
  // Convites recebidos (RF23). Só o aluno sem equipe tem convites PENDING no mock.
  http.get('*/api/me/invitations', ({ request }) => {
    const status = new URL(request.url).searchParams.get('status');
    if (currentViewer()) return HttpResponse.json([]);
    return HttpResponse.json(receivedInvitations.filter((i) => !status || i.status === status));
  }),
  http.post('*/api/invitations/:invitationId/respond', async ({ params, request }) => {
    const invitation = receivedInvitations.find((i) => i.id === Number(params.invitationId));
    if (!invitation) return apiError(404, 'not_found', 'Convite não encontrado.');
    if (invitation.status !== 'PENDING') {
      return apiError(409, 'invitation_not_pending', 'O convite não está mais pendente.');
    }
    const { status } = (await request.json()) as { status: 'ACCEPTED' | 'DECLINED' };
    if (status === 'ACCEPTED') {
      if (currentViewer() || createdTeam) {
        return apiError(
          409,
          'student_already_in_team',
          'O aluno já participa de uma equipe nesta edição.',
        );
      }
      const team = mockTeams.find((t) => t.id === invitation.team.id);
      if (!team || toTeamListing(team).available_slots <= 0) {
        return apiError(409, 'team_full', 'A equipe atingiu o limite máximo de integrantes.');
      }
      const now = new Date().toISOString();
      createdTeam = {
        id: team.id,
        edition_id: 3,
        name: team.name,
        code: team.code,
        status: 'ACTIVE',
        qualification: null,
        disqualification_reason: null,
        description: team.description ?? null,
        members: [
          {
            id: nextId++,
            student: {
              user_id: `leader-${team.id}`,
              name: team.leader?.name ?? 'Liderança',
              course: team.leader?.course ?? STUDENT_WITHOUT_TEAM.course,
            },
            role: 'LEADER',
            joined_at: team.created_at,
          },
          {
            id: nextId++,
            student: { ...STUDENT_WITHOUT_TEAM, name: session?.name ?? STUDENT_WITHOUT_TEAM.name },
            role: 'MEMBER',
            joined_at: now,
          },
        ],
        created_at: team.created_at,
        updated_at: now,
      };
      myTeams.set(createdTeam.id, createdTeam);
    }
    const answered: Invitation = {
      ...invitation,
      status,
      responded_at: new Date().toISOString(),
    };
    receivedInvitations = receivedInvitations.map((i) => (i.id === answered.id ? answered : i));
    return HttpResponse.json(answered);
  }),
  http.get('*/api/me/join-requests', ({ request }) => {
    const status = new URL(request.url).searchParams.get('status');
    return HttpResponse.json(joinRequests.filter((r) => !status || r.status === status));
  }),
  // PROPOSTA (ainda não está no openapi): cancelamento pelo próprio aluno.
  http.post('*/api/join-requests/:joinRequestId/cancel', ({ params }) => {
    const joinRequest = joinRequests.find((r) => r.id === Number(params.joinRequestId));
    if (!joinRequest) return apiError(404, 'not_found', 'Solicitação não encontrada.');
    if (joinRequest.status !== 'PENDING') {
      return apiError(409, 'request_not_pending', 'A solicitação não está pendente.');
    }
    const cancelled: JoinRequest = {
      ...joinRequest,
      status: 'CANCELLED',
      responded_at: new Date().toISOString(),
    };
    joinRequests = joinRequests.map((r) => (r.id === cancelled.id ? cancelled : r));
    return HttpResponse.json(cancelled);
  }),

  // Minha equipe (task #11) — formatos de docs/api/openapi.yaml (+ propostas marcadas).
  http.get('*/api/teams/:teamId', ({ params }) => {
    const found = viewerTeam(params.teamId);
    return 'error' in found ? found.error : HttpResponse.json(found.team);
  }),
  // PROPOSTA (ainda não está no openapi): o líder edita nome e apresentação.
  http.patch('*/api/teams/:teamId', async ({ params, request }) => {
    const found = viewerTeam(params.teamId, { leader: true });
    if ('error' in found) return found.error;
    const body = (await request.json()) as TeamUpdate;
    const name = body.name?.trim() ?? found.team.name;
    if (!name) {
      return HttpResponse.json(
        {
          error: {
            code: 'validation_error',
            message: 'Dados inválidos.',
            details: { name: ['Campo obrigatório.'] },
          },
        },
        { status: 400 },
      );
    }
    if (mockTeams.some((team) => normalize(team.name) === normalize(name))) {
      return apiError(409, 'team_name_taken', 'Já existe equipe com este nome na edição.');
    }
    const team = saveTeam({
      ...found.team,
      name,
      description: body.description ?? found.team.description ?? null,
    });
    return HttpResponse.json(team);
  }),
  http.get('*/api/teams/:teamId/invitations', ({ params, request }) => {
    const found = viewerTeam(params.teamId, { leader: true });
    if ('error' in found) return found.error;
    const status = new URL(request.url).searchParams.get('status');
    return HttpResponse.json(
      teamInvitations.filter(
        (i) => i.team.id === found.team.id && (!status || i.status === status),
      ),
    );
  }),
  http.post('*/api/teams/:teamId/invitations', async ({ params, request }) => {
    const found = viewerTeam(params.teamId, { leader: true });
    if ('error' in found) return found.error;
    const body = (await request.json()) as { email?: string; student_id?: string };
    const email = body.email?.trim().toLowerCase();
    if (!email && !body.student_id) {
      return HttpResponse.json(
        {
          error: {
            code: 'validation_error',
            message: 'Dados inválidos.',
            details: { email: ['Informe o e-mail institucional.'] },
          },
        },
        { status: 400 },
      );
    }
    if (isTeamFull(found.team)) {
      return apiError(409, 'team_full', 'A equipe atingiu o limite máximo de integrantes.');
    }
    if (
      teamInvitations.some(
        (i) => i.team.id === found.team.id && i.status === 'PENDING' && i.invited_email === email,
      )
    ) {
      return apiError(
        409,
        'invitation_pending_exists',
        'Já existe convite pendente para este aluno.',
      );
    }
    const invitation: Invitation = {
      id: nextId++,
      team: teamRef(found.team),
      student: { user_id: String(nextId), name: email ?? 'Estudante convidado' },
      invited_email: email ?? null,
      status: 'PENDING',
      created_at: new Date().toISOString(),
      responded_at: null,
    };
    teamInvitations = [invitation, ...teamInvitations];
    return HttpResponse.json(invitation, { status: 201 });
  }),
  // PROPOSTA (ainda não está no openapi): o líder cancela um convite pendente.
  http.post('*/api/invitations/:invitationId/cancel', ({ params }) => {
    const invitation = teamInvitations.find((i) => i.id === Number(params.invitationId));
    if (!invitation) return apiError(404, 'not_found', 'Convite não encontrado.');
    const found = viewerTeam(invitation.team.id, { leader: true });
    if ('error' in found) return found.error;
    if (invitation.status !== 'PENDING') {
      return apiError(409, 'invitation_not_pending', 'O convite não está pendente.');
    }
    const cancelled: Invitation = {
      ...invitation,
      status: 'CANCELLED',
      responded_at: new Date().toISOString(),
    };
    teamInvitations = teamInvitations.map((i) => (i.id === cancelled.id ? cancelled : i));
    return HttpResponse.json(cancelled);
  }),
  http.get('*/api/teams/:teamId/join-requests', ({ params, request }) => {
    const found = viewerTeam(params.teamId, { leader: true });
    if ('error' in found) return found.error;
    const status = new URL(request.url).searchParams.get('status');
    return HttpResponse.json(
      receivedJoinRequests.filter(
        (r) => r.team.id === found.team.id && (!status || r.status === status),
      ),
    );
  }),
  http.post('*/api/join-requests/:joinRequestId/respond', async ({ params, request }) => {
    const joinRequest = receivedJoinRequests.find((r) => r.id === Number(params.joinRequestId));
    if (!joinRequest) return apiError(404, 'not_found', 'Solicitação não encontrada.');
    const found = viewerTeam(joinRequest.team.id, { leader: true });
    if ('error' in found) return found.error;
    if (joinRequest.status !== 'PENDING') {
      return apiError(409, 'join_request_not_pending', 'A solicitação não está pendente.');
    }
    const { status } = (await request.json()) as { status: 'APPROVED' | 'REJECTED' };
    if (status === 'APPROVED') {
      if (isTeamFull(found.team)) {
        return apiError(409, 'team_full', 'A equipe atingiu o limite máximo de integrantes.');
      }
      saveTeam({
        ...found.team,
        members: [
          ...found.team.members,
          {
            id: nextId++,
            student: joinRequest.student,
            role: 'MEMBER',
            joined_at: new Date().toISOString(),
          },
        ],
      });
    }
    const answered: JoinRequest = {
      ...joinRequest,
      status,
      responded_at: new Date().toISOString(),
    };
    receivedJoinRequests = receivedJoinRequests.map((r) => (r.id === answered.id ? answered : r));
    return HttpResponse.json(answered);
  }),
  // PROPOSTA (ainda não está no openapi): o líder remove um integrante.
  http.delete('*/api/teams/:teamId/members/:memberId', ({ params }) => {
    const found = viewerTeam(params.teamId, { leader: true });
    if ('error' in found) return found.error;
    const target = found.team.members.find((m) => m.id === Number(params.memberId));
    if (!target) return apiError(404, 'not_found', 'Integrante não encontrado.');
    if (target.id === found.member.id) {
      return apiError(400, 'validation_error', 'Para sair da equipe, use a opção de saída.');
    }
    saveTeam({ ...found.team, members: found.team.members.filter((m) => m.id !== target.id) });
    return new HttpResponse(null, { status: 204 });
  }),
  http.post('*/api/teams/:teamId/leadership-transfer', async ({ params, request }) => {
    const found = viewerTeam(params.teamId, { leader: true });
    if ('error' in found) return found.error;
    const { member_id: memberId } = (await request.json()) as { member_id: number };
    const target = found.team.members.find((m) => m.id === memberId);
    if (!target || target.id === found.member.id) {
      return apiError(400, 'validation_error', 'Escolha um integrante ativo da equipe.');
    }
    const team = saveTeam({
      ...found.team,
      members: found.team.members.map((m) => ({
        ...m,
        role: m.id === target.id ? 'LEADER' : 'MEMBER',
      })),
    });
    return HttpResponse.json(team);
  }),
  http.post('*/api/teams/:teamId/leave', async ({ params, request }) => {
    const found = viewerTeam(params.teamId);
    if ('error' in found) return found.error;
    const body = (await request.json().catch(() => ({}))) as { confirm?: boolean };
    const others = found.team.members.filter((m) => m.id !== found.member.id);
    if (found.member.role === 'LEADER' && others.length > 0) {
      return apiError(
        409,
        'leader_must_transfer',
        'Transfira a liderança antes de sair da equipe.',
      );
    }
    if (others.length > 0 && others.length < 3 && !body.confirm) {
      return apiError(
        409,
        'leave_below_minimum',
        `Sua saída deixa a equipe com ${others.length} de 3 integrantes. Confirme para sair.`,
      );
    }
    if (others.length === 0) {
      myTeams.delete(found.team.id);
      if (createdTeam?.id === found.team.id) createdTeam = null;
    } else {
      saveTeam({ ...found.team, members: others });
    }
    return new HttpResponse(null, { status: 204 });
  }),
  http.get('*/api/teams/:teamId/leadership-requests', ({ params }) => {
    const found = viewerTeam(params.teamId);
    if ('error' in found) return found.error;
    return HttpResponse.json(leadershipRequests.filter((r) => r.team.id === found.team.id));
  }),
  http.post('*/api/teams/:teamId/leadership-requests', async ({ params, request }) => {
    const found = viewerTeam(params.teamId);
    if ('error' in found) return found.error;
    const { justification } = (await request.json()) as { justification?: string };
    if (!justification?.trim()) {
      return HttpResponse.json(
        {
          error: {
            code: 'validation_error',
            message: 'Dados inválidos.',
            details: { justification: ['Campo obrigatório.'] },
          },
        },
        { status: 400 },
      );
    }
    if (found.team.members.some((m) => m.role === 'LEADER')) {
      return apiError(409, 'team_has_leader', 'A equipe já possui líder ativo.');
    }
    if (leadershipRequests.some((r) => r.team.id === found.team.id && r.status === 'PENDING')) {
      return apiError(409, 'leadership_request_pending_exists', 'Já existe solicitação pendente.');
    }
    const leadershipRequest: LeadershipRequest = {
      id: nextId++,
      team: teamRef(found.team),
      requester: { user_id: found.member.student.user_id, name: found.member.student.name },
      justification: justification.trim(),
      status: 'PENDING',
      teacher: null,
      decision_justification: null,
      created_at: new Date().toISOString(),
      decided_at: null,
    };
    leadershipRequests = [...leadershipRequests, leadershipRequest];
    return HttpResponse.json(leadershipRequest, { status: 201 });
  }),

  // Cadastro do projeto (task #12) — formatos de docs/api/openapi.yaml (PUT proposto, P-25).
  http.get('*/api/teams/:teamId/project/options', ({ params }) => {
    const found = viewerTeam(params.teamId);
    if ('error' in found) return found.error;
    return HttpResponse.json(buildProjectOptions());
  }),
  http.get('*/api/teams/:teamId/project', ({ params }) => {
    const found = viewerTeam(params.teamId);
    if ('error' in found) return found.error;
    const project = teamProjects.get(found.team.id);
    return project
      ? HttpResponse.json(project)
      : apiError(404, 'not_found', 'A equipe ainda não cadastrou o projeto.');
  }),
  http.put('*/api/teams/:teamId/project/challenge', async ({ params, request }) => {
    const found = viewerTeam(params.teamId, { leader: true });
    if ('error' in found) return found.error;
    const formation = buildStudentDashboard().stages.find(
      (item) => item.stage.type === 'FORMATION' && item.stage.phase_status === 'OPEN',
    );
    if (!formation) {
      return apiError(409, 'formation_closed', 'O prazo de formação de equipes está encerrado.');
    }
    const { challenge_id } = (await request.json()) as { challenge_id?: number };
    const options = buildProjectOptions();
    const challenge = options.challenges.find((c) => c.id === challenge_id);
    if (!challenge) {
      return apiError(400, 'challenge_not_eligible', 'Desafio fora dos cursos da equipe.');
    }
    const existing = teamProjects.get(found.team.id);
    const now = new Date().toISOString();
    const project: Project = existing
      ? {
          ...existing,
          challenge,
          updated_at: now,
          updated_by: { user_id: found.member.student.user_id, name: found.member.student.name },
        }
      : {
          ...buildProject(
            found.team,
            {
              challenge_id: challenge.id,
              category_id: 0,
              title: '',
              summary: '',
              objective: '',
            },
            nextId++,
          ),
          category: null,
          updated_by: { user_id: found.member.student.user_id, name: found.member.student.name },
        };
    teamProjects.set(found.team.id, project);
    return HttpResponse.json(project);
  }),
  http.put('*/api/teams/:teamId/project/details', async ({ params, request }) => {
    const found = viewerTeam(params.teamId, { leader: true });
    if ('error' in found) return found.error;
    const formation = buildStudentDashboard().stages.find(
      (item) => item.stage.type === 'FORMATION' && item.stage.phase_status === 'OPEN',
    );
    if (!formation) {
      return apiError(409, 'formation_closed', 'O prazo de formação de equipes está encerrado.');
    }
    const existing = teamProjects.get(found.team.id);
    if (!existing || !existing.challenge) {
      return apiError(409, 'challenge_not_selected', 'Selecione um desafio antes dos dados.');
    }
    const input = (await request.json()) as {
      title?: string;
      summary?: string;
      objective?: string;
    };
    if (!input.title?.trim() || !input.summary?.trim()) {
      return apiError(400, 'validation_error', 'Título e resumo são obrigatórios.');
    }
    const normalizedTitle = normalize(input.title).replace(/\s+/g, ' ').trim();
    if (TAKEN_PROJECT_TITLES.some((taken) => normalize(taken) === normalizedTitle)) {
      return apiError(409, 'project_title_taken', 'Já existe projeto com título equivalente.');
    }
    const project: Project = {
      ...existing,
      title: input.title.trim(),
      summary: input.summary.trim(),
      objective: (input.objective ?? '').trim(),
      updated_at: new Date().toISOString(),
      updated_by: { user_id: found.member.student.user_id, name: found.member.student.name },
    };
    teamProjects.set(found.team.id, project);
    projectDrafts.delete(found.team.id);
    return HttpResponse.json(project);
  }),
  http.put('*/api/teams/:teamId/project/category', async ({ params, request }) => {
    const found = viewerTeam(params.teamId, { leader: true });
    if ('error' in found) return found.error;
    const formation = buildStudentDashboard().stages.find(
      (item) => item.stage.type === 'FORMATION' && item.stage.phase_status === 'OPEN',
    );
    if (!formation) {
      return apiError(409, 'formation_closed', 'O prazo de formação de equipes está encerrado.');
    }
    const existing = teamProjects.get(found.team.id);
    if (!existing) {
      return apiError(409, 'project_not_found', 'Selecione o desafio antes da categoria.');
    }
    const { category_id } = (await request.json()) as { category_id?: number };
    const options = buildProjectOptions();
    const category = options.categories.find((c) => c.id === category_id);
    if (!category) {
      return apiError(400, 'category_not_available', 'Categoria indisponível na edição.');
    }
    const project: Project = {
      ...existing,
      category: { id: category.id, name: category.name },
      updated_at: new Date().toISOString(),
      updated_by: { user_id: found.member.student.user_id, name: found.member.student.name },
    };
    teamProjects.set(found.team.id, project);
    return HttpResponse.json(project);
  }),
  // PROPOSTA (ainda não está no openapi): rascunho do cadastro.
  http.get('*/api/teams/:teamId/project/draft', ({ params }) => {
    const found = viewerTeam(params.teamId, { leader: true });
    if ('error' in found) return found.error;
    const draft = projectDrafts.get(found.team.id);
    return draft
      ? HttpResponse.json(draft)
      : apiError(404, 'not_found', 'A equipe não tem rascunho salvo.');
  }),
  http.put('*/api/teams/:teamId/project/draft', async ({ params, request }) => {
    const found = viewerTeam(params.teamId, { leader: true });
    if ('error' in found) return found.error;
    const draft = {
      ...((await request.json()) as ProjectDraft),
      saved_at: new Date().toISOString(),
    };
    projectDrafts.set(found.team.id, draft);
    return HttpResponse.json(draft);
  }),
  // Projeto da equipe (task #13) — GET confirmado (RF31); POST proposto (P-23, P-43).
  http.get('*/api/projects/:projectId/deliverables', ({ params }) => {
    const found = viewerProject(params.projectId);
    if ('error' in found) return found.error;
    return HttpResponse.json(deliverablesOf(found.project.id));
  }),
  // Notas da equipe (RF32, confirmado). Só o projeto semeado tem etapas avaliadas no mock.
  http.get('*/api/projects/:projectId/scores', ({ params }) => {
    const found = viewerProject(params.projectId);
    if ('error' in found) return found.error;
    const scores = buildProjectScores({ id: found.project.id, title: found.project.title });
    return HttpResponse.json(
      found.project.id === SEEDED_PROJECT_ID ? scores : { ...scores, stages: [] },
    );
  }),
  // PROPOSTA: qualquer integrante ativo envia (o contrato hoje exige o LEADER).
  http.post('*/api/projects/:projectId/stages/:stageId/versions', async ({ params, request }) => {
    const found = viewerProject(params.projectId);
    if ('error' in found) return found.error;
    const list = deliverablesOf(found.project.id);
    const item = list.find((entry) => entry.stage.id === Number(params.stageId));
    if (!item) return apiError(404, 'not_found', 'Etapa não encontrada.');

    const now = Date.now();
    const latest = item.versions[0];
    const review = latest && item.review?.version_id === latest.id ? item.review : null;
    const deadline =
      review?.status === 'CHANGES_REQUESTED'
        ? (review.resubmission_deadline ?? item.stage.ends_at)
        : item.stage.ends_at;
    if (now < new Date(item.stage.starts_at).getTime()) {
      return apiError(409, 'stage_not_open', 'A etapa ainda não está aberta para envio.');
    }
    if (now > new Date(deadline).getTime() || review?.status === 'APPROVED') {
      return apiError(409, 'stage_deadline_closed', 'O prazo da etapa está encerrado.');
    }

    let entries: DeliverableSubmissionItem[];
    let files: File[] = [];
    let notes: string;
    const contentType = request.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const json = (await request.json()) as {
        items?: DeliverableSubmissionItem[];
        notes?: string;
      };
      entries = json.items ?? [];
      notes = String(json.notes ?? '').trim();
    } else {
      const form = await request.formData();
      try {
        entries = JSON.parse(String(form.get('items') ?? '[]')) as DeliverableSubmissionItem[];
      } catch {
        return validationError({ items: ['JSON inválido.'] });
      }
      // Sem instanceof: nos testes, o File do jsdom e o do Node são classes diferentes.
      files = form.getAll('files').filter((value): value is File => typeof value !== 'string');
      notes = String(form.get('notes') ?? '').trim();
    }

    const items: DeliverableItem[] = [];
    const details: Record<string, string[]> = {};
    for (const field of item.fields) {
      const entry = entries.find((candidate) => candidate.field_id === field.id);
      if (!entry) {
        if (field.required) details[`field_${field.id}`] = ['Campo obrigatório.'];
        continue;
      }
      if (field.type === 'FILE' && 'file_index' in entry) {
        const file = files[entry.file_index];
        const extension = file?.name.split('.').pop()?.toLowerCase() ?? '';
        const formats = (field.formats ?? '')
          .split(',')
          .map((f) => f.trim())
          .filter(Boolean);
        if (!file) details[`field_${field.id}`] = ['Arquivo não enviado.'];
        else if (formats.length > 0 && !formats.includes(extension)) {
          details[`field_${field.id}`] = ['Formato não aceito.'];
        } else if (field.max_size_mb && file.size > field.max_size_mb * 1024 * 1024) {
          details[`field_${field.id}`] = ['Arquivo maior que o permitido.'];
        } else {
          items.push({
            id: nextId++,
            field_id: field.id,
            type: 'FILE',
            link: null,
            file_url: null,
            file_name: file.name,
            size_bytes: file.size,
          });
        }
      } else if ((field.type === 'CANVAS' || field.type === 'SWOT') && 'content' in entry) {
        items.push({
          id: nextId++,
          field_id: field.id,
          type: field.type,
          link: null,
          file_url: null,
          file_name: null,
          size_bytes: null,
          content: entry.content,
        });
      } else if (field.type === 'LINK' && 'link' in entry) {
        if (!/^https:\/\/[^\s.]+\.[^\s]+$/.test(entry.link.trim())) {
          details[`field_${field.id}`] = ['Informe um endereço https:// válido.'];
        } else {
          items.push({
            id: nextId++,
            field_id: field.id,
            type: 'LINK',
            link: entry.link.trim(),
            file_url: null,
            file_name: null,
            size_bytes: null,
          });
        }
      }
    }
    if (Object.keys(details).length > 0) return validationError(details);

    const submittedAt = new Date().toISOString();
    const id = nextId++;
    const created: DeliverableVersion = {
      id,
      version_number: (latest?.version_number ?? 0) + 1,
      submitted_by: { user_id: found.member.student.user_id, name: found.member.student.name },
      submitted_at: submittedAt,
      notes: notes || null,
      items,
      receipt: {
        verification_code: `DX-2027-${id}`,
        file_url: null,
        generated_at: submittedAt,
      },
    };
    projectDeliverables.set(
      found.project.id,
      list.map((entry) =>
        entry === item
          ? { ...entry, status: 'SUBMITTED', versions: [created, ...entry.versions] }
          : entry,
      ),
    );
    return HttpResponse.json(created, { status: 201 });
  }),

  // Avaliação de membro (task #14) — POST confirmado (RF33); o resumo é PROPOSTA.
  http.get('*/api/teams/:teamId/member-notes/summary', ({ params }) => {
    const found = viewerTeam(params.teamId, { leader: true });
    if ('error' in found) return found.error;
    const latest = new Map<number, string>();
    for (const note of memberNotes.filter((n) => n.team_id === found.team.id)) {
      const current = latest.get(note.member_id);
      if (!current || note.created_at > current) latest.set(note.member_id, note.created_at);
    }
    return HttpResponse.json(
      [...latest].map(([member_id, created_at]) => ({ member_id, created_at })),
    );
  }),
  http.post('*/api/teams/:teamId/member-notes', async ({ params, request }) => {
    const found = viewerTeam(params.teamId, { leader: true });
    if ('error' in found) return found.error;
    const body = (await request.json()) as Partial<MemberNoteCreate>;
    if (!body.content?.trim() || typeof body.member_id !== 'number') {
      return HttpResponse.json(
        {
          error: {
            code: 'validation_error',
            message: 'Dados inválidos.',
            details: { content: ['Campo obrigatório.'] },
          },
        },
        { status: 400 },
      );
    }
    if (!found.team.members.some((member) => member.id === body.member_id)) {
      return apiError(404, 'not_found', 'Integrante não encontrado na equipe.');
    }
    const note: MockMemberNote = {
      id: nextId++,
      team_id: found.team.id,
      member_id: body.member_id,
      content: body.content,
      created_at: new Date().toISOString(),
    };
    memberNotes = [...memberNotes, note];
    return HttpResponse.json({ id: note.id, created_at: note.created_at }, { status: 201 });
  }),

  // Central de dúvidas (task #14) — POST /api/support/tickets (PROPOSTO, P-06).
  http.post('*/api/support/tickets', async ({ request }) => {
    const body = (await request.json()) as Partial<SupportTicketCreate>;
    const title = body.title?.trim() ?? '';
    const description = body.description?.trim() ?? '';
    const details: Record<string, string[]> = {};
    if (!title) details.title = ['Campo obrigatório.'];
    else if (title.length > 150) details.title = ['Use até 150 caracteres.'];
    if (!description) details.description = ['Campo obrigatório.'];
    if (Object.keys(details).length > 0) {
      return HttpResponse.json(
        { error: { code: 'validation_error', message: 'Dados inválidos.', details } },
        { status: 400 },
      );
    }
    const now = new Date().toISOString();
    const ticket: SupportTicket = {
      id: crypto.randomUUID(),
      title,
      description,
      status: 'OPEN',
      priority: 'MEDIUM',
      support_response: null,
      created_at: now,
      updated_at: now,
      resolved_at: null,
    };
    supportTickets = [ticket, ...supportTickets];
    return HttpResponse.json(ticket, { status: 201 });
  }),

  http.get('*/api/public/editions/current', () => HttpResponse.json(buildCurrentEdition())),

  // Acervo histórico (RF35/RF46): edições encerradas e pódio de vencedores.
  http.get('*/api/public/editions', () => HttpResponse.json(buildClosedEditions())),
  http.get('*/api/public/editions/:editionId/winners', ({ params }) =>
    HttpResponse.json(buildEditionWinners(Number(params.editionId))),
  ),

  http.get('*/api/public/projects', ({ request }) => {
    const url = new URL(request.url);

    const search = normalize(url.searchParams.get('search') ?? '').trim();

    const courseId = url.searchParams.get('course_id');
    const sdgId = url.searchParams.get('sdg_id');
    const editionId = Number(url.searchParams.get('edition_id'));

    // Edições encerradas usam o acervo; a vigente usa a vitrine.
    const source = ARCHIVE_EDITION_IDS.includes(editionId)
      ? buildArchiveProjects(editionId)
      : publicProjects;

    const filteredProjects = source.filter((project) => {
      const searchableText = normalize(
        `${project.title} ${project.summary} ${project.course.name}`,
      );

      const matchesSearch = !search || searchableText.includes(search);

      const matchesCourse = !courseId || String(project.course.id) === courseId;

      const matchesSdg = !sdgId || String(project.sdg.id) === sdgId;

      return matchesSearch && matchesCourse && matchesSdg;
    });

    return HttpResponse.json(paginate(filteredProjects, url));
  }),

  http.get('*/api/public/projects/:projectId', ({ params }) => {
    const id = Number(params.projectId);
    const detail =
      buildPublicProjectDetail(id) ??
      buildTeacherProjectDetail(id) ??
      buildArchiveProjectDetail(id);
    return detail
      ? HttpResponse.json(detail)
      : apiError(404, 'not_found', 'Projeto não encontrado.');
  }),
  http.get('*/api/notifications', ({ request }) => {
    const url = new URL(request.url);
    const source = currentViewer() ? buildNotifications() : buildEditionNotifications();
    const all = source.map((n) =>
      readNotifications.has(n.id) ? { ...n, read_at: n.read_at ?? new Date().toISOString() } : n,
    );
    const items = url.searchParams.get('unread') === 'true' ? all.filter((n) => !n.read_at) : all;
    return HttpResponse.json(paginate(items, url));
  }),
  http.post('*/api/notifications/:notificationId/read', ({ params }) => {
    const id = String(params.notificationId);
    const notification = buildNotifications().find((n) => n.id === id);
    if (!notification) {
      return HttpResponse.json(
        { error: { code: 'not_found', message: 'Notificação não encontrada.', details: null } },
        { status: 404 },
      );
    }
    readNotifications.add(id);
    return HttpResponse.json({
      ...notification,
      read_at: notification.read_at ?? new Date().toISOString(),
    });
  }),

  // Painel administrativo (RF20, PROPOSTO): visão geral da edição em preparação.
  http.get('*/api/admin/overview', () => {
    if (!session || session.role !== 'ADMIN') {
      return apiError(403, 'forbidden', 'Acesso restrito a administradores.');
    }
    return HttpResponse.json(buildAdminOverview());
  }),

  // Equipes e Projetos (administração, RF13).
  http.get('*/api/admin/teams', ({ request }) => {
    if (!session || session.role !== 'ADMIN') {
      return apiError(403, 'forbidden', 'Acesso restrito a administradores.');
    }
    const url = new URL(request.url);
    const search = normalize(url.searchParams.get('search') ?? '').trim();
    const items = buildAdminTeams().filter((team) => {
      if (!search) return true;
      return normalize(`${team.name} ${team.project?.title ?? ''} ${team.course ?? ''}`).includes(
        search,
      );
    });
    return HttpResponse.json(paginate(items, url));
  }),
  http.get('*/api/admin/teams/:teamId', ({ params }) => {
    if (!session || session.role !== 'ADMIN') {
      return apiError(403, 'forbidden', 'Acesso restrito a administradores.');
    }
    const detail = buildAdminTeamDetail(Number(params.teamId));
    return detail
      ? HttpResponse.json(detail)
      : apiError(404, 'not_found', 'Equipe não encontrada.');
  }),
  http.post('*/api/admin/teams/:teamId/disqualify', async ({ params, request }) => {
    if (!session || session.role !== 'ADMIN') {
      return apiError(403, 'forbidden', 'Acesso restrito a administradores.');
    }
    const body = (await request.json().catch(() => ({}))) as { reason?: string };
    if (!body.reason?.trim()) {
      return validationError({ reason: ['Informe o motivo da desclassificação.'] });
    }
    const result = disqualifyAdminTeam(Number(params.teamId), body.reason.trim());
    if (!result.ok) return apiError(result.status, result.code, result.message);
    const detail = buildAdminTeamDetail(Number(params.teamId));
    return HttpResponse.json(detail);
  }),

  http.get('*/api/admin/email-domains', ({ request }) => {
    if (!session || session.role !== 'ADMIN') {
      return apiError(403, 'forbidden', 'Acesso restrito a administradores.');
    }
    const url = new URL(request.url);
    const role = url.searchParams.get('role');
    const active = url.searchParams.get('active');
    const filtered = emailDomains.filter((d) => {
      if (role && d.role !== role) return false;
      if (active === 'true' && !d.active) return false;
      if (active === 'false' && d.active) return false;
      return true;
    });
    return HttpResponse.json(filtered);
  }),
  http.post('*/api/admin/email-domains', async ({ request }) => {
    if (!session || session.role !== 'ADMIN') {
      return apiError(403, 'forbidden', 'Acesso restrito a administradores.');
    }
    const body = (await request.json()) as {
      name?: string;
      role?: 'STUDENT' | 'TEACHER';
      active?: boolean;
    };
    const name = body.name?.trim().toLowerCase() ?? '';
    const role = body.role ?? 'STUDENT';
    if (!name) return apiError(400, 'validation_error', 'Informe o domínio.');
    if (emailDomains.some((d) => d.name.toLowerCase() === name && d.role === role)) {
      return apiError(409, 'email_domain_taken', 'Este domínio já está cadastrado.');
    }
    const created = {
      id: nextId++,
      name,
      role,
      active: body.active ?? true,
    };
    emailDomains = [...emailDomains, created];
    return HttpResponse.json(created, { status: 201 });
  }),
  http.patch('*/api/admin/email-domains/:domainId', async ({ params, request }) => {
    if (!session || session.role !== 'ADMIN') {
      return apiError(403, 'forbidden', 'Acesso restrito a administradores.');
    }
    const id = Number(params.domainId);
    const existing = emailDomains.find((d) => d.id === id);
    if (!existing) return apiError(404, 'not_found', 'Domínio não encontrado.');
    const body = (await request.json()) as Partial<typeof existing>;
    const updated = { ...existing, ...body };
    emailDomains = emailDomains.map((d) => (d.id === id ? updated : d));
    return HttpResponse.json(updated);
  }),

  // --- Configuração da avaliação (task #23) ---
  http.get(
    '*/api/admin/editions',
    () => adminOnly() ?? HttpResponse.json(evaluationSetup.editions),
  ),
  http.get('*/api/admin/editions/:editionId/stages', ({ params }) => {
    const denied = adminOnly();
    if (denied) return denied;
    const editionId = Number(params.editionId);
    return HttpResponse.json(evaluationSetup.stages.filter((s) => s.edition_id === editionId));
  }),
  http.post('*/api/admin/editions/:editionId/stages', async ({ params, request }) => {
    const editionId = Number(params.editionId);
    const denied = adminOnly() ?? frozenEdition(editionId);
    if (denied) return denied;
    const body = (await request.json()) as StageCreate;
    const created: Stage = {
      id: nextSetupId++,
      edition_id: editionId,
      min_evaluations: 1,
      submission_fields: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...body,
    };
    const invalid = checkStage(created);
    if (invalid) return invalid;
    evaluationSetup.stages = [...evaluationSetup.stages, created];
    return HttpResponse.json(created, { status: 201 });
  }),
  http.get('*/api/admin/stages/:stageId', ({ params }) => {
    const denied = adminOnly();
    if (denied) return denied;
    const found = evaluationSetup.stages.find((s) => s.id === Number(params.stageId));
    return found ? HttpResponse.json(found) : apiError(404, 'not_found', 'Etapa não encontrada.');
  }),
  http.patch('*/api/admin/stages/:stageId', async ({ params, request }) => {
    const existing = evaluationSetup.stages.find((s) => s.id === Number(params.stageId));
    if (!existing) return adminOnly() ?? apiError(404, 'not_found', 'Etapa não encontrada.');
    const denied = adminOnly() ?? frozenEdition(existing.edition_id);
    if (denied) return denied;
    const body = (await request.json()) as Partial<StageCreate>;
    const updated: Stage = { ...existing, ...body, updated_at: new Date().toISOString() };
    const invalid = checkStage(updated);
    if (invalid) return invalid;
    evaluationSetup.stages = evaluationSetup.stages.map((s) => (s.id === updated.id ? updated : s));
    return HttpResponse.json(updated);
  }),
  http.get('*/api/admin/stages/:stageId/criteria', ({ params }) => {
    const denied = adminOnly();
    if (denied) return denied;
    return HttpResponse.json(toStageCriteria(evaluationSetup, Number(params.stageId)));
  }),
  http.put('*/api/admin/stages/:stageId/criteria', async ({ params, request }) => {
    const stageId = Number(params.stageId);
    const target = evaluationSetup.stages.find((s) => s.id === stageId);
    if (!target) return adminOnly() ?? apiError(404, 'not_found', 'Etapa não encontrada.');
    const denied = adminOnly() ?? frozenEdition(target.edition_id);
    if (denied) return denied;
    const { items } = (await request.json()) as { items: StageCriteriaItem[] };
    if (!target.scored) return setupValidationError('items', 'A etapa não é pontuada.');
    if (items.some((item) => cents(item.max_score) <= 0)) {
      return setupValidationError('items', 'A pontuação de cada critério deve ser maior que zero.');
    }
    const sum = items.reduce((total, item) => total + cents(item.max_score), 0);
    if (sum > cents(target.max_score)) {
      return setupValidationError('max_score', 'Os critérios passariam do valor da etapa.');
    }
    evaluationSetup.links = { ...evaluationSetup.links, [stageId]: items };
    return HttpResponse.json(toStageCriteria(evaluationSetup, stageId));
  }),
  http.get('*/api/admin/editions/:editionId/criteria', ({ params }) => {
    const denied = adminOnly();
    if (denied) return denied;
    const editionId = Number(params.editionId);
    return HttpResponse.json(evaluationSetup.criteria.filter((c) => c.edition_id === editionId));
  }),
  http.post('*/api/admin/editions/:editionId/criteria', async ({ params, request }) => {
    const editionId = Number(params.editionId);
    const denied = adminOnly() ?? frozenEdition(editionId);
    if (denied) return denied;
    const body = (await request.json()) as CriterionCreate;
    const name = (body.name ?? '').trim();
    if (!name) return setupValidationError('name', 'Informe o nome do critério.');
    const taken = evaluationSetup.criteria.some(
      (c) => c.edition_id === editionId && normalize(c.name) === normalize(name),
    );
    if (taken) return apiError(409, 'criterion_name_taken', 'Já existe critério com este nome.');
    const created = {
      id: nextSetupId++,
      edition_id: editionId,
      name,
      rubric: body.rubric ?? null,
      tiebreak_order: body.tiebreak_order ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    evaluationSetup.criteria = [...evaluationSetup.criteria, created];
    return HttpResponse.json(created, { status: 201 });
  }),
  http.patch('*/api/admin/criteria/:criterionId', async ({ params, request }) => {
    const existing = evaluationSetup.criteria.find((c) => c.id === Number(params.criterionId));
    if (!existing) return adminOnly() ?? apiError(404, 'not_found', 'Critério não encontrado.');
    const denied = adminOnly() ?? frozenEdition(existing.edition_id);
    if (denied) return denied;
    const body = (await request.json()) as Partial<CriterionCreate>;
    const name = body.name?.trim();
    if (
      name &&
      evaluationSetup.criteria.some(
        (c) =>
          c.id !== existing.id &&
          c.edition_id === existing.edition_id &&
          normalize(c.name) === normalize(name),
      )
    ) {
      return apiError(409, 'criterion_name_taken', 'Já existe critério com este nome.');
    }
    const updated = {
      ...existing,
      ...body,
      name: name ?? existing.name,
      updated_at: new Date().toISOString(),
    };
    evaluationSetup.criteria = evaluationSetup.criteria.map((c) =>
      c.id === updated.id ? updated : c,
    );
    return HttpResponse.json(updated);
  }),
];

/** Usado nos testes para isolar a sessão simulada entre os casos. */
export function resetMockSession() {
  session = null;
  resetTeacherMock();
  resetEvaluatorMock();
  resetAdminTeamsMock();
  for (const email of Object.keys(users)) delete users[email];
  Object.assign(users, structuredClone(initialUsers));
  readNotifications.clear();
  mockTeams = buildMockTeams();
  joinRequests = buildMockJoinRequests();
  receivedInvitations = buildReceivedInvitations();
  createdTeam = null;
  resetEmailDomains();
  evaluationSetup = buildEvaluationSetup();
  nextSetupId = 900;
  resetMyTeams();
  resetProjects();
}
