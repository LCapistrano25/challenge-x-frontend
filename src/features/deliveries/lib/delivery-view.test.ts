import {
  deliveryPath,
  filterDeliveries,
  formatDeadline,
  formatSubmission,
  summarize,
} from './delivery-view';
import type { TeacherDelivery } from '../types';

const make = (id: string, status: TeacherDelivery['status'], over = {}): TeacherDelivery => ({
  id,
  project_name: `Projeto ${id}`,
  team_name: `Equipe ${id}`,
  course: 'Engenharia de Software',
  stage: 2,
  submitted_at: '2026-10-06T14:32:00',
  status,
  ...over,
});

describe('formatadores', () => {
  it('formata o envio como dia/mês • HHhMM', () => {
    expect(formatSubmission('2026-10-06T14:32:00')).toBe('06/10 • 14h32');
    expect(formatSubmission('2026-01-03T09:05:00')).toBe('03/01 • 09h05');
  });

  it('formata o prazo sem deslocar o dia por causa do fuso', () => {
    expect(formatDeadline('2026-10-23')).toBe('23 de outubro de 2026');
    expect(formatDeadline('2026-01-01')).toBe('1 de janeiro de 2026');
  });
});

describe('summarize', () => {
  const items = [
    make('a', 'PENDING_EVALUATION'),
    make('b', 'PENDING_EVALUATION'),
    make('c', 'SUBMITTED'),
    make('d', 'EVALUATED'),
  ];

  it('conta por situação e calcula o progresso', () => {
    expect(summarize(items)).toMatchObject({
      total: 4,
      pending: 2,
      evaluated: 1,
      awaiting: 3,
      progress: 25,
    });
  });

  it('o próximo projeto é o primeiro pendente da lista (já ordenada por prioridade)', () => {
    expect(summarize(items).next?.id).toBe('a');
  });

  it('lista vazia não quebra', () => {
    expect(summarize([])).toMatchObject({ total: 0, progress: 0, next: null });
  });
});

describe('filterDeliveries', () => {
  const items = [
    make('a', 'PENDING_EVALUATION', {
      project_name: 'Portal de Extensão',
      team_name: 'Equipe Aurora',
    }),
    make('b', 'EVALUATED', { course: 'Sistemas de Informação' }),
  ];
  const none = { course: '', status: '', query: '' };

  it('sem filtros devolve tudo', () => {
    expect(filterDeliveries(items, none)).toHaveLength(2);
  });

  it('filtra por curso, status e texto (projeto ou equipe, sem diferenciar maiúsculas)', () => {
    expect(filterDeliveries(items, { ...none, course: 'Sistemas de Informação' })).toHaveLength(1);
    expect(filterDeliveries(items, { ...none, status: 'EVALUATED' })).toHaveLength(1);
    expect(filterDeliveries(items, { ...none, query: 'AURORA' })[0]?.id).toBe('a');
    expect(filterDeliveries(items, { ...none, query: 'portal' })[0]?.id).toBe('a');
  });

  it('combina os filtros', () => {
    const filters = { course: 'Sistemas de Informação', status: 'PENDING_EVALUATION', query: '' };
    expect(filterDeliveries(items, filters)).toHaveLength(0);
  });
});

describe('deliveryPath', () => {
  it('aponta para a tela da entrega', () => {
    expect(deliveryPath({ id: 'd1' })).toBe('/professor/entregas/d1');
  });
});
