import type { EditionSummary } from '@/shared/types/api';
import type {
  FinalEvaluationStatus,
  FinalistMaterial,
  FinalistMember,
  FinalistRow,
} from '../types';
import { evaluationFormPath, evaluationViewPath, finalistPath } from './evaluator-paths';

/** Rótulos do Figma para a situação da avaliação do avaliador. */
export const FINAL_STATUS_LABEL: Record<FinalEvaluationStatus, string> = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em preenchimento',
  FINALIZED: 'Enviada',
};

export type EvaluatorTone = 'brand' | 'pending' | 'sent' | 'danger';

export const FINAL_STATUS_TONE: Record<FinalEvaluationStatus, EvaluatorTone> = {
  PENDING: 'pending',
  IN_PROGRESS: 'brand',
  FINALIZED: 'sent',
};

export type StatusFilter = 'ALL' | FinalEvaluationStatus;

export interface FinalistFilters {
  search: string;
  /** id do curso em texto ('' = todos). */
  courseId: string;
  status: StatusFilter;
}

export const EMPTY_FILTERS: FinalistFilters = { search: '', courseId: '', status: 'ALL' };

export const hasActiveFilters = (filters: FinalistFilters) =>
  filters.search.trim() !== '' || filters.courseId !== '' || filters.status !== 'ALL';

/** Minúsculas e sem acentos, para a busca não depender de "ç" ou "ã". */
export const normalizeText = (text: string) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** Busca por projeto ou equipe, curso e situação (feita na página: a banca é pequena). */
export function filterFinalists(rows: FinalistRow[], filters: FinalistFilters): FinalistRow[] {
  const term = normalizeText(filters.search);
  return rows.filter(
    (row) =>
      (term === '' ||
        normalizeText(row.project.title).includes(term) ||
        normalizeText(row.team.name).includes(term)) &&
      (filters.courseId === '' || String(row.project.course.id) === filters.courseId) &&
      (filters.status === 'ALL' || row.my_evaluation_status === filters.status),
  );
}

const STATUS_ORDER: Record<FinalEvaluationStatus, number> = {
  IN_PROGRESS: 0,
  PENDING: 1,
  FINALIZED: 2,
};

const time = (iso?: string | null) => (iso ? new Date(iso).getTime() : Number.POSITIVE_INFINITY);

/**
 * "Não avaliados primeiro": em preenchimento, pendentes (pelo prazo) e, por fim, enviadas.
 * No empate, mantém a ordem recebida da API.
 */
export function sortFinalists(rows: FinalistRow[]): FinalistRow[] {
  return [...rows].sort(
    (a, b) =>
      STATUS_ORDER[a.my_evaluation_status] - STATUS_ORDER[b.my_evaluation_status] ||
      time(a.evaluation_deadline) - time(b.evaluation_deadline),
  );
}

export interface FinalistCounters {
  assigned: number;
  /** Ainda não enviadas: pendentes e em preenchimento. */
  pending: number;
  sent: number;
}

export function countFinalists(rows: FinalistRow[]): FinalistCounters {
  const sent = rows.filter((row) => row.my_evaluation_status === 'FINALIZED').length;
  return { assigned: rows.length, pending: rows.length - sent, sent };
}

/** Cursos presentes na banca, para o filtro "Curso". */
export function courseOptions(rows: FinalistRow[]) {
  const courses = new Map(rows.map((row) => [row.project.course.id, row.project.course.name]));
  return [...courses]
    .map(([id, name]) => ({ value: String(id), label: name }))
    .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
}

export interface FinalistAction {
  /** Texto da tabela (desktop), com seta. */
  label: string;
  /** Texto do botão do cartão (celular). */
  button: string;
  to: string;
}

/** O botão de ação muda conforme a situação da avaliação. */
export function finalistAction(row: Pick<FinalistRow, 'project' | 'my_evaluation_status'>) {
  const id = row.project.id;
  const actions: Record<FinalEvaluationStatus, FinalistAction> = {
    PENDING: { label: 'Ver projeto →', button: 'Ver projeto', to: finalistPath(id) },
    IN_PROGRESS: {
      label: 'Continuar →',
      button: 'Continuar avaliação',
      to: evaluationFormPath(id),
    },
    FINALIZED: { label: 'Ver avaliação →', button: 'Ver avaliação', to: evaluationViewPath(id) },
  };
  return actions[row.my_evaluation_status];
}

/* ------------------------------------ Formatação ------------------------------------ */

/** Datas sempre no horário de Brasília, como no protótipo. */
const TIME_ZONE = 'America/Sao_Paulo';

const dateFormat = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: TIME_ZONE,
});
const timeFormat = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: TIME_ZONE,
});

/** "23/10/2026" */
export const formatDate = (iso: string) => dateFormat.format(new Date(iso));

/** "23h59" */
export const formatTime = (iso: string) => timeFormat.format(new Date(iso)).replace(':', 'h');

/** "20/10/2026 às 14h32" */
export const formatDateTime = (iso: string) => `${formatDate(iso)} às ${formatTime(iso)}`;

/** Decimal da API ("86.00", "8.50") em texto: "86", "8,5". */
export function formatScore(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) return '—';
  return number.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
}

/** "86 / 100" (a pontuação máxima é omitida quando a API não informa). */
export function formatTotal(total: string | number | null | undefined, max?: string | null) {
  const score = formatScore(total);
  return max ? `${score} / ${formatScore(max)}` : score;
}

/** "2026.2": código da edição usado no protótipo. */
export const editionCode = (edition: Pick<EditionSummary, 'year' | 'semester'>) =>
  `${edition.year}.${edition.semester}`;

/** "ODS 10 · Redução das desigualdades" */
export const sdgLabel = (sdg: { number: number; title: string }) =>
  `ODS ${sdg.number} · ${sdg.title}`;

/** "2,4 MB" */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb).toLocaleString('pt-BR')} KB`;
  return `${(kb / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`;
}

/** "PDF · 2,4 MB" ou "Link externo · Figma". */
export function describeMaterial(material: FinalistMaterial): string {
  if (material.kind === 'LINK') {
    return ['Link externo', material.format].filter(Boolean).join(' · ');
  }
  const size = material.size_bytes === null ? null : formatFileSize(material.size_bytes);
  return [material.format, size].filter(Boolean).join(' · ') || 'Arquivo';
}

/** "Engenharia de Software · Líder · Pesquisa e experiência do usuário" */
export function describeMember(member: FinalistMember): string {
  return [member.course, member.role === 'LEADER' ? 'Líder' : null, member.responsibility]
    .filter(Boolean)
    .join(' · ');
}

/** Parágrafos separados por linha em branco. */
export const paragraphs = (text: string | null | undefined) =>
  (text ?? '')
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);

/** Texto do estado "Busca sem resultados". */
export function describeNoResults(filters: FinalistFilters): string {
  const parts: string[] = [];
  const term = filters.search.trim();
  if (term) parts.push(`“${term}”`);
  if (filters.status !== 'ALL') parts.push(`status ${FINAL_STATUS_LABEL[filters.status]}`);
  const criteria = parts.length > 0 ? ` com ${parts.join(' e ')}` : ' com esses filtros';
  return `Não encontramos projetos atribuídos${criteria}. Tente outro termo ou remova os filtros.`;
}
