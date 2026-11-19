import { formatRelativeTime } from '@/features/notifications';
import { daysUntil } from './formation-deadline';
import { formatDate, formatDayMonth } from './team-formation';
import type { Invitation, JoinRequest } from '../types';

/** Atalhos da Home sem equipe: a tela de formação rola até o bloco certo. */
export const CREATE_TEAM_HREF = '/academico/equipe/buscar#criar-equipe';
export const FIND_TEAMS_HREF = '/academico/equipe/buscar#equipes-com-vagas';

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/** Card "Prazo" da Home sem equipe: "5 dias" / "Formação de equipes até 15/03/2027". */
export function describeTeamlessDeadline(deadline: string | null, today: Date = new Date()) {
  if (!deadline) return { value: '—', description: 'Prazo de formação não definido' };
  const days = daysUntil(deadline, today);
  if (days < 0) {
    return {
      value: 'Encerrado',
      description: `A formação de equipes terminou em ${formatDate(deadline)}`,
    };
  }
  return {
    value: days === 0 ? 'Hoje' : `${days} ${plural(days, 'dia', 'dias')}`,
    description: `Formação de equipes até ${formatDate(deadline)}`,
  };
}

/** "Equipes que querem conhecer você" (1 → singular). */
export const describeInvitationsCount = (count: number) =>
  plural(count, 'Equipe que quer conhecer você', 'Equipes que querem conhecer você');

/** "2 vagas" / "1 vaga" / "Equipe completa"; sem o dado (PROPOSTA), não mostra nada. */
export function describeInvitationSlots(invitation: Pick<Invitation, 'available_slots'>) {
  const slots = invitation.available_slots;
  if (slots == null) return null;
  if (slots <= 0) return 'Equipe completa';
  return `${slots} ${plural(slots, 'vaga', 'vagas')}`;
}

/** "Convidou você · Agronomia e tecnologia" (cursos da equipe, quando a API os enviar). */
export function describeInvitationOrigin(invitation: Pick<Invitation, 'team_courses'>) {
  const courses = (invitation.team_courses ?? []).map((course) => course.name);
  if (courses.length === 0) return 'Convidou você';
  const last = courses.pop();
  const list = courses.length > 0 ? `${courses.join(', ')} e ${last}` : last;
  return `Convidou você · ${list}`;
}

/** "Há 2 h · Expira em 15/03" (a validade é o fim da formação quando a API não informar). */
export function describeInvitationTiming(
  invitation: Pick<Invitation, 'created_at' | 'expires_at'>,
  formationDeadline: string | null,
  now: Date = new Date(),
) {
  const expires = invitation.expires_at ?? formationDeadline;
  const received = formatRelativeTime(invitation.created_at, now);
  return expires ? `${received} · Expira em ${formatDayMonth(expires)}` : received;
}

/** "Enviada em 09/03/2027 · Você ainda não faz parte desta equipe." */
export const describeSentRequest = (request: Pick<JoinRequest, 'created_at'>) =>
  `Enviada em ${formatDate(request.created_at)} · Você ainda não faz parte desta equipe.`;
