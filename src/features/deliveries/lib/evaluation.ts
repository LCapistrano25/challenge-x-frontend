import type { EvaluationCriterion } from '../types';

const round2 = (value: number) => Math.round(value * 100) / 100;

/** Aceita "1,5" e "1.5". Devolve `null` para vazio ou formato inválido. */
export function parseScore(raw: string): number | null {
  const text = raw.trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;
  return Number(text);
}

/** "1,5", "2,0", "8,25" (pt-BR, de 1 a 2 casas). */
export function formatScore(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
}

export const formatTotal = (total: number, max: number) =>
  `${formatScore(total)} / ${formatScore(max)}`;

/** Erros por critério (chave = id). Mapa vazio = pode publicar. */
export function validateScores(
  criteria: EvaluationCriterion[],
  values: Record<string, string>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const criterion of criteria) {
    const raw = values[criterion.id] ?? '';
    if (raw.trim() === '') {
      errors[criterion.id] = 'Informe a nota.';
      continue;
    }
    const score = parseScore(raw);
    if (score === null) errors[criterion.id] = 'Use um número, ex.: 1,5.';
    else if (score > criterion.max_score) {
      errors[criterion.id] = `A nota máxima é ${formatScore(criterion.max_score)}.`;
    }
  }
  return errors;
}

/** Soma só as notas válidas, para o total acompanhar a digitação sem quebrar. */
export function totalScore(criteria: EvaluationCriterion[], values: Record<string, string>) {
  return round2(
    criteria.reduce((sum, criterion) => {
      const score = parseScore(values[criterion.id] ?? '');
      return score !== null && score <= criterion.max_score ? sum + score : sum;
    }, 0),
  );
}

export const maxTotal = (criteria: EvaluationCriterion[]) =>
  round2(criteria.reduce((sum, criterion) => sum + criterion.max_score, 0));

/** "1,8 MB", "124 KB". */
export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

const pad = (value: number) => String(value).padStart(2, '0');

/** "06/10/2026 às 14h32" a partir de ISO 8601. */
export function formatSentAt(iso: string): string {
  const date = new Date(iso);
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} às ${pad(date.getHours())}h${pad(date.getMinutes())}`;
}

/** "07/10/2026" a partir de AAAA-MM-DD (sem deslocar o dia por fuso). */
export function formatDateOnly(dateOnly: string): string {
  const [year, month, day] = dateOnly.split('-');
  return `${day}/${month}/${year}`;
}
