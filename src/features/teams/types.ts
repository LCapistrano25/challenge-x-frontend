import type { CourseSummary, EditionSummary, SdgSummary, StageSchedule } from '@/shared/types/api';

/**
 * Tipos do domínio de equipes, espelhando docs/api/openapi.yaml (snake_case).
 * StudentDashboard é PROPOSTO (P-23): confirme com o back-end antes de depender de campos novos.
 */

export type MemberRole = 'LEADER' | 'MEMBER';
export type TeamStatus = 'ACTIVE' | 'DISQUALIFIED' | 'DISBANDED';
export type TeamQualification = 'QUALIFIED' | 'NOT_QUALIFIED';

/** TeamMember (somente vínculos ativos). */
export interface TeamMember {
  id: number;
  student: {
    user_id: string;
    name: string;
    course: CourseSummary;
  };
  role: MemberRole;
  joined_at: string;
}

/** Team */
export interface Team {
  id: number;
  edition_id: number;
  name: string;
  code: string;
  status: TeamStatus;
  qualification: TeamQualification | null;
  disqualification_reason: string | null;
  formation_extended_until?: string | null;
  members: TeamMember[];
  created_at: string;
  updated_at: string;
  /**
   * PROPOSTA (ainda não está no openapi): apresentação da equipe, a mesma enviada no cadastro
   * (TeamCreate.description). O Figma mostra o texto no cartão de "Minha equipe".
   */
  description?: string | null;
  /**
   * PROPOSTA (ainda não está no openapi): último líder, quando a equipe está sem líder ativo.
   * O Figma mostra "Ana Maria saiu da equipe sem transferir a liderança".
   */
  previous_leader?: { name: string } | null;
}

export type IncompleteRequirement =
  'MIN_MEMBERS' | 'CHALLENGE_NOT_SELECTED' | 'PROJECT_DATA_MISSING';

export type PendingActionKind =
  | 'INVITATION_RECEIVED'
  | 'JOIN_REQUEST_TO_REVIEW'
  | 'PROJECT_DATA_PENDING'
  | 'CHALLENGE_RESELECTION_REQUIRED'
  | 'DELIVERABLE_PENDING';

/** PendingAction */
export interface PendingAction {
  kind: PendingActionKind;
  description: string;
  reference_id: number | null;
}

export type DeliverableStatus = 'NOT_SUBMITTED' | 'SUBMITTED' | 'NOT_DELIVERED';
export type ScoreStatus = 'PENDING' | 'PARTIAL' | 'FINALIZED';

/** DashboardStage */
export interface DashboardStage {
  stage: StageSchedule;
  deliverable_status: DeliverableStatus | null;
  score: { status: ScoreStatus; value: string | null } | null;
}

/** Project (somente os campos usados na home; ver schema Project no openapi). */
export interface DashboardProject {
  id: number;
  title: string;
  summary: string;
  status: string;
  challenge: { id: number; description: string; course: CourseSummary; sdg: SdgSummary } | null;
}

/** StudentDashboard — GET /api/me/dashboard */
export interface StudentDashboard {
  edition: EditionSummary | null;
  team: Team | null;
  is_leader: boolean;
  incomplete_requirements: IncompleteRequirement[];
  project: DashboardProject | null;
  stages: DashboardStage[];
  pending_actions: PendingAction[];
  /**
   * PROPOSTA (ainda não está no openapi): limite de integrantes da edição, hoje só em
   * Edition.max_members (admin). Necessário para o card "Vagas" do Figma.
   */
  max_members?: number | null;
}

/* --- Formação de equipe (task #10): /api/teams, /api/me/join-requests --- */

/**
 * Áreas de interesse da equipe. PROPOSTA (ainda não está no openapi): o Figma pede a área no
 * cadastro e no filtro de "Equipes com vagas", mas TeamCreate/TeamListing não têm esse campo.
 * Os códigos seguem o padrão de enum da API (MAIÚSCULAS); confirme a lista com o back-end.
 */
export type InterestArea =
  'TECHNOLOGY' | 'HEALTH' | 'EDUCATION' | 'ENVIRONMENT' | 'SOCIAL' | 'BUSINESS';

/** TeamRef */
export interface TeamRef {
  id: number;
  name: string;
  code: string;
}

/** TeamCreate — POST /api/teams */
export interface TeamCreate {
  /** Contrato: maxLength 150. O Figma limita a 60 caracteres na tela. */
  name: string;
  /** Convites iniciais exigidos na criação da equipe (entre min_members - 1 e max_members - 1). */
  invitations: InvitationCreate[];
  /** PROPOSTA: área de interesse da equipe. */
  interest_area?: InterestArea;
  /** PROPOSTA: apresentação da equipe (até 300 caracteres). */
  description?: string;
}

/** TeamListing — item de GET /api/teams (equipes com vagas). */
export interface TeamListing {
  id: number;
  name: string;
  code: string;
  member_count: number;
  available_slots: number;
  courses: CourseSummary[];
  /** PROPOSTA: apresentação exibida no cartão ("Soluções digitais para…"). */
  description?: string | null;
  /** PROPOSTA: área de interesse, usada no filtro. */
  interest_area?: InterestArea | null;
  /** PROPOSTA: líder exibido no cartão (nome e curso). */
  leader?: { name: string; course: CourseSummary } | null;
}

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

/** JoinRequest — solicitação de entrada em equipe. */
export interface JoinRequest {
  id: number;
  team: TeamRef;
  student: {
    user_id: string;
    name: string;
    course: CourseSummary;
  };
  status: RequestStatus;
  created_at: string;
  responded_at: string | null;
  /** PROPOSTA (ainda não está no openapi): mensagem do aluno ao solicitar entrada. */
  message?: string | null;
}

/** Parâmetros de GET /api/teams (Search, Page, PageSize). */
export interface AvailableTeamsParams {
  search?: string;
  /** PROPOSTA: filtro por área de interesse (ainda não é parâmetro do openapi). */
  interest_area?: InterestArea;
  page?: number;
  page_size?: number;
}

/* --- Minha equipe (task #11): convites, solicitações, liderança e saída --- */

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';

/** UserSummary */
export interface UserSummary {
  user_id: string;
  name: string;
}

/** InvitationCreate — informe exatamente um entre student_id e email institucional. */
export type InvitationCreate = { student_id: string } | { email: string };

/** Invitation — convite enviado pela equipe. */
export interface Invitation {
  id: number;
  team: TeamRef;
  student: UserSummary;
  invited_email: string | null;
  status: InvitationStatus;
  created_at: string;
  responded_at: string | null;
  /**
   * PROPOSTA (GET /api/me/invitations): quem convidou e um resumo da equipe, para o aluno
   * decidir na Home ("Marina Rocha · Convidou você · Agronomia e tecnologia", "2 vagas").
   * Hoje o Invitation só traz o TeamRef.
   */
  invited_by?: { name: string; course?: CourseSummary | null } | null;
  team_courses?: CourseSummary[];
  available_slots?: number | null;
  /** PROPOSTA: fim da validade do convite (convites PENDING expiram com a formação). */
  expires_at?: string | null;
}

/** InvitationResponse — POST /api/invitations/{id}/respond */
export interface InvitationResponse {
  status: 'ACCEPTED' | 'DECLINED';
}

/** JoinRequestDecision — POST /api/join-requests/{id}/respond */
export interface JoinRequestDecision {
  status: 'APPROVED' | 'REJECTED';
}

/** LeadershipRequest — pedido para assumir a liderança de equipe sem líder (RF28). */
export interface LeadershipRequest {
  id: number;
  team: TeamRef;
  requester: UserSummary;
  justification: string;
  status: RequestStatus;
  teacher: UserSummary | null;
  decision_justification: string | null;
  created_at: string;
  decided_at: string | null;
  /**
   * PROPOSTA (ainda não está no openapi): contexto exibido no Figma "Aprovação de Liderança"
   * (projeto, curso, etapa, líder atual, motivo e o anexo de comunicação de saída). Confirmar
   * com o back-end antes de depender destes campos.
   */
  project?: { id: number; title: string } | null;
  course?: string | null;
  stage_label?: string | null;
  current_leader?: UserSummary | null;
  reason?: string | null;
  attachment?: { name: string; size_label: string; description: string } | null;
}

/** LeadershipDecision — POST /api/leadership-requests/{id}/decide (RF28, RF40). */
export interface LeadershipDecision {
  status: 'APPROVED' | 'REJECTED';
  decision_justification: string;
}

/**
 * MemberNote — observação registrada pelo líder sobre um integrante (RF33). O conteúdo só é
 * consultável por professor do curso e admin (RF39, GET /api/teams/{id}/member-notes).
 */
export interface MemberNote {
  id: number;
  member: UserSummary;
  author: UserSummary;
  content: string;
  created_at: string;
  /**
   * PROPOSTA (ainda não está no openapi): contexto exibido no Figma "Observações sobre
   * Integrantes" (equipe, projeto, curso, semestre, etapa, resumo e o papel do autor à época).
   */
  team?: { id: number; name: string } | null;
  project?: string | null;
  course?: string | null;
  semester?: string | null;
  stage_label?: string | null;
  summary?: string | null;
  author_role_label?: string | null;
}

/**
 * TeacherProjectRow — linha do acompanhamento do professor (RF37,
 * GET /api/teacher/projects). Aqui só usamos a equipe e o curso para listar as equipes dos
 * cursos vinculados; os demais campos seguem o contrato para uso futuro.
 */
export interface TeacherProjectRow {
  project: { id: number; title: string };
  team: TeamRef;
  challenge_course: { id: number; name: string; slug: string };
  stage: { id: number; name: string; position: number } | null;
  deliverable_status: DeliverableStatus | null;
  evaluation_count: number;
  min_evaluators: number;
  my_evaluation_status: string;
}

/**
 * PROPOSTA (ainda não está no openapi): PATCH /api/teams/{team_id} para o líder editar o nome
 * e a apresentação ("Editar informações" no Figma).
 */
export interface TeamUpdate {
  name?: string;
  description?: string;
}
