import type { Stage } from '../types';
import { endOfDayIso, formatPeriod, startOfDayIso, toDateInput } from './dates';
import {
  chronologyIssues,
  formToStagePayload,
  scheduleSummary,
  stageStatus,
  stagesTotal,
  totalSituation,
  validateStageForm,
  type StageFormValues,
} from './stages';

function stage(
  id: number,
  order: number,
  name: string,
  [start, end, evaluation]: [string, string, string],
  maxScore: string,
): Stage {
  return {
    id,
    edition_id: 7,
    order,
    name,
    kind: 'SUBMISSION',
    starts_at: startOfDayIso(start),
    ends_at: endOfDayIso(end),
    evaluation_ends_at: endOfDayIso(evaluation),
    scored: true,
    max_score: maxScore,
    min_evaluations: 1,
    submission_fields: [],
    created_at: '',
    updated_at: '',
  };
}

const ideation = stage(1, 1, 'Ideação', ['2027-03-01', '2027-03-19', '2027-03-21'], '2.00');
const development = stage(
  2,
  2,
  'Desenvolvimento',
  ['2027-03-22', '2027-04-30', '2027-05-02'],
  '3.00',
);
const delivery = stage(3, 3, 'Entrega', ['2027-05-03', '2027-05-14', '2027-05-28'], '3.00');
const presentation = stage(
  4,
  4,
  'Apresentação',
  ['2027-06-14', '2027-06-18', '2027-06-25'],
  '2.00',
);
const all = [ideation, development, delivery, presentation];

const form = (overrides: Partial<StageFormValues> = {}): StageFormValues => ({
  name: 'Entrega',
  order: '3',
  kind: 'SUBMISSION',
  startDay: '2027-05-03',
  endDay: '2027-05-14',
  evaluationDay: '2027-05-28',
  maxScore: '3,0',
  criterionIds: ['703'],
  ...overrides,
});

describe('datas', () => {
  it('converte o dia de Brasília para date-time e volta', () => {
    expect(startOfDayIso('2027-05-03')).toBe('2027-05-03T03:00:00.000Z');
    expect(endOfDayIso('2027-05-14')).toBe('2027-05-15T02:59:00.000Z');
    expect(toDateInput('2027-05-15T02:59:00Z')).toBe('2027-05-14');
  });

  it('formata o período como no Figma', () => {
    expect(formatPeriod('2027-03-01', '2027-03-19')).toBe('01/03 a 19/03/2027');
    expect(formatPeriod('2026-12-10', '2027-01-20')).toBe('10/12/2026 a 20/01/2027');
  });
});

describe('stageStatus', () => {
  const days = { startDay: '2027-05-03', endDay: '2027-05-14', evaluationDay: '2027-05-28' };
  it.each([
    ['2027-04-01', 'PLANNED'],
    ['2027-05-03', 'OPEN'],
    ['2027-05-20', 'EVALUATING'],
    ['2027-06-01', 'DONE'],
  ])('em %s → %s', (today, expected) => expect(stageStatus(days, today)).toBe(expected));
});

describe('total das etapas', () => {
  it('soma em centésimos e reconhece os 10,0 exatos', () => {
    expect(stagesTotal(all)).toBe(10);
    expect(totalSituation(10)).toEqual({ exact: true, text: 'Soma exata atendida' });
    expect(totalSituation(10.5).text).toBe('Excede em 0,5');
    expect(totalSituation(8).text).toBe('Faltam 2,0 para 10,0');
  });

  it('resume a cronologia e aponta sobreposição', () => {
    expect(scheduleSummary(all)).toBe(
      'Ideação até 19/03; Desenvolvimento até 30/04; Entrega até 14/05; Apresentação até 18/06/2027.',
    );
    expect(chronologyIssues(all)).toEqual([]);
    const overlapping = {
      ...development,
      ends_at: endOfDayIso('2027-05-05'),
      evaluation_ends_at: endOfDayIso('2027-05-10'),
    };
    expect(chronologyIssues([ideation, overlapping, delivery])).toEqual([
      'Desenvolvimento termina depois do início de Entrega.',
    ]);
  });
});

describe('validateStageForm', () => {
  const others = [ideation, development, presentation];

  it('aceita a etapa salva', () => {
    const result = validateStageForm(form(), { others, criteriaTotal: 3 });
    expect(result.errors).toEqual({});
    expect(result.chronology).toBeNull();
    expect(result.total).toBe(10);
  });

  it('rejeita prazo posterior à avaliação técnica (Figma: 30/05 x 28/05)', () => {
    const result = validateStageForm(form({ endDay: '2027-05-30' }), { others });
    expect(result.errors.endDay).toBe('Deve ocorrer antes de 28/05/2027.');
    expect(result.chronology).toBe(
      'O prazo proposto de 30/05 é posterior à avaliação técnica. Defina uma data entre 03/05 e 27/05/2027.',
    );
  });

  it('não deixa a etapa sobrepor as vizinhas na sequência', () => {
    const before = validateStageForm(form({ startDay: '2027-04-28' }), { others });
    expect(before.errors.startDay).toBe(
      'Deve ocorrer depois de 30/04/2027 (fim de Desenvolvimento).',
    );
    const after = validateStageForm(form({ endDay: '2027-06-15', evaluationDay: '2027-06-20' }), {
      others,
    });
    expect(after.errors.endDay).toBe('Deve ocorrer antes de 14/06/2027 (início de Apresentação).');
  });

  it('bloqueia total acima de 10,0 e pontuação abaixo dos critérios', () => {
    expect(validateStageForm(form({ maxScore: '3,5' }), { others }).errors.maxScore).toBe(
      'A soma das etapas passaria de 10,0 (ficaria 10,5).',
    );
    expect(
      validateStageForm(form({ maxScore: '2,5' }), { others, criteriaTotal: 3 }).errors.maxScore,
    ).toBe('Os critérios desta etapa somam 3,0.');
  });

  it('exige posição livre, nome e critérios', () => {
    const result = validateStageForm(form({ order: '2', name: ' ', criterionIds: [] }), {
      others,
    });
    expect(result.errors.order).toBe('A posição 2 já é da etapa Desenvolvimento.');
    expect(result.errors.name).toBe('Informe o nome da etapa.');
    expect(result.errors.criterionIds).toBe('Selecione ao menos um critério.');
  });

  it('etapa FINAL dispensa pontuação, critérios e prazo de avaliação', () => {
    const result = validateStageForm(
      form({ kind: 'FINAL', maxScore: '', criterionIds: [], evaluationDay: '' }),
      { others },
    );
    expect(result.errors).toEqual({});
  });
});

describe('formToStagePayload', () => {
  it('monta o corpo da API com decimais e prazos às 23h59', () => {
    expect(formToStagePayload(form())).toEqual({
      order: 3,
      name: 'Entrega',
      kind: 'SUBMISSION',
      starts_at: '2027-05-03T03:00:00.000Z',
      ends_at: '2027-05-15T02:59:00.000Z',
      evaluation_ends_at: '2027-05-29T02:59:00.000Z',
      scored: true,
      max_score: '3.00',
    });
    expect(formToStagePayload(form({ kind: 'FINAL' }))).toMatchObject({
      scored: false,
      max_score: null,
      evaluation_ends_at: null,
    });
  });
});
