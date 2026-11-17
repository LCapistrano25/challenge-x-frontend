import { getApiError } from '@/shared/lib/api-error';
import type { FaqItem, FaqTopic, SupportTicketCreate } from '../types';

/* --- Busca por palavra-chave --- */

/** Minúsculas e sem acentos: "Liderança" encontra "lideranca". */
export const normalizeText = (text: string) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * Converte a busca em grupos de termos. Vírgulas separam alternativas ("convites, entregas"
 * encontra uma ou outra); dentro de cada alternativa, todas as palavras precisam aparecer.
 */
export function parseQuery(query: string): string[][] {
  return normalizeText(query)
    .split(',')
    .map((part) => part.split(/\s+/).filter(Boolean))
    .filter((terms) => terms.length > 0);
}

/** Aceita o singular de palavras no plural ("convites" também encontra "convite"). */
function hasTerm(text: string, term: string) {
  if (text.includes(term)) return true;
  return term.length > 3 && term.endsWith('s') && text.includes(term.slice(0, -1));
}

export function matchesFaq(item: FaqItem, groups: string[][]) {
  if (groups.length === 0) return true;
  const text = normalizeText(`${item.question} ${item.answer}`);
  return groups.some((terms) => terms.every((term) => hasTerm(text, term)));
}

/** Assuntos com as perguntas que atendem à busca (assuntos sem resultado saem da lista). */
export function filterFaq(topics: readonly FaqTopic[], query: string): FaqTopic[] {
  const groups = parseQuery(query);
  return topics
    .map((topic) => ({ ...topic, items: topic.items.filter((item) => matchesFaq(item, groups)) }))
    .filter((topic) => topic.items.length > 0);
}

/* --- Textos --- */

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** "8 respostas · 2 assuntos" */
export function describeFaqSummary(topics: readonly FaqTopic[]) {
  const answers = topics.reduce((total, topic) => total + topic.items.length, 0);
  return `${plural(answers, 'resposta', 'respostas')} · ${plural(topics.length, 'assunto', 'assuntos')}`;
}

/** "4 perguntas e respostas" */
export const describeTopicCount = (count: number) =>
  count === 1 ? '1 pergunta e resposta' : `${count} perguntas e respostas`;

/* --- Falar com a organização (SupportTicketCreate) --- */

export const TICKET_TITLE_MAX = 150;

export type TicketValues = SupportTicketCreate;
export type TicketErrors = Partial<Record<keyof TicketValues, string>>;

export function validateTicket(values: TicketValues): TicketErrors {
  const errors: TicketErrors = {};
  const title = values.title.trim();
  if (!title) errors.title = 'Informe o assunto.';
  else if (title.length > TICKET_TITLE_MAX)
    errors.title = `Use até ${TICKET_TITLE_MAX} caracteres.`;
  if (!values.description.trim()) errors.description = 'Descreva sua dúvida.';
  return errors;
}

export const toTicketCreate = (values: TicketValues): SupportTicketCreate => ({
  title: values.title.trim(),
  description: values.description.trim(),
});

/** Erros de validação da API (details: campo → mensagens) ou mensagem genérica. */
export function describeTicketError(error: unknown): { message: string; fields: TicketErrors } {
  const apiError = getApiError(error);
  const fields: TicketErrors = {};
  const details = apiError?.details as Record<string, string[]> | null | undefined;
  if (details && typeof details === 'object') {
    for (const key of ['title', 'description'] as const) {
      const message = details[key]?.[0];
      if (message) fields[key] = message;
    }
  }
  return {
    message:
      apiError?.status === 403
        ? 'Seu perfil não pode abrir chamados.'
        : 'Não foi possível enviar sua mensagem. Tente novamente.',
    fields,
  };
}
