import { http, HttpResponse } from 'msw';
import {
  buildCurrentEdition,
  buildNotifications,
  buildStudentDashboard,
  publicProjects,
} from './fixtures/academic-home';
import {
  MOCK_MAX_MEMBERS,
  STUDENT_WITHOUT_TEAM,
  buildMockJoinRequests,
  buildMockTeams,
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
import type {
  Invitation,
  JoinRequest,
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
};

const users: Record<string, MockUser> = {
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
  'admin@exemplo.com': {
    id: '4',
    name: 'Adriano Admin',
    email: 'admin@exemplo.com',
    role: 'ADMIN',
  },
};

// Sessão simulada em memória.
let session: MockUser | null = null;

// Formação de equipe (task #10): equipes, solicitações e a equipe criada na sessão.
let mockTeams = buildMockTeams();
let joinRequests = buildMockJoinRequests();
let createdTeam: Team | null = null;
let nextId = 1000;

// Minha equipe (task #11): equipes com integrantes, convites, solicitações e liderança.
let myTeams = new Map<number, Team>();
let teamInvitations: Invitation[] = [];
let receivedJoinRequests: JoinRequest[] = [];
let leadershipRequests: LeadershipRequest[] = [];

function resetMyTeams() {
  myTeams = new Map([
    [MY_TEAM_ID, buildMyTeam()],
    [LEADERLESS_TEAM_ID, buildLeaderlessTeam()],
  ]);
  teamInvitations = buildMyTeamInvitations();
  receivedJoinRequests = buildMyTeamJoinRequests();
  leadershipRequests = [];
}
resetMyTeams();

/** Vínculo de cada login simulado. Sem sessão (testes), vale o líder da Equipe Aurora. */
const MEMBERSHIP: Record<string, { teamId: number; memberId: number }> = {
  'academico@exemplo.com': { teamId: MY_TEAM_ID, memberId: LEADER_MEMBER_ID },
  'participante@exemplo.com': { teamId: MY_TEAM_ID, memberId: PARTICIPANT_MEMBER_ID },
  'sem-lider@exemplo.com': { teamId: LEADERLESS_TEAM_ID, memberId: LEADERLESS_MEMBER_ID },
};

/** Equipe e vínculo ativo de quem está logado (null se saiu ou foi removido). */
function currentViewer() {
  if (session?.email === 'sem-equipe@exemplo.com') {
    const member = createdTeam?.members.find((m) => m.role === 'LEADER');
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

const teamRef = (team: Team) => ({ id: team.id, name: team.name, code: team.code });
const isTeamFull = (team: Team) => team.members.length >= MOCK_MAX_MEMBERS;

const apiError = (status: number, code: string, message: string, details = null) =>
  HttpResponse.json({ error: { code, message, details } }, { status });

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export const handlers = [
  // Lista de cursos para o cadastro.
  http.get('*/api/courses', () => {
    return HttpResponse.json([
      {
        id: 1,
        name: 'Engenharia de Software',
        slug: 'ES',
      },
      {
        id: 2,
        name: 'Sistemas de Informação',
        slug: 'SI',
      },
      {
        id: 3,
        name: 'Direito',
        slug: 'DIR',
      },
    ]);
  }),

  // Login simulado.
  http.post('*/auth/login', async ({ request }) => {
    const { email, password } = (await request.json()) as {
      email: string;
      password: string;
    };

    const user = users[email];

    if (!user || password !== '123456') {
      return HttpResponse.json({ message: 'Credenciais inválidas' }, { status: 401 });
    }

    session = user;
    return HttpResponse.json(user);
  }),

  // Consulta da sessão atual.
  http.get('*/auth/me', () =>
    session
      ? HttpResponse.json(session)
      : HttpResponse.json({ message: 'Não autenticado' }, { status: 401 }),
  ),

  // Encerramento da sessão.
  http.post('*/auth/logout', () => {
    session = null;
    return new HttpResponse(null, { status: 204 });
  }),

  // Home do acadêmico (task #9) — formatos de docs/api/openapi.yaml.
  http.get('*/api/me/dashboard', () => {
    const dashboard = buildStudentDashboard();
    const viewer = currentViewer();
    if (session?.email !== 'sem-equipe@exemplo.com' && viewer?.member.role === 'LEADER') {
      return HttpResponse.json({ ...dashboard, team: viewer.team });
    }
    return HttpResponse.json({
      ...dashboard,
      team: viewer?.team ?? null,
      is_leader: viewer?.member.role === 'LEADER',
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
      student: null,
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
  http.post('*/api/teams/:teamId/leave', ({ params }) => {
    const found = viewerTeam(params.teamId);
    if ('error' in found) return found.error;
    const others = found.team.members.filter((m) => m.id !== found.member.id);
    if (found.member.role === 'LEADER' && others.length > 0) {
      return apiError(
        409,
        'leader_must_transfer',
        'Transfira a liderança antes de sair da equipe.',
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
  http.get('*/api/public/editions/current', () => HttpResponse.json(buildCurrentEdition())),
  http.get('*/api/public/projects', ({ request }) =>
    HttpResponse.json(paginate(publicProjects, new URL(request.url))),
  ),
  http.get('*/api/notifications', ({ request }) => {
    const url = new URL(request.url);
    const all = buildNotifications().map((n) =>
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
];

/** Usado nos testes para isolar a sessão simulada entre os casos. */
export function resetMockSession() {
  session = null;
  readNotifications.clear();
  mockTeams = buildMockTeams();
  joinRequests = buildMockJoinRequests();
  createdTeam = null;
  resetMyTeams();
}
