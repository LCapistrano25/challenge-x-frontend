import { useCurrentEdition } from '@/features/public-panel';
import { editionCode } from '../lib/finalists';

/**
 * Código da edição vigente ("2026.2") usado no título e no rodapé das telas do avaliador.
 * O cabeçalho em degradê é do layout (AppLayout), igual em todas as telas da área.
 */
export function useEvaluatorPage(): string | undefined {
  const edition = useCurrentEdition().data?.edition;
  return edition ? editionCode(edition) : undefined;
}
