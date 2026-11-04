import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup } from '@testing-library/react';
import { Input } from './Input';

afterEach(cleanup);

describe('Input', () => {
  it('renderiza como um campo de texto', () => {
    render(<Input placeholder="Digite seu nome" />);

    expect(screen.getByPlaceholderText('Digite seu nome')).toBeInTheDocument();
  });

  it('repassa as propriedades nativas', () => {
    render(<Input type="email" defaultValue="teste@exemplo.com" />);

    expect(screen.getByDisplayValue('teste@exemplo.com')).toHaveAttribute('type', 'email');
  });

  it('aplica o estado invalido', () => {
    render(<Input invalid aria-label="E-mail" />);

    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });
});
