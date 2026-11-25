/**
 * Pontos da configuração da avaliação. As contas são feitas em centésimos (inteiros) para que
 * 2,0 + 3,0 + 3,0 + 2,0 feche em 10,0 sem erro de ponto flutuante.
 */

/** Total exato que as etapas pontuadas precisam somar (RF09). */
export const TOTAL_POINTS = 10;
export const TOTAL_CENTS = TOTAL_POINTS * 100;

export const toCents = (value: number) => Math.round(value * 100);
export const fromCents = (cents: number) => cents / 100;

/** Aceita "1,5", "1.5" e "2". Devolve `null` para vazio, negativo ou mais de 2 casas. */
export function parsePoints(raw: string): number | null {
  const text = raw.trim().replace(',', '.');
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(text)) return null;
  return Number(text);
}

/** Mensagem para pontuação fora do formato aceito por `parsePoints`. */
export const INVALID_POINTS = 'Use um número com até 2 casas decimais, ex.: 1,5.';

/** Decimal da API ("3.00") para número; `null` continua `null`. */
export function decimalToNumber(value: string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Número para o decimal da API, sempre com 2 casas ("3.00"). */
export const toDecimal = (value: number) => fromCents(toCents(value)).toFixed(2);

/** "2,0", "0,75", "10,0" (pt-BR, de 1 a 2 casas), como no Figma. */
export function formatPoints(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
}

/** Soma em centésimos e devolve o número. */
export function sumPoints(values: readonly number[]): number {
  return fromCents(values.reduce((total, value) => total + toCents(value), 0));
}

/** "20%" — participação de uma etapa no total de 10 pontos. */
export function shareOfTotal(value: number): string {
  const percent = (toCents(value) / TOTAL_CENTS) * 100;
  return `${percent.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
}

/** "1 ponto", "0,5 ponto", "2,5 pontos". */
export function pointsLabel(value: number): string {
  return `${formatPoints(value)} ${Math.abs(value) > 1 ? 'pontos' : 'ponto'}`;
}
