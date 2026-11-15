import type { SelectOption } from '@/shared/ui';
import { getApiError } from '@/shared/lib/api-error';
import type { StageSchedule } from '@/shared/types/api';
import type { InterestArea, TeamCreate, TeamListing } from '../types';
import { daysUntil } from './formation-deadline';

/* --- Regras da formação (task #10) --- */

export const TEAM_NAME_MIN = 3;
export const TEAM_NAME_MAX = 60;
export const TEAM_DESCRIPTION_MAX = 300;
/** Limite padrão de integrantes (Figma: "até 6 estudantes"). O valor real é Edition.max_members. */
export const DEFAULT_MAX_MEMBERS = 6;

const INTEREST_AREA_LABEL: Record<InterestArea, string> = {
  TECHNOLOGY: 'Tecnologia',
  HEALTH: 'Saúde e bem-estar',
  EDUCATION: 'Educação',
  ENVIRONMENT: 'Meio ambiente',
  SOCIAL: 'Impacto social',
  BUSINESS: 'Negócios e empreendedorismo',
};

export const INTEREST_AREA_OPTIONS: SelectOption[] = Object.entries(INTEREST_AREA_LABEL).map(
  ([value, label]) => ({ value, label }),
);

export const isInterestArea = (value: string): value is InterestArea =>
  value in INTEREST_AREA_LABEL;

export const describeInterestArea = (area: InterestArea) => INTEREST_AREA_LABEL[area];

/* --- Criar equipe --- */

export interface CreateTeamValues {
  name: string;
  interestArea: string;
  description: string;
}

export type CreateTeamErrors = Partial<Record<keyof CreateTeamValues, string>>;

export function validateCreateTeam(values: CreateTeamValues): CreateTeamErrors {
  const errors: CreateTeamErrors = {};
  const name = values.name.trim();
  const description = values.description.trim();

  if (!name) errors.name = 'Informe o nome da equipe.';
  else if (name.length < TEAM_NAME_MIN || name.length > TEAM_NAME_MAX)
    errors.name = `O nome deve ter entre ${TEAM_NAME_MIN} e ${TEAM_NAME_MAX} caracteres.`;

  if (!values.interestArea) errors.interestArea = 'Selecione a área de interesse.';
  else if (!isInterestArea(values.interestArea)) errors.interestArea = 'Selecione uma área válida.';

  if (!description) errors.description = 'Escreva a apresentação da equipe.';
  else if (description.length > TEAM_DESCRIPTION_MAX)
    errors.description = `A apresentação deve ter até ${TEAM_DESCRIPTION_MAX} caracteres.`;

  return errors;
}

/** Monta o corpo de POST /api/teams a partir do formulário já validado. */
export function toTeamCreate(values: CreateTeamValues): TeamCreate {
  return {
    name: values.name.trim(),
    ...(isInterestArea(values.interestArea) ? { interest_area: values.interestArea } : {}),
    description: values.description.trim(),
  };
}

/* --- Código da equipe --- */

/** Maiúsculas e sem espaços: "dx27-ab12 " → "DX27-AB12". */
export const normalizeTeamCode = (code: string) => code.replace(/\s+/g, '').toUpperCase();

/** Compara códigos ignorando caixa, espaços e hífens ("DX27-AB12" = "dx27ab12"). */
export const sameTeamCode = (a: string, b: string) =>
  a.replace(/[^a-z0-9]/gi, '').toUpperCase() === b.replace(/[^a-z0-9]/gi, '').toUpperCase();

/** Team.code tem no máximo 20 caracteres; letras, números e hífen. */
export function validateTeamCode(code: string): string | null {
  const value = normalizeTeamCode(code);
  if (!value) return 'Informe o código recebido do líder.';
  if (value.length < 4 || value.length > 20 || !/^[A-Z0-9-]+$/.test(value))
    return 'Código inválido. Confira o formato, por exemplo DX27-AB12.';
  return null;
}

/* --- Cartão da equipe --- */

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** "4 de 6 integrantes · 2 vagas" (o limite é integrantes + vagas). */
export function describeVacancies(team: Pick<TeamListing, 'member_count' | 'available_slots'>) {
  const max = team.member_count + team.available_slots;
  if (team.available_slots <= 0) return `${max} de ${max} integrantes · Equipe completa`;
  return `${team.member_count} de ${max} integrantes · ${plural(team.available_slots, 'vaga', 'vagas')}`;
}

/** "Liderança · Agronomia · Engenharia de Software" (cursos da equipe). */
export function describeLeadership(team: Pick<TeamListing, 'courses'>) {
  return ['Liderança', ...team.courses.map((course) => course.name)].join(' · ');
}

/* --- Prazo de formação --- */

export type FormationStatus = 'OPEN' | 'UPCOMING' | 'CLOSED' | 'UNKNOWN';

export interface FormationWindow {
  status: FormationStatus;
  startsAt: string | null;
  endsAt: string | null;
  /** Dias até o fim (negativo = encerrado). */
  daysLeft: number | null;
}

/**
 * Situação da etapa FORMATION: a que está aberta; se não houver, a próxima; senão a última.
 * Sem etapa de formação, o status é UNKNOWN e quem decide é a API (409 formation_closed).
 */
export function getFormationWindow(stages: StageSchedule[], today = new Date()): FormationWindow {
  const formation = stages
    .filter((stage) => stage.type === 'FORMATION')
    .sort((a, b) => a.position - b.position);
  const stage =
    formation.find((s) => s.phase_status === 'OPEN') ??
    formation.find((s) => s.phase_status === 'UPCOMING') ??
    formation[formation.length - 1];

  if (!stage) return { status: 'UNKNOWN', startsAt: null, endsAt: null, daysLeft: null };

  const daysLeft = daysUntil(stage.ends_at, today);
  const status: FormationStatus =
    stage.phase_status === 'UPCOMING'
      ? 'UPCOMING'
      : stage.phase_status === 'FINISHED' || daysLeft < 0
        ? 'CLOSED'
        : 'OPEN';

  return { status, startsAt: stage.starts_at, endsAt: stage.ends_at, daysLeft };
}

/* --- Datas --- */

export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    new Date(iso),
  );

export const formatDayMonth = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(new Date(iso));

export const formatLongDate = (date: Date) =>
  new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);

/* --- Mensagens de erro da API (409 e validação) --- */

const ERROR_MESSAGE: Record<string, string> = {
  formation_closed: 'O prazo de formação de equipes está encerrado.',
  team_full: 'Esta equipe já atingiu o limite de integrantes.',
  student_already_in_team: 'Você já participa de uma equipe nesta edição.',
  join_request_pending_exists: 'Você já tem uma solicitação pendente para esta equipe.',
  team_name_taken: 'Já existe uma equipe com este nome nesta edição.',
  no_current_edition: 'Não há edição vigente no momento.',
  request_not_pending: 'Esta solicitação não está mais pendente.',
};

/** Mensagem para o usuário: código conhecido → texto da tela; senão a mensagem da API. */
export function describeTeamError(error: unknown, fallback: string) {
  const apiError = getApiError(error);
  if (!apiError) return fallback;
  return ERROR_MESSAGE[apiError.code] ?? apiError.message ?? fallback;
}

/** Códigos de erro que mudam o estado da lista (equipe lotou, prazo acabou…). */
export const isTeamStateConflict = (error: unknown) => {
  const code = getApiError(error)?.code;
  return (
    code === 'team_full' ||
    code === 'formation_closed' ||
    code === 'student_already_in_team' ||
    code === 'join_request_pending_exists'
  );
};
