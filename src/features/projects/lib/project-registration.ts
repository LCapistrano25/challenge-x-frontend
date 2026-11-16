import type { SelectOption } from '@/shared/ui';
import { getApiError } from '@/shared/lib/api-error';
import type { EligibleChallenge, ProjectCategory, ProjectDraft, ProjectWrite } from '../types';

/* --- Limites (Figma: "Até 100 caracteres" e "Até 1.000 caracteres") --- */

export const PROJECT_TITLE_MAX = 100;
export const PROJECT_SUMMARY_MAX = 1000;
/**
 * Problema, objetivo geral e metodologia. O Figma só limita o resumo; os demais textos longos
 * seguem o mesmo limite (proposta ao back-end, ver api/README.md).
 */
export const PROJECT_TEXT_MAX = 1000;
/** Tamanho das colunas de link do modelo (varchar(1000)). */
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

/** Campos obrigatórios para cadastrar, com a mensagem de cada um (ordem da tela). */
const REQUIRED: [ProjectFormField, string][] = [
  ['title', 'Informe o título do projeto.'],
  ['categoryId', 'Selecione o eixo temático.'],
  ['challengeId', 'Selecione o Objetivo de Desenvolvimento Sustentável.'],
  ['summary', 'Escreva o resumo da proposta.'],
  ['problem', 'Descreva o problema identificado.'],
  ['objective', 'Informe o objetivo geral.'],
  ['methodology', 'Descreva a metodologia e o plano de desenvolvimento.'],
  ['targetAudience', 'Informe o público beneficiado.'],
  ['location', 'Informe o local de aplicação.'],
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
  // Campo vazio mostra a mensagem de obrigatório, não a de formato.
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

/** Ordem dos campos na tela, para focar o primeiro erro. */
export const FIELD_ORDER: (keyof ProjectFormValues)[] = [
  'title',
  'categoryId',
  'challengeId',
  'summary',
  'problem',
  'objective',
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

/** Corpo de PUT /api/teams/{id}/project a partir do formulário já validado. */
export function toProjectWrite(values: ProjectFormValues): ProjectWrite {
  return {
    challenge_id: Number(values.challengeId),
    category_id: Number(values.categoryId),
    title: text(values.title),
    summary: text(values.summary),
    objective: text(values.objective),
    problem: text(values.problem),
    methodology: text(values.methodology),
    target_audience: text(values.targetAudience),
    location: text(values.location),
    advisor_name: optional(values.advisorName),
    advisor_email: optional(values.advisorEmail),
    reference_url: optional(values.referenceUrl),
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

/**
 * Preenche o formulário com o rascunho salvo. Desafio e categoria que deixaram de ser elegíveis
 * (ex.: o curso perdeu representante, RF26) voltam vazios para a liderança escolher de novo.
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

/**
 * O projeto tem uma única ODS, que vem do desafio escolhido (RF29). O campo "Objetivo de
 * Desenvolvimento Sustentável" lista os desafios elegíveis pela ODS ("ODS 11 · Cidades…"); quando
 * dois desafios têm a mesma ODS, o título do desafio diferencia as opções.
 */
export function toSdgOptions(challenges: EligibleChallenge[]): SelectOption[] {
  const perSdg = new Map<number, number>();
  for (const challenge of challenges)
    perSdg.set(challenge.sdg.id, (perSdg.get(challenge.sdg.id) ?? 0) + 1);

  return [...challenges]
    .sort((a, b) => a.sdg.number - b.sdg.number || a.title.localeCompare(b.title, 'pt-BR'))
    .map((challenge) => {
      const sdg = `ODS ${challenge.sdg.number} · ${challenge.sdg.title}`;
      const shared = (perSdg.get(challenge.sdg.id) ?? 0) > 1;
      return { value: String(challenge.id), label: shared ? `${sdg} — ${challenge.title}` : sdg };
    });
}

/* --- Textos --- */

const timeFormat = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });

/** Linha de situação ao lado dos botões (Figma: "Preenchimento em andamento · …"). */
export function describeFillStatus(savedAt: string | null | undefined) {
  if (!savedAt) return 'Preenchimento em andamento · Ainda não cadastrado';
  return `Rascunho salvo às ${timeFormat.format(new Date(savedAt))} · Ainda não cadastrado`;
}

/** "4 integrantes · Engenharia de Software e Agronomia" */
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
  category_not_available: 'Este eixo temático não está disponível na edição.',
  forbidden: 'Somente a liderança da equipe pode cadastrar o projeto.',
};

/** Erros que pertencem a um campo e aparecem abaixo dele. */
const FIELD_ERROR: Record<string, keyof ProjectFormValues> = {
  project_title_taken: 'title',
  challenge_not_eligible: 'challengeId',
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
