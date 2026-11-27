import type {
  AdminCourse,
  AdminEdition,
  AdminTeam,
  EditionEvaluator,
  ExternalEvaluator,
  InvitationStatus,
  Regulation,
} from '@/features/admin';
import { PUBLISHED_EDITION_ID, SETUP_EDITION_ID } from './evaluation-setup';

/**
 * Editais e avaliadores externos (task #24), com os dados do Figma (04 - Administrador ›
 * Editais e Avaliadores). Formatos reais: EditionEvaluator, ExternalEvaluatorAdmin,
 * AdminTeamListItem e Course; editais, convite e atribuições seguem a proposta em
 * docs/api/propostas/editais-e-avaliadores.md.
 */

const ADMIN = { id: 1, name: 'Coordenação do Desafio X' };

const ref = (edition: AdminEdition) => ({
  id: edition.id,
  year: edition.year,
  semester: edition.semester,
  name: edition.name,
  status: edition.status,
});

/** PDF mínimo válido, servido em GET /api/admin/regulations/{id}/file. */
export const SAMPLE_PDF = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length 90>>stream
BT /F1 18 Tf 72 760 Td (Edital de participacao - Desafio X) Tj 0 -28 Td /F1 11 Tf (Documento de exemplo) Tj ET
endstream endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
trailer<</Root 1 0 R>>
%%EOF`;

export function buildRegulations(editions: AdminEdition[]): Regulation[] {
  const byId = (id: number) => ref(editions.find((item) => item.id === id)!);
  const base = {
    title: 'Edital de participação',
    description:
      'Regras de inscrição, formação de equipes, etapas e critérios de avaliação do Desafio X, destinadas a estudantes e professores orientadores.',
  };
  return [
    {
      ...base,
      id: 701,
      edition: byId(SETUP_EDITION_ID),
      title: 'Edital de participação Desafio X 2027',
      version: 1,
      status: 'DRAFT',
      file: {
        name: 'edital-desafio-x-2027-v1.pdf',
        size_bytes: 1_258_291,
        url: '/api/admin/regulations/701/file',
      },
      created_at: '2026-11-10T13:00:00Z',
      updated_at: '2026-11-18T14:30:00Z',
      published_at: null,
      published_by: null,
    },
    {
      ...base,
      id: 302,
      edition: byId(PUBLISHED_EDITION_ID),
      title: 'Edital de participação Desafio X 2026',
      version: 2,
      status: 'PUBLISHED',
      file: {
        name: 'edital-desafio-x-2026-v2.pdf',
        size_bytes: 1_468_006,
        url: '/api/admin/regulations/302/file',
      },
      created_at: '2026-02-20T13:00:00Z',
      updated_at: '2026-03-02T12:00:00Z',
      published_at: '2026-03-02T12:00:00Z',
      published_by: ADMIN,
    },
    {
      ...base,
      id: 301,
      edition: byId(PUBLISHED_EDITION_ID),
      title: 'Edital de participação Desafio X 2026',
      version: 1,
      status: 'SUPERSEDED',
      file: {
        name: 'edital-desafio-x-2026-v1.pdf',
        size_bytes: 1_153_434,
        url: '/api/admin/regulations/301/file',
      },
      created_at: '2026-01-15T13:00:00Z',
      updated_at: '2026-02-01T12:00:00Z',
      published_at: '2026-02-01T12:00:00Z',
      published_by: ADMIN,
    },
  ];
}

export const ADMIN_COURSES: AdminCourse[] = [
  { id: 1, name: 'Engenharia de Software', term_count: 8, active: true },
  { id: 2, name: 'Ciência da Computação', term_count: 8, active: true },
  { id: 3, name: 'Sistemas de Informação', term_count: 8, active: true },
  { id: 4, name: 'Design Digital', term_count: 6, active: true },
  { id: 5, name: 'Administração', term_count: 8, active: true },
];

export function buildAdminTeams(): AdminTeam[] {
  const team = (id: number, name: string, code: string, project: string): AdminTeam => ({
    id,
    edition_id: SETUP_EDITION_ID,
    name,
    code,
    status: 'ACTIVE',
    situation: 'REGULAR',
    member_count: 4,
    project: { id: id + 1000, title: project },
  });
  return [
    team(81, 'Conecta', 'CON-27', 'Rede de apoio a cuidadores'),
    team(82, 'Aurora', 'AUR-27', 'Energia solar comunitária'),
    team(83, 'Raízes', 'RAI-27', 'Hortas urbanas nas escolas'),
    team(84, 'Maré', 'MAR-27', 'Monitoramento de enchentes'),
    team(85, 'Trilha', 'TRI-27', 'Mobilidade para o campus'),
  ];
}

interface Person {
  user_id: number;
  name: string;
  email: string;
  institution: string;
  phone: string | null;
  role_title: string | null;
}

const PEOPLE: Person[] = [
  {
    user_id: 501,
    name: 'Ana Ribeiro',
    email: 'ana.ribeiro@saudecoletiva.org',
    institution: 'Instituto Saúde Coletiva',
    phone: '(63) 99901-1001',
    role_title: 'Pesquisadora em saúde coletiva',
  },
  {
    user_id: 502,
    name: 'Bruno Carvalho',
    email: 'bruno@incubadora-to.org',
    institution: 'Incubadora Tocantins',
    phone: null,
    role_title: 'Gestor de inovação',
  },
  {
    user_id: 503,
    name: 'Camila Duarte',
    email: 'camila.duarte@ecoverde.org',
    institution: 'Coletivo EcoVerde',
    phone: null,
    role_title: 'Engenheira ambiental',
  },
  {
    user_id: 504,
    name: 'Diego Martins',
    email: 'diego.martins@techpalmas.com',
    institution: 'TechPalmas',
    phone: '(63) 98822-3344',
    role_title: 'Arquiteto de software',
  },
  {
    user_id: 505,
    name: 'Elisa Nogueira',
    email: 'elisa@designlab.com',
    institution: 'DesignLab Estúdio',
    phone: null,
    role_title: 'Designer de serviços',
  },
  {
    user_id: 506,
    name: 'Fábio Lima',
    email: 'fabio.lima@sebrae-to.org',
    institution: 'Sebrae Tocantins',
    phone: null,
    role_title: 'Consultor de negócios',
  },
  {
    user_id: 507,
    name: 'Giovana Prado',
    email: 'giovana.prado@educa.org',
    institution: 'Rede Educa',
    phone: null,
    role_title: 'Coordenadora pedagógica',
  },
  {
    user_id: 508,
    name: 'Henrique Sales',
    email: 'henrique@prefeitura.to.gov.br',
    institution: 'Secretaria Municipal de Inovação',
    phone: null,
    role_title: 'Analista de políticas públicas',
  },
  // Só no catálogo (para "Vincular avaliador existente").
  {
    user_id: 509,
    name: 'Isabela Torres',
    email: 'isabela.torres@agrotech.com',
    institution: 'AgroTech Cerrado',
    phone: null,
    role_title: 'Pesquisadora em agricultura',
  },
  {
    user_id: 510,
    name: 'João Pedro Alves',
    email: 'joao.alves@fintech.com',
    institution: 'Fintech Norte',
    phone: null,
    role_title: 'Product manager',
  },
];

export const personOf = (userId: number) => PEOPLE.find((person) => person.user_id === userId);

function linked(
  id: number,
  person: Person,
  specialty: string,
  status: InvitationStatus,
  assignments: EditionEvaluator['assignments'] = [],
): EditionEvaluator {
  return {
    id,
    edition_id: SETUP_EDITION_ID,
    evaluator: {
      user_id: person.user_id,
      name: person.name,
      email: person.email,
      institution: person.institution,
      phone: person.phone,
      role_title: person.role_title,
    },
    course: null,
    specialty,
    active: true,
    invitation: {
      status,
      sent_at: '2026-11-04T13:00:00Z',
      responded_at: status === 'PENDING' ? null : '2026-11-08T15:20:00Z',
      sent_by: ADMIN,
    },
    assignments,
    created_at: '2026-11-04T13:00:00Z',
    updated_at: '2026-11-08T15:20:00Z',
  };
}

const assignment = (
  id: number,
  teamId: number,
  team: string,
  project: string,
  stageId: number,
  stage: string,
) => ({
  id,
  team: { id: teamId, name: team },
  project: { id: teamId + 1000, title: project },
  stage: { id: stageId, name: stage },
});

/** Edição 2027: 4 convites aceitos (com atribuições) e 4 pendentes; 2026 sem vínculos. */
export function buildEditionEvaluators(): EditionEvaluator[] {
  const [ana, bruno, camila, diego, elisa, fabio, giovana, henrique] = PEOPLE as [
    Person,
    Person,
    Person,
    Person,
    Person,
    Person,
    Person,
    Person,
  ];
  return [
    linked(601, ana, 'Saúde coletiva', 'ACCEPTED', [
      assignment(1, 81, 'Conecta', 'Rede de apoio a cuidadores', 74, 'Apresentação'),
    ]),
    linked(602, bruno, 'Inovação e empreendedorismo', 'ACCEPTED', [
      assignment(2, 82, 'Aurora', 'Energia solar comunitária', 72, 'Desenvolvimento'),
      assignment(3, 85, 'Trilha', 'Mobilidade para o campus', 72, 'Desenvolvimento'),
    ]),
    linked(603, camila, 'Sustentabilidade e meio ambiente', 'ACCEPTED', [
      assignment(4, 83, 'Raízes', 'Hortas urbanas nas escolas', 73, 'Entrega'),
    ]),
    linked(604, diego, 'Tecnologia e desenvolvimento', 'ACCEPTED', [
      assignment(5, 84, 'Maré', 'Monitoramento de enchentes', 71, 'Ideação'),
    ]),
    linked(605, elisa, 'Design e experiência do usuário', 'PENDING'),
    linked(606, fabio, 'Gestão e negócios', 'PENDING'),
    linked(607, giovana, 'Educação', 'PENDING'),
    linked(608, henrique, 'Políticas públicas', 'PENDING'),
  ];
}

/** Catálogo GET /api/admin/external-evaluators a partir dos vínculos atuais. */
export function buildCatalog(
  links: readonly EditionEvaluator[],
  editions: readonly AdminEdition[],
  extra: readonly Person[] = [],
): ExternalEvaluator[] {
  const people = [...PEOPLE, ...extra.filter((p) => !personOf(p.user_id))];
  return people.map((person) => ({
    user_id: person.user_id,
    name: person.name,
    email: person.email,
    active: true,
    institution: person.institution,
    editions: links
      .filter((item) => item.evaluator.user_id === person.user_id)
      .map((item) => ({
        edition: ref(editions.find((edition) => edition.id === item.edition_id)!),
        course: item.course,
      })),
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-01T12:00:00Z',
  }));
}

export type CatalogPerson = Person;
