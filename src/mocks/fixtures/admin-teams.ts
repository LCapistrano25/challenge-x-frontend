/**
 * Equipes e Projetos (administração, RF13). Figma: 04 - Administrador › "Equipes e Projetos".
 * - GET  /api/admin/teams                     (teamsAdminList)
 * - GET  /api/admin/teams/{id}                (detalhe — PROPOSTO)
 * - POST /api/admin/teams/{id}/disqualify     (teamsDisqualify)
 * Dados ilustrativos.
 */
import type {
  AdminTeamDelivery,
  AdminTeamDetail,
  AdminTeamListItem,
  AdminTeamMember,
  AdminTeamSituation,
} from '@/features/admin';

const EDITION_ID = 4;

type Seed = {
  id: number;
  name: string;
  code: string;
  project: string;
  course: string;
  members: number;
  situation: AdminTeamSituation;
  category: string;
  sdg: string;
  challenge: string;
  advisor: string;
  description: string;
  memberNames: string[];
};

const SEEDS: Seed[] = [
  {
    id: 801,
    name: 'Conecta',
    code: 'DX27-CONE',
    project: 'Saúde em Rede',
    course: 'Enfermagem',
    members: 4,
    situation: 'VALIDATED',
    category: 'Impacto social',
    sdg: 'ODS 3 · Saúde e bem-estar',
    challenge: 'Cuidado comunitário conectado',
    advisor: 'Prof.ª Helena Costa',
    description:
      'O Saúde em Rede aproxima famílias dos serviços de atenção à saúde por meio de orientações acessíveis e acompanhamento de ações preventivas. A equipe propõe um fluxo de comunicação comunitária, validado com profissionais e participantes do território.',
    memberNames: ['Marina Oliveira', 'Lucas Pereira', 'Júlia Santos', 'Pedro Almeida'],
  },
  {
    id: 802,
    name: 'Raízes',
    code: 'DX27-RAIZ',
    project: 'Horta Circular',
    course: 'Agronomia',
    members: 5,
    situation: 'PRE_REGISTERED',
    category: 'Protótipos e Artefatos',
    sdg: 'ODS 2 · Fome Zero e Agricultura Sustentável',
    challenge: 'Produção de alimentos no campus',
    advisor: 'Prof. Rafael Nunes',
    description:
      'A Horta Circular transforma resíduos orgânicos do campus em adubo para hortas comunitárias, aproximando estudantes e moradores da produção sustentável de alimentos.',
    memberNames: ['Bruno Lima', 'Sofia Reis', 'Igor Alves', 'Vera Pires', 'Noa Dias'],
  },
  {
    id: 803,
    name: 'Horizonte',
    code: 'DX27-HORZ',
    project: 'Aprender Juntos',
    course: 'Pedagogia',
    members: 4,
    situation: 'PENDING',
    category: 'Impacto social',
    sdg: 'ODS 4 · Educação de Qualidade',
    challenge: 'Reforço escolar comunitário',
    advisor: 'Prof.ª Juliana Ribeiro',
    description:
      'O Aprender Juntos organiza oficinas de reforço escolar para crianças da comunidade, com materiais abertos e acompanhamento dos acadêmicos de Pedagogia.',
    memberNames: ['Camila Dias', 'Rafael Melo', 'Bia Santos', 'Caio Rocha'],
  },
  {
    id: 804,
    name: 'Código Vivo',
    code: 'DX27-CODV',
    project: 'Campus Acessível',
    course: 'Eng. de Software',
    members: 3,
    situation: 'PRE_REGISTERED',
    category: 'Protótipos e Artefatos',
    sdg: 'ODS 10 · Redução das Desigualdades',
    challenge: 'Acessibilidade digital no campus',
    advisor: 'Prof. André Faria',
    description:
      'O Campus Acessível mapeia barreiras de acessibilidade e oferece um aplicativo com rotas e recursos adaptados para estudantes com deficiência.',
    memberNames: ['Gabriel Gomes', 'Maria Souza', 'Lucas Lima'],
  },
  {
    id: 805,
    name: 'Nova Rota',
    code: 'DX27-NOVR',
    project: 'Bairro Sustentável',
    course: 'Arquitetura',
    members: 4,
    situation: 'PENDING',
    category: 'Pesquisa Aplicada',
    sdg: 'ODS 11 · Cidades e Comunidades Sustentáveis',
    challenge: 'Requalificação de espaços públicos',
    advisor: 'Prof.ª Marina Dias',
    description:
      'O Bairro Sustentável propõe intervenções de baixo custo para requalificar praças e espaços públicos, com participação dos moradores no desenho das soluções.',
    memberNames: ['Fernanda Silva', 'Marcos Silva', 'Flávia Santos', 'Hugo Alves'],
  },
  {
    id: 806,
    name: 'Aurora',
    code: 'DX27-AURO',
    project: 'Portal de Extensão',
    course: 'Sistemas de Informação',
    members: 4,
    situation: 'VALIDATED',
    category: 'Impacto social',
    sdg: 'ODS 4 · Educação de Qualidade',
    challenge: 'Divulgação de ações de extensão',
    advisor: 'Prof.ª Helena Costa',
    description:
      'O Portal de Extensão reúne ações universitárias em um único ambiente acessível, facilitando a descoberta de atividades gratuitas e a inscrição da comunidade.',
    memberNames: ['Ana Souza', 'Bruno Lima', 'Carla Dias', 'Diego Melo'],
  },
  {
    id: 807,
    name: 'Nexo',
    code: 'DX27-NEXO',
    project: 'Biblioteca Conectada',
    course: 'Eng. de Software',
    members: 4,
    situation: 'PRE_REGISTERED',
    category: 'Protótipos e Artefatos',
    sdg: 'ODS 11 · Cidades e Comunidades Sustentáveis',
    challenge: 'Acesso à leitura na comunidade',
    advisor: 'Prof. André Faria',
    description:
      'A Biblioteca Conectada integra acervos comunitários e permite reservas online, aproximando a leitura de bairros com pouco acesso a livros.',
    memberNames: ['Rafael Nunes', 'Sofia Reis', 'Tiago Alves', 'Lia Castro'],
  },
  {
    id: 808,
    name: 'Prisma',
    code: 'DX27-PRIS',
    project: 'Gestão de Laboratórios',
    course: 'Sistemas de Informação',
    members: 5,
    situation: 'PRE_REGISTERED',
    category: 'Pesquisa Aplicada',
    sdg: 'ODS 9 · Indústria, Inovação e Infraestrutura',
    challenge: 'Otimização dos laboratórios',
    advisor: 'Prof.ª Lara Pires',
    description:
      'A Gestão de Laboratórios digitaliza o agendamento e o inventário dos laboratórios, reduzindo filas e desperdício de recursos.',
    memberNames: ['Hugo Alves', 'Vera Lima', 'Noah Pires', 'Gal Costa', 'Edu Rocha'],
  },
  {
    id: 809,
    name: 'Elo',
    code: 'DX27-ELO',
    project: 'Agenda Comunitária',
    course: 'Eng. de Software',
    members: 4,
    situation: 'PENDING',
    category: 'Impacto social',
    sdg: 'ODS 16 · Paz, Justiça e Instituições Eficazes',
    challenge: 'Comunicação de serviços públicos',
    advisor: 'Prof.ª Marina Dias',
    description:
      'A Agenda Comunitária centraliza eventos e serviços públicos do bairro em um calendário colaborativo e acessível.',
    memberNames: ['Caio Melo', 'Bia Santos', 'Igor Rocha', 'Paula Reis'],
  },
  {
    id: 810,
    name: 'Pulso',
    code: 'DX27-PULS',
    project: 'Vida Ativa',
    course: 'Educação Física',
    members: 3,
    situation: 'VALIDATED',
    category: 'Impacto social',
    sdg: 'ODS 3 · Saúde e bem-estar',
    challenge: 'Promoção de atividade física',
    advisor: 'Prof. Rafael Nunes',
    description:
      'O Vida Ativa incentiva a prática de atividade física em praças com treinos guiados e acompanhamento de indicadores de saúde da comunidade.',
    memberNames: ['Lara Dias', 'Igor Melo', 'Caio Souza'],
  },
];

const slug = (name: string) =>
  name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, '.');

// Desclassificações aplicadas na sessão (team_id → motivo).
let disqualified = new Map<number, string>();

export function resetAdminTeamsMock() {
  disqualified = new Map();
}

const situationOf = (seed: Seed): AdminTeamSituation =>
  disqualified.has(seed.id) ? 'DISQUALIFIED' : seed.situation;

export function buildAdminTeams(): AdminTeamListItem[] {
  return SEEDS.map((seed) => ({
    id: seed.id,
    edition_id: EDITION_ID,
    name: seed.name,
    code: seed.code,
    status: disqualified.has(seed.id) ? 'DISQUALIFIED' : 'ACTIVE',
    qualification: null,
    member_count: seed.members,
    project: { id: seed.id, title: seed.project },
    course: seed.course,
    situation: situationOf(seed),
  }));
}

function buildMembers(seed: Seed): AdminTeamMember[] {
  return seed.memberNames.slice(0, seed.members).map((name, index) => ({
    name,
    email: `${slug(name)}@aluno.unicatolica.edu.br`,
    role: index === 0 ? 'LEADER' : 'MEMBER',
    course: seed.course,
  }));
}

function buildDeliverables(seed: Seed): AdminTeamDelivery[] {
  const received = seed.situation === 'VALIDATED';
  return [
    {
      stage: 'Ideação',
      resource: `Resumo-${seed.name}.pdf`,
      submitted_at: received ? '19/03/2027 · 17:40' : null,
      situation: received ? 'Recebida' : 'Aguardando etapa',
      action_label: received ? 'Baixar PDF' : 'Consultar prazo',
      href: received ? '#' : null,
    },
    {
      stage: 'Desenvolvimento',
      resource: `Prototipo-${seed.name}.pdf`,
      submitted_at: received ? '30/04/2027 · 16:12' : null,
      situation: received ? 'Recebida' : 'Aguardando etapa',
      action_label: received ? 'Baixar PDF' : 'Consultar prazo',
      href: received ? '#' : null,
    },
    {
      stage: 'Entrega',
      resource: `Relatorio-final-${seed.name}.pdf`,
      submitted_at: received ? '14/05/2027 · 15:08' : null,
      situation: received ? 'Recebida' : 'Aguardando etapa',
      action_label: received ? 'Baixar PDF' : 'Consultar prazo',
      href: received ? '#' : null,
    },
    {
      stage: 'Apresentação',
      resource: 'Apresentação prevista para 18/06',
      submitted_at: null,
      situation: 'Aguardando etapa',
      action_label: 'Consultar prazo',
      href: null,
    },
  ];
}

export function buildAdminTeamDetail(id: number): AdminTeamDetail | null {
  const seed = SEEDS.find((item) => item.id === id);
  if (!seed) return null;
  const situation = situationOf(seed);
  return {
    id: seed.id,
    name: seed.name,
    code: seed.code,
    project: { id: seed.id, title: seed.project, category: seed.category },
    situation,
    description: seed.description,
    course: seed.course,
    advisor: seed.advisor,
    sdg: seed.sdg,
    challenge: seed.challenge,
    member_count: seed.members,
    members: buildMembers(seed),
    deliverables: buildDeliverables(seed),
    validated_at: seed.situation === 'VALIDATED' ? '19/03/2027' : null,
    flow_note:
      situation === 'DISQUALIFIED'
        ? `Equipe desclassificada. Motivo: ${disqualified.get(seed.id)}`
        : 'Inscrição validada em 19/03/2027. Qualquer intervenção administrativa exige justificativa e fica registrada na auditoria.',
  };
}

export type DisqualifyResult =
  { ok: true } | { ok: false; status: 404 | 409; code: string; message: string };

export function disqualifyAdminTeam(id: number, reason: string): DisqualifyResult {
  const seed = SEEDS.find((item) => item.id === id);
  if (!seed)
    return { ok: false, status: 404, code: 'not_found', message: 'Equipe não encontrada.' };
  if (disqualified.has(id)) {
    return {
      ok: false,
      status: 409,
      code: 'team_already_disqualified',
      message: 'A equipe já está desclassificada.',
    };
  }
  disqualified.set(id, reason);
  return { ok: true };
}
