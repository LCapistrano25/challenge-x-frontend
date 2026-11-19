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
    // Datas no fuso de quem roda o teste (o CI usa UTC): o cálculo é por dia de calendário local.
    const today = new Date(2027, 2, 10, 12);
    const deadline = new Date(2027, 2, 15, 18).toISOString();
    expect(describeTeamlessDeadline(deadline, today)).toEqual({
      value: '5 dias',
      description: 'Formação de equipes até 15/03/2027',
    });
    expect(describeTeamlessDeadline(new Date(2027, 2, 9, 18).toISOString(), today).value).toBe(
      'Encerrado',
    );
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
