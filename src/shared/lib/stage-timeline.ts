import type { Step, StepStatus } from '@/shared/ui';
import type { PhaseStatus, StageSchedule } from '@/shared/types/api';

const STEP_STATUS: Record<PhaseStatus, StepStatus> = {
  FINISHED: 'done',
  OPEN: 'current',
  UPCOMING: 'upcoming',
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

/** Percentual decorrido da etapa em andamento (0–100). */
export function stageProgress(
  stage: Pick<StageSchedule, 'starts_at' | 'ends_at'>,
  now = new Date(),
) {
  const start = new Date(stage.starts_at).getTime();
  const end = new Date(stage.ends_at).getTime();
  if (end <= start) return 100;
  const ratio = (now.getTime() - start) / (end - start);
  return Math.round(Math.min(1, Math.max(0, ratio)) * 100);
}

/** Converte o cronograma da API (StageSchedule[]) para os passos do Stepper. */
export function toTimelineSteps(stages: StageSchedule[], now = new Date()): Step[] {
  return [...stages]
    .sort((a, b) => a.position - b.position)
    .map((stage) => ({
      id: String(stage.id),
      label: stage.name,
      date: formatDate(stage.starts_at),
      status: STEP_STATUS[stage.phase_status],
      progress: stage.phase_status === 'OPEN' ? stageProgress(stage, now) : undefined,
    }));
}
