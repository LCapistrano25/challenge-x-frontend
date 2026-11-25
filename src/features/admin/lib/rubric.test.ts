import {
  isLevelOverMax,
  isRubricComplete,
  joinList,
  levelText,
  parseRubric,
  serializeRubric,
  validateRubricLevel,
} from './rubric';

const TEXT = `Apresenta problema, solução e resultados.

Insuficiente (0,0): Sem sequência compreensível.
Em desenvolvimento (0,3): Ideias dispersas; conexão parcial.
Adequado (0,6): Sequência clara com pequenas lacunas.
Excelente (0,8): Síntese clara do problema, solução e impacto.`;

describe('rubrica em texto', () => {
  it('lê descrição e níveis', () => {
    const rubric = parseRubric(TEXT);
    expect(rubric.description).toBe('Apresenta problema, solução e resultados.');
    expect(rubric.levels.DEVELOPING).toEqual({
      points: 0.3,
      descriptor: 'Ideias dispersas; conexão parcial.',
    });
    expect(isRubricComplete(rubric)).toBe(true);
    expect(levelText(rubric.levels.EXCELLENT)).toBe(
      '0,8 • Síntese clara do problema, solução e impacto.',
    );
  });

  it('nível acima do máximo do critério deixa a rubrica "A revisar"', () => {
    const rubric = parseRubric(TEXT);
    expect(isRubricComplete(rubric, 0.8)).toBe(true);
    expect(isRubricComplete(rubric, 0.7)).toBe(false);
    expect(isLevelOverMax(rubric.levels.EXCELLENT, 0.7)).toBe(true);
    expect(joinList(['A', 'B', 'C'])).toBe('A, B e C');
    expect(joinList(['A', 'B'])).toBe('A e B');
  });

  it('volta ao mesmo texto ao serializar', () => {
    expect(serializeRubric(parseRubric(TEXT))).toBe(TEXT);
  });

  it('texto livre vira descrição; rubrica incompleta fica "A revisar"', () => {
    const rubric = parseRubric('Avalia o grau de originalidade da solução...');
    expect(rubric).toEqual({
      description: 'Avalia o grau de originalidade da solução...',
      levels: {},
    });
    expect(isRubricComplete(rubric)).toBe(false);
    expect(levelText(undefined)).toBe('Não definido');
    expect(serializeRubric({ description: '', levels: {} })).toBeNull();
  });
});

describe('validateRubricLevel', () => {
  const rubric = parseRubric(TEXT);

  it('respeita o intervalo de 0 ao máximo do critério', () => {
    expect(
      validateRubricLevel(rubric, 'EXCELLENT', { points: '0,9', descriptor: 'x' }, 0.8).points,
    ).toBe('Use um valor de 0,0 a 0,8.');
    expect(
      validateRubricLevel(rubric, 'EXCELLENT', { points: '0,8', descriptor: 'x' }, 0.8),
    ).toEqual({});
  });

  it('mantém a ordem dos níveis e exige descritor', () => {
    const errors = validateRubricLevel(rubric, 'ADEQUATE', { points: '0,2', descriptor: ' ' }, 0.8);
    expect(errors.points).toBe('Não pode ser menor que o nível Em desenvolvimento (0,3).');
    expect(errors.descriptor).toBe('Descreva o desempenho esperado no nível.');
  });
});
