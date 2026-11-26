/**
 * Dados simulados para o MSW no formato de docs/api/openapi.yaml.
 * Servem ao desenvolvimento e aos testes; não são contrato. As datas são relativas a "agora"
 * para o cronograma e o prazo de formação fazerem sentido em qualquer dia.
 */
import type { StudentDashboard, TeamMember } from '@/features/teams';
import type { Notification } from '@/features/notifications';
import type { PublicEdition, PublicProject, PublicProjectDetail } from '@/features/public-panel';
import type { CourseSummary, EditionSummary, StageSchedule } from '@/shared/types/api';

const DAY = 24 * 60 * 60 * 1000;
const daysFromNow = (days: number) => new Date(Date.now() + days * DAY).toISOString();
const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60 * 1000).toISOString();

const ES: CourseSummary = { id: 1, name: 'Engenharia de Software' };
const AGRO: CourseSummary = { id: 2, name: 'Agronomia' };
const PSI: CourseSummary = { id: 3, name: 'Psicologia' };
const DIR: CourseSummary = { id: 4, name: 'Direito' };

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

const EXPANDED_ABOUT =
  'Este projeto conecta a comunidade acadêmica a demandas reais da região, com foco em impacto social mensurável. A equipe mapeou o problema junto aos usuários, prototipou a solução e validou as hipóteses em campo, documentando os aprendizados a cada etapa.\n\nA proposta prevê continuidade após o Desafio X, com materiais abertos para que outras turmas possam evoluir o trabalho.';

const OBJECTIVE =
  'Ampliar a participação da comunidade nas ações do projeto. No piloto, a maioria dos participantes concluiu a jornada sem apoio. A próxima etapa prevê acompanhar adesão e permanência.';

/** Business Model Canvas ilustrativo (Figma "Detalhe do Projeto"). 6 blocos preenchidos. */
export function buildProjectCanvas() {
  return [
    {
      title: 'Proposta de valor',
      text: 'Reunir ações de extensão em um único portal acessível, facilitando a descoberta de atividades gratuitas e a inscrição da comunidade.',
    },
    {
      title: 'Público-alvo',
      text: 'Moradores da comunidade e estudantes que buscam oficinas, atendimentos e outras oportunidades de extensão universitária.',
    },
    {
      title: 'Canais e relacionamento',
      text: 'Portal web para consulta e inscrição nas atividades, com divulgação pelas redes sociais e canais institucionais da universidade.',
    },
    {
      title: 'Atividades e recursos-chave',
      text: 'Cadastrar e divulgar ações, gerenciar inscrições e acompanhar a participação. Recursos: plataforma web e equipe acadêmica.',
    },
    {
      title: 'Parcerias-chave',
      text: 'Coordenação de extensão, docentes e projetos universitários, em articulação com organizações e lideranças da comunidade.',
    },
    {
      title: 'Custos e sustentabilidade',
      text: 'Hospedagem, manutenção e suporte ao portal. Apoio institucional e editais de extensão para manter o acesso gratuito à comunidade.',
    },
  ];
}

/**
 * Detalhe público do projeto (GET /api/public/projects/{id}). O contrato devolve o PublicProject;
 * descrição, objetivo, orientação, tecnologias, integrantes e arquivos são PROPOSTA (Figma).
 */
export function buildPublicProjectDetail(id: number): PublicProjectDetail | null {
  const base = publicProjects.find((project) => project.id === id);
  if (!base) return null;
  return {
    ...base,
    keywords: `${base.sdg.title}, ${base.course.name}`,
    about: EXPANDED_ABOUT,
    objective: OBJECTIVE,
    code: `DX-${base.edition.year}-${String(base.id).padStart(3, '0')}`,
    stage_label: 'Etapa final',
    advisor: 'Prof.ª Juliana Ribeiro',
    technologies: ['React', 'Node.js', 'PostgreSQL', 'Figma'],
    submitted_at: '2026-10-20T14:32:00',
    canvas: buildProjectCanvas(),
    members: base.members.map((member, index) => ({
      name: member.name,
      course: base.course.name,
      role: index === 0 ? 'LEADER' : 'MEMBER',
    })),
    deliverables: [
      {
        id: 1,
        label: 'Relatório final.pdf',
        type: 'FILE',
        href: '/mocks/relatorio-final.pdf',
        meta: 'PDF · 2,4 MB',
      },
      {
        id: 2,
        label: 'Apresentação da equipe.pdf',
        type: 'FILE',
        href: '/mocks/apresentacao.pdf',
        meta: 'PDF · 4,8 MB',
      },
      {
        id: 3,
        label: 'Protótipo navegável',
        type: 'LINK',
        href: 'https://exemplo.com/projeto',
        meta: 'Link externo · Figma',
      },
    ],
  };
}

/** Aluno sem equipe: só o aviso da coordenação (Figma 551:11777). */
export function buildEditionNotifications(): Notification[] {
  return [
    {
      id: 'c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e60',
      type: 'SYSTEM',
      title: 'Inscrições da edição abertas',
      message:
        'Confira o regulamento e organize sua participação antes do fim da formação de equipes.',
      link: null,
      read_at: null,
      created_at: minutesAgo(90),
    },
  ];
}

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
