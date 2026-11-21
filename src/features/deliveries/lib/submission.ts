import {
  describeFormats,
  formatFileSize,
  parseFormats,
  type CanvasContent,
  type DeliverableField,
  type SwotContent,
} from '@/features/projects';
import { getApiError } from '@/shared/lib/api-error';
import type {
  DeliverableSubmissionItem,
  DeliverableSubmissionJson,
  DeliveryFormErrors,
  DeliveryFormValues,
} from '../types';

export const CANVAS_SWOT_TEXT_MAX = 5000;
export const SWOT_QUADRANT_MAX_ITEMS = 20;

export const CANVAS_BLOCKS: readonly { key: keyof CanvasContent; label: string }[] = [
  { key: 'customer_segments', label: 'Segmentos de clientes' },
  { key: 'value_propositions', label: 'Proposta de valor' },
  { key: 'channels', label: 'Canais' },
  { key: 'customer_relationships', label: 'Relacionamento com clientes' },
  { key: 'revenue_streams', label: 'Fontes de receita' },
  { key: 'key_resources', label: 'Recursos-chave' },
  { key: 'key_activities', label: 'Atividades-chave' },
  { key: 'key_partnerships', label: 'Parcerias-chave' },
  { key: 'cost_structure', label: 'Estrutura de custos' },
];

export const SWOT_QUADRANTS: readonly { key: keyof SwotContent; label: string }[] = [
  { key: 'strengths', label: 'Forças' },
  { key: 'weaknesses', label: 'Fraquezas' },
  { key: 'opportunities', label: 'Oportunidades' },
  { key: 'threats', label: 'Ameaças' },
];

export function emptyCanvas(): CanvasContent {
  return {
    customer_segments: '',
    value_propositions: '',
    channels: '',
    customer_relationships: '',
    revenue_streams: '',
    key_resources: '',
    key_activities: '',
    key_partnerships: '',
    cost_structure: '',
  };
}

export function emptySwot(): SwotContent {
  return {
    strengths: [''],
    weaknesses: [''],
    opportunities: [''],
    threats: [''],
  };
}

export const EMPTY_DELIVERY: DeliveryFormValues = {
  files: {},
  links: {},
  canvas: {},
  swot: {},
  notes: '',
};

/* --- Arquivo --- */

/** Extensão em minúsculas ("relatorio.final.PDF" → "pdf"). */
export const fileExtension = (name: string) => {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
};

/** Valor do atributo `accept` do input: "pdf,zip" → ".pdf,.zip". */
export const acceptAttribute = (field: DeliverableField) =>
  parseFormats(field.formats)
    .map((format) => `.${format}`)
    .join(',') || undefined;

/** Valida formato e tamanho (o back-end valida de novo). */
export function validateFile(file: File, field: DeliverableField): string | null {
  const formats = parseFormats(field.formats);
  if (formats.length > 0 && !formats.includes(fileExtension(file.name))) {
    return `Formato não aceito. Envie um arquivo ${describeFormats(field.formats)}.`;
  }
  if (field.max_size_mb && file.size > field.max_size_mb * 1024 * 1024) {
    return `O arquivo tem ${formatFileSize(file.size)}. O limite é ${field.max_size_mb} MB.`;
  }
  if (file.size === 0) return 'O arquivo está vazio. Selecione outro arquivo.';
  return null;
}

/** "4,8 MB · PDF · Pronto para enviar" */
export const describeSelectedFile = (file: File) =>
  `${formatFileSize(file.size)} · ${fileExtension(file.name).toUpperCase() || 'Arquivo'} · Pronto para enviar`;

/** "PDF ou ZIP, até 20 MB." */
export const describeFileRule = (field: DeliverableField) =>
  `${describeFormats(field.formats)}${field.max_size_mb ? `, até ${field.max_size_mb} MB` : ''}.`;

/* --- Link --- */

/** Endereço completo com https:// e um domínio. */
export function isValidHttpsUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' && url.hostname.includes('.');
  } catch {
    return false;
  }
}

/* --- Canvas & SWOT --- */

function hasCanvasAnyText(canvas: CanvasContent | undefined): boolean {
  if (!canvas) return false;
  return CANVAS_BLOCKS.some(({ key }) => (canvas[key]?.trim() ?? '').length > 0);
}

function normalizeCanvas(canvas: CanvasContent): CanvasContent {
  const out = emptyCanvas();
  for (const { key } of CANVAS_BLOCKS) {
    out[key] = (canvas[key] ?? '').trim();
  }
  return out;
}

function validateCanvas(canvas: CanvasContent | undefined, required: boolean): string | null {
  const filled = hasCanvasAnyText(canvas);
  if (!filled) {
    return required ? 'Preencha todos os 9 blocos do Business Model Canvas.' : null;
  }
  for (const { key, label } of CANVAS_BLOCKS) {
    const text = canvas?.[key]?.trim() ?? '';
    if (!text) return `Preencha o bloco "${label}" do Canvas.`;
    if (text.length > CANVAS_SWOT_TEXT_MAX) {
      return `O bloco "${label}" deve ter até ${CANVAS_SWOT_TEXT_MAX} caracteres.`;
    }
  }
  return null;
}

function hasSwotAnyText(swot: SwotContent | undefined): boolean {
  if (!swot) return false;
  return SWOT_QUADRANTS.some(({ key }) =>
    (swot[key] ?? []).some((entry) => entry.trim().length > 0),
  );
}

function normalizeSwot(swot: SwotContent): SwotContent {
  const out = emptySwot();
  for (const { key } of SWOT_QUADRANTS) {
    out[key] = (swot[key] ?? []).map((entry) => entry.trim()).filter(Boolean);
  }
  return out;
}

function validateSwot(swot: SwotContent | undefined, required: boolean): string | null {
  const filled = hasSwotAnyText(swot);
  if (!filled) {
    return required ? 'Preencha ao menos 1 item em cada quadrante da matriz SWOT.' : null;
  }
  for (const { key, label } of SWOT_QUADRANTS) {
    const raw = swot?.[key] ?? [];
    const entries = raw.map((entry) => entry.trim()).filter(Boolean);
    if (entries.length === 0) return `Informe ao menos 1 item em "${label}".`;
    if (entries.length > SWOT_QUADRANT_MAX_ITEMS) {
      return `"${label}" aceita no máximo ${SWOT_QUADRANT_MAX_ITEMS} itens.`;
    }
    if (entries.some((entry) => entry.length > CANVAS_SWOT_TEXT_MAX)) {
      return `Cada item de "${label}" deve ter até ${CANVAS_SWOT_TEXT_MAX} caracteres.`;
    }
  }
  return null;
}

/* --- Formulário --- */

export function validateDelivery(
  fields: DeliverableField[],
  values: DeliveryFormValues,
): DeliveryFormErrors {
  const errors: DeliveryFormErrors = {};
  for (const field of fields) {
    if (field.type === 'FILE') {
      const file = values.files[field.id];
      if (!file) {
        if (field.required) errors[field.id] = 'Selecione o arquivo da entrega.';
        continue;
      }
      const problem = validateFile(file, field);
      if (problem) errors[field.id] = problem;
    } else if (field.type === 'CANVAS') {
      const problem = validateCanvas(values.canvas?.[field.id], field.required);
      if (problem) errors[field.id] = problem;
    } else if (field.type === 'SWOT') {
      const problem = validateSwot(values.swot?.[field.id], field.required);
      if (problem) errors[field.id] = problem;
    } else {
      const link = values.links[field.id]?.trim() ?? '';
      if (!link) {
        if (field.required) errors[field.id] = `Informe o ${field.label.toLowerCase()}.`;
        continue;
      }
      if (!isValidHttpsUrl(link)) {
        errors[field.id] = 'Informe um endereço completo, começando com https://.';
      }
    }
  }
  return errors;
}

/** Algo preenchido? (para habilitar o envio quando não há campos obrigatórios). */
export const hasDeliveryContent = (values: DeliveryFormValues) =>
  Object.values(values.files).some(Boolean) ||
  Object.values(values.links).some((link) => link.trim().length > 0) ||
  Object.values(values.canvas ?? {}).some((entry) => hasCanvasAnyText(entry)) ||
  Object.values(values.swot ?? {}).some((entry) => hasSwotAnyText(entry));

function buildItemsAndFiles(fields: DeliverableField[], values: DeliveryFormValues) {
  const items: DeliverableSubmissionItem[] = [];
  const files: File[] = [];
  for (const field of fields) {
    if (field.type === 'FILE') {
      const file = values.files[field.id];
      if (!file) continue;
      items.push({ field_id: field.id, file_index: files.length });
      files.push(file);
    } else if (field.type === 'CANVAS') {
      const canvas = values.canvas?.[field.id];
      if (canvas && hasCanvasAnyText(canvas)) {
        items.push({ field_id: field.id, content: normalizeCanvas(canvas) });
      }
    } else if (field.type === 'SWOT') {
      const swot = values.swot?.[field.id];
      if (swot && hasSwotAnyText(swot)) {
        items.push({ field_id: field.id, content: normalizeSwot(swot) });
      }
    } else {
      const link = values.links[field.id]?.trim();
      if (link) items.push({ field_id: field.id, link });
    }
  }
  return { items, files };
}

/** Corpo multipart de DeliverableSubmission (P-43): items (JSON), files[] e notes. */
export function toSubmissionFormData(fields: DeliverableField[], values: DeliveryFormValues) {
  const { items, files } = buildItemsAndFiles(fields, values);
  const body = new FormData();
  body.append('items', JSON.stringify(items));
  for (const file of files) body.append('files', file, file.name);
  const notes = values.notes.trim();
  if (notes) body.append('notes', notes);
  return body;
}

/**
 * Escolhe o formato exigido pelo contrato:
 * - FormData quando há pelo menos um arquivo (FILE);
 * - JSON quando só há links, Canvas e/ou SWOT.
 */
export function toSubmissionBody(
  fields: DeliverableField[],
  values: DeliveryFormValues,
): FormData | DeliverableSubmissionJson {
  const { items, files } = buildItemsAndFiles(fields, values);
  if (files.length > 0) {
    return toSubmissionFormData(fields, values);
  }
  const notes = values.notes.trim();
  return {
    items: items as DeliverableSubmissionJson['items'],
    ...(notes ? { notes } : {}),
  };
}

/* --- Erros da API (schema Error) --- */

const DELIVERY_ERROR: Record<string, string> = {
  stage_not_open: 'Esta etapa ainda não está aberta para envio.',
  stage_deadline_closed: 'O prazo desta etapa está encerrado.',
  team_disqualified: 'A equipe está desclassificada e não pode enviar entregas.',
  team_incomplete: 'Equipes incompletas não podem realizar entregas.',
  edition_closed: 'A edição está encerrada e não pode ser alterada.',
  file_format_not_allowed: 'Formato de arquivo não permitido para este campo.',
  file_too_large: 'Um dos arquivos excede o tamanho máximo permitido.',
  not_team_leader: 'Somente o líder ativo da equipe pode enviar a entrega.',
  storage_unavailable: 'Armazenamento de arquivos indisponível no momento. Tente novamente.',
};

export function describeDeliveryError(error: unknown) {
  const apiError = getApiError(error);
  const known = apiError ? DELIVERY_ERROR[apiError.code] : undefined;
  if (known) return known;
  if (apiError?.status === 503) {
    return 'Armazenamento de arquivos indisponível no momento. Tente novamente.';
  }
  if (apiError?.status === 403) return 'Você não tem permissão para enviar a entrega desta etapa.';
  if (apiError?.status === 413) return 'O arquivo é maior que o permitido para esta etapa.';
  if (apiError?.status === 400) return apiError.message || 'Revise o material e tente novamente.';
  return 'Não foi possível enviar a entrega. Tente novamente.';
}

/** O prazo acabou enquanto a tela estava aberta (409): a etapa deixa de aceitar envios. */
export const isDeadlineClosedError = (error: unknown) =>
  getApiError(error)?.code === 'stage_deadline_closed';
