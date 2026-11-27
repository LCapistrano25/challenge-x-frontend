import { usePageHeader } from '@/shared/lib/page-header';
import { EditionPicker } from '../components/setup/SetupParts';

/** Título da página no cabeçalho, com o sobretítulo da área e o seletor de edição. */
export function useSetupHeader(
  title: string,
  area: 'ETAPAS' | 'AVALIAÇÕES' | 'EDITAIS' | 'AVALIADORES',
) {
  usePageHeader(title, undefined, {
    eyebrow: `ADMINISTRAÇÃO / ${area}`,
    actions: <EditionPicker />,
  });
}
