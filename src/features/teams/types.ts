import type { CourseSummary, EditionSummary, SdgSummary, StageSchedule } from '@/shared/types/api';

/**
 * Tipos do domínio de equipes, espelhando docs/api/openapi.yaml (snake_case).
 * StudentDashboard é PROPOSTO (P-23): confirme com o back-end antes de depender de campos novos.
 */

export type MemberRole = 'LEADER' | 'MEMBER';
export type TeamStatus = 'ACTIVE' | 'DISQUALIFIED';
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
  members: TeamMember[];
  created_at: string;
  updated_at: string;
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
  challenge: { id: number; title: string; course: CourseSummary; sdg: SdgSummary };
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
