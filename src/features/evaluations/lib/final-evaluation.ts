import type { FinalAnswer, FinalEvaluation, FinalEvaluationWrite, FinalQuestion } from '../types';
import { formatScore } from './finalists';

/** Parecer final: mínimo de caracteres exigido no Figma ("Campo obrigatório · mínimo de 50"). */
export const FEEDBACK_MIN_LENGTH = 50;
export const FEEDBACK_MAX_LENGTH = 3000;
export const ANSWER_MAX_LENGTH = 1000;

/** Preenchimento do formulário, por pergunta. */
export interface EvaluationDraft {
  /** Nota digitada (SCORE). */
  scores: Record<number, string>;
  /** Comentário opcional à equipe (SCORE). */
  comments: Record<number, string>;
  /** Justificativa da nota (SCORE) ou resposta (TEXT). */
  texts: Record<number, string>;
  /** Parecer final. */
  feedback: string;
}

export const sortQuestions = (questions: FinalQuestion[]) =>
  [...questions].sort((a, b) => a.position - b.position);

const scoreQuestions = (questions: FinalQuestion[]) =>
  sortQuestions(questions).filter((question) => question.type === 'SCORE');

/** Rascunho a partir da avaliação salva (ou vazio). */
export function draftFrom(evaluation: FinalEvaluation | null): EvaluationDraft {
  const draft: EvaluationDraft = { scores: {}, comments: {}, texts: {}, feedback: '' };
  for (const answer of evaluation?.answers ?? []) {
    if (answer.value !== null) draft.scores[answer.question_id] = formatScore(answer.value);
    if (answer.comment) draft.comments[answer.question_id] = answer.comment;
    if (answer.answer_text) draft.texts[answer.question_id] = answer.answer_text;
  }
  draft.feedback = evaluation?.comment ?? '';
  return draft;
}

/** Aceita "18", "18,5" ou "18.5" (até duas casas, como o decimal da API). */
export function parseScore(text: string): number | null {
  const normalized = text.trim().replace(',', '.');
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(normalized)) return null;
  return Number(normalized);
}

export const maxOf = (question: FinalQuestion) => Number(question.max_score ?? 0);

export type ScoreIssue = 'missing' | 'invalid' | 'out_of_range';

export function scoreIssue(question: FinalQuestion, text: string | undefined): ScoreIssue | null {
  if (!text || text.trim() === '') return 'missing';
  const value = parseScore(text);
  if (value === null) return 'invalid';
  return value > maxOf(question) ? 'out_of_range' : null;
}

export const scoreKey = (id: number) => `score-${id}`;
export const textKey = (id: number) => `text-${id}`;
export const FEEDBACK_KEY = 'feedback';

/** Erros por campo. A chave identifica o campo (nota, justificativa/resposta ou parecer). */
export function validateDraft(
  questions: FinalQuestion[],
  draft: EvaluationDraft,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const question of sortQuestions(questions)) {
    if (question.type === 'SCORE') {
      const issue = scoreIssue(question, draft.scores[question.id]);
      if (issue === 'missing') errors[scoreKey(question.id)] = 'Informe a nota.';
      if (issue === 'invalid') errors[scoreKey(question.id)] = 'Use apenas números.';
      if (issue === 'out_of_range') {
        errors[scoreKey(question.id)] = `Informe de 0 a ${formatScore(question.max_score)}.`;
      }
    }
    if (!draft.texts[question.id]?.trim()) {
      errors[textKey(question.id)] =
        question.type === 'SCORE' ? 'Justifique a nota para continuar.' : 'Responda à pergunta.';
    }
  }
  if (draft.feedback.trim().length < FEEDBACK_MIN_LENGTH) {
    errors[FEEDBACK_KEY] = `Escreva pelo menos ${FEEDBACK_MIN_LENGTH} caracteres.`;
  }
  return errors;
}

/** "Revise 2 campos antes de continuar" */
export function invalidFieldsTitle(count: number) {
  return `Revise ${count} ${count === 1 ? 'campo' : 'campos'} antes de continuar`;
}

/**
 * Explica os erros como no Figma: "A nota de Relevância e impacto social está fora do limite e
 * a justificativa é obrigatória. Os demais dados foram preservados."
 */
export function describeInvalidFields(
  questions: FinalQuestion[],
  draft: EvaluationDraft,
  errors: Record<string, string>,
): string {
  const sentences: string[] = [];
  for (const question of sortQuestions(questions)) {
    const parts: string[] = [];
    if (errors[scoreKey(question.id)]) {
      const issue = scoreIssue(question, draft.scores[question.id]);
      parts.push(
        `a nota de ${question.prompt} ${
          issue === 'missing' ? 'não foi informada' : 'está fora do limite'
        }`,
      );
    }
    if (errors[textKey(question.id)]) {
      const subject = question.type === 'SCORE' ? 'a justificativa' : 'a resposta';
      parts.push(
        parts.length > 0
          ? `${subject} é obrigatória`
          : `${subject} de ${question.prompt} é obrigatória`,
      );
    }
    if (parts.length > 0) sentences.push(parts.join(' e '));
  }
  if (errors[FEEDBACK_KEY]) {
    sentences.push(`o parecer final precisa de pelo menos ${FEEDBACK_MIN_LENGTH} caracteres`);
  }
  // Muitos campos: um resumo curto; os próprios campos mostram o que corrigir.
  if (sentences.length > 2) {
    return 'Preencha ou corrija os campos destacados em vermelho. Os demais dados foram preservados.';
  }
  const text = sentences.join('; ');
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}. Os demais dados foram preservados.`;
}

export interface ScoreTotal {
  /** Soma das notas; null quando alguma nota falta ou é inválida ("Total indisponível"). */
  total: number | null;
  max: number;
  parts: number[];
  filled: number;
  criteria: number;
}

export function computeTotal(questions: FinalQuestion[], draft: EvaluationDraft): ScoreTotal {
  const criteria = scoreQuestions(questions);
  const parts: number[] = [];
  let valid = true;
  for (const question of criteria) {
    const issue = scoreIssue(question, draft.scores[question.id]);
    if (issue === null) parts.push(parseScore(draft.scores[question.id]!)!);
    else valid = false;
  }
  return {
    total: valid ? round(parts.reduce((sum, value) => sum + value, 0)) : null,
    max: round(criteria.reduce((sum, question) => sum + maxOf(question), 0)),
    parts,
    filled: parts.length,
    criteria: criteria.length,
  };
}

/** Total de uma avaliação já salva (somente leitura). */
export function totalFromAnswers(questions: FinalQuestion[], answers: FinalAnswer[]): ScoreTotal {
  const draft = draftFrom({
    id: 0,
    status: 'FINALIZED',
    comment: null,
    answers,
    finalized_at: null,
    created_at: '',
    updated_at: '',
  });
  return computeTotal(questions, draft);
}

const round = (value: number) => Math.round(value * 100) / 100;

/** "18 + 16 + 18 + 16 + 18 = 86" */
export const formatSum = ({ parts, total }: ScoreTotal) =>
  total === null
    ? ''
    : `${parts.map((part) => formatScore(part)).join(' + ')} = ${formatScore(total)}`;

/** Referência da escala: "0 = não atende", "10 = atende parcialmente", "20 = atende plenamente". */
export function scaleHint(question: FinalQuestion): string[] {
  const max = maxOf(question);
  return [
    '0 = não atende',
    `${formatScore(max / 2)} = atende parcialmente`,
    `${formatScore(max)} = atende plenamente`,
  ];
}

/**
 * Aviso "Configuração da etapa": "5 critérios × 20 pontos = 100 pontos. Notas de 0 a 20, sem
 * pesos adicionais. Critérios e limites definidos pelo administrador."
 * Os limites vêm do formulário publicado (max_score), seja a escala 0–10 ou 0–20.
 */
export function describeConfiguration(questions: FinalQuestion[]): string {
  const criteria = scoreQuestions(questions);
  const total = criteria.reduce((sum, question) => sum + maxOf(question), 0);
  const maxes = new Set(criteria.map(maxOf));
  const count = `${criteria.length} ${criteria.length === 1 ? 'critério' : 'critérios'}`;
  const scale =
    maxes.size === 1
      ? `${count} × ${formatScore([...maxes][0])} pontos = ${formatScore(total)} pontos. Notas de 0 a ${formatScore([...maxes][0])}, sem pesos adicionais.`
      : `${count}, com total de ${formatScore(total)} pontos. Cada critério tem o próprio limite.`;
  return `${scale} Critérios e limites definidos pelo administrador.`;
}

/** Corpo do PUT: nota em decimal da API, justificativa em answer_text e comentário opcional. */
export function toWrite(
  questions: FinalQuestion[],
  draft: EvaluationDraft,
  status: FinalEvaluationWrite['status'],
): FinalEvaluationWrite {
  const answers = sortQuestions(questions).map((question) => {
    const text = draft.texts[question.id]?.trim() || null;
    if (question.type === 'TEXT') return { question_id: question.id, answer_text: text };
    const score = parseScore(draft.scores[question.id] ?? '');
    return {
      question_id: question.id,
      value: score === null ? null : String(round(score)),
      answer_text: text,
      comment: draft.comments[question.id]?.trim() || null,
    };
  });
  return { status, comment: draft.feedback.trim() || null, answers };
}
