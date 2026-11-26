import type { FinalistRow } from '../types';
import { editionCode, normalizeText } from './finalists';

/** Etapas avaliadas pelo avaliador externo: hoje, só a etapa final. */
export const EVALUATOR_STAGES = [{ value: 'FINAL', label: 'Final' }];

export interface SentFilters {
  search: string;
  /** id da edição em texto ('' = todas). */
  editionId: string;
  stage: string;
}

/** Avaliações enviadas, das mais recentes para as mais antigas. */
export function sentEvaluations(rows: FinalistRow[]): FinalistRow[] {
  return rows
    .filter((row) => row.my_evaluation_status === 'FINALIZED')
    .sort(
      (a, b) =>
        new Date(b.finalized_at ?? 0).getTime() - new Date(a.finalized_at ?? 0).getTime() ||
        a.project.title.localeCompare(b.project.title, 'pt-BR'),
    );
}

export function filterSent(rows: FinalistRow[], filters: SentFilters): FinalistRow[] {
  const term = normalizeText(filters.search);
  return rows.filter(
    (row) =>
      (term === '' ||
        normalizeText(row.project.title).includes(term) ||
        normalizeText(row.team.name).includes(term)) &&
      (filters.editionId === '' || String(row.project.edition.id) === filters.editionId),
  );
}

/** Edições presentes no histórico, da mais recente para a mais antiga. */
export function editionOptions(rows: FinalistRow[]) {
  const editions = new Map(rows.map((row) => [row.project.edition.id, row.project.edition]));
  return [...editions.values()]
    .sort((a, b) => b.year - a.year || b.semester - a.semester)
    .map((edition) => ({ value: String(edition.id), label: editionCode(edition) }));
}
