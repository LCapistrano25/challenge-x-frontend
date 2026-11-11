import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';
import { Button } from './Button';

afterEach(cleanup);

describe('Button', () => {
  it('renderiza o texto recebido', () => {
    render(<Button>Salvar</Button>);

    expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument();
  });

  it('pode ser desabilitado', () => {
    render(<Button disabled>Salvar</Button>);

    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();
  });

  it('fica desabilitado em loading mesmo com disabled={false}', () => {
    render(
      <Button loading disabled={false}>
        Salvar
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Salvar' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('aceita fullWidth e className extra sem perder o estilo base', () => {
    render(
      <Button fullWidth className="extra">
        Salvar
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Salvar' });
    expect(button).toHaveClass('extra');
    expect(button.className.split(' ').length).toBeGreaterThan(3);
  });
});
