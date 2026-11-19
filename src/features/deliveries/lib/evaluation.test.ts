import {
  formatDateOnly,
  formatFileSize,
  formatScore,
  formatSentAt,
  formatTotal,
  maxTotal,
  parseScore,
  totalScore,
  validateScores,
} from './evaluation';
import type { EvaluationCriterion } from '../types';

const criteria: EvaluationCriterion[] = [
  { id: 'a', name: 'A', description: '', max_score: 2, score: null },
  { id: 'b', name: 'B', description: '', max_score: 3, score: null },
];

describe('parseScore', () => {
  it.each([
    ['1,5', 1.5],
    ['1.5', 1.5],
    [' 2 ', 2],
    ['0', 0],
    ['2,25', 2.25],
  ])('%s → %s', (raw, expected) => expect(parseScore(raw)).toBe(expected));

  it.each(['', 'abc', '1,555', '-1', '1,5,2'])('rejeita "%s"', (raw) =>
    expect(parseScore(raw)).toBeNull(),
  );
});

describe('formatação', () => {
  it('notas em pt-BR', () => {
    expect(formatScore(2)).toBe('2,0');
    expect(formatScore(1.5)).toBe('1,5');
    expect(formatScore(8.25)).toBe('8,25');
    expect(formatTotal(8, 10)).toBe('8,0 / 10,0');
  });

  it('tamanho de arquivo', () => {
    expect(formatFileSize(1887436)).toBe('1,8 MB');
    expect(formatFileSize(126976)).toBe('124 KB');
    expect(formatFileSize(10)).toBe('1 KB');
  });

  it('datas', () => {
    expect(formatSentAt('2026-10-06T14:32:00')).toBe('06/10/2026 às 14h32');
    expect(formatDateOnly('2026-10-07')).toBe('07/10/2026');
  });
});

describe('validateScores', () => {
  it('exige todas as notas', () => {
    expect(validateScores(criteria, { a: '1', b: '' })).toEqual({ b: 'Informe a nota.' });
  });

  it('rejeita formato inválido e nota acima do máximo', () => {
    expect(validateScores(criteria, { a: 'x', b: '3,5' })).toEqual({
      a: 'Use um número, ex.: 1,5.',
      b: 'A nota máxima é 3,0.',
    });
  });

  it('aceita de 0 até o máximo, inclusive', () => {
    expect(validateScores(criteria, { a: '0', b: '3' })).toEqual({});
  });
});

describe('totais', () => {
  it('soma as notas válidas e ignora o resto', () => {
    expect(totalScore(criteria, { a: '1,5', b: '2,5' })).toBe(4);
    expect(totalScore(criteria, { a: 'x', b: '2,5' })).toBe(2.5);
    expect(totalScore(criteria, { a: '9', b: '' })).toBe(0);
  });

  it('o máximo é a soma dos máximos', () => {
    expect(maxTotal(criteria)).toBe(5);
  });
});
