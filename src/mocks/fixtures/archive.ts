/**
 * Acervo histórico e galeria de vencedores (RF35/RF46). Formatos de docs/api/openapi.yaml:
 * - GET /api/public/editions                      → edições encerradas (PublicEditionListItem)
 * - GET /api/public/editions/{id}/winners         → pódio (Winner[])
 * - GET /api/public/projects?edition_id=...        → projetos antigos da edição
 * - GET /api/public/projects/{id}                  → detalhe compartilhado
 * Dados ilustrativos (edições passadas não existem no mock da edição vigente).
 */
import type {
  PublicEditionListItem,
  PublicProject,
  PublicProjectDetail,
  Winner,
} from '@/features/public-panel';
import type { CourseSummary, EditionSummary } from '@/shared/types/api';
import { buildProjectCanvas } from './academic-home';

const ES: CourseSummary = { id: 1, name: 'Engenharia de Software' };
const SI: CourseSummary = { id: 3, name: 'Sistemas de Informação' };
const PSI: CourseSummary = { id: 4, name: 'Psicologia' };
const AGRO: CourseSummary = { id: 2, name: 'Agronomia' };

const CAT_PROTO = { id: 2, name: 'Protótipos e Artefatos' };
const CAT_PESQ = { id: 1, name: 'Pesquisa Aplicada' };
const CAT_SOCIAL = { id: 5, name: 'Impacto Social' };

const ED_2025_2: EditionSummary = {
  id: 12,
  year: 2025,
  semester: 2,
  name: 'Desafio X 2025/2',
  status: 'CLOSED',
};
const ED_2025_1: EditionSummary = {
  id: 11,
  year: 2025,
  semester: 1,
  name: 'Desafio X 2025/1',
  status: 'CLOSED',
};
const ED_2024_2: EditionSummary = {
  id: 10,
  year: 2024,
  semester: 2,
  name: 'Desafio X 2024/2',
  status: 'CLOSED',
};

const SUMMARY =
  'Solução acadêmica que conecta a comunidade a demandas reais da região, com impacto social mensurável.';

type Seed = {
  id: number;
  title: string;
  sdg: [number, string];
  course: CourseSummary;
  category: { id: number; name: string };
  members: string[];
};

const project = (edition: EditionSummary, seed: Seed): PublicProject => ({
  id: seed.id,
  edition,
  title: seed.title,
  summary: SUMMARY,
  course: seed.course,
  sdg: { id: seed.sdg[0], number: seed.sdg[0], title: seed.sdg[1] },
  category: seed.category,
  members: seed.members.map((name) => ({ name })),
});

const EDITIONS_SEEDS: { edition: EditionSummary; closed_at: string; seeds: Seed[] }[] = [
  {
    edition: ED_2025_2,
    closed_at: '2026-01-20T18:00:00Z',
    seeds: [
      {
        id: 600,
        title: 'EcoRota Universitária',
        sdg: [11, 'Cidades e Comunidades Sustentáveis'],
        course: ES,
        category: CAT_PROTO,
        members: ['Marina Alves', 'Rafael Dias', 'Camila Nunes', 'Pedro Rocha'],
      },
      {
        id: 601,
        title: 'Saúde em Rede',
        sdg: [3, 'Saúde e Bem-estar'],
        course: PSI,
        category: CAT_SOCIAL,
        members: ['Helena Prado', 'Tiago Melo', 'Laura Castro'],
      },
      {
        id: 602,
        title: 'AgroSensor',
        sdg: [2, 'Fome Zero e Agricultura Sustentável'],
        course: AGRO,
        category: CAT_PESQ,
        members: ['Bruno Lima', 'Sofia Reis', 'Igor Alves'],
      },
      {
        id: 603,
        title: 'Biblioteca Viva',
        sdg: [4, 'Educação de Qualidade'],
        course: SI,
        category: CAT_SOCIAL,
        members: ['Ana Costa', 'Diego Melo', 'Vera Pires'],
      },
    ],
  },
  {
    edition: ED_2025_1,
    closed_at: '2025-07-15T18:00:00Z',
    seeds: [
      {
        id: 604,
        title: 'Mobilidade Acessível',
        sdg: [10, 'Redução das Desigualdades'],
        course: ES,
        category: CAT_PROTO,
        members: ['Lucas Matos', 'Bia Santos', 'Caio Rocha', 'Lia Nunes'],
      },
      {
        id: 605,
        title: 'Água Inteligente',
        sdg: [6, 'Água Potável e Saneamento'],
        course: AGRO,
        category: CAT_PESQ,
        members: ['Giovana Gomes', 'Matheus Sales', 'Rita Lopes'],
      },
      {
        id: 606,
        title: 'Mente em Foco',
        sdg: [3, 'Saúde e Bem-estar'],
        course: PSI,
        category: CAT_SOCIAL,
        members: ['Felipe Soares', 'Bruna Alves', 'Noa Dias'],
      },
      {
        id: 607,
        title: 'Transparência Já',
        sdg: [16, 'Paz, Justiça e Instituições Eficazes'],
        course: SI,
        category: CAT_PESQ,
        members: ['Marcos Silva', 'Flávia Santos', 'Edu Rocha'],
      },
    ],
  },
  {
    edition: ED_2024_2,
    closed_at: '2025-01-18T18:00:00Z',
    seeds: [
      {
        id: 608,
        title: 'Energia na Escola',
        sdg: [7, 'Energia Limpa e Acessível'],
        course: ES,
        category: CAT_PROTO,
        members: ['Lara Dias', 'Igor Melo', 'Caio Souza'],
      },
      {
        id: 609,
        title: 'Reciclagem Conectada',
        sdg: [12, 'Consumo e Produção Responsáveis'],
        course: SI,
        category: CAT_SOCIAL,
        members: ['Paula Reis', 'Hugo Alves', 'Gal Costa'],
      },
      {
        id: 610,
        title: 'Horta Comunitária',
        sdg: [2, 'Fome Zero e Agricultura Sustentável'],
        course: AGRO,
        category: CAT_PESQ,
        members: ['Vera Lima', 'Noah Pires', 'Beatriz Nunes'],
      },
      {
        id: 611,
        title: 'Escuta Ativa',
        sdg: [3, 'Saúde e Bem-estar'],
        course: PSI,
        category: CAT_SOCIAL,
        members: ['Ana Maria', 'João Silva', 'José Ferreira'],
      },
    ],
  },
];

const ALL_PROJECTS: PublicProject[] = EDITIONS_SEEDS.flatMap(({ edition, seeds }) =>
  seeds.map((seed) => project(edition, seed)),
);

/** GET /api/public/editions — edições encerradas, da mais recente para a mais antiga. */
export function buildClosedEditions(): PublicEditionListItem[] {
  return EDITIONS_SEEDS.map(({ edition, closed_at }) => ({ edition, closed_at }));
}

export const ARCHIVE_EDITION_IDS = EDITIONS_SEEDS.map(({ edition }) => edition.id);

/** Projetos de uma edição encerrada (ou todos, quando editionId é omitido). */
export function buildArchiveProjects(editionId?: number): PublicProject[] {
  return editionId == null
    ? ALL_PROJECTS
    : ALL_PROJECTS.filter((project) => project.edition.id === editionId);
}

/** GET /api/public/editions/{id}/winners — pódio 1º/2º/3º da edição. */
export function buildEditionWinners(editionId: number): Winner[] {
  const projects = buildArchiveProjects(editionId);
  if (projects.length === 0) return [];
  return projects.slice(0, 3).map((project, index) => ({
    award_place: (index + 1) as 1 | 2 | 3,
    course: project.course,
    category: project.category ?? CAT_PROTO,
    project,
  }));
}

/** Detalhe compartilhado de um projeto do acervo (/projetos/:id). */
export function buildArchiveProjectDetail(id: number): PublicProjectDetail | null {
  const base = ALL_PROJECTS.find((project) => project.id === id);
  if (!base) return null;
  return {
    ...base,
    about:
      'Projeto desenvolvido em uma edição anterior do Desafio X. A equipe mapeou o problema junto à comunidade, prototipou a solução e validou os resultados em campo.',
    objective:
      'Gerar impacto social mensurável e deixar materiais abertos para que novas turmas evoluam o trabalho.',
    keywords: `${base.sdg.title}, ${base.course.name}`,
    code: `DX-${base.edition.year}-${String(base.id).padStart(3, '0')}`,
    stage_label: 'Edição encerrada',
    advisor: 'Prof.ª Juliana Ribeiro',
    technologies: ['React', 'Node.js', 'PostgreSQL'],
    submitted_at: '2025-11-10T14:00:00',
    canvas: buildProjectCanvas(),
    team: { name: `Equipe ${base.title.split(' ')[0]}` },
    members: base.members.map((member, index) => ({
      name: member.name,
      course: base.course.name,
      role: index === 0 ? 'LEADER' : 'MEMBER',
    })),
    deliverables: [
      { id: 1, label: 'Relatório final.pdf', type: 'FILE', href: '#', meta: 'PDF · 2,1 MB' },
      { id: 2, label: 'Apresentação.pdf', type: 'FILE', href: '#', meta: 'PDF · 3,4 MB' },
    ],
  };
}
