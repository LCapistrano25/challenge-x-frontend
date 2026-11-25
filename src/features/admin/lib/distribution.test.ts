import type { Stage } from '../types';
import { checkDistribution, distributionFormula, planDistribution } from './distribution';
import { formatPoints, parsePoints, shareOfTotal, sumPoints } from './score';

const stage = (id: number, order: number, name: string, maxScore: string) =>
  ({ id, order, name, scored: true, max_score: maxScore }) as Stage;
const stages = [
  stage(1, 1, 'Ideação', '2.00'),
  stage(2, 2, 'Desenvolvimento', '3.00'),
  stage(3, 3, 'Entrega', '3.00'),
  stage(4, 4, 'Apresentação', '2.00'),
];
const noCriteria = new Map<number, number>();

describe('pontos', () => {
  it('lê e formata no padrão brasileiro', () => {
    expect(parsePoints('0,8')).toBe(0.8);
    expect(parsePoints('3.5')).toBe(3.5);
    expect(parsePoints('-1')).toBeNull();
    expect(parsePoints('1,555')).toBeNull();
    expect(formatPoints(10)).toBe('10,0');
    expect(sumPoints([0.1, 0.2, 9.7])).toBe(10);
    expect(shareOfTotal(3)).toBe('30%');
  });
});

describe('checkDistribution', () => {
  it('soma exata libera o salvamento', () => {
    const check = checkDistribution(stages, { 1: '2,0', 2: '3,0', 3: '3,0', 4: '2,0' }, noCriteria);
    expect(check).toMatchObject({ exact: true, total: 10, problem: null, errors: {} });
    expect(distributionFormula(stages)).toBe('2,0 + 3,0 + 3,0 + 2,0 = 10,0');
  });

  it('bloqueia soma acima de 10,0 e marca o campo alterado (Figma: Entrega 3,5)', () => {
    const check = checkDistribution(
      stages,
      { 1: '2,0', 2: '3,0', 3: '3,5', 4: '2,0' },
      noCriteria,
      3,
    );
    expect(check.exact).toBe(false);
    expect(check.errors).toEqual({ 3: 'A soma excede o total.' });
    expect(check.problem).toEqual({
      title: 'Não é possível salvar: soma de 10,5 pontos',
      detail:
        'Reduza 0,5 ponto na distribuição. O total precisa ser exatamente 10,0; a configuração salva continua válida.',
    });
  });

  it('bloqueia soma abaixo de 10,0 e pontuação menor que os critérios da etapa', () => {
    const below = checkDistribution(
      stages,
      { 1: '2,0', 2: '3,0', 3: '2,0', 4: '2,0' },
      noCriteria,
      3,
    );
    expect(below.problem?.title).toBe('Não é possível salvar: soma de 9,0 pontos');
    expect(below.errors[3]).toBe('A soma está abaixo do total.');

    const criteria = checkDistribution(
      stages,
      { 1: '2,0', 2: '3,5', 3: '2,5', 4: '2,0' },
      new Map([[3, 3]]),
    );
    expect(criteria.exact).toBe(false);
    expect(criteria.errors[3]).toBe('Os critérios desta etapa somam 3,0.');
  });
});

describe('planDistribution', () => {
  it('grava só as etapas alteradas, com as reduções antes dos aumentos', () => {
    expect(planDistribution(stages, { 1: '2,0', 2: '3,5', 3: '2,5', 4: '2,0' })).toEqual([
      { stageId: 3, max_score: '2.50', delta: -50 },
      { stageId: 2, max_score: '3.50', delta: 50 },
    ]);
  });
});
