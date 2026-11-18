import type { DeliveryStatus, TeacherDelivery } from '../types';

export const STATUS_LABEL: Record<DeliveryStatus, string> = {
  PENDING_EVALUATION: 'Pendente de Avaliação',
  SUBMITTED: 'Enviado',
  EVALUATED: 'Avaliado',
};

export const STATUS_NOTE: Record<DeliveryStatus, string> = {
  PENDING_EVALUATION: 'Falta avaliar',
  SUBMITTED: 'Recebido; ainda não triado',
  EVALUATED: 'Nota e feedback publicados',
};

export const ACTION_LABEL: Record<DeliveryStatus, string> = {
  PENDING_EVALUATION: 'Avaliar entrega',
  SUBMITTED: 'Ver material',
  EVALUATED: 'Ver avaliação',
};

const pad = (value: number) => String(value).padStart(2, '0');

/** "06/10 • 14h32". Datas sem fuso são lidas no horário local (sem deslocar o dia). */
export function formatSubmission(iso: string): string {
  const date = new Date(iso);
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)} • ${pad(date.getHours())}h${pad(date.getMinutes())}`;
}

/** "23 de outubro de 2026" a partir de AAAA-MM-DD, sem o erro de fuso de `new Date('2026-10-23')`. */
export function formatDeadline(dateOnly: string): string {
  const [year, month, day] = dateOnly.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(year!, month! - 1, day));
}

export function summarize(deliveries: TeacherDelivery[]) {
  const count = (status: DeliveryStatus) => deliveries.filter((d) => d.status === status).length;
  const total = deliveries.length;
  const pending = count('PENDING_EVALUATION');
  const evaluated = count('EVALUATED');
  return {
    total,
    pending,
    evaluated,
    /** Projetos que ainda esperam ação do professor (pendentes + enviados sem triagem). */
    awaiting: pending + count('SUBMITTED'),
    progress: total === 0 ? 0 : Math.round((evaluated / total) * 100),
    next: deliveries.find((d) => d.status === 'PENDING_EVALUATION') ?? null,
  };
}

export interface DeliveryFilters {
  course: string;
  status: string;
  query: string;
}

export function filterDeliveries(deliveries: TeacherDelivery[], filters: DeliveryFilters) {
  const query = filters.query.trim().toLowerCase();
  return deliveries.filter(
    (d) =>
      (!filters.course || d.course === filters.course) &&
      (!filters.status || d.status === filters.status) &&
      (!query || `${d.project_name} ${d.team_name}`.toLowerCase().includes(query)),
  );
}

/** Destino das ações da tabela. A tela de avaliação da entrega ainda é um placeholder. */
export const deliveryPath = (delivery: Pick<TeacherDelivery, 'id'>) =>
  `/professor/entregas/${delivery.id}`;
