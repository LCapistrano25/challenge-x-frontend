import type { EditionSummary } from '@/shared/types/api';

/** "2026/1": ano e semestre da edição. */
export const editionLabel = (edition: Pick<EditionSummary, 'year' | 'semester'>) =>
  `${edition.year}/${edition.semester}`;
