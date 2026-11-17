/**
 * Projeto da equipe e entregas por etapa simulados (task #13), no formato de
 * docs/api/openapi.yaml. Campos marcados como PROPOSTA nos tipos (description, guidance, review,
 * updated_by) aparecem aqui para a tela ficar igual ao Figma; não são contrato aprovado.
 * As datas são relativas a "agora" (horário de Brasília) para os status fazerem sentido em
 * qualquer dia.
 */
import type {
  DeliverableField,
  DeliverableVersion,
  Project,
  StageDeliverable,
} from '@/features/projects';
import type { Team, TeamMember } from '@/features/teams';
import type { CourseSummary, StageSchedule } from '@/shared/types/api';

const ES: CourseSummary = { id: 1, name: 'Engenharia de Software', slug: 'ES' };
const AGRO: CourseSummary = { id: 2, name: 'Agronomia', slug: 'AGRO' };

/** Dia relativo a hoje, no horário de Brasília (UTC−3). */
function brasilia(days: number, hour: number, minute: number) {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + days, hour + 3, minute),
  ).toISOString();
}

/* --- Equipe "Conexão Verde" com projeto cadastrado (logins lider.projeto e integrante.projeto) --- */

export const PROJECT_TEAM_ID = 14;
export const PROJECT_LEADER_MEMBER_ID = 401;
export const PROJECT_MEMBER_ID = 402;
export const SEEDED_PROJECT_ID = 70;

const member = (
  id: number,
  name: string,
  course: CourseSummary,
  role: TeamMember['role'] = 'MEMBER',
): TeamMember => ({
  id,
  student: { user_id: `00000000-0000-4000-8000-000000000${id}`, name, course },
  role,
  joined_at: '2026-10-22T16:00:00Z',
});

export function buildProjectTeam(): Team {
  return {
    id: PROJECT_TEAM_ID,
    edition_id: 3,
    name: 'Conexão Verde',
    code: 'DX-2027-018',
    status: 'ACTIVE',
    qualification: null,
    disqualification_reason: null,
    description: 'Tecnologia e agronomia para fortalecer a agricultura familiar da região.',
    members: [
      member(PROJECT_LEADER_MEMBER_ID, 'Ana Maria', ES, 'LEADER'),
      member(PROJECT_MEMBER_ID, 'João Silva', ES),
      member(403, 'José Ferreira', AGRO),
      member(404, 'José Pereira', AGRO),
    ],
    created_at: '2026-10-22T16:00:00Z',
    updated_at: '2026-10-22T16:00:00Z',
  };
}

export function buildSeededProject(): Project {
  const team = buildProjectTeam();
  const leader = team.members[0]!.student;
  return {
    id: SEEDED_PROJECT_ID,
    team_id: PROJECT_TEAM_ID,
    edition_id: 3,
    challenge: {
      id: 17,
      title: 'Comércio local e agricultura familiar',
      course: AGRO,
      sdg: { id: 11, number: 11, title: 'Cidades sustentáveis' },
    },
    category: { id: 1, name: 'Tecnologia e sustentabilidade' },
    title: 'AgroConecta — da horta à comunidade',
    summary:
      'Conectamos agricultores familiares à comunidade acadêmica por meio de uma plataforma de comércio local.',
    objective: 'Ampliar a renda dos produtores e o acesso a alimentos frescos no campus.',
    status: 'IN_PROGRESS',
    courses: [ES, AGRO],
    problem: 'Pequenos produtores têm pouco acesso ao público universitário.',
    methodology: 'Pesquisa com produtores, protótipo navegável e piloto na feira do campus.',
    target_audience: 'Agricultores familiares e comunidade acadêmica',
    location: 'Campus sede',
    advisor_name: 'Profa. Carla Mendes',
    advisor_email: 'carla.mendes@universidade.edu.br',
    reference_url: null,
    created_at: brasilia(-40, 10, 0),
    updated_at: brasilia(-3, 15, 10),
    updated_by: { user_id: leader.user_id, name: leader.name },
  };
}

/* --- Etapas com entrega --- */

const stage = (
  id: number,
  position: number,
  name: string,
  startDays: number,
  endDays: number,
): StageSchedule => {
  const starts_at = brasilia(startDays, 0, 0);
  const ends_at = brasilia(endDays, 23, 59);
  const now = Date.now();
  return {
    id,
    position,
    name,
    type: 'EVALUATION',
    starts_at,
    ends_at,
    scored: true,
    points_value: '2.50',
    phase_status:
      now < new Date(starts_at).getTime()
        ? 'UPCOMING'
        : now > new Date(ends_at).getTime()
          ? 'FINISHED'
          : 'OPEN',
  };
};

const pdf = (id: number, label = 'Material da entrega'): DeliverableField => ({
  id,
  type: 'FILE',
  label,
  required: true,
  formats: 'pdf',
  max_size_mb: 20,
});

const link = (id: number, label: string): DeliverableField => ({
  id,
  type: 'LINK',
  label,
  required: true,
  formats: null,
  max_size_mb: null,
});

const version = (
  id: number,
  number: number,
  sender: TeamMember,
  submittedAt: string,
  fieldId: number,
  fileName: string,
  sizeBytes: number,
): DeliverableVersion => ({
  id,
  version_number: number,
  submitted_by: { user_id: sender.student.user_id, name: sender.student.name },
  submitted_at: submittedAt,
  notes: null,
  items: [
    {
      id: id * 10,
      field_id: fieldId,
      type: 'FILE',
      link: null,
      file_url: null,
      file_name: fileName,
      size_bytes: sizeBytes,
    },
  ],
  receipt: { verification_code: `DX-2027-${id}`, file_url: null, generated_at: submittedAt },
});

const MB = 1024 * 1024;

/**
 * Entregas do projeto. Com `seeded`, reproduz o Figma: Pesquisa aprovada, Proposta com ajustes
 * solicitados, Protótipo em andamento e Apresentação final em breve. Sem, todas sem envio.
 */
export function buildDeliverables({ seeded = false } = {}): StageDeliverable[] {
  const team = buildProjectTeam();
  const [ana, joao] = team.members as [TeamMember, TeamMember];

  const research = stage(21, 1, 'Pesquisa e diagnóstico', -60, -32);
  const proposal = stage(22, 2, 'Proposta de solução', -31, -2);
  const prototype = stage(23, 3, 'Protótipo e validação', -1, 25);
  const final = stage(24, 4, 'Apresentação final', 26, 35);

  const researchVersion = version(
    501,
    1,
    ana,
    brasilia(-33, 16, 42),
    211,
    'diagnostico_agroconecta_v1.pdf',
    2.4 * MB,
  );
  const proposalV2 = version(
    512,
    2,
    joao,
    brasilia(-4, 14, 20),
    221,
    'proposta_agroconecta_v2.pdf',
    1.8 * MB,
  );
  const proposalV1 = version(
    511,
    1,
    ana,
    brasilia(-10, 9, 5),
    221,
    'proposta_agroconecta_v1.pdf',
    1.6 * MB,
  );

  return [
    {
      stage: research,
      fields: [pdf(211, 'Relatório de diagnóstico')],
      status: seeded ? 'SUBMITTED' : 'NOT_DELIVERED',
      official_version_id: seeded ? researchVersion.id : null,
      versions: seeded ? [researchVersion] : [],
      description: 'Relatório do problema, público e evidências iniciais.',
      guidance:
        'Descreva o problema, o público afetado e as evidências levantadas em campo, com as fontes consultadas.',
      review: seeded
        ? {
            status: 'APPROVED',
            version_id: researchVersion.id,
            comment: 'Diagnóstico consistente e bem fundamentado.',
            resubmission_deadline: null,
            reviewed_at: brasilia(-30, 11, 0),
          }
        : null,
    },
    {
      stage: proposal,
      fields: [pdf(221, 'Documento da proposta')],
      status: seeded ? 'SUBMITTED' : 'NOT_DELIVERED',
      official_version_id: null,
      versions: seeded ? [proposalV2, proposalV1] : [],
      description: 'Escopo, requisitos e plano de desenvolvimento.',
      guidance:
        'Apresente o escopo da solução, os requisitos principais e o plano de desenvolvimento por etapa.',
      review: seeded
        ? {
            status: 'CHANGES_REQUESTED',
            version_id: proposalV2.id,
            comment: 'detalhar os indicadores de impacto.',
            resubmission_deadline: brasilia(3, 23, 59),
            reviewed_at: brasilia(-1, 10, 0),
          }
        : null,
    },
    {
      stage: prototype,
      fields: [{ ...pdf(231), formats: 'pdf,zip' }, link(232, 'Link do protótipo')],
      status: 'NOT_SUBMITTED',
      official_version_id: null,
      versions: [],
      description: 'Protótipo navegável e resultados dos testes com usuários.',
      guidance:
        'Apresente o protótipo navegável e os resultados dos testes com usuários. Inclua o link do protótipo e mantenha o acesso liberado para avaliação.',
      review: null,
    },
    {
      stage: final,
      fields: [pdf(241, 'Documentação final'), link(242, 'Link do vídeo')],
      status: 'NOT_SUBMITTED',
      official_version_id: null,
      versions: [],
      description: 'Pitch, resultados do piloto e documentação final.',
      guidance: 'Envie a documentação final em PDF e o link do vídeo do pitch.',
      review: null,
    },
  ];
}
