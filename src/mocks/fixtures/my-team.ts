/**
 * "Minha equipe" simulada (task #11), no formato de docs/api/openapi.yaml. Campos marcados como
 * PROPOSTA nos tipos (description, previous_leader, message) aparecem aqui para a tela ficar
 * igual ao Figma; não são contrato aprovado.
 */
import type { Invitation, JoinRequest, Team, TeamMember } from '@/features/teams';
import type { CourseSummary } from '@/shared/types/api';

const MINUTE = 60 * 1000;
const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * MINUTE).toISOString();

const ES: CourseSummary = { id: 1, name: 'Engenharia de Software', slug: 'ES' };
const AGRO: CourseSummary = { id: 2, name: 'Agronomia', slug: 'AGRO' };
const AMB: CourseSummary = { id: 7, name: 'Engenharia Ambiental', slug: 'AMB' };

const student = (id: number, name: string, course: CourseSummary) => ({
  user_id: `00000000-0000-4000-8000-00000000${id}`,
  name,
  course,
});

const member = (
  id: number,
  name: string,
  course: CourseSummary,
  role: TeamMember['role'] = 'MEMBER',
  joinedDay = 22,
): TeamMember => ({
  id,
  student: student(id, name, course),
  role,
  joined_at: `2026-10-${joinedDay}T16:00:00Z`,
});

/** Mesmos integrantes do painel do aluno (Figma: Ana Maria líder, João, José F., José P.). */
export const MY_TEAM_ID = 12;
export const LEADER_MEMBER_ID = 101;
export const PARTICIPANT_MEMBER_ID = 102;

export function buildMyTeam(): Team {
  return {
    id: MY_TEAM_ID,
    edition_id: 3,
    name: 'Equipe Aurora',
    code: 'DXA7K2',
    status: 'ACTIVE',
    qualification: null,
    disqualification_reason: null,
    description:
      'Unimos tecnologia e agronomia para criar soluções de impacto para a agricultura familiar.',
    members: [
      member(LEADER_MEMBER_ID, 'Ana Maria', ES, 'LEADER', 22),
      member(PARTICIPANT_MEMBER_ID, 'João Silva', ES, 'MEMBER', 23),
      member(103, 'José Ferreira', AGRO, 'MEMBER', 24),
      member(104, 'José Pereira', AGRO, 'MEMBER', 25),
    ],
    created_at: '2026-10-22T16:00:00Z',
    updated_at: '2026-10-22T16:00:00Z',
  };
}

/** Equipe sem líder: a líder saiu sem transferir (login: sem-lider@exemplo.com). */
export const LEADERLESS_TEAM_ID = 13;
export const LEADERLESS_MEMBER_ID = 202;

export function buildLeaderlessTeam(): Team {
  return {
    id: LEADERLESS_TEAM_ID,
    edition_id: 3,
    name: 'Conexão Verde',
    code: 'DX27-CV18',
    status: 'ACTIVE',
    qualification: null,
    disqualification_reason: null,
    description:
      'Unimos tecnologia e agronomia para criar soluções de impacto para a agricultura familiar.',
    previous_leader: { name: 'Ana Maria' },
    members: [
      member(LEADERLESS_MEMBER_ID, 'João Silva', ES, 'MEMBER', 23),
      member(203, 'José Ferreira', AGRO, 'MEMBER', 24),
      member(204, 'José Pereira', AGRO, 'MEMBER', 25),
    ],
    created_at: '2026-10-22T16:00:00Z',
    updated_at: '2026-10-22T16:00:00Z',
  };
}

const teamRef = (team: Team) => ({ id: team.id, name: team.name, code: team.code });

/** Convites enviados (Figma: Marina Rocha há 2 min, Pedro Alves ontem). */
export function buildMyTeamInvitations(): Invitation[] {
  const team = teamRef(buildMyTeam());
  return [
    {
      id: 88,
      team,
      student: { user_id: '00000000-0000-4000-8000-000000000301', name: 'Marina Rocha' },
      invited_email: null,
      status: 'PENDING',
      created_at: minutesAgo(2),
      responded_at: null,
    },
    {
      id: 89,
      team,
      student: { user_id: '00000000-0000-4000-8000-000000000302', name: 'Pedro Alves' },
      invited_email: null,
      status: 'PENDING',
      created_at: minutesAgo(24 * 60 + 30),
      responded_at: null,
    },
  ];
}

/** Solicitação recebida (Figma: Luiza Costa, Engenharia Ambiental, há 15 min). */
export function buildMyTeamJoinRequests(): JoinRequest[] {
  return [
    {
      id: 45,
      team: teamRef(buildMyTeam()),
      student: student(303, 'Luiza Costa', AMB),
      status: 'PENDING',
      message: 'Quero contribuir com pesquisa de campo e sustentabilidade.',
      created_at: minutesAgo(15),
      responded_at: null,
    },
  ];
}
