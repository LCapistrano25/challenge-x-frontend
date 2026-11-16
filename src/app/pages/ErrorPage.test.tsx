import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, vi } from 'vitest';
import { ErrorPage } from './ErrorPage';

function Boom({ message }: { message: string }): never {
  throw new Error(message);
}

function renderThrowing(message: string) {
  const router = createMemoryRouter(
    [{ path: '/', element: <Boom message={message} />, errorElement: <ErrorPage /> }],
    { initialEntries: ['/'] },
  );
  render(<RouterProvider router={router} />);
}

describe('ErrorPage', () => {
  beforeEach(() => {
    // O React registra o erro lançado no console; silenciamos para não poluir a saída.
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it('mostra uma mensagem genérica para erros de renderização', async () => {
    renderThrowing('falha qualquer');

    expect(await screen.findByRole('heading', { name: 'Algo deu errado' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Recarregar página' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar ao início' })).toHaveAttribute('href', '/');
  });

  it('reconhece falha ao carregar um chunk lazy', async () => {
    renderThrowing('Failed to fetch dynamically imported module: /assets/Admin-abc.js');

    expect(
      await screen.findByRole('heading', { name: 'Não foi possível carregar a página' }),
    ).toBeInTheDocument();
  });
});
