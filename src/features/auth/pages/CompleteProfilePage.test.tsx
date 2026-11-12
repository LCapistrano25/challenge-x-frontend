import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { routes } from '@/app/router/routes';
import { server } from '@/mocks/server';
import { AuthProvider } from '@/features/auth';
import { login, simulateMicrosoftLogin } from '../api/auth.api';

/** Abre a sessão como o produto real faria: Microsoft para aluno/professor, senha para o resto. */
async function renderAs(email: string, path = '/cadastro') {
  if (/^(avaliador|admin)@/.test(email)) {
    await login({ email, password: '123456' });
  } else {
    await simulateMicrosoftLogin(email);
  }
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
  );
  return router;
}

const termsCheckbox = () => screen.getByRole('checkbox', { name: /Aceito os/ });

describe('primeiro acesso do aluno', () => {
  it('mostra os campos do aluno', async () => {
    await renderAs('novo.aluno@exemplo.com');

    expect(await screen.findByRole('heading', { name: 'Preencher dados' })).toBeInTheDocument();
    expect(screen.getByText('Todos os campos são obrigatórios.')).toBeInTheDocument();
    expect(await screen.findByLabelText('Curso')).toBeInTheDocument();
    expect(screen.getByLabelText('Matrícula')).toBeInTheDocument();
    expect(screen.getByLabelText('Período')).toBeInTheDocument();
    expect(screen.queryByText('Selecione seus cursos')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Termos de uso' })).toHaveAttribute('href', '/termos');
  });

  it('valida os campos antes de enviar', async () => {
    const onSubmit = vi.fn();
    server.use(
      http.post('*/auth/complete-profile', () => {
        onSubmit();
        return HttpResponse.json({});
      }),
    );
    await renderAs('novo.aluno@exemplo.com');

    fireEvent.click(await screen.findByRole('button', { name: 'Finalizar cadastro' }));

    expect(await screen.findByText('Selecione seu curso.')).toBeInTheDocument();
    expect(screen.getByText('Informe sua matrícula.')).toBeInTheDocument();
    expect(screen.getByText('Selecione o período.')).toBeInTheDocument();
    expect(screen.getByText('Você precisa aceitar os termos para continuar.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('só aceita dígitos na matrícula', async () => {
    await renderAs('novo.aluno@exemplo.com');
    const registration = await screen.findByLabelText('Matrícula');

    fireEvent.change(registration, { target: { value: '20a26-001' } });

    expect(registration).toHaveValue('2026001');
  });

  it('envia os dados e leva para a home do aluno', async () => {
    let body: unknown;
    server.use(
      http.post('*/auth/complete-profile', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({
          id: '5',
          name: 'Nina Nova',
          email: 'novo.aluno@exemplo.com',
          role: 'STUDENT',
          profileComplete: true,
        });
      }),
    );
    const router = await renderAs('novo.aluno@exemplo.com');

    fireEvent.change(await screen.findByLabelText('Curso'), { target: { value: 'c1' } });
    fireEvent.change(screen.getByLabelText('Matrícula'), { target: { value: '2026001234' } });
    fireEvent.change(screen.getByLabelText('Período'), { target: { value: '4' } });
    fireEvent.click(termsCheckbox());
    fireEvent.click(screen.getByRole('button', { name: 'Finalizar cadastro' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/academico'));
    expect(body).toEqual({
      role: 'STUDENT',
      courseId: 'c1',
      registration: '2026001234',
      period: 4,
      acceptedTerms: true,
    });
  });

  it('mostra a mensagem da API quando o envio falha', async () => {
    server.use(
      http.post('*/auth/complete-profile', () =>
        HttpResponse.json({ message: 'Matrícula já cadastrada.' }, { status: 422 }),
      ),
    );
    const router = await renderAs('novo.aluno@exemplo.com');

    fireEvent.change(await screen.findByLabelText('Curso'), { target: { value: 'c2' } });
    fireEvent.change(screen.getByLabelText('Matrícula'), { target: { value: '2026001234' } });
    fireEvent.change(screen.getByLabelText('Período'), { target: { value: '1' } });
    fireEvent.click(termsCheckbox());
    fireEvent.click(screen.getByRole('button', { name: 'Finalizar cadastro' }));

    expect(await screen.findByText('Matrícula já cadastrada.')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/cadastro');
    expect(screen.getByRole('button', { name: 'Finalizar cadastro' })).toBeEnabled();
  });
});

describe('primeiro acesso do professor', () => {
  it('mostra a seleção de cursos e não pede matrícula', async () => {
    await renderAs('novo.professor@exemplo.com');

    expect(await screen.findByRole('button', { name: /Cursos/ })).toHaveTextContent(
      'Selecione seus cursos',
    );
    expect(screen.queryByLabelText('Matrícula')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Período')).not.toBeInTheDocument();
  });

  it('exige ao menos um curso', async () => {
    await renderAs('novo.professor@exemplo.com');

    fireEvent.click(await screen.findByRole('button', { name: 'Finalizar cadastro' }));

    expect(await screen.findByText('Selecione ao menos um curso.')).toBeInTheDocument();
  });

  it('envia os cursos escolhidos e leva para a home do professor', async () => {
    let body: unknown;
    server.use(
      http.post('*/auth/complete-profile', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({
          id: '6',
          name: 'Nando Novo',
          email: 'novo.professor@exemplo.com',
          role: 'TEACHER',
          profileComplete: true,
        });
      }),
    );
    const router = await renderAs('novo.professor@exemplo.com');

    fireEvent.click(await screen.findByRole('button', { name: /Cursos/ }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Engenharia de Software' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Design Digital' }));
    fireEvent.click(termsCheckbox());
    fireEvent.click(screen.getByRole('button', { name: 'Finalizar cadastro' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/professor'));
    expect(body).toEqual({ role: 'TEACHER', courseIds: ['c1', 'c4'], acceptedTerms: true });
  });
});

describe('guards do primeiro acesso', () => {
  it('quem ainda não preencheu os dados é levado ao cadastro ao abrir a própria área', async () => {
    const router = await renderAs('novo.aluno@exemplo.com', '/academico');

    await waitFor(() => expect(router.state.location.pathname).toBe('/cadastro'));
    expect(await screen.findByRole('heading', { name: 'Preencher dados' })).toBeInTheDocument();
  });

  it('quem já concluiu não vê mais a tela e vai direto para a home', async () => {
    const router = await renderAs('academico@exemplo.com', '/cadastro');

    await waitFor(() => expect(router.state.location.pathname).toBe('/academico'));
  });

  it('avaliador externo e admin nunca passam pelo primeiro acesso', async () => {
    const router = await renderAs('avaliador@exemplo.com', '/cadastro');

    await waitFor(() => expect(router.state.location.pathname).toBe('/avaliador'));
  });

  it('sem sessão, o cadastro redireciona para o login', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const router = createMemoryRouter(routes, { initialEntries: ['/cadastro'] });
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
  });
});
