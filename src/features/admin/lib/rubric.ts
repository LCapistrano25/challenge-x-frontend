import { formatPoints, parsePoints, toCents } from './score';

/**
 * Rubrica do critério. A API guarda a rubrica em um único texto (`Criterion.rubric`); a tela
 * monta a matriz de níveis do Figma a partir dele. O texto continua legível para quem só vê
 * a rubrica (professores e avaliadores):
 *
 *   Apresenta problema, solução e resultados com sequência clara.
 *
 *   Insuficiente (0,0): Sem sequência compreensível.
 *   Em desenvolvimento (0,3): Ideias dispersas; conexão parcial.
 *   Adequado (0,6): Sequência clara com pequenas lacunas.
 *   Excelente (0,8): Síntese clara do problema, solução e impacto.
 *
 * Linhas fora desse padrão formam a descrição do critério.
 */

export type RubricLevelKey = 'INSUFFICIENT' | 'DEVELOPING' | 'ADEQUATE' | 'EXCELLENT';

export const RUBRIC_LEVELS: readonly { key: RubricLevelKey; label: string }[] = [
  { key: 'INSUFFICIENT', label: 'Insuficiente' },
  { key: 'DEVELOPING', label: 'Em desenvolvimento' },
  { key: 'ADEQUATE', label: 'Adequado' },
  { key: 'EXCELLENT', label: 'Excelente' },
];

export const RUBRIC_LEVEL_LABEL = Object.fromEntries(
  RUBRIC_LEVELS.map((level) => [level.key, level.label]),
) as Record<RubricLevelKey, string>;

export interface RubricLevel {
  points: number;
  descriptor: string;
}

export interface Rubric {
  description: string;
  levels: Partial<Record<RubricLevelKey, RubricLevel>>;
}

const LEVEL_BY_LABEL = new Map(
  RUBRIC_LEVELS.map((level) => [level.label.toLowerCase(), level.key]),
);
const LEVEL_LINE = /^\s*([^()]+?)\s*\((\d{1,3}(?:[.,]\d{1,2})?)\)\s*:\s*(.+?)\s*$/;

export function parseRubric(text: string | null | undefined): Rubric {
  const levels: Rubric['levels'] = {};
  const description: string[] = [];
  for (const line of (text ?? '').split(/\r?\n/)) {
    const match = LEVEL_LINE.exec(line);
    const key = match ? LEVEL_BY_LABEL.get(match[1]!.toLowerCase()) : undefined;
    const points = match ? parsePoints(match[2]!) : null;
    if (match && key && points !== null) {
      levels[key] = { points, descriptor: match[3]! };
    } else {
      description.push(line);
    }
  }
  return { description: description.join('\n').trim(), levels };
}

export function serializeRubric(rubric: Rubric): string | null {
  const lines = RUBRIC_LEVELS.flatMap(({ key, label }) => {
    const level = rubric.levels[key];
    return level ? [`${label} (${formatPoints(level.points)}): ${level.descriptor.trim()}`] : [];
  });
  const description = rubric.description.trim();
  const text = [description, lines.join('\n')].filter(Boolean).join('\n\n');
  return text || null;
}

/** O nível vale mais que o máximo do critério (ex.: o máximo caiu depois da rubrica pronta). */
export const isLevelOverMax = (level: RubricLevel | undefined, criterionMax: number | null) =>
  level !== undefined && criterionMax !== null && toCents(level.points) > toCents(criterionMax);

/**
 * Revisada: os quatro níveis têm pontuação e descritor e nenhum passa do máximo do critério
 * na etapa (quando informado).
 */
export const isRubricComplete = (rubric: Rubric, criterionMax: number | null = null) =>
  RUBRIC_LEVELS.every(
    ({ key }) =>
      Boolean(rubric.levels[key]?.descriptor.trim()) &&
      !isLevelOverMax(rubric.levels[key], criterionMax),
  );

export const rubricStatusLabel = (rubric: Rubric, criterionMax: number | null = null) =>
  isRubricComplete(rubric, criterionMax) ? 'Revisada' : 'A revisar';

/** "A", "A e B", "A, B e C". */
export function joinList(items: readonly string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} e ${items.at(-1)}`;
}

/** "0,8 • Síntese clara do problema, solução e impacto." */
export const levelText = (level: RubricLevel | undefined) =>
  level ? `${formatPoints(level.points)} • ${level.descriptor}` : 'Não definido';

export interface RubricLevelErrors {
  points?: string;
  descriptor?: string;
}

/**
 * Pontuação do nível entre 0 e o máximo do critério, sem inverter a ordem dos níveis
 * (Insuficiente ≤ Em desenvolvimento ≤ Adequado ≤ Excelente).
 */
export function validateRubricLevel(
  rubric: Rubric,
  key: RubricLevelKey,
  values: { points: string; descriptor: string },
  criterionMax: number | null,
): RubricLevelErrors {
  const errors: RubricLevelErrors = {};
  if (!values.descriptor.trim()) errors.descriptor = 'Descreva o desempenho esperado no nível.';

  const points = parsePoints(values.points);
  if (values.points.trim() === '') errors.points = 'Informe a pontuação do nível.';
  else if (points === null) errors.points = 'Use um número, ex.: 0,5.';
  else if (criterionMax !== null && toCents(points) > toCents(criterionMax)) {
    errors.points = `Use um valor de 0,0 a ${formatPoints(criterionMax)}.`;
  } else {
    const index = RUBRIC_LEVELS.findIndex((level) => level.key === key);
    const lower = RUBRIC_LEVELS.slice(0, index)
      .reverse()
      .find(({ key: k }) => rubric.levels[k]);
    const upper = RUBRIC_LEVELS.slice(index + 1).find(({ key: k }) => rubric.levels[k]);
    const lowerPoints = lower ? rubric.levels[lower.key]!.points : null;
    const upperPoints = upper ? rubric.levels[upper.key]!.points : null;
    if (lower && lowerPoints !== null && toCents(points) < toCents(lowerPoints)) {
      errors.points = `Não pode ser menor que o nível ${lower.label} (${formatPoints(lowerPoints)}).`;
    } else if (upper && upperPoints !== null && toCents(points) > toCents(upperPoints)) {
      errors.points = `Não pode ser maior que o nível ${upper.label} (${formatPoints(upperPoints)}).`;
    }
  }
  return errors;
}
