/**
 * Dados simulados para o MSW no formato de docs/api/openapi.yaml.
 * Servem ao desenvolvimento e aos testes; não são contrato. As datas são relativas a "agora"
 * para o cronograma e o prazo de formação fazerem sentido em qualquer dia.
 */
import type { StudentDashboard, TeamMember } from '@/features/teams';
import type { Notification } from '@/features/notifications';
import type { PublicEdition, PublicProject } from '@/features/public-panel';
import type { CourseSummary, EditionSummary, StageSchedule } from '@/shared/types/api';

const DAY = 24 * 60 * 60 * 1000;
const daysFromNow = (days: number) => new Date(Date.now() + days * DAY).toISOString();
const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60 * 1000).toISOString();

const ES: CourseSummary = { id: 1, name: 'Engenharia de Software', slug: 'ES' };
const AGRO: CourseSummary = { id: 2, name: 'Agronomia', slug: 'AGRO' };
const PSI: CourseSummary = { id: 3, name: 'Psicologia', slug: 'PSI' };
const DIR: CourseSummary = { id: 4, name: 'Direito', slug: 'DIR' };

const edition: EditionSummary = {
  id: 3,
  year: 2026,
  semester: 1,
  name: 'Desafio X 2026/1',
  status: 'IN_PROGRESS',
};

function stages(): StageSchedule[] {
  const stage = (
    id: number,
    name: string,
    type: StageSchedule['type'],
    start: number,
    end: number,
    scored = true,
  ): StageSchedule => ({
    id,
    position: id,
    name,
    type,
    starts_at: daysFromNow(start),
    ends_at: daysFromNow(end),
    scored,
    points_value: scored ? '3.00' : null,
    phase_status: end < 0 ? 'FINISHED' : start > 0 ? 'UPCOMING' : 'OPEN',
  });

  return [
    stage(1, 'Inscrições', 'FORMATION', -40, -21, false),
    stage(2, 'Formação das equipes', 'FORMATION', -20, 5, false),
    stage(3, 'Entrega preliminar', 'EVALUATION', 6, 30),
    stage(4, 'Avaliação técnica', 'EVALUATION', 31, 45),
    stage(5, 'Divulgação dos finalistas', 'FINAL', 46, 50, false),
  ];
}

const member = (
  id: number,
  name: string,
  course: CourseSummary,
  role: TeamMember['role'] = 'MEMBER',
): TeamMember => ({
  id,
  student: { user_id: `00000000-0000-4000-8000-00000000${id}`, name, course },
  role,
  joined_at: '2026-10-22T16:00:00Z',
});

export function buildStudentDashboard(): StudentDashboard {
  return {
    edition,
    team: {
      id: 12,
      edition_id: edition.id,
      name: 'Equipe Aurora',
      code: 'DXA7K2',
      status: 'ACTIVE',
      qualification: null,
      disqualification_reason: null,
      members: [
        member(101, 'Ana Maria', ES, 'LEADER'),
        member(102, 'João Silva', ES),
        member(103, 'José Ferreira', AGRO),
        member(104, 'José Pereira', AGRO),
      ],
      created_at: '2026-10-22T16:00:00Z',
      updated_at: '2026-10-22T16:00:00Z',
    },
    is_leader: true,
    // Proposta de campo (ver StudentDashboard.max_members).
    max_members: 6,
    incomplete_requirements: [],
    project: null,
    stages: stages().map((stage) => ({
      stage,
      deliverable_status: stage.scored ? 'NOT_SUBMITTED' : null,
      score: null,
    })),
    pending_actions: [
      {
        kind: 'PROJECT_DATA_PENDING',
        description: 'Complete os dados do projeto da equipe.',
        reference_id: null,
      },
      {
        kind: 'CHALLENGE_RESELECTION_REQUIRED',
        description: 'Escolha um novo desafio.',
        reference_id: 15,
      },
      {
        kind: 'DELIVERABLE_PENDING',
        description: 'Envie a entrega preliminar.',
        reference_id: 3,
      },
    ],
  };
}

export function buildCurrentEdition(): PublicEdition {
  return {
    edition,
    // PDF local em public/mocks: o host do exemplo do openapi não existe.
    notice_url: '/mocks/edital-2026-1.pdf',
    stages: stages(),
    sdgs: [
      {
        id: 3,
        number: 3,
        title: 'Saúde e Bem-estar',
        description: 'Assegurar uma vida saudável.',
        icon: 'ods-03.svg',
      },
    ],
    challenges: [],
  };
}

const project = (
  id: number,
  title: string,
  sdg: [number, string],
  course: CourseSummary,
  members: string[],
): PublicProject => ({
  id,
  edition,
  title,
  summary:
    'Solução que conecta a comunidade acadêmica a demandas reais da região, com foco em impacto social mensurável.',
  course,
  sdg: { id: sdg[0], number: sdg[0], title: sdg[1] },
  category: { id: 2, name: 'Protótipos e Artefatos' },
  members: members.map((name) => ({ name })),
});

export const publicProjects: PublicProject[] = [
  project(40, 'Inclusão Digital no Campo', [10, 'Redução das Desigualdades'], ES, [
    'Gabriel Gomes',
    'Maria Souza',
    'Fernanda Silva',
    'Lucas Lima',
  ]),
  project(41, 'Mente Saudável', [3, 'Saúde e Bem-estar'], PSI, [
    'Gustavo Garcia',
    'Mariana Santos',
    'Felipe Soares',
    'Bruna Alves',
  ]),
  project(42, 'Transparência Já', [16, 'Paz, Justiça e Instituições Eficazes'], DIR, [
    'Gabriela Gil',
    'Marcos Silva',
    'Flávia Santos',
  ]),
  project(43, 'Água Inteligente', [6, 'Água Potável e Saneamento'], AGRO, [
    'Giovana Gomes',
    'Matheus Sales',
    'Fábio Souza',
    'Rita Lopes',
  ]),
  project(44, 'Energia na Escola', [7, 'Energia Limpa e Acessível'], ES, [
    'Caio Rocha',
    'Lara Dias',
    'Igor Melo',
  ]),
];

export function buildNotifications(): Notification[] {
  return [
    {
      id: 'c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e51',
      type: 'TEAM',
      title: 'Marina Rocha',
      message: 'Convite enviado · aguardando resposta.',
      link: null,
      read_at: null,
      created_at: minutesAgo(2),
    },
    {
      id: 'c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e52',
      type: 'TEAM',
      title: 'Luiza Costa',
      message: 'Solicitação pendente para entrar na equipe.',
      link: null,
      read_at: null,
      created_at: minutesAgo(15),
    },
    {
      id: 'c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e53',
      type: 'TEAM',
      title: 'Pedro Alves',
      message: 'Convite enviado · aguardando resposta.',
      link: null,
      read_at: daysFromNow(-1),
      created_at: daysFromNow(-1),
    },
  ];
}
