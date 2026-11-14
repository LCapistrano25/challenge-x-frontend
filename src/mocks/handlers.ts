import { http, HttpResponse } from 'msw';
import {
  buildCurrentEdition,
  buildNotifications,
  buildStudentDashboard,
  publicProjects,
} from './fixtures/academic-home';

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
  'admin@exemplo.com': {
    id: '4',
    name: 'Adriano Admin',
    email: 'admin@exemplo.com',
    role: 'ADMIN',
  },
};

// Sessão simulada em memória.
let session: MockUser | null = null;

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
  http.get('*/api/me/dashboard', () => HttpResponse.json(buildStudentDashboard())),
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
}
