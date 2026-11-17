import { getApiError } from '@/shared/lib/api-error';
import type { AvatarTone } from '@/shared/ui';
import type {
  MemberCriterionId,
  MemberEvaluationDraft,
  MemberEvaluationStatus,
  MemberNoteCreate,
  MemberScore,
} from '../types';

/* --- Critérios e escala (Figma: 03 - Acadêmico › "Equipe — avaliação de membro") --- */

export interface MemberCriterion {
  id: MemberCriterionId;
  label: string;
  description: string;
}

/**
 * Critérios de participação do protótipo. São exemplos (nota "Sobre este formulário"), não
 * regras institucionais: confirmar com a equipe de requisitos antes de fixar.
 */
export const MEMBER_CRITERIA: readonly MemberCriterion[] = [
  {
    id: 'COMMITMENT',
    label: 'Comprometimento',
    description: 'Envolvimento com as atividades e responsabilidade nas entregas.',
  },
  {
    id: 'COLLABORATION',
    label: 'Colaboração',
    description: 'Apoio aos colegas e construção conjunta de soluções.',
  },
  {
    id: 'COMMUNICATION',
    label: 'Comunicação',
    description: 'Clareza nas trocas e compartilhamento de informações.',
  },
  {
    id: 'CONTRIBUTION',
    label: 'Contribuição para o projeto',
    description: 'Qualidade e relevância das contribuições ao trabalho da equipe.',
  },
];

export const MEMBER_SCORES: readonly MemberScore[] = [1, 2, 3, 4, 5];

export const SCORE_LABEL: Record<MemberScore, string> = {
  1: 'Muito baixa',
  2: 'Baixa',
  3: 'Adequada',
  4: 'Boa',
  5: 'Excelente',
};

export const EMPTY_DRAFT: MemberEvaluationDraft = { scores: {}, comment: '' };

/* --- Preenchimento --- */

export const countFilledCriteria = (draft: MemberEvaluationDraft) =>
  MEMBER_CRITERIA.filter((criterion) => draft.scores[criterion.id] != null).length;

/** O envio só habilita com todos os critérios preenchidos (critério de aceitação). */
export const isDraftComplete = (draft: MemberEvaluationDraft) =>
  countFilledCriteria(draft) === MEMBER_CRITERIA.length;

/** Algo foi preenchido (nota ou comentário)? */
export const isDraftStarted = (draft: MemberEvaluationDraft | undefined) =>
  draft != null && (countFilledCriteria(draft) > 0 || draft.comment.trim().length > 0);

export function getEvaluationStatus(
  sent: boolean,
  draft: MemberEvaluationDraft | undefined,
): MemberEvaluationStatus {
  if (sent) return 'SENT';
  return isDraftStarted(draft) ? 'IN_PROGRESS' : 'NOT_STARTED';
}

export const STATUS_LABEL: Record<MemberEvaluationStatus, string> = {
  NOT_STARTED: 'Não iniciada',
  IN_PROGRESS: 'Em preenchimento',
  SENT: 'Enviada',
};

/** Cor da situação (Figma: Em preenchimento azul, Enviada verde, Não iniciada cinza). */
export const STATUS_TONE: Record<MemberEvaluationStatus, 'primary' | 'neutral' | 'positive'> = {
  NOT_STARTED: 'neutral',
  IN_PROGRESS: 'primary',
  SENT: 'positive',
};

/** Mesmas cores de "Minha equipe": o rosa é do líder; os demais seguem azul, laranja e verde. */
const MEMBER_TONES: AvatarTone[] = ['blue', 'orange', 'green', 'pink'];
export const memberTone = (index: number): AvatarTone =>
  MEMBER_TONES[index % MEMBER_TONES.length] ?? 'blue';

/* --- Textos --- */

/** "1 de 3 avaliações enviadas" */
export function describeProgress(sent: number, total: number) {
  return `${sent} de ${total} ${total === 1 ? 'avaliação enviada' : 'avaliações enviadas'}`;
}

/** Percentual da barra de progresso (0 quando não há integrantes para avaliar). */
export const progressPercent = (sent: number, total: number) =>
  total > 0 ? (sent / total) * 100 : 0;

/** "4 de 4 critérios preenchidos · Avaliação de João Silva ainda não enviada." */
export function describeSubmission(draft: MemberEvaluationDraft, memberName: string) {
  const filled = countFilledCriteria(draft);
  return `${filled} de ${MEMBER_CRITERIA.length} critérios preenchidos · Avaliação de ${memberName} ainda não enviada.`;
}

/* --- Envio (contrato confirmado: { member_id, content }) --- */

/**
 * Monta o corpo de POST /api/teams/{team_id}/member-notes. O contrato só tem `content`
 * (texto), então as notas vão em linhas legíveis para o professor (RF39), seguidas do
 * comentário. Um campo estruturado para as notas é proposta (ver api/README.md).
 */
export function toMemberNoteCreate(
  memberId: number,
  draft: MemberEvaluationDraft,
): MemberNoteCreate {
  const lines = MEMBER_CRITERIA.map((criterion) => {
    const score = draft.scores[criterion.id];
    return `${criterion.label}: ${score != null ? `${score}/5 (${SCORE_LABEL[score]})` : 'não avaliado'}`;
  });
  const comment = draft.comment.trim();
  if (comment) lines.push('', `Comentário: ${comment}`);
  return { member_id: memberId, content: lines.join('\n') };
}

/* --- Erros (schema Error) --- */

export function describeMemberNoteError(error: unknown) {
  const apiError = getApiError(error);
  if (apiError?.status === 403) return 'Somente o líder da equipe pode avaliar os integrantes.';
  if (apiError?.status === 404) return 'Este integrante não faz mais parte da equipe.';
  if (apiError?.status === 400) return 'Revise as notas e o comentário antes de enviar.';
  return apiError?.message ?? 'Não foi possível enviar a avaliação. Tente novamente.';
}
