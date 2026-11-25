import type { AdminEdition, AdminEditionStatus } from '../types';

export const EDITION_STATUS_LABEL: Record<AdminEditionStatus, string> = {
  SETUP: 'Em configuração',
  PUBLISHED: 'Publicada',
  CLOSED: 'Encerrada',
};

/** "Desafio X • 2027" (Figma); com dois semestres no ano, "Desafio X • 2027/1". */
export function editionLabel(edition: AdminEdition, editions: readonly AdminEdition[] = []) {
  const sameYear = editions.filter((other) => other.year === edition.year).length > 1;
  return `Desafio X • ${edition.year}${sameYear ? `/${edition.semester}` : ''}`;
}

const byRecency = (a: AdminEdition, b: AdminEdition) => b.year - a.year || b.semester - a.semester;

/** Edição aberta à configuração mais recente; sem ela, a mais recente de todas. */
export function defaultEdition(editions: readonly AdminEdition[]): AdminEdition | undefined {
  const sorted = [...editions].sort(byRecency);
  return sorted.find((edition) => edition.status === 'SETUP') ?? sorted[0];
}

export const sortEditions = (editions: readonly AdminEdition[]) => [...editions].sort(byRecency);

/** A configuração congela após a publicação do edital (409 edition_published). */
export const isEditionEditable = (edition: AdminEdition | undefined) => edition?.status === 'SETUP';

export function lockedReason(edition: AdminEdition): string {
  return edition.status === 'CLOSED'
    ? 'A edição está encerrada; a configuração fica disponível apenas para consulta.'
    : 'O edital desta edição já foi publicado; etapas, critérios e pontuações estão congelados.';
}
