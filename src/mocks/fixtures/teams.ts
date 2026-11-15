/**
 * Equipes simuladas para "Encontre sua equipe" (task #10), no formato de docs/api/openapi.yaml.
 * Campos marcados como PROPOSTA nos tipos (description, interest_area, leader) também aparecem
 * aqui para a tela ficar igual ao Figma; não são contrato aprovado.
 */
import type { JoinRequest, TeamListing } from '@/features/teams';
import type { CourseSummary } from '@/shared/types/api';

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (days: number) => new Date(Date.now() - days * DAY).toISOString();

const ES: CourseSummary = { id: 1, name: 'Engenharia de Software', slug: 'ES' };
const AGRO: CourseSummary = { id: 2, name: 'Agronomia', slug: 'AGRO' };
const ARQ: CourseSummary = { id: 5, name: 'Arquitetura', slug: 'ARQ' };
const SI: CourseSummary = { id: 6, name: 'Sistemas de Informação', slug: 'SI' };
const AMB: CourseSummary = { id: 7, name: 'Engenharia Ambiental', slug: 'AMB' };
const ADM: CourseSummary = { id: 8, name: 'Administração', slug: 'ADM' };
const PSI: CourseSummary = { id: 3, name: 'Psicologia', slug: 'PSI' };

/** Equipe da edição com o total de integrantes; `available_slots` sai do limite (6). */
export interface MockTeam extends Omit<TeamListing, 'available_slots'> {
  created_at: string;
}

export const MOCK_MAX_MEMBERS = 6;

export function buildMockTeams(): MockTeam[] {
  return [
    {
      id: 21,
      name: 'Raízes do Futuro',
      code: 'DX27-RF21',
      member_count: 4,
      courses: [AGRO, ES],
      description: 'Soluções digitais para aproximar a agricultura familiar da comunidade.',
      interest_area: 'TECHNOLOGY',
      leader: { name: 'Marina Rocha', course: AGRO },
      created_at: daysAgo(1),
    },
    {
      id: 22,
      name: 'Cidade em Rede',
      code: 'DX27-CR22',
      member_count: 5,
      courses: [ARQ, SI],
      description: 'Mapeamento colaborativo de espaços e serviços acessíveis no entorno do campus.',
      interest_area: 'SOCIAL',
      leader: { name: 'Pedro Alves', course: ARQ },
      created_at: daysAgo(2),
    },
    {
      id: 23,
      name: 'EcoLab',
      code: 'DX27-EL23',
      member_count: 3,
      courses: [AMB, ADM],
      description: 'Redução de resíduos e incentivo ao consumo consciente na universidade.',
      interest_area: 'ENVIRONMENT',
      leader: { name: 'Luiza Costa', course: AMB },
      created_at: daysAgo(3),
    },
    {
      // Lotada: não aparece em GET /api/teams (só equipes com vagas).
      id: 24,
      name: 'Mente em Foco',
      code: 'DX27-MF24',
      member_count: 6,
      courses: [PSI, ES],
      description: 'Apoio à saúde mental de estudantes com acolhimento digital.',
      interest_area: 'HEALTH',
      leader: { name: 'Carla Nunes', course: PSI },
      created_at: daysAgo(4),
    },
  ];
}

export const toTeamListing = (team: MockTeam): TeamListing => ({
  id: team.id,
  name: team.name,
  code: team.code,
  member_count: team.member_count,
  available_slots: Math.max(0, MOCK_MAX_MEMBERS - team.member_count),
  courses: team.courses,
  description: team.description,
  interest_area: team.interest_area,
  leader: team.leader,
});

/** Aluno simulado sem equipe (login: sem-equipe@exemplo.com). */
export const STUDENT_WITHOUT_TEAM = {
  user_id: '00000000-0000-4000-8000-000000000005',
  name: 'João Silva',
  course: ES,
};

/** Solicitação já enviada para a EcoLab (Figma: "Solicitação enviada"). */
export function buildMockJoinRequests(): JoinRequest[] {
  return [
    {
      id: 301,
      team: { id: 23, name: 'EcoLab', code: 'DX27-EL23' },
      student: STUDENT_WITHOUT_TEAM,
      status: 'PENDING',
      created_at: daysAgo(1),
      responded_at: null,
    },
  ];
}
