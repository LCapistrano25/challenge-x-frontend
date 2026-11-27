import type {
  AdminEdition,
  Criterion,
  EditionEvaluator,
  Regulation,
  RegulationStatus,
  Stage,
} from '../types';
import { stageCriteriaTotal, type StageCriteriaMap } from './criteria';
import { formatDay, formatDayMonth, toDateInput } from './dates';
import { invitationStatus } from './evaluators';
import { isRubricComplete, parseRubric } from './rubric';
import { formatPoints, toCents } from './score';
import { chronologyIssues, sortStages, stagePoints, stagesTotal, totalSituation } from './stages';

export const REGULATIONS_PATH = '/admin/editais';

export const REGULATION_STATUS_LABEL: Record<RegulationStatus, string> = {
  DRAFT: 'Minuta',
  PUBLISHED: 'Publicado',
  SUPERSEDED: 'Substituído',
};

export const REGULATION_STATUS_OPTIONS = (
  Object.keys(REGULATION_STATUS_LABEL) as RegulationStatus[]
).map((status) => ({ value: status, label: REGULATION_STATUS_LABEL[status] }));

/* ------------------------------------------------------------------------------------------ */
/* Arquivo PDF                                                                                 */
/* ------------------------------------------------------------------------------------------ */

export const MAX_PDF_BYTES = 10 * 1024 * 1024;

/** "1,2 MB" / "350 KB". */
export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** Primeiros 5 bytes do arquivo como texto ("%PDF-" num PDF). */
export async function readHeader(file: Blob): Promise<string> {
  const head = file.slice(0, 5);
  if (typeof head.text === 'function') return head.text();
  // Navegadores antigos e ambientes de teste sem Blob.text().
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => resolve('');
    reader.readAsText(head);
  });
}

/**
 * Valida o anexo antes do envio: extensão .pdf, tamanho até 10 MB e assinatura "%PDF-" no
 * início do arquivo (um .docx renomeado não passa). Devolve a mensagem de rejeição ou null.
 */
export async function validatePdfFile(file: File): Promise<string | null> {
  const isPdfName = /\.pdf$/i.test(file.name);
  const isPdfType = !file.type || file.type === 'application/pdf';
  if (!isPdfName || !isPdfType) {
    return 'Formato não aceito. Exporte o documento em PDF e tente novamente. Nenhum arquivo foi anexado.';
  }
  if (file.size === 0) {
    return 'O arquivo está vazio. Selecione um PDF legível. Nenhum arquivo foi anexado.';
  }
  if (file.size > MAX_PDF_BYTES) {
    return `O arquivo tem ${formatFileSize(file.size)}; o limite é 10 MB. Reduza o PDF e tente novamente. Nenhum arquivo foi anexado.`;
  }
  if ((await readHeader(file)) !== '%PDF-') {
    return 'O arquivo não é um PDF válido. Exporte o documento em PDF e tente novamente. Nenhum arquivo foi anexado.';
  }
  return null;
}

/* ------------------------------------------------------------------------------------------ */
/* Listagem                                                                                    */
/* ------------------------------------------------------------------------------------------ */

const normalize = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** Mais recente primeiro: edição (ano/semestre) e, dentro dela, a versão. */
export const sortRegulations = (items: readonly Regulation[]) =>
  [...items].sort(
    (a, b) =>
      b.edition.year - a.edition.year ||
      b.edition.semester - a.edition.semester ||
      b.version - a.version,
  );

export function filterRegulations(
  items: readonly Regulation[],
  { search, editionId, status }: { search: string; editionId: string; status: string },
) {
  const term = normalize(search);
  return items.filter(
    (item) =>
      (!term || normalize(item.title).includes(term)) &&
      (!editionId || String(item.edition.id) === editionId) &&
      (!status || item.status === status),
  );
}

/** "28/05/2027" a partir de um date-time da API. */
export const formatDate = (iso: string) => formatDay(toDateInput(iso));

/** Ações da linha, pela situação (Figma: "Visualizar · Editar", "Visualizar · Baixar"...). */
export const isDraft = (regulation: Pick<Regulation, 'status'>) => regulation.status === 'DRAFT';

/** Minuta em aberto da edição: cada edição tem no máximo uma (as demais versões vêm dela). */
export const draftOf = (items: readonly Regulation[], editionId: number) =>
  items.find((item) => item.edition.id === editionId && item.status === 'DRAFT');

/** Minuta pendente de uma edição em configuração (aviso da listagem). */
export function pendingDraft(items: readonly Regulation[]): Regulation | undefined {
  return sortRegulations(items).find((item) => item.status === 'DRAFT');
}

/* ------------------------------------------------------------------------------------------ */
/* Formulário                                                                                  */
/* ------------------------------------------------------------------------------------------ */

export const REGULATION_TITLE_LIMIT = 150;
export const REGULATION_DESCRIPTION_LIMIT = 1000;

export interface RegulationFormValues {
  title: string;
  editionId: string;
  description: string;
}

export type RegulationFormErrors = Partial<Record<keyof RegulationFormValues | 'file', string>>;

export function validateRegulationForm(
  values: RegulationFormValues,
  { hasFile }: { hasFile: boolean },
): RegulationFormErrors {
  const errors: RegulationFormErrors = {};
  if (!values.title.trim()) errors.title = 'Informe o título do edital.';
  else if (values.title.trim().length > REGULATION_TITLE_LIMIT) {
    errors.title = `Use até ${REGULATION_TITLE_LIMIT} caracteres.`;
  }
  if (!values.editionId) errors.editionId = 'Selecione a edição.';
  if (!values.description.trim()) errors.description = 'Informe a descrição do documento.';
  if (!hasFile) errors.file = 'Anexe o edital em PDF.';
  return errors;
}

/** Próxima versão da edição: a maior existente + 1. */
export function nextVersion(items: readonly Regulation[], editionId: number): number {
  const versions = items.filter((item) => item.edition.id === editionId).map((i) => i.version);
  return versions.length ? Math.max(...versions) + 1 : 1;
}

/* ------------------------------------------------------------------------------------------ */
/* Checklist de publicação                                                                     */
/* ------------------------------------------------------------------------------------------ */

export interface ChecklistItem {
  key: 'edition' | 'calendar' | 'stages' | 'criteria' | 'evaluators' | 'file';
  label: string;
  detail?: string;
  done: boolean;
}

export interface ChecklistInput {
  edition: AdminEdition;
  regulation: Regulation;
  stages: readonly Stage[];
  criteria: readonly Criterion[];
  stageCriteria: StageCriteriaMap;
  evaluators: readonly EditionEvaluator[];
}

/**
 * Pendências da publicação (Figma: "Checklist de publicação"). Reúne as regras que a API
 * aplica ao publicar a edição: cronologia, total de 10,0, critérios com rubrica revisada e
 * pontuação da etapa distribuída; e, da proposta, avaliadores com convite aceito.
 */
export function publicationChecklist({
  edition,
  regulation,
  stages,
  criteria,
  stageCriteria,
  evaluators,
}: ChecklistInput): ChecklistItem[] {
  const sorted = sortStages(stages);
  const scored = sorted.filter((stage) => stage.scored);
  const first = sorted[0];
  const last = sorted.at(-1);
  const issues = chronologyIssues(sorted);
  const total = stagesTotal(sorted);
  const exact = totalSituation(total).exact;

  const unreviewed = criteria.filter(
    (criterion) => !isRubricComplete(parseRubric(criterion.rubric)),
  );
  const undistributed = scored.filter(
    (stage) =>
      toCents(stageCriteriaTotal(stageCriteria.get(stage.id) ?? [])) !==
      toCents(stagePoints(stage)),
  );
  const pending = evaluators.filter((item) => invitationStatus(item) !== 'ACCEPTED');

  const items: ChecklistItem[] = [
    {
      key: 'edition',
      label: 'Edição cadastrada e dados conferidos',
      detail:
        edition.status === 'CLOSED'
          ? 'A edição está encerrada.'
          : `Equipes de ${edition.min_members} a ${edition.max_members} integrantes.`,
      done: edition.status !== 'CLOSED',
    },
    {
      key: 'calendar',
      label:
        first && last
          ? `Calendário consistente: ${formatDayMonth(toDateInput(first.starts_at))} a ${formatDay(toDateInput(last.evaluation_ends_at ?? last.ends_at))}`
          : 'Calendário consistente',
      detail: !first ? 'Cadastre as etapas da edição.' : issues[0],
      done: Boolean(first) && issues.length === 0,
    },
    {
      key: 'stages',
      label: `${scored.length} ${scored.length === 1 ? 'etapa configurada' : 'etapas configuradas'}: total ${exact ? 'exato de 10,0' : `de ${formatPoints(total)} de 10,0`} pontos`,
      detail: scored.length
        ? `${scored.map((stage) => formatPoints(stagePoints(stage))).join(' + ')} = ${formatPoints(total)}`
        : 'Nenhuma etapa pontuada.',
      done: scored.length > 0 && exact,
    },
    {
      key: 'criteria',
      label: 'Critérios e rubricas revisados',
      detail:
        criteria.length === 0
          ? 'Cadastre os critérios da edição.'
          : unreviewed.length
            ? `Rubrica a revisar: ${unreviewed.map((c) => c.name).join(', ')}.`
            : undistributed.length
              ? `Distribua a pontuação de ${undistributed.map((s) => s.name).join(', ')} entre os critérios.`
              : undefined,
      done: criteria.length > 0 && unreviewed.length === 0 && undistributed.length === 0,
    },
    {
      key: 'evaluators',
      label: 'Avaliadores confirmados e vinculados',
      detail:
        evaluators.length === 0
          ? 'Nenhum avaliador vinculado à edição.'
          : pending.length
            ? `${pending.length} ${pending.length === 1 ? 'convite aguarda' : 'convites aguardam'} confirmação.`
            : undefined,
      done: evaluators.length > 0 && pending.length === 0,
    },
    {
      key: 'file',
      label: `PDF validado: versão ${regulation.version}, ${formatFileSize(regulation.file.size_bytes)}`,
      done: regulation.file.size_bytes > 0 && regulation.file.size_bytes <= MAX_PDF_BYTES,
    },
  ];

  // Nova versão de edital de edição já publicada: a configuração está congelada desde a
  // publicação e não pode mais mudar; só a edição e o PDF são conferidos.
  if (edition.status !== 'PUBLISHED') return items;
  return items.map((item) =>
    item.done || item.key === 'edition' || item.key === 'file'
      ? item
      : {
          ...item,
          done: true,
          detail: `${item.detail ? `${item.detail} ` : ''}Configuração congelada desde a publicação da edição.`,
        },
  );
}
