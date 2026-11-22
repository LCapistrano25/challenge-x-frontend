import type { DeliverableField, DeliverableVersion, Project, StageDeliverable } from '../types';

/* --- Datas (todos os horários seguem o horário de Brasília) --- */

const TIME_ZONE = 'America/Sao_Paulo';

const part = (iso: string, options: Intl.DateTimeFormatOptions) =>
  new Date(iso).toLocaleString('pt-BR', { timeZone: TIME_ZONE, ...options });

/** "31/03/2027" */
export const formatDateBR = (iso: string) =>
  part(iso, { day: '2-digit', month: '2-digit', year: 'numeric' });

/** "31/03" */
export const formatDayMonth = (iso: string) => part(iso, { day: '2-digit', month: '2-digit' });

/** "23:59" */
export const formatTime = (iso: string) => part(iso, { hour: '2-digit', minute: '2-digit' });

/** "31/03/2027 · 23:59" */
export const formatDeadline = (iso: string) => `${formatDateBR(iso)} · ${formatTime(iso)}`;

/** "23/04/2027, às 23:59" */
export const formatDateAtTime = (iso: string) => `${formatDateBR(iso)}, às ${formatTime(iso)}`;

/** "30/03, às 16:42" */
export const formatShortDateAtTime = (iso: string) =>
  `${formatDayMonth(iso)}, às ${formatTime(iso)}`;

/* --- Arquivos e campos --- */

/** "2,4 MB" · "850 KB" */
export function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  const mb = bytes / 1024 / 1024;
  return `${mb.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} MB`;
}

/** "pdf,zip" → ["pdf", "zip"] */
export const parseFormats = (formats: string | null | undefined) =>
  (formats ?? '')
    .split(/[,\s]+/)
    .map((format) => format.trim().replace(/^\./, '').toLowerCase())
    .filter(Boolean);

/** "pdf,zip" → "PDF ou ZIP" */
export function describeFormats(formats: string | null | undefined) {
  const list = parseFormats(formats).map((format) => format.toUpperCase());
  if (list.length <= 1) return list[0] ?? 'Qualquer formato';
  return `${list.slice(0, -1).join(', ')} ou ${list[list.length - 1]}`;
}

/** "PDF ou ZIP, até 20 MB · Link do protótipo obrigatório" */
export function describeRequirements(fields: DeliverableField[]) {
  return fields
    .map((field) => {
      if (field.type === 'FILE') {
        const size = field.max_size_mb ? `, até ${field.max_size_mb} MB` : '';
        return `${describeFormats(field.formats)}${size}`;
      }
      return field.required ? `${field.label} obrigatório` : `${field.label} (opcional)`;
    })
    .join(' · ');
}

/** Arquivo (ou, sem arquivo, o link) principal de uma versão. */
export function describeVersionMaterial(version: DeliverableVersion) {
  const file = version.items.find((item) => item.type === 'FILE' && item.file_name);
  if (file) {
    return file.size_bytes != null
      ? `${file.file_name} · ${formatFileSize(file.size_bytes)}`
      : (file.file_name ?? '');
  }
  return version.items.find((item) => item.link)?.link ?? 'Material enviado';
}

/** "Enviado por Ana Maria em 30/03, às 16:42 · Versão 1" */
export const describeVersionSender = (version: DeliverableVersion) =>
  `Enviado por ${version.submitted_by.name} em ${formatShortDateAtTime(version.submitted_at)} · Versão ${version.version_number}`;

/* --- Situação de cada etapa --- */

export type StageViewStatus =
  'UPCOMING' | 'OPEN' | 'AWAITING_REVIEW' | 'APPROVED' | 'CHANGES_REQUESTED' | 'NOT_DELIVERED';

export type StageTone = 'neutral' | 'primary' | 'positive' | 'attention' | 'danger';

export const STAGE_STATUS_LABEL: Record<StageViewStatus, string> = {
  UPCOMING: 'Em breve',
  OPEN: 'Em andamento',
  AWAITING_REVIEW: 'Aguardando avaliação',
  APPROVED: 'Aprovada',
  CHANGES_REQUESTED: 'Ajustes solicitados',
  NOT_DELIVERED: 'Não entregue',
};

export const STAGE_STATUS_TONE: Record<StageViewStatus, StageTone> = {
  UPCOMING: 'neutral',
  OPEN: 'primary',
  AWAITING_REVIEW: 'primary',
  APPROVED: 'positive',
  CHANGES_REQUESTED: 'attention',
  NOT_DELIVERED: 'danger',
};

export type StageActionKind = 'submit' | 'details';

export interface StageView {
  status: StageViewStatus;
  /** A equipe pode enviar (ou reenviar) agora. */
  canSubmit: boolean;
  /** Última versão enviada (a API ordena da mais recente para a mais antiga). */
  latest: DeliverableVersion | null;
  /** Prazo de reenvio, quando a orientação pediu ajustes. */
  resubmissionDeadline: string | null;
  action: { kind: StageActionKind; label: string; primary: boolean };
}

const time = (iso: string) => new Date(iso).getTime();

/**
 * Situação exibida na lista, a partir do contrato (datas da etapa, versões e status derivado) e
 * do parecer da orientação (PROPOSTA: StageDeliverable.review).
 */
export function getStageView(item: StageDeliverable, now = new Date()): StageView {
  const nowMs = now.getTime();
  const latest = item.versions[0] ?? null;
  const review = latest && item.review?.version_id === latest.id ? item.review : null;
  const started = nowMs >= time(item.stage.starts_at);
  const open = started && nowMs <= time(item.stage.ends_at);
  const resubmissionDeadline =
    review?.status === 'CHANGES_REQUESTED'
      ? (review.resubmission_deadline ?? item.stage.ends_at)
      : null;

  let status: StageViewStatus;
  if (!started) status = 'UPCOMING';
  else if (review?.status === 'APPROVED') status = 'APPROVED';
  else if (review?.status === 'CHANGES_REQUESTED') status = 'CHANGES_REQUESTED';
  else if (latest) status = 'AWAITING_REVIEW';
  else status = open ? 'OPEN' : 'NOT_DELIVERED';

  const canSubmit =
    status === 'CHANGES_REQUESTED'
      ? resubmissionDeadline != null && nowMs <= time(resubmissionDeadline)
      : open && status !== 'APPROVED';

  let action: StageView['action'];
  if (status === 'OPEN') action = { kind: 'submit', label: 'Enviar entrega', primary: true };
  else if (canSubmit) action = { kind: 'submit', label: 'Atualizar entrega', primary: false };
  else if (latest) action = { kind: 'details', label: 'Consultar envio', primary: false };
  else action = { kind: 'details', label: 'Ver orientações', primary: false };

  return { status, canSubmit, latest, resubmissionDeadline, action };
}

/** Linhas "Arquivo e detalhes" de cada etapa. */
export function describeStageMaterial(item: StageDeliverable, view: StageView) {
  if (view.latest) {
    return {
      title: describeVersionMaterial(view.latest),
      detail: describeVersionSender(view.latest),
    };
  }
  const requirements = describeRequirements(item.fields);
  if (view.status === 'UPCOMING') {
    return {
      title: 'Aguardando abertura da etapa',
      detail: `Envio disponível a partir de ${formatDateBR(item.stage.starts_at)}${requirements ? ` · ${requirements}` : ''}`,
    };
  }
  if (view.status === 'NOT_DELIVERED') {
    return {
      title: 'Nenhum arquivo enviado',
      detail: `Prazo encerrado em ${formatDeadline(item.stage.ends_at)}`,
    };
  }
  return {
    title: 'Nenhum arquivo enviado',
    detail: `Envio aberto${requirements ? ` · ${requirements}` : ''}`,
  };
}

/** Parecer com o prazo de reenvio (aviso "Atenção ao reenvio"). */
export function describeResubmission(item: StageDeliverable, view: StageView) {
  if (view.status !== 'CHANGES_REQUESTED') return null;
  const comment = item.review?.comment?.trim();
  const opinion = comment ? `Parecer da orientação: ${comment}` : 'A orientação solicitou ajustes.';
  if (!view.resubmissionDeadline) return opinion;
  return view.canSubmit
    ? `${opinion} Reenvio autorizado até ${formatDateAtTime(view.resubmissionDeadline)}.`
    : `${opinion} O prazo de reenvio terminou em ${formatDateAtTime(view.resubmissionDeadline)}.`;
}

/* --- Indicadores do cabeçalho do projeto --- */

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export interface ProjectMetric {
  value: string;
  label: string;
}

/** "1 de 4 · entregas aprovadas", "1 ajuste · aguardando reenvio até 23/04" e o próximo prazo. */
export function getProjectMetrics(items: StageDeliverable[], now = new Date()): ProjectMetric[] {
  const views = items.map((item) => ({ item, view: getStageView(item, now) }));
  const approved = views.filter(({ view }) => view.status === 'APPROVED').length;
  const adjustments = views
    .filter(({ view }) => view.status === 'CHANGES_REQUESTED' && view.canSubmit)
    .map(({ view }) => view.resubmissionDeadline as string)
    .sort();
  const current = views
    .filter(({ view }) => view.status !== 'UPCOMING' && view.status !== 'APPROVED')
    .find(({ item }) => now.getTime() <= time(item.stage.ends_at));
  const next = views.find(({ view }) => view.status === 'UPCOMING');

  const deadline: ProjectMetric = current
    ? {
        value: formatDayMonth(current.item.stage.ends_at),
        label: `prazo de ${current.item.stage.name}`,
      }
    : next
      ? {
          value: formatDayMonth(next.item.stage.starts_at),
          label: `abertura de ${next.item.stage.name}`,
        }
      : { value: '—', label: 'sem etapas em aberto' };

  return [
    { value: `${approved} de ${items.length}`, label: 'entregas aprovadas' },
    {
      value: plural(adjustments.length, 'ajuste', 'ajustes'),
      label: adjustments[0]
        ? `aguardando reenvio até ${formatDayMonth(adjustments[0])}`
        : 'nenhum reenvio pendente',
    },
    deadline,
  ];
}

/** Etapas em que a equipe precisa agir agora (enviar ou reenviar). */
export const countPendingActions = (items: StageDeliverable[], now = new Date()) =>
  items.filter((item) => {
    const view = getStageView(item, now);
    return view.status === 'OPEN' || (view.status === 'CHANGES_REQUESTED' && view.canSubmit);
  }).length;

/** "1 ação pendente da equipe" */
export const describePendingActions = (count: number) =>
  count === 0
    ? 'Nenhuma ação pendente'
    : `${plural(count, 'ação pendente', 'ações pendentes')} da equipe`;

/* --- Projeto --- */

export const PROJECT_STATUS_LABEL: Record<Project['status'], string> = {
  IN_PROGRESS: 'Cadastrado',
  COMPLETED: 'Concluído',
  DISQUALIFIED: 'Desclassificado',
  SUBMITTED: 'Enviado',
  UNDER_EVALUATION: 'Em avaliação',
  APPROVED: 'Aprovado',
  REJECTED: 'Não aprovado',
};

/** "Interdisciplinar" quando a equipe reúne mais de um curso. */
export const describeProjectCourses = (project: Pick<Project, 'courses' | 'challenge'>) =>
  project.courses.length > 1
    ? 'Interdisciplinar'
    : (project.courses[0]?.name ?? project.challenge?.course.name ?? '');

/** "Cadastro em 12/03/2027 · Última edição por Ana Maria em 16/04/2027, às 15:10" */
export function describeProjectHistory(project: Project) {
  const edited = project.updated_at !== project.created_at;
  const editor = project.updated_by?.name;
  const history = `Cadastro em ${formatDateBR(project.created_at)}`;
  if (!edited) return history;
  return `${history} · Última edição${editor ? ` por ${editor}` : ''} em ${formatDateAtTime(project.updated_at)}`;
}

/** Posição da etapa entre as etapas com entrega: "Etapa 3 de 4". */
export function stagePosition(items: StageDeliverable[], stageId: number) {
  const ordered = [...items].sort((a, b) => a.stage.position - b.stage.position);
  const index = ordered.findIndex((item) => item.stage.id === stageId);
  return { index: index + 1, total: ordered.length };
}
