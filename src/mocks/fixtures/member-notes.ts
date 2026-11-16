/**
 * Avaliação de membro simulada (task #14). O envio segue POST /api/teams/{id}/member-notes
 * (confirmado); o resumo para o líder é PROPOSTA (GET /member-notes/summary).
 * Figma: José Ferreira já avaliado; João Silva e José Pereira pendentes.
 */
import { MY_TEAM_ID } from './my-team';

export interface MockMemberNote {
  id: number;
  team_id: number;
  member_id: number;
  content: string;
  created_at: string;
}

export function buildMemberNotes(): MockMemberNote[] {
  return [
    {
      id: 17,
      team_id: MY_TEAM_ID,
      member_id: 103,
      content: [
        'Comprometimento: 5/5 (Excelente)',
        'Colaboração: 4/5 (Boa)',
        'Comunicação: 4/5 (Boa)',
        'Contribuição para o projeto: 5/5 (Excelente)',
      ].join('\n'),
      created_at: '2026-11-10T14:00:00Z',
    },
  ];
}
