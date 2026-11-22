import type { SelectOption } from '@/shared/ui';
import { getApiError } from '@/shared/lib/api-error';
import type {
  EligibleChallenge,
  Project,
  ProjectCategory,
  ProjectDraft,
  ProjectWrite,
} from '../types';

/* --- Limites --- */

export const PROJECT_TITLE_MAX = 200;
export const PROJECT_SUMMARY_MAX = 1000;
export const PROJECT_TEXT_MAX = 1000;
export const PROJECT_URL_MAX = 1000;

/* --- Formulário --- */

export interface ProjectFormValues {
  title: string;
  categoryId: string;
  challengeId: string;
  summary: string;
  problem: string;
  objective: string;
  methodology: string;
  targetAudience: string;
  location: string;
  advisorName: string;
  advisorEmail: string;
  referenceUrl: string;
  /** Declaração de aceite (obrigatória só para cadastrar). */
  accepted: boolean;
}

export type ProjectFormField = Exclude<keyof ProjectFormValues, 'accepted'>;
export type ProjectFormErrors = Partial<Record<keyof ProjectFormValues, string>>;

export const EMPTY_PROJECT_FORM: ProjectFormValues = {
  title: '',
  categoryId: '',
  challengeId: '',
  summary: '',
  problem: '',
  objective: '',
  methodology: '',
  targetAudience: '',
  location: '',
  advisorName: '',
  advisorEmail: '',
  referenceUrl: '',
  accepted: false,
};

/** Campos obrigatórios para cadastrar segundo o contrato (desafio -> dados -> categoria). */
const REQUIRED: [ProjectFormField, string][] = [
  ['challengeId', 'Selecione o Objetivo de Desenvolvimento Sustentável.'],
  ['title', 'Informe o título do projeto.'],
  ['summary', 'Escreva o resumo da proposta.'],
  ['categoryId', 'Selecione o eixo temático.'],
];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Regras que valem também para o rascunho: tamanho e formato do que foi preenchido. */
function validateFormat(values: ProjectFormValues): ProjectFormErrors {
  const errors: ProjectFormErrors = {};
  const email = values.advisorEmail.trim();
  const url = values.referenceUrl.trim();

  if (values.title.trim().length > PROJECT_TITLE_MAX)
    errors.title = `O título deve ter até ${PROJECT_TITLE_MAX} caracteres.`;
  if (values.summary.trim().length > PROJECT_SUMMARY_MAX)
    errors.summary = 'O resumo deve ter até 1.000 caracteres.';
  for (const field of ['problem', 'objective', 'methodology'] as const) {
    if (values[field].trim().length > PROJECT_TEXT_MAX)
      errors[field] = 'O texto deve ter até 1.000 caracteres.';
  }
  if (email && !EMAIL.test(email)) errors.advisorEmail = 'Informe um e-mail válido.';
  if (url && (!isValidUrl(url) || url.length > PROJECT_URL_MAX))
    errors.referenceUrl = 'Informe um link válido, começando com http:// ou https://.';

  return errors;
}

/** Validação de "Cadastrar projeto": obrigatórios, formatos e declaração de aceite. */
export function validateProjectForm(values: ProjectFormValues): ProjectFormErrors {
  const errors = validateFormat(values);
  for (const [field, message] of REQUIRED) {
    if (!values[field].trim()) errors[field] = message;
  }
  if (!values.accepted) errors.accepted = 'Confirme a declaração para cadastrar o projeto.';
  return errors;
}

/** Validação de "Salvar rascunho": nada é obrigatório, mas o que foi digitado precisa ser válido. */
export function validateProjectDraft(values: ProjectFormValues): ProjectFormErrors {
  return validateFormat(values);
}

/** Há algo para salvar no rascunho? */
export function hasDraftContent(values: ProjectFormValues) {
  return Object.entries(values).some(
    ([key, value]) => key !== 'accepted' && typeof value === 'string' && value.trim() !== '',
  );
}

/** Ordem dos campos na tela (desafio -> dados -> categoria), para focar o primeiro erro. */
export const FIELD_ORDER: (keyof ProjectFormValues)[] = [
  'challengeId',
  'title',
  'summary',
  'objective',
  'categoryId',
  'problem',
  'methodology',
  'targetAudience',
  'location',
  'advisorName',
  'advisorEmail',
  'referenceUrl',
  'accepted',
];

export const firstInvalidField = (errors: ProjectFormErrors) =>
  FIELD_ORDER.find((field) => errors[field]);

/* --- Conversão para o contrato --- */

const text = (value: string) => value.trim();
const optional = (value: string) => value.trim() || null;
const toId = (value: string) => (value ? Number(value) : null);

/** Corpo dos 3 passos da API a partir do formulário já validado. */
export function toProjectWrite(values: ProjectFormValues): ProjectWrite {
  return {
    challenge_id: Number(values.challengeId),
    category_id: Number(values.categoryId),
    title: text(values.title),
    summary: text(values.summary),
    objective: text(values.objective),
  };
}

/** Corpo do rascunho: campos vazios vão como null. */
export function toProjectDraft(values: ProjectFormValues): ProjectDraft {
  return {
    challenge_id: toId(values.challengeId),
    category_id: toId(values.categoryId),
    title: optional(values.title),
    summary: optional(values.summary),
    objective: optional(values.objective),
    problem: optional(values.problem),
    methodology: optional(values.methodology),
    target_audience: optional(values.targetAudience),
    location: optional(values.location),
    advisor_name: optional(values.advisorName),
    advisor_email: optional(values.advisorEmail),
    reference_url: optional(values.referenceUrl),
  };
}

/** Projeto incompleto segundo o contrato (sem desafio, título, resumo ou categoria). */
export function isProjectIncomplete(project: Project | null | undefined): boolean {
  if (!project) return true;
  return (
    project.challenge === null ||
    project.title === '' ||
    project.summary === '' ||
    project.category === null
  );
}

/** Dados do projeto cadastrado no formato do rascunho, para preencher a edição. */
export function projectToDraft(project: Project): ProjectDraft {
  return {
    challenge_id: project.challenge?.id ?? null,
    category_id: project.category?.id ?? null,
    title: project.title,
    summary: project.summary,
    objective: project.objective,
    problem: project.problem,
    methodology: project.methodology,
    target_audience: project.target_audience,
    location: project.location,
    advisor_name: project.advisor_name,
    advisor_email: project.advisor_email,
    reference_url: project.reference_url,
  };
}

/**
 * Preenche o formulário com o rascunho salvo. Desafio e categoria que deixaram de ser elegíveis
 * voltam vazios para a liderança escolher de novo.
 */
export function fromProjectDraft(
  draft: ProjectDraft | null | undefined,
  options?: { challenges: EligibleChallenge[]; categories: ProjectCategory[] },
): ProjectFormValues {
  if (!draft) return EMPTY_PROJECT_FORM;
  const eligible = (id: number | null | undefined, list?: { id: number }[]) =>
    id != null && (!list || list.some((item) => item.id === id)) ? String(id) : '';
  return {
    ...EMPTY_PROJECT_FORM,
    title: draft.title ?? '',
    categoryId: eligible(draft.category_id, options?.categories),
    challengeId: eligible(draft.challenge_id, options?.challenges),
    summary: draft.summary ?? '',
    problem: draft.problem ?? '',
    objective: draft.objective ?? '',
    methodology: draft.methodology ?? '',
    targetAudience: draft.target_audience ?? '',
    location: draft.location ?? '',
    advisorName: draft.advisor_name ?? '',
    advisorEmail: draft.advisor_email ?? '',
    referenceUrl: draft.reference_url ?? '',
  };
}

/* --- Opções dos selects --- */

/** "Eixo temático" = categorias ativas da edição. */
export const toCategoryOptions = (categories: ProjectCategory[]): SelectOption[] =>
  categories.map((category) => ({ value: String(category.id), label: category.name }));

function truncateDescription(description: string, max = 60): string {
  const trimmed = description.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

/**
 * O projeto tem uma única ODS, que vem do desafio escolhido (RF29). Quando dois desafios têm
 * a mesma ODS, a descrição do desafio diferencia as opções.
 */
export function toSdgOptions(challenges: EligibleChallenge[]): SelectOption[] {
  const perSdg = new Map<number, number>();
  for (const challenge of challenges)
    perSdg.set(challenge.sdg.id, (perSdg.get(challenge.sdg.id) ?? 0) + 1);

  return [...challenges]
    .sort(
      (a, b) => a.sdg.number - b.sdg.number || a.description.localeCompare(b.description, 'pt-BR'),
    )
    .map((challenge) => {
      const sdg = `ODS ${challenge.sdg.number} · ${challenge.sdg.title}`;
      const shared = (perSdg.get(challenge.sdg.id) ?? 0) > 1;
      const summary = truncateDescription(challenge.description);
      return {
        value: String(challenge.id),
        label: shared && summary ? `${sdg} — ${summary}` : sdg,
      };
    });
}

/* --- Textos --- */

const timeFormat = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });

export function describeFillStatus(savedAt: string | null | undefined) {
  if (!savedAt) return 'Preenchimento em andamento · Ainda não cadastrado';
  return `Rascunho salvo às ${timeFormat.format(new Date(savedAt))} · Ainda não cadastrado`;
}

export function describeTeamComposition(courses: string[], memberCount: number) {
  const unique = [...new Set(courses)];
  const names =
    unique.length <= 1
      ? (unique[0] ?? '')
      : `${unique.slice(0, -1).join(', ')} e ${unique[unique.length - 1]}`;
  const members = `${memberCount} ${memberCount === 1 ? 'integrante' : 'integrantes'}`;
  return names ? `${members} · ${names}` : members;
}

/* --- Erros da API --- */

const ERROR_MESSAGE: Record<string, string> = {
  formation_closed: 'O prazo de cadastro do projeto está encerrado.',
  project_title_taken: 'Já existe um projeto com este título nesta edição.',
  challenge_not_eligible: 'Esta ODS não está disponível para os cursos da equipe.',
  challenge_not_selected: 'Selecione o desafio antes de preencher os dados do projeto.',
  project_not_found: 'Selecione o desafio antes de escolher o eixo temático.',
  category_not_available: 'Este eixo temático não está disponível na edição.',
  not_team_leader: 'Somente a liderança da equipe pode cadastrar o projeto.',
  forbidden: 'Somente a liderança da equipe pode cadastrar o projeto.',
};

/** Erros que pertencem a um campo e aparecem abaixo dele. */
const FIELD_ERROR: Record<string, keyof ProjectFormValues> = {
  project_title_taken: 'title',
  challenge_not_eligible: 'challengeId',
  challenge_not_selected: 'challengeId',
  category_not_available: 'categoryId',
};

export function describeProjectError(error: unknown, fallback: string) {
  const apiError = getApiError(error);
  if (!apiError) return fallback;
  return ERROR_MESSAGE[apiError.code] ?? apiError.message ?? fallback;
}

/** Campo do formulário ligado ao erro da API, quando houver. */
export function projectErrorField(error: unknown): keyof ProjectFormValues | null {
  const code = getApiError(error)?.code;
  return (code && FIELD_ERROR[code]) || null;
}

export const isFormationClosedError = (error: unknown) =>
  getApiError(error)?.code === 'formation_closed';
