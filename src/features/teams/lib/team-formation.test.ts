import type { StageSchedule } from '@/shared/types/api';
import {
  describeLeadership,
  describeVacancies,
  getFormationWindow,
  normalizeTeamCode,
  sameTeamCode,
  toTeamCreate,
  validateCreateTeam,
  validateTeamCode,
} from './team-formation';

const valid = { name: 'Raízes do Futuro', interestArea: 'TECHNOLOGY', description: 'Agricultura.' };

describe('validateCreateTeam', () => {
  it('aceita um formulário completo', () => {
    expect(validateCreateTeam(valid)).toEqual({});
  });

  it('exige os três campos', () => {
    const errors = validateCreateTeam({ name: ' ', interestArea: '', description: '' });
    expect(Object.keys(errors).sort()).toEqual(['description', 'interestArea', 'name']);
  });

  it('limita o nome entre 3 e 60 caracteres (sem contar espaços nas pontas)', () => {
    expect(validateCreateTeam({ ...valid, name: '  ab  ' }).name).toContain('entre 3 e 60');
    expect(validateCreateTeam({ ...valid, name: 'a'.repeat(61) }).name).toContain('entre 3 e 60');
    expect(validateCreateTeam({ ...valid, name: 'abc' }).name).toBeUndefined();
    expect(validateCreateTeam({ ...valid, name: 'a'.repeat(60) }).name).toBeUndefined();
  });

  it('limita a apresentação a 300 caracteres', () => {
    expect(validateCreateTeam({ ...valid, description: 'a'.repeat(301) }).description).toContain(
      '300',
    );
    expect(
      validateCreateTeam({ ...valid, description: 'a'.repeat(300) }).description,
    ).toBeUndefined();
  });

  it('recusa área fora da lista', () => {
    expect(validateCreateTeam({ ...valid, interestArea: 'XYZ' }).interestArea).toBeDefined();
  });
});

it('toTeamCreate monta o corpo de POST /api/teams', () => {
  expect(toTeamCreate({ ...valid, name: '  EcoLab ', description: ' Texto ' })).toEqual({
    name: 'EcoLab',
    interest_area: 'TECHNOLOGY',
    description: 'Texto',
  });
});

describe('código da equipe', () => {
  it('normaliza e compara ignorando caixa, espaços e hífen', () => {
    expect(normalizeTeamCode(' dx27-ab12 ')).toBe('DX27-AB12');
    expect(sameTeamCode('DX27-AB12', 'dx27ab12')).toBe(true);
    expect(sameTeamCode('DXA7K2', 'DXA7K3')).toBe(false);
  });

  it('valida o formato', () => {
    expect(validateTeamCode('')).toContain('Informe');
    expect(validateTeamCode('AB')).toContain('inválido');
    expect(validateTeamCode('DX27@AB12')).toContain('inválido');
    expect(validateTeamCode('dx27-ab12')).toBeNull();
  });
});

it('descreve vagas e liderança como no Figma', () => {
  expect(describeVacancies({ member_count: 4, available_slots: 2 })).toBe(
    '4 de 6 integrantes · 2 vagas',
  );
  expect(describeVacancies({ member_count: 5, available_slots: 1 })).toBe(
    '5 de 6 integrantes · 1 vaga',
  );
  expect(describeVacancies({ member_count: 6, available_slots: 0 })).toBe(
    '6 de 6 integrantes · Equipe completa',
  );
  expect(
    describeLeadership({
      courses: [
        { id: 2, name: 'Agronomia', slug: 'AGRO' },
        { id: 1, name: 'Engenharia de Software', slug: 'ES' },
      ],
    }),
  ).toBe('Liderança · Agronomia · Engenharia de Software');
});

describe('getFormationWindow', () => {
  const today = new Date(2027, 2, 10, 12);
  const stage = (
    id: number,
    type: StageSchedule['type'],
    phase: StageSchedule['phase_status'],
    starts: string,
    ends: string,
  ): StageSchedule => ({
    id,
    position: id,
    name: `Etapa ${id}`,
    type,
    starts_at: starts,
    ends_at: ends,
    scored: false,
    points_value: null,
    phase_status: phase,
  });

  it('usa a etapa de formação aberta e conta os dias restantes', () => {
    const window = getFormationWindow(
      [
        stage(1, 'FORMATION', 'FINISHED', '2027-02-01T12:00:00Z', '2027-02-20T12:00:00Z'),
        stage(2, 'FORMATION', 'OPEN', '2027-02-21T12:00:00Z', '2027-03-15T12:00:00Z'),
        stage(3, 'EVALUATION', 'UPCOMING', '2027-03-16T12:00:00Z', '2027-04-01T12:00:00Z'),
      ],
      today,
    );
    expect(window).toMatchObject({ status: 'OPEN', daysLeft: 5 });
  });

  it('indica formação encerrada ou ainda não iniciada', () => {
    expect(
      getFormationWindow(
        [stage(1, 'FORMATION', 'FINISHED', '2027-02-01T12:00:00Z', '2027-03-01T12:00:00Z')],
        today,
      ).status,
    ).toBe('CLOSED');
    expect(
      getFormationWindow(
        [stage(1, 'FORMATION', 'UPCOMING', '2027-03-20T12:00:00Z', '2027-04-01T12:00:00Z')],
        today,
      ).status,
    ).toBe('UPCOMING');
  });

  it('sem etapa de formação a situação é desconhecida', () => {
    expect(getFormationWindow([], today).status).toBe('UNKNOWN');
  });
});
