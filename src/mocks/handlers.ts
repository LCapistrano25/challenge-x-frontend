import { http, HttpResponse } from 'msw';

type MockUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

const users: Record<string, MockUser> = {
  'academico@exemplo.com': {
    id: '1',
    name: 'Ana Acadêmica',
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
];

/** Usado nos testes para isolar a sessão simulada entre os casos. */
export function resetMockSession() {
  session = null;
}
