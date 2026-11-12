import { http, HttpResponse } from 'msw';

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
  // Primeiro acesso: simulam quem acabou de entrar pela Microsoft e ainda não preencheu os dados.
  // Em desenvolvimento, use o botão "Entrar com a Microsoft" (seletor de contas simuladas).
  'novo.aluno@exemplo.com': {
    id: '5',
    name: 'Nina Nova',
    email: 'novo.aluno@exemplo.com',
    role: 'STUDENT',
    profileComplete: false,
  },
  'novo.professor@exemplo.com': {
    id: '6',
    name: 'Nando Novo',
    email: 'novo.professor@exemplo.com',
    role: 'TEACHER',
    profileComplete: false,
  },
};

const courses = [
  { id: 'c1', name: 'Engenharia de Software' },
  { id: 'c2', name: 'Ciência da Computação' },
  { id: 'c3', name: 'Sistemas de Informação' },
  { id: 'c4', name: 'Design Digital' },
  { id: 'c5', name: 'Administração' },
];

const users: Record<string, MockUser> = structuredClone(initialUsers);

// Sessão simulada em memória (some ao recarregar a página).
let session: MockUser | null = null;

type ProfileBody = {
  role?: string;
  courseId?: string;
  registration?: string;
  period?: number;
  courseIds?: string[];
  acceptedTerms?: boolean;
};

// "*/" casa com qualquer base de URL (VITE_API_URL).
export const handlers = [
  http.post('*/auth/login', async ({ request }) => {
    const { email, password } = (await request.json()) as { email: string; password: string };
    const user = users[email];
    if (!user || password !== '123456') {
      return HttpResponse.json({ message: 'Credenciais inválidas' }, { status: 401 });
    }
    // Regra do produto: aluno e professor só entram pela Microsoft, nunca por senha.
    if (user.role === 'STUDENT' || user.role === 'TEACHER') {
      return HttpResponse.json(
        { message: 'Alunos e professores entram com a conta Microsoft.' },
        { status: 403 },
      );
    }
    session = user;
    return HttpResponse.json(user);
  }),
  // SÓ MOCK: substitui o fluxo OAuth (que o back-end fará) abrindo a sessão de uma conta acadêmica.
  http.post('*/auth/microsoft/mock', async ({ request }) => {
    const { email } = (await request.json()) as { email: string };
    const user = users[email];
    if (!user || (user.role !== 'STUDENT' && user.role !== 'TEACHER')) {
      return HttpResponse.json({ message: 'Conta Microsoft não encontrada.' }, { status: 404 });
    }
    session = user;
    return HttpResponse.json(user);
  }),
  http.get('*/auth/me', () =>
    session
      ? HttpResponse.json(session)
      : HttpResponse.json({ message: 'Não autenticado' }, { status: 401 }),
  ),
  http.post('*/auth/logout', () => {
    session = null;
    return new HttpResponse(null, { status: 204 });
  }),
  http.get('*/courses', () => HttpResponse.json(courses)),
  http.post('*/auth/complete-profile', async ({ request }) => {
    if (!session) {
      return HttpResponse.json({ message: 'Não autenticado' }, { status: 401 });
    }
    if (session.profileComplete !== false) {
      return HttpResponse.json({ message: 'O cadastro já foi concluído.' }, { status: 409 });
    }

    const body = (await request.json()) as ProfileBody;
    const validCourse = (id?: string) => courses.some((course) => course.id === id);
    const valid =
      body.acceptedTerms === true &&
      body.role === session.role &&
      (session.role === 'STUDENT'
        ? validCourse(body.courseId) &&
          /^[A-Z0-9]{6,11}$/.test(body.registration ?? '') &&
          Number.isInteger(body.period)
        : Array.isArray(body.courseIds) &&
          body.courseIds.length > 0 &&
          body.courseIds.every(validCourse));

    if (!valid) {
      return HttpResponse.json({ message: 'Dados inválidos.' }, { status: 422 });
    }

    const updated = { ...session, profileComplete: true };
    users[updated.email] = updated;
    session = updated;
    return HttpResponse.json(updated);
  }),
];

/** Usado nos testes para isolar a sessão e os usuários simulados entre os casos. */
export function resetMockSession() {
  session = null;
  for (const email of Object.keys(users)) delete users[email];
  Object.assign(users, structuredClone(initialUsers));
}
