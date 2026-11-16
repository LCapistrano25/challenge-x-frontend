import type { NewsItem } from '../types';

/**
 * Notícias e canal de dúvidas não estão modelados na API (P-35).
 * Conteúdo editorial provisório: trocar por uma chamada quando o endpoint existir.
 */
export const NEWS: NewsItem[] = [
  {
    id: 'edital-publicado',
    category: 'Atualização',
    title: 'Edital publicado e inscrições abertas',
    summary: 'Confira os prazos, critérios e orientações para participar da edição vigente.',
  },
  {
    id: 'preparar-submissao',
    category: 'Dicas',
    title: 'Como preparar sua submissão',
    summary: 'Checklist rápido para revisar antes do envio e evitar pendências administrativas.',
  },
  {
    id: 'canal-duvidas',
    category: 'Comunidade',
    title: 'Canal de dúvidas já está disponível',
    summary: 'Equipe técnica e administrativa atende por chat para tirar dúvidas sobre o processo.',
  },
];
