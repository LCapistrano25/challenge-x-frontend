import {
  describeFormats,
  formatFileSize,
  parseFormats,
  type DeliverableField,
} from '@/features/projects';
import { getApiError } from '@/shared/lib/api-error';
import type { DeliverableSubmissionItem, DeliveryFormErrors, DeliveryFormValues } from '../types';

export const EMPTY_DELIVERY: DeliveryFormValues = { files: {}, links: {}, notes: '' };

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
  Object.values(values.links).some((link) => link.trim().length > 0);

/** Corpo multipart de DeliverableSubmission (P-43): items (JSON), files[] e notes. */
export function toSubmissionFormData(fields: DeliverableField[], values: DeliveryFormValues) {
  const items: DeliverableSubmissionItem[] = [];
  const files: File[] = [];
  for (const field of fields) {
    if (field.type === 'FILE') {
      const file = values.files[field.id];
      if (!file) continue;
      items.push({ field_id: field.id, file_index: files.length });
      files.push(file);
    } else {
      const link = values.links[field.id]?.trim();
      if (link) items.push({ field_id: field.id, link });
    }
  }
  const body = new FormData();
  body.append('items', JSON.stringify(items));
  for (const file of files) body.append('files', file, file.name);
  const notes = values.notes.trim();
  if (notes) body.append('notes', notes);
  return body;
}

/* --- Erros da API (schema Error) --- */

const DELIVERY_ERROR: Record<string, string> = {
  stage_deadline_closed: 'O prazo desta etapa está encerrado.',
  team_disqualified: 'A equipe está desclassificada e não pode enviar entregas.',
  team_incomplete: 'Equipes incompletas não podem realizar entregas.',
  edition_closed: 'A edição está encerrada e não pode ser alterada.',
};

export function describeDeliveryError(error: unknown) {
  const apiError = getApiError(error);
  const known = apiError ? DELIVERY_ERROR[apiError.code] : undefined;
  if (known) return known;
  if (apiError?.status === 403) return 'Você não tem permissão para enviar a entrega desta etapa.';
  if (apiError?.status === 413) return 'O arquivo é maior que o permitido para esta etapa.';
  if (apiError?.status === 400) return apiError.message || 'Revise o material e tente novamente.';
  return 'Não foi possível enviar a entrega. Tente novamente.';
}

/** O prazo acabou enquanto a tela estava aberta (409): a etapa deixa de aceitar envios. */
export const isDeadlineClosedError = (error: unknown) =>
  getApiError(error)?.code === 'stage_deadline_closed';
