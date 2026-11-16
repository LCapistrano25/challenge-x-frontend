import type { StageSchedule } from '@/shared/types/api';
import { stageProgress, toTimelineSteps } from './stage-timeline';

const stage = (over: Partial<StageSchedule>): StageSchedule => ({
  id: 1,
  position: 1,
  name: 'Etapa',
  type: 'EVALUATION',
  starts_at: '2026-04-01T12:00:00Z',
  ends_at: '2026-04-11T12:00:00Z',
  scored: true,
  points_value: '3.00',
  phase_status: 'UPCOMING',
  ...over,
});

describe('toTimelineSteps', () => {
  it('ordena por posição e traduz phase_status para o Stepper', () => {
    const steps = toTimelineSteps([
      stage({ id: 2, position: 2, phase_status: 'OPEN', name: 'Avaliação' }),
      stage({ id: 1, position: 1, phase_status: 'FINISHED', name: 'Formação' }),
    ]);

    expect(steps.map((s) => [s.label, s.status])).toEqual([
      ['Formação', 'done'],
      ['Avaliação', 'current'],
    ]);
    expect(steps[0]?.date).toBe('01/04/2026');
  });

  it('calcula o progresso só da etapa em andamento', () => {
    const now = new Date('2026-04-06T12:00:00Z');
    const [done, open] = toTimelineSteps(
      [stage({ phase_status: 'FINISHED' }), stage({ id: 2, position: 2, phase_status: 'OPEN' })],
      now,
    );
    expect(done?.progress).toBeUndefined();
    expect(open?.progress).toBe(50);
  });
});

describe('stageProgress', () => {
  it('limita entre 0 e 100', () => {
    const s = stage({});
    expect(stageProgress(s, new Date('2026-03-01T00:00:00Z'))).toBe(0);
    expect(stageProgress(s, new Date('2026-05-01T00:00:00Z'))).toBe(100);
  });
});
