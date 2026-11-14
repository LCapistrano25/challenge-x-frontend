import type { DashboardStage } from '../types';
import { describeRequirement, getFormationDeadline } from './dashboard';

type Stage = DashboardStage['stage'];

const item = (
  id: number,
  type: Stage['type'],
  phase_status: Stage['phase_status'],
): DashboardStage => ({
  stage: {
    id,
    position: id,
    name: `Etapa ${id}`,
    type,
    starts_at: '2026-03-01T00:00:00Z',
    ends_at: `2026-03-${10 + id}T23:59:00Z`,
    scored: false,
    points_value: null,
    phase_status,
  },
  deliverable_status: null,
  score: null,
});

describe('getFormationDeadline', () => {
  it('usa a etapa de formação em andamento, não a primeira', () => {
    const stages = [
      item(1, 'FORMATION', 'FINISHED'),
      item(2, 'FORMATION', 'OPEN'),
      item(3, 'EVALUATION', 'UPCOMING'),
    ];
    expect(getFormationDeadline({ stages })).toBe('2026-03-12T23:59:00Z');
  });

  it('sem etapa aberta, usa a próxima de formação', () => {
    const stages = [item(1, 'FORMATION', 'UPCOMING'), item(2, 'FORMATION', 'UPCOMING')];
    expect(getFormationDeadline({ stages })).toBe('2026-03-11T23:59:00Z');
  });

  it('com a formação encerrada, usa a última etapa de formação', () => {
    const stages = [item(1, 'FORMATION', 'FINISHED'), item(2, 'FORMATION', 'FINISHED')];
    expect(getFormationDeadline({ stages })).toBe('2026-03-12T23:59:00Z');
  });

  it('retorna null sem etapa de formação', () => {
    expect(getFormationDeadline({ stages: [item(1, 'FINAL', 'OPEN')] })).toBeNull();
  });
});

it('descreve os requisitos pendentes em português', () => {
  expect(describeRequirement('MIN_MEMBERS')).toContain('mínimo de integrantes');
});
