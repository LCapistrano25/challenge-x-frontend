import type {
  EditionEvaluator,
  EvaluatorAssignment,
  EvaluatorAssignmentItem,
  InvitationStatus,
} from '../types';

export const EVALUATORS_PATH = '/admin/avaliadores';

export const INVITATION_STATUS_LABEL: Record<InvitationStatus, string> = {
  PENDING: 'Pendente',
  ACCEPTED: 'Aceito',
  DECLINED: 'Recusado',
};

export const INVITATION_FILTER_OPTIONS = [
  { value: 'ACCEPTED', label: 'Aceitos' },
  { value: 'PENDING', label: 'Pendentes' },
  { value: 'DECLINED', label: 'Recusados' },
];

/** Áreas de atuação oferecidas no cadastro (lista fechada até a API definir um catálogo). */
export const EVALUATOR_SPECIALTIES = [
  'Inovação e empreendedorismo',
  'Tecnologia e desenvolvimento',
  'Saúde coletiva',
  'Educação',
  'Sustentabilidade e meio ambiente',
  'Design e experiência do usuário',
  'Gestão e negócios',
  'Políticas públicas',
] as const;

/**
 * Situação do convite. Vínculos sem o campo (o que a API devolve hoje) foram feitos
 * diretamente pelo administrador e contam como aceitos.
 */
export const invitationStatus = (evaluator: EditionEvaluator): InvitationStatus =>
  evaluator.invitation?.status ?? 'ACCEPTED';

export const isLinkActive = (evaluator: EditionEvaluator) => evaluator.active !== false;

/** Equipes e etapas só podem ser atribuídas depois do aceite, com o vínculo ativo. */
export const canAssign = (evaluator: EditionEvaluator) =>
  invitationStatus(evaluator) === 'ACCEPTED' && isLinkActive(evaluator);

export function assignmentBlockReason(evaluator: EditionEvaluator): string | null {
  const status = invitationStatus(evaluator);
  if (status === 'PENDING') {
    return 'As atribuições serão liberadas depois que o avaliador aceitar o convite.';
  }
  if (status === 'DECLINED') {
    return 'O avaliador recusou o convite; reenvie o convite para liberar as atribuições.';
  }
  if (!isLinkActive(evaluator)) return 'Reative o vínculo para atribuir equipes e etapas.';
  return null;
}

const normalize = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export const sortEvaluators = (items: readonly EditionEvaluator[]) =>
  [...items].sort((a, b) => a.evaluator.name.localeCompare(b.evaluator.name, 'pt-BR'));

/** Busca por nome ou organização e filtro pela situação do convite. */
export function filterEvaluators(
  items: readonly EditionEvaluator[],
  { search, invitation }: { search: string; invitation: string },
) {
  const term = normalize(search);
  return items.filter(
    (item) =>
      (!term ||
        normalize(item.evaluator.name).includes(term) ||
        normalize(item.evaluator.institution ?? '').includes(term)) &&
      (!invitation || invitationStatus(item) === invitation),
  );
}

export function evaluatorCounts(items: readonly EditionEvaluator[]) {
  const accepted = items.filter((item) => invitationStatus(item) === 'ACCEPTED').length;
  const pending = items.filter((item) => invitationStatus(item) === 'PENDING').length;
  return { linked: items.length, accepted, pending };
}

/** "Conecta · Apresentação" (primeira atribuição) e "+N" para as demais. */
export function assignmentsSummary(evaluator: EditionEvaluator): string {
  if (!canAssign(evaluator)) {
    return invitationStatus(evaluator) === 'PENDING' ? 'Aguardando confirmação' : '—';
  }
  const items = evaluator.assignments ?? [];
  if (items.length === 0) return 'Sem atribuições';
  const [first, ...rest] = items;
  return `${first!.team.name} · ${first!.stage.name}${rest.length ? ` +${rest.length}` : ''}`;
}

/* ------------------------------------------------------------------------------------------ */
/* Cadastro com convite                                                                        */
/* ------------------------------------------------------------------------------------------ */

export interface InviteFormValues {
  name: string;
  email: string;
  phone: string;
  institution: string;
  roleTitle: string;
  specialty: string;
  editionId: string;
  message: string;
}

export type InviteFormErrors = Partial<Record<keyof InviteFormValues, string>>;

export const emptyInviteForm = (editionId = ''): InviteFormValues => ({
  name: '',
  email: '',
  phone: '',
  institution: '',
  roleTitle: '',
  specialty: '',
  editionId,
  message: '',
});

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const digits = (value: string) => value.replace(/\D/g, '');

/** "(63) 99999-0000" enquanto digita; no máximo 11 dígitos. */
export function maskPhone(value: string): string {
  const d = digits(value).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function validateInviteForm(
  values: InviteFormValues,
  linkedEmails: readonly string[] = [],
): InviteFormErrors {
  const errors: InviteFormErrors = {};
  if (!values.name.trim()) errors.name = 'Informe o nome completo.';
  const email = values.email.trim().toLowerCase();
  if (!email) errors.email = 'Informe o e-mail.';
  else if (!EMAIL.test(email))
    errors.email = 'Informe um e-mail válido, ex.: nome@instituicao.org.';
  else if (linkedEmails.some((item) => item.toLowerCase() === email)) {
    errors.email = 'Este avaliador já está vinculado à edição.';
  }
  const phone = digits(values.phone);
  if (phone && phone.length !== 10 && phone.length !== 11) {
    errors.phone = 'Informe o telefone com DDD, ex.: (63) 99999-0000.';
  }
  if (!values.institution.trim()) errors.institution = 'Informe a instituição ou organização.';
  if (!values.specialty) errors.specialty = 'Selecione a área de atuação.';
  if (!values.editionId) errors.editionId = 'Selecione a edição.';
  return errors;
}

export function formToInvitation(values: InviteFormValues) {
  return {
    name: values.name.trim(),
    email: values.email.trim().toLowerCase(),
    phone: values.phone.trim() || null,
    institution: values.institution.trim(),
    role_title: values.roleTitle.trim() || null,
    specialty: values.specialty,
    message: values.message.trim() || null,
  };
}

/* ------------------------------------------------------------------------------------------ */
/* Atribuições                                                                                 */
/* ------------------------------------------------------------------------------------------ */

export const toAssignmentItems = (
  items: readonly EvaluatorAssignment[],
): EvaluatorAssignmentItem[] =>
  items.map((item) => ({ team_id: item.team.id, stage_id: item.stage.id }));

export const sameAssignments = (
  a: readonly EvaluatorAssignmentItem[],
  b: readonly EvaluatorAssignmentItem[],
) => {
  const key = (item: EvaluatorAssignmentItem) => `${item.team_id}:${item.stage_id}`;
  const left = new Set(a.map(key));
  return a.length === b.length && b.every((item) => left.has(key(item)));
};

export const hasAssignment = (
  items: readonly EvaluatorAssignmentItem[],
  candidate: EvaluatorAssignmentItem,
) =>
  items.some((item) => item.team_id === candidate.team_id && item.stage_id === candidate.stage_id);
