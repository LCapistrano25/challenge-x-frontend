/**
 * Painel administrativo (Figma: 04 - Administrador › "Painel Administrativo"). RF20, PROPOSTO:
 * GET /api/admin/overview ainda não está no openapi — dados ilustrativos para a tela.
 */
import type { AdminOverview } from '@/features/admin';

export function buildAdminOverview(): AdminOverview {
  return {
    edition: { id: 4, label: 'Desafio X • 2027', status_label: 'Em configuração' },
    editions: [
      { id: 4, label: 'Desafio X • 2027' },
      { id: 3, label: 'Desafio X • 2026/1' },
    ],
    admin_name: 'Administrador',
    today: '2026-10-13',
    metrics: [
      {
        key: 'projects',
        label: 'Total de projetos',
        value: 32,
        caption: 'Pré-cadastrados para 2027',
      },
      { key: 'teams', label: 'Total de equipes', value: 32, caption: '128 acadêmicos vinculados' },
      {
        key: 'courses',
        label: 'Cursos participantes',
        value: 8,
        caption: 'Todos com professor responsável',
      },
      { key: 'stages', label: 'Etapas de avaliação', value: 4, caption: '10 pontos no total' },
    ],
    quick_actions: [
      { label: 'Criar edição', to: '/admin/etapas', primary: true },
      { label: 'Cadastrar curso', to: '/admin/cursos-professores' },
      { label: 'Cadastrar desafio', to: '/admin/ods-desafios' },
      { label: 'Configurar etapas', to: '/admin/etapas' },
      { label: 'Publicar edital', disabled: true },
    ],
    edition_management: {
      title: 'Desafio X 2027',
      phase: 'Planejamento e preparação',
      manage_to: '/admin/etapas',
      progress_percent: 75,
      requirements_done: 9,
      requirements_total: 12,
      timeline: [
        { id: 't1', label: 'Abertura das inscrições', date: '01/03/2027', status: 'upcoming' },
        { id: 't2', label: 'Fim das inscrições', date: '19/03/2027', status: 'upcoming' },
        { id: 't3', label: 'Entrega das etapas', date: '14/05/2027', status: 'upcoming' },
        { id: 't4', label: 'Avaliação técnica', date: '28/05/2027', status: 'upcoming' },
        { id: 't5', label: 'Divulgação dos finalistas', date: '11/06/2027', status: 'upcoming' },
      ],
      points: {
        valid: true,
        total: 10,
        max: 10,
        formula: 'Ideação 2,0 + Desenvolvimento 3,0 + Entrega 3,0 + Apresentação 2,0 = 10,0',
      },
    },
    teams: [
      {
        id: 1,
        name: 'Equipe Aurora',
        project: 'Portal de Extensão',
        course: 'Sistemas de Informação',
        status_label: 'Projeto cadastrado',
      },
      {
        id: 2,
        name: 'Equipe Nexo',
        project: 'Biblioteca Conectada',
        course: 'Engenharia de Software',
        status_label: 'Projeto cadastrado',
      },
      {
        id: 3,
        name: 'Equipe Ponte',
        project: 'Mapa de Acessibilidade',
        course: 'Engenharia de Software',
        status_label: 'Rascunho',
      },
    ],
    pendencias: [
      {
        id: 'p1',
        title: 'Publicar o edital da edição 2027',
        description: 'O edital precisa ser anexado antes da abertura das inscrições.',
        to: '/admin/etapas',
      },
      {
        id: 'p2',
        title: '3 cursos sem professor responsável',
        description: 'Vincule um docente para liberar as equipes desses cursos.',
        to: '/admin/cursos-professores',
      },
      {
        id: 'p3',
        title: 'Critérios da etapa final incompletos',
        description: 'A soma das notas da etapa final ainda não fecha 10 pontos.',
        to: '/admin/criterios-rubricas',
      },
    ],
  };
}
