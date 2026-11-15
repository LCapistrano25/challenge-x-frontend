import { getApiError } from '@/shared/lib/api-error';
import { formatRelativeTime } from '@/features/notifications';
import type { Invitation, LeadershipRequest, Team, TeamMember } from '../types';
import {
  TEAM_DESCRIPTION_MAX,
  TEAM_NAME_MAX,
  TEAM_NAME_MIN,
  describeTeamError,
  formatDate,
  type FormationWindow,
} from './team-formation';

/* --- Papel de quem está vendo a tela --- */

/**
 * LEADER: gerencia a equipe · MEMBER: participante com líder ativo ·
 * LEADERLESS: participante de equipe sem líder ativo (pode solicitar a liderança, RF28).
 */
export type TeamViewMode = 'LEADER' | 'MEMBER' | 'LEADERLESS';

export const findLeader = (team: Pick<Team, 'members'>) =>
  team.members.find((member) => member.role === 'LEADER') ?? null;

export function getTeamViewMode(team: Pick<Team, 'members'>, isLeader: boolean): TeamViewMode {
  if (isLeader) return 'LEADER';
  return findLeader(team) ? 'MEMBER' : 'LEADERLESS';
}

/** Vínculo do próprio aluno: pelo user_id da sessão ou, sem ele, pelo nome. */
export function findSelf(members: TeamMember[], user?: { id?: string; name?: string } | null) {
  if (!user) return null;
  return (
    members.find((member) => member.student.user_id === user.id) ??
    members.find((member) => member.student.name === user.name) ??
    null
  );
}

/** Líder primeiro; depois a ordem de entrada na equipe. */
export function orderMembers(members: TeamMember[]) {
  return [...members].sort((a, b) => {
    const byRole = Number(b.role === 'LEADER') - Number(a.role === 'LEADER');
    return byRole || a.joined_at.localeCompare(b.joined_at) || a.id - b.id;
  });
}

/* --- Textos do cartão da equipe --- */

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** "4 de 6 estudantes" */
export const describeMemberCount = (count: number, max: number) => `${count} de ${max} estudantes`;

export const availableSlots = (count: number, max: number) => Math.max(0, max - count);

/** "2 vagas" · "1 vaga" · "Equipe completa" */
export function describeSlots(count: number, max: number) {
  const slots = availableSlots(count, max);
  return slots > 0 ? plural(slots, 'vaga', 'vagas') : 'Equipe completa';
}

/** "2 vagas disponíveis" (faixa abaixo dos integrantes). */
export function describeSlotsTitle(count: number, max: number) {
  const slots = availableSlots(count, max);
  if (slots <= 0) return 'Nenhuma vaga disponível';
  return slots === 1 ? '1 vaga disponível' : `${slots} vagas disponíveis`;
}

/** "4 integrantes" */
export const describeMembersBadge = (count: number) => plural(count, 'integrante', 'integrantes');

/** "2 convites · 1 solicitação" */
export function describePendingSummary(invitations: number, joinRequests: number) {
  if (invitations + joinRequests === 0) return 'Nenhuma pendência';
  const parts = [];
  if (invitations > 0) parts.push(plural(invitations, 'convite', 'convites'));
  if (joinRequests > 0) parts.push(plural(joinRequests, 'solicitação', 'solicitações'));
  return parts.join(' · ');
}

/** "Até 15/03/2027 · 5 dias" (coluna "Formação da equipe"). */
export function describeFormation(formation: FormationWindow) {
  if (!formation.endsAt) return 'Prazo não definido';
  const end = formatDate(formation.endsAt);
  if (formation.status === 'CLOSED') return `Encerrada em ${end}`;
  if (formation.status === 'UPCOMING' && formation.startsAt)
    return `Começa em ${formatDate(formation.startsAt)}`;
  const days = formation.daysLeft ?? 0;
  if (days <= 0) return `Até ${end} · último dia`;
  return `Até ${end} · ${plural(days, 'dia', 'dias')}`;
}

/** A composição da equipe só muda durante a formação (convites, aprovações, saídas). */
export const isFormationLocked = (formation: FormationWindow) =>
  formation.status === 'CLOSED' || formation.status === 'UPCOMING';

/* --- Pendências --- */

const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

/** "Engenharia Ambiental · Há 15 min" */
export const describeJoinRequestMeta = (course: string, createdAt: string, now?: Date) =>
  `${course} · ${formatRelativeTime(createdAt, now)}`;

/** "Enviado há 2 min · Aguardando resposta" */
export const describeInvitationMeta = (createdAt: string, now?: Date) =>
  `Enviado ${lowerFirst(formatRelativeTime(createdAt, now))} · Aguardando resposta`;

/** Nome do convidado ou, no convite por e-mail sem cadastro, o próprio e-mail. */
export const invitationLabel = (invitation: Invitation) =>
  invitation.student?.name ?? invitation.invited_email ?? 'Convidado';

/** Solicitação de liderança ainda aguardando o professor. */
export const pendingLeadershipRequest = (requests: LeadershipRequest[] | undefined) =>
  requests?.find((request) => request.status === 'PENDING') ?? null;

/* --- Formulários --- */

/** E-mail simples (a API valida o domínio institucional). */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateInviteEmail(email: string): string | null {
  const value = email.trim();
  if (!value) return 'Informe o e-mail institucional do estudante.';
  if (value.length > 254 || !EMAIL_PATTERN.test(value)) return 'Informe um e-mail válido.';
  return null;
}

export interface EditTeamValues {
  name: string;
  description: string;
}

export type EditTeamErrors = Partial<Record<keyof EditTeamValues, string>>;

export function validateEditTeam(values: EditTeamValues): EditTeamErrors {
  const errors: EditTeamErrors = {};
  const name = values.name.trim();
  if (!name) errors.name = 'Informe o nome da equipe.';
  else if (name.length < TEAM_NAME_MIN || name.length > TEAM_NAME_MAX)
    errors.name = `O nome deve ter entre ${TEAM_NAME_MIN} e ${TEAM_NAME_MAX} caracteres.`;
  if (values.description.trim().length > TEAM_DESCRIPTION_MAX)
    errors.description = `A apresentação deve ter até ${TEAM_DESCRIPTION_MAX} caracteres.`;
  return errors;
}

/* --- Erros da API (409) desta tela --- */

const MY_TEAM_ERROR: Record<string, string> = {
  invitation_pending_exists: 'Já existe um convite pendente para este estudante.',
  invitation_not_pending: 'Este convite não está mais pendente.',
  join_request_not_pending: 'Esta solicitação não está mais pendente.',
  student_already_in_team: 'Este estudante já participa de uma equipe nesta edição.',
  leader_must_transfer: 'Transfira a liderança antes de sair da equipe.',
  team_has_leader: 'A equipe já possui líder ativo.',
  leadership_request_pending_exists: 'Já existe uma solicitação de liderança pendente.',
  edition_closed: 'A edição está encerrada e não pode ser alterada.',
  team_disqualified: 'A equipe está desclassificada.',
};

export function describeMyTeamError(error: unknown, fallback: string) {
  const code = getApiError(error)?.code;
  if (code && MY_TEAM_ERROR[code]) return MY_TEAM_ERROR[code];
  return describeTeamError(error, fallback);
}
