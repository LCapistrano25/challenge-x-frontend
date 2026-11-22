/**
 * Cadastro do projeto simulado (task #12), no formato de docs/api/openapi.yaml. Desafios dos
 * cursos da Equipe Aurora (Engenharia de Software e Agronomia) e categorias da edição.
 * Não são contrato: servem ao desenvolvimento e aos testes.
 */
import type { EligibleChallenge, Project, ProjectOptions, ProjectWrite } from '@/features/projects';
import type { Team } from '@/features/teams';
import type { CourseSummary } from '@/shared/types/api';

const ES: CourseSummary = { id: 1, name: 'Engenharia de Software' };
const AGRO: CourseSummary = { id: 2, name: 'Agronomia' };

const challenges: EligibleChallenge[] = [
  {
    id: 15,
    description:
      'Propor uma solução para reduzir o desperdício de água nas instalações da universidade.',
    course: ES,
    sdg: { id: 6, number: 6, title: 'Água potável e saneamento' },
  },
  {
    id: 16,
    description: 'Criar serviços digitais que aproximem a universidade da comunidade do entorno.',
    course: ES,
    sdg: { id: 9, number: 9, title: 'Indústria, inovação e infraestrutura' },
  },
  {
    id: 17,
    description: 'Ampliar o acesso dos pequenos produtores aos consumidores da região.',
    course: AGRO,
    sdg: { id: 11, number: 11, title: 'Cidades sustentáveis' },
  },
  {
    id: 18,
    description: 'Apoiar práticas de cultivo que aumentem a produtividade com menor impacto.',
    course: AGRO,
    sdg: { id: 2, number: 2, title: 'Fome zero e agricultura sustentável' },
  },
];

export function buildProjectOptions(): ProjectOptions {
  return {
    challenges,
    categories: [
      { id: 1, name: 'Tecnologia e sustentabilidade', description: null },
      { id: 2, name: 'Protótipos e artefatos', description: 'Categoria A do Art. 2.' },
      { id: 3, name: 'Inovação social', description: null },
      { id: 4, name: 'Educação e inclusão', description: null },
    ],
  };
}

/** Títulos já usados por outras equipes da edição (409 project_title_taken). */
export const TAKEN_PROJECT_TITLES = ['Monitoramento inteligente do consumo de água'];

/** Projeto que a API devolveria ao cadastrar pelos 3 passos. */
export function buildProject(team: Team, input: ProjectWrite, id: number): Project {
  const options = buildProjectOptions();
  const challenge = options.challenges.find((item) => item.id === input.challenge_id) ?? null;
  const category = options.categories.find((item) => item.id === input.category_id) ?? null;
  const courses = [
    ...new Map(team.members.map((m) => [m.student.course.id, m.student.course])).values(),
  ];
  const now = new Date().toISOString();
  return {
    id,
    team_id: team.id,
    edition_id: team.edition_id,
    challenge,
    category: category ? { id: category.id, name: category.name } : null,
    title: input.title,
    summary: input.summary,
    objective: input.objective ?? '',
    status: 'IN_PROGRESS',
    courses,
    created_at: now,
    updated_at: now,
  };
}
