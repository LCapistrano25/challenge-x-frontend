import type { DeliveryStatus, TeacherDashboard, TeacherDelivery } from '@/features/deliveries';

const delivery = (
  id: string,
  project_name: string,
  team_name: string,
  course: string,
  submitted_at: string,
  status: DeliveryStatus,
): TeacherDelivery => ({ id, project_name, team_name, course, stage: 2, submitted_at, status });

const ES = 'Engenharia de Software';
const SI = 'Sistemas de Informação';

/** Mesmos dados ilustrativos do Figma (Professor › Home), já ordenados por prioridade. */
export function buildTeacherDashboard(): TeacherDashboard {
  return {
    semester: '2026.2',
    stage_label: 'Etapa 2 — Proposta e planejamento',
    evaluation_deadline: '2026-10-23',
    courses: [ES, SI],
    deliveries: [
      delivery(
        'd1',
        'Portal de Extensão',
        'Equipe Aurora',
        ES,
        '2026-10-06T14:32:00',
        'PENDING_EVALUATION',
      ),
      delivery(
        'd2',
        'Biblioteca Conectada',
        'Equipe Nexo',
        ES,
        '2026-10-05T18:10:00',
        'PENDING_EVALUATION',
      ),
      delivery(
        'd3',
        'Mapa de Acessibilidade',
        'Equipe Ponte',
        ES,
        '2026-10-05T10:15:00',
        'PENDING_EVALUATION',
      ),
      delivery('d4', 'Agenda Comunitária', 'Equipe Elo', ES, '2026-10-08T09:20:00', 'SUBMITTED'),
      delivery(
        'd5',
        'Gestão de Laboratórios',
        'Equipe Prisma',
        SI,
        '2026-10-04T16:40:00',
        'EVALUATED',
      ),
      delivery('d6', 'Rede de Voluntariado', 'Equipe Raiz', ES, '2026-10-03T11:05:00', 'EVALUATED'),
    ],
  };
}
