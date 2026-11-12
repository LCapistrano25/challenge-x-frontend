import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { MultiSelect } from './MultiSelect';

const options = [
  { value: 'a', label: 'Engenharia' },
  { value: 'b', label: 'Design' },
  { value: 'c', label: 'Direito' },
];

function Harness({ error }: { error?: string }) {
  const [value, setValue] = useState<string[]>([]);
  return (
    <MultiSelect
      label="Cursos"
      placeholder="Selecione seus cursos"
      options={options}
      value={value}
      onChange={setValue}
      error={error}
    />
  );
}

describe('MultiSelect', () => {
  it('mostra o placeholder e abre a lista ao clicar', () => {
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: /Cursos/ });

    expect(trigger).toHaveTextContent('Selecione seus cursos');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
  });

  it('permite marcar vários itens e resume a seleção', () => {
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: /Cursos/ });
    fireEvent.click(trigger);

    fireEvent.click(screen.getByRole('checkbox', { name: 'Engenharia' }));
    expect(trigger).toHaveTextContent('Engenharia');

    fireEvent.click(screen.getByRole('checkbox', { name: 'Design' }));
    expect(trigger).toHaveTextContent('Engenharia, Design');

    fireEvent.click(screen.getByRole('checkbox', { name: 'Direito' }));
    expect(trigger).toHaveTextContent('3 selecionados');

    fireEvent.click(screen.getByRole('checkbox', { name: 'Design' }));
    expect(trigger).toHaveTextContent('Engenharia, Direito');
  });

  it('fecha com Esc e devolve o foco ao botão', () => {
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: /Cursos/ });
    fireEvent.click(trigger);

    fireEvent.keyDown(screen.getByRole('group'), { key: 'Escape' });

    expect(screen.queryByRole('group')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('fecha ao clicar fora', () => {
    render(
      <>
        <Harness />
        <p>Fora</p>
      </>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Cursos/ }));

    fireEvent.mouseDown(screen.getByText('Fora'));

    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });

  it('exibe a mensagem de erro ligada ao botão', () => {
    render(<Harness error="Selecione ao menos um curso." />);

    expect(screen.getByRole('alert')).toHaveTextContent('Selecione ao menos um curso.');
    expect(screen.getByRole('button', { name: /Cursos/ })).toHaveAttribute('aria-invalid', 'true');
  });
});
