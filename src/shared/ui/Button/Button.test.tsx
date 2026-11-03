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
});
