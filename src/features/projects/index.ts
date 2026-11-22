export { ProjectDetailPage } from './pages/ProjectDetailPage';
export { ProjectRegistrationPage } from './pages/ProjectRegistrationPage';
export { TeamProjectPage } from './pages/TeamProjectPage';
export { ProjectSummaryCard } from './components/ProjectSummaryCard';
export { StageStatusTag } from './components/StageStatusTag';
export { TeamResponsibleCard } from './components/TeamResponsibleCard';
export { useTeamProject, teamProjectKey } from './hooks/useProjectRegistration';
export { useProjectDeliverables, projectDeliverablesKey } from './hooks/useProjectDeliverables';
export {
  STAGE_STATUS_LABEL,
  STAGE_STATUS_TONE,
  describeFormats,
  describeRequirements,
  formatDateAtTime,
  formatDateBR,
  formatDeadline,
  formatFileSize,
  getStageView,
  parseFormats,
  stagePosition,
} from './lib/deliverables';
export type { StageTone, StageView, StageViewStatus } from './lib/deliverables';
export {
  EDIT_PROJECT_PATH,
  TEAM_PROJECT_PATH,
  deliveryConfirmationPath,
  describeProjectContext,
  describeResponsibles,
  submitDeliveryPath,
} from './lib/team-project';
export type {
  CategoryRef,
  DeliverableField,
  DeliverableFieldType,
  DeliverableItem,
  DeliverableReview,
  DeliverableStatus,
  DeliverableVersion,
  ReceiptSummary,
  StageDeliverable,
  ChallengeSummary,
  EligibleChallenge,
  Project,
  ProjectCategory,
  ProjectDetails,
  ProjectDraft,
  ProjectOptions,
  ProjectStatus,
  ProjectWrite,
} from './types';
