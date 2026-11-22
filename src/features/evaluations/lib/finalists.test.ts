import type { FinalEvaluationStatus, FinalistRow } from '../types';
import {
  EMPTY_FILTERS,
  countFinalists,
  describeMaterial,
  describeNoResults,
  filterFinalists,
  finalistAction,
  formatDateTime,
  formatScore,
  formatTotal,
  sortFinalists,
} from './finalists';

function row(
  id: number,
  title: string,
  team: string,
  status: FinalEvaluationStatus,
  deadline: string | null = null,
  courseId = 1,
): FinalistRow {
  return {
    project: {
      id,
      edition: { id: 3, year: 2026, semester: 2, name: null, status: 'IN_PROGRESS' },
      title,
      summary: '',
      course: { id: courseId, name: `Curso ${courseId}`, slug: `C${courseId}` },
      sdg: { id: 1, number: 1, title: 'ODS' },
      category: null,
      members: [],
    },
    team: { id, name: team, code: 'ABC123' },
    my_evaluation_status: status,
    evaluation_deadline: deadline,
  };
}

const rows = [
  row(1, 'Gestão de Laboratórios', 'Equipe Prisma', 'FINALIZED', null, 2),
  row(2, 'Mapa de Acessibilidade', 'Equipe Ponte', 'PENDING', '2026-10-27T02:59:00Z'),
  row(3, 'Biblioteca Conectada', 'Equipe Nexo', 'PENDING', '2026-10-24T02:59:00Z'),
  row(4, 'Portal de Extensão', 'Equipe Aurora', 'IN_PROGRESS', '2026-10-24T02:59:00Z'),
];

describe('projetos finalistas', () => {
  it('busca por projeto ou equipe sem diferenciar acentos e maiúsculas', () => {
    const titles = (search: string) =>
      filterFinalists(rows, { ...EMPTY_FILTERS, search }).map((r) => r.project.title);
    expect(titles('gestao')).toEqual(['Gestão de Laboratórios']);
    expect(titles('AURORA')).toEqual(['Portal de Extensão']);
  });

  it('filtra por curso e por status', () => {
    expect(filterFinalists(rows, { ...EMPTY_FILTERS, courseId: '2' })).toHaveLength(1);
    expect(filterFinalists(rows, { ...EMPTY_FILTERS, status: 'PENDING' })).toHaveLength(2);
  });

  it('ordena não avaliados primeiro: em preenchimento, pendentes pelo prazo, enviadas', () => {
    expect(sortFinalists(rows).map((r) => r.project.id)).toEqual([4, 3, 2, 1]);
  });

  it('conta atribuídos, pendentes (inclui em preenchimento) e enviadas', () => {
    expect(countFinalists(rows)).toEqual({ assigned: 4, pending: 3, sent: 1 });
  });

  it('muda a ação conforme o status', () => {
    expect(finalistAction(rows[1]!).label).toBe('Ver projeto →');
    expect(finalistAction(rows[3]!)).toMatchObject({
      label: 'Continuar →',
      to: '/avaliador/projetos/4/avaliar',
    });
    expect(finalistAction(rows[0]!).label).toBe('Ver avaliação →');
  });

  it('formata datas no horário de Brasília e notas sem casas desnecessárias', () => {
    expect(formatDateTime('2026-10-24T02:59:00Z')).toBe('23/10/2026 às 23h59');
    expect(formatScore('86.00')).toBe('86');
    expect(formatScore('8.50')).toBe('8,5');
    expect(formatTotal('86.00', '100.00')).toBe('86 / 100');
  });

  it('descreve materiais e a busca sem resultados', () => {
    expect(
      describeMaterial({
        id: 1,
        name: 'Relatório.pdf',
        kind: 'FILE',
        url: '#',
        format: 'PDF',
        size_bytes: 2_516_582,
      }),
    ).toBe('PDF · 2,4 MB');
    expect(
      describeMaterial({
        id: 2,
        name: 'Protótipo',
        kind: 'LINK',
        url: '#',
        format: 'Figma',
        size_bytes: null,
      }),
    ).toBe('Link externo · Figma');
    expect(describeNoResults({ search: '', courseId: '', status: 'PENDING' })).toBe(
      'Não encontramos projetos atribuídos com status Pendente. Tente outro termo ou remova os filtros.',
    );
  });
});
