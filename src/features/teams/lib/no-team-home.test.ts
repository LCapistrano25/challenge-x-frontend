import {
  describeInvitationOrigin,
  describeInvitationSlots,
  describeInvitationsCount,
  describeTeamlessDeadline,
} from './no-team-home';

const ES = { id: 1, name: 'Engenharia de Software', slug: 'ES' };
const AGRO = { id: 2, name: 'Agronomia', slug: 'AGRO' };

describe('Home sem equipe', () => {
  it('descreve o prazo de formação', () => {
    const today = new Date(2027, 2, 10, 12);
    expect(describeTeamlessDeadline('2027-03-15T23:59:00-03:00', today)).toEqual({
      value: '5 dias',
      description: 'Formação de equipes até 15/03/2027',
    });
    expect(describeTeamlessDeadline('2027-03-09T23:59:00-03:00', today).value).toBe('Encerrado');
    expect(describeTeamlessDeadline(null).value).toBe('—');
  });

  it('descreve os convites', () => {
    expect(describeInvitationsCount(1)).toBe('Equipe que quer conhecer você');
    expect(describeInvitationsCount(2)).toBe('Equipes que querem conhecer você');
    expect(describeInvitationSlots({ available_slots: 2 })).toBe('2 vagas');
    expect(describeInvitationSlots({ available_slots: 1 })).toBe('1 vaga');
    expect(describeInvitationSlots({})).toBeNull();
    expect(describeInvitationOrigin({ team_courses: [AGRO, ES] })).toBe(
      'Convidou você · Agronomia e Engenharia de Software',
    );
    expect(describeInvitationOrigin({})).toBe('Convidou você');
  });
});
