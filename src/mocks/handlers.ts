import { http, HttpResponse } from 'msw';
import {
  buildCurrentEdition,
  buildNotifications,
  buildStudentDashboard,
  publicProjects,
} from './fixtures/academic-home';
import {
  STUDENT_WITHOUT_TEAM,
  buildMockJoinRequests,
  buildMockTeams,
  toTeamListing,
} from './fixtures/teams';
import type { JoinRequest, Team, TeamCreate } from '@/features/teams';

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
    if (session?.email !== 'sem-equipe@exemplo.com') return HttpResponse.json(dashboard);
    return HttpResponse.json({
      ...dashboard,
      team: createdTeam,
      is_leader: createdTeam !== null,
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
}
