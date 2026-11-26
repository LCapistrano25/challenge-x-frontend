/**
 * Integrantes na visão do professor (Figma: 05 - Professor › "Aprovação de Liderança" e
 * "Observações sobre Integrantes"). Formatos de docs/api/openapi.yaml:
 * - GET /api/teacher/leadership-requests (RF40)
 * - POST /api/leadership-requests/{id}/decide (RF28, RF40)
 * - GET /api/teacher/projects (RF37) — usado só para listar as equipes do professor
 * - GET /api/teams/{id}/member-notes (RF39)
 * Os campos de contexto (projeto, curso, etapa, líder atual, anexo, semestre) são PROPOSTA
 * (ver tipos): aparecem aqui para a tela ficar igual ao Figma.
 */
import type { LeadershipRequest, MemberNote, TeacherProjectRow, TeamRef } from '@/features/teams';

const AURORA: TeamRef = { id: 12, name: 'Equipe Aurora', code: 'DXA7K2' };
const NEXO: TeamRef = { id: 21, name: 'Equipe Nexo', code: 'DXN3P9' };
const PONTE: TeamRef = { id: 22, name: 'Equipe Ponte', code: 'DXP5Q1' };

const ES = 'Engenharia de Software';
const SI = 'Sistemas de Informação';
const STAGE = 'Etapa 2 — Proposta e planejamento';

const user = (id: number, name: string) => ({
  user_id: `00000000-0000-4000-8000-0000000003${String(id).padStart(2, '0')}`,
  name,
});

const ANA = user(10, 'Ana Souza');

export const TEACHER_TEAMS: TeamRef[] = [AURORA, NEXO, PONTE];

const projectRow = (
  team: TeamRef,
  projectId: number,
  title: string,
  courseName: string,
): TeacherProjectRow => ({
  project: { id: projectId, title },
  team,
  challenge_course: {
    id: courseName === ES ? 1 : 3,
    name: courseName,
    slug: courseName === ES ? 'ES' : 'SI',
  },
  stage: { id: 7, name: 'Entrega Preliminar', position: 3 },
  deliverable_status: 'NOT_SUBMITTED',
  evaluation_count: 0,
  min_evaluators: 2,
  my_evaluation_status: 'NOT_STARTED',
});

export function buildTeacherProjectRows(): TeacherProjectRow[] {
  return [
    projectRow(AURORA, 40, 'Portal de Extensão', ES),
    projectRow(NEXO, 41, 'Biblioteca Conectada', ES),
    projectRow(PONTE, 42, 'Mapa de Acessibilidade', SI),
  ];
}

const ATTACHMENT = {
  name: 'Mensagem_desligamento.pdf',
  size_label: 'PDF • 240 KB',
  description: 'Comunicação de saída da líder',
};

/** Fila de solicitações de liderança dos cursos do professor (Figma: 3 pendentes). */
export function buildTeacherLeadershipRequests(): LeadershipRequest[] {
  return [
    {
      id: 9,
      team: AURORA,
      requester: user(20, 'Lucas Matos'),
      justification:
        'Ana informou à equipe em 07/10 que trancou a matrícula e não continuará no projeto. A proposta da etapa foi enviada em 06/10, mas precisamos de um responsável para organizar as próximas entregas.\n\nOs integrantes ativos concordaram que eu assuma a liderança. Já acompanho o cronograma e me comprometo a redistribuir as tarefas e manter a comunicação com o docente.',
      status: 'PENDING',
      teacher: null,
      decision_justification: null,
      created_at: '2026-10-08T09:10:00Z',
      decided_at: null,
      project: { id: 40, title: 'Portal de Extensão' },
      course: ES,
      stage_label: STAGE,
      current_leader: ANA,
      reason: 'abandono',
      attachment: ATTACHMENT,
    },
    {
      id: 10,
      team: NEXO,
      requester: user(21, 'João Almeida'),
      justification:
        'A líder saiu da instituição sem transferir a liderança. Assumi a coordenação das entregas e quero formalizar a responsabilidade pela equipe.',
      status: 'PENDING',
      teacher: null,
      decision_justification: null,
      created_at: '2026-10-07T17:45:00Z',
      decided_at: null,
      project: { id: 41, title: 'Biblioteca Conectada' },
      course: ES,
      stage_label: STAGE,
      current_leader: user(23, 'Marina Dias'),
      reason: 'abandono',
      attachment: ATTACHMENT,
    },
    {
      id: 11,
      team: PONTE,
      requester: user(22, 'Camila Rocha'),
      justification:
        'O líder anterior deixou a equipe sem transferir a liderança. Já organizo as reuniões e quero dar continuidade ao projeto.',
      status: 'PENDING',
      teacher: null,
      decision_justification: null,
      created_at: '2026-10-07T11:30:00Z',
      decided_at: null,
      project: { id: 42, title: 'Mapa de Acessibilidade' },
      course: SI,
      stage_label: STAGE,
      current_leader: user(24, 'Rafael Nunes'),
      reason: 'abandono',
      attachment: ATTACHMENT,
    },
  ];
}

const note = (
  id: number,
  member: { user_id: string; name: string },
  summary: string,
  content: string[],
  createdAt: string,
): MemberNote => ({
  id,
  member,
  author: ANA,
  content: content.join('\n'),
  created_at: createdAt,
  team: { id: AURORA.id, name: AURORA.name },
  project: 'Portal de Extensão',
  course: ES,
  semester: '2026.2',
  stage_label: STAGE,
  summary,
  author_role_label: 'Líder à época do registro',
});

/** Observações registradas pela liderança de cada equipe (Figma: 4 registros na Aurora). */
export function buildTeacherMemberNotes(): Record<number, MemberNote[]> {
  return {
    [AURORA.id]: [
      note(
        17,
        user(30, 'Lucas Matos'),
        'Contribuição no planejamento e apoio à equipe.',
        [
          'Lucas organizou o cronograma da etapa e consolidou as contribuições dos colegas. Participou das duas reuniões de planejamento e entregou suas atividades dentro do prazo combinado.',
          '',
          'Também apoiou Rafael na revisão das tarefas pendentes. Recomendo acompanhar a divisão de responsabilidades para evitar que concentre atividades que deveriam ser compartilhadas pela equipe.',
        ],
        '2026-10-05T16:20:00Z',
      ),
      note(
        18,
        user(31, 'Mariana Costa'),
        'Pesquisa concluída e referências organizadas.',
        [
          'Mariana concluiu a pesquisa de referências e organizou o material de apoio da etapa. Comunicação clara e participação ativa nas discussões.',
        ],
        '2026-10-05T15:40:00Z',
      ),
      note(
        19,
        user(32, 'Rafael Lima'),
        'Ausência na reunião; atividades redistribuídas.',
        [
          'Rafael faltou à reunião de planejamento sem aviso prévio e as atividades foram redistribuídas entre a equipe. Retomou as tarefas na semana seguinte.',
        ],
        '2026-10-04T10:10:00Z',
      ),
      note(
        20,
        user(33, 'Beatriz Nunes'),
        'Boa colaboração e revisão dos materiais.',
        [
          'Beatriz revisou os materiais antes do envio e apoiou a comunicação com o docente. Participação consistente ao longo da etapa.',
        ],
        '2026-10-04T09:30:00Z',
      ),
    ],
    [NEXO.id]: [],
    [PONTE.id]: [],
  };
}
