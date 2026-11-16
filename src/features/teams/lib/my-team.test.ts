import type { TeamMember } from '../types';
import {
  describeFormation,
  describeInvitationMeta,
  describeMemberCount,
  describePendingSummary,
  describeSlots,
  describeSlotsTitle,
  findSelf,
  getTeamViewMode,
  orderMembers,
  validateEditTeam,
  validateInviteEmail,
} from './my-team';

const member = (id: number, name: string, role: TeamMember['role'] = 'MEMBER'): TeamMember => ({
  id,
  student: { user_id: `u-${id}`, name, course: { id: 1, name: 'ES', slug: 'ES' } },
  role,
  joined_at: `2026-10-2${id % 10}T10:00:00Z`,
});

describe('my-team', () => {
  it('define o modo da tela pelo papel e pela presença de líder', () => {
    const withLeader = { members: [member(1, 'Ana', 'LEADER'), member(2, 'João')] };
    const leaderless = { members: [member(2, 'João')] };
    expect(getTeamViewMode(withLeader, true)).toBe('LEADER');
    expect(getTeamViewMode(withLeader, false)).toBe('MEMBER');
    expect(getTeamViewMode(leaderless, false)).toBe('LEADERLESS');
  });

  it('ordena com o líder primeiro e encontra o próprio vínculo', () => {
    const members = [member(3, 'José'), member(1, 'Ana', 'LEADER'), member(2, 'João')];
    expect(orderMembers(members).map((m) => m.student.name)).toEqual(['Ana', 'João', 'José']);
    expect(findSelf(members, { id: 'u-2' })?.id).toBe(2);
    expect(findSelf(members, { id: 'x', name: 'José' })?.id).toBe(3);
    expect(findSelf(members, null)).toBeNull();
  });

  it('descreve integrantes, vagas e pendências como no Figma', () => {
    expect(describeMemberCount(4, 6)).toBe('4 de 6 estudantes');
    expect(describeSlots(4, 6)).toBe('2 vagas');
    expect(describeSlots(5, 6)).toBe('1 vaga');
    expect(describeSlots(6, 6)).toBe('Equipe completa');
    expect(describeSlotsTitle(4, 6)).toBe('2 vagas disponíveis');
    expect(describeSlotsTitle(6, 6)).toBe('Nenhuma vaga disponível');
    expect(describePendingSummary(2, 1)).toBe('2 convites · 1 solicitação');
    expect(describePendingSummary(0, 2)).toBe('2 solicitações');
    expect(describePendingSummary(0, 0)).toBe('Nenhuma pendência');
  });

  it('descreve o prazo de formação', () => {
    const endsAt = '2027-03-15T12:00:00Z';
    expect(describeFormation({ status: 'OPEN', startsAt: null, endsAt, daysLeft: 5 })).toBe(
      'Até 15/03/2027 · 5 dias',
    );
    expect(describeFormation({ status: 'OPEN', startsAt: null, endsAt, daysLeft: 0 })).toBe(
      'Até 15/03/2027 · último dia',
    );
    expect(describeFormation({ status: 'CLOSED', startsAt: null, endsAt, daysLeft: -1 })).toBe(
      'Encerrada em 15/03/2027',
    );
    expect(
      describeFormation({ status: 'UNKNOWN', startsAt: null, endsAt: null, daysLeft: null }),
    ).toBe('Prazo não definido');
  });

  it('descreve o convite enviado', () => {
    const now = new Date('2026-11-15T12:00:00Z');
    expect(describeInvitationMeta('2026-11-15T11:58:00Z', now)).toBe(
      'Enviado há 2 min · Aguardando resposta',
    );
  });

  it('valida e-mail do convite e dados da equipe', () => {
    expect(validateInviteEmail('')).toMatch(/Informe o e-mail/);
    expect(validateInviteEmail('nome@')).toBe('Informe um e-mail válido.');
    expect(validateInviteEmail(' nome@universidade.edu.br ')).toBeNull();
    expect(validateEditTeam({ name: 'AB', description: '' }).name).toMatch(/entre 3 e 60/);
    expect(validateEditTeam({ name: 'Conexão Verde', description: 'x'.repeat(301) })).toEqual({
      description: 'A apresentação deve ter até 300 caracteres.',
    });
  });
});
