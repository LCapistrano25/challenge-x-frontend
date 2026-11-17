import { useId, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  EDIT_PROJECT_PATH,
  STAGE_STATUS_LABEL,
  STAGE_STATUS_TONE,
  TEAM_PROJECT_PATH,
  deliveryConfirmationPath,
  describeProjectContext,
  formatDateAtTime,
  formatDateBR,
  getStageView,
  stagePosition,
  type Project,
  type StageDeliverable,
  type StageView,
} from '@/features/projects';
import {
  describeMembersBadge,
  findLeader,
  type StudentDashboard,
  type Team,
} from '@/features/teams';
import { usePageHeader } from '@/shared/lib/page-header';
import { Alert, Button, ButtonLink, EmptyState, Spinner, notify } from '@/shared/ui';
import { cn } from '@/shared/lib/cn';
import {
  DeliveryBreadcrumb,
  DeliveryFooter,
  DeliveryPage,
  ProjectContextColumn,
  StageHeaderCard,
} from '../components/DeliveryLayout';
import { FileUploadField } from '../components/FileUploadField';
import { useDeliveryContext, useStageParam, useSubmitDelivery } from '../hooks/useDelivery';
import {
  EMPTY_DELIVERY,
  describeDeliveryError,
  hasDeliveryContent,
  isDeadlineClosedError,
  toSubmissionFormData,
  validateDelivery,
  validateFile,
} from '../lib/submission';
import type { DeliveryFormErrors, DeliveryFormValues } from '../types';
import styles from '../components/Delivery.module.css';

function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <Alert
      tone="danger"
      title="Não foi possível carregar a etapa."
      action={
        <Button variant="secondary" size="small" onClick={onRetry}>
          Tentar de novo
        </Button>
      }
    >
      Verifique sua conexão e tente novamente.
    </Alert>
  );
}

/**
 * Enviar entrega (task #13, Figma: 03 - Acadêmico › "Entrega — Arquivo", 586:7669).
 * Qualquer integrante envia o material da etapa: arquivo (formato e tamanho da etapa), link com
 * https:// e observação. Etapas futuras ficam bloqueadas até a data de abertura.
 *
 * Fontes (docs/api/openapi.yaml):
 * - GET  /api/projects/{id}/deliverables                → campos, prazo e versões da etapa
 * - POST /api/projects/{id}/stages/{stage_id}/versions  → envio multipart (PROPOSTO, P-23/P-43)
 */
export function SubmitDeliveryPage() {
  usePageHeader('Enviar entrega', 'Compartilhe o material da etapa para avaliação da orientação.');
  const stageId = useStageParam();
  const context = useDeliveryContext(stageId);

  if (context.loading) {
    return (
      <DeliveryPage>
        <Spinner label="Carregando a etapa…" />
      </DeliveryPage>
    );
  }
  if (context.failed) {
    return (
      <DeliveryPage>
        <LoadError onRetry={context.retry} />
      </DeliveryPage>
    );
  }
  if (!context.team || !context.project || !context.dashboard) {
    return (
      <DeliveryPage>
        <EmptyState
          title="O projeto da equipe ainda não foi cadastrado"
          description="As entregas ficam disponíveis depois que a liderança cadastra o projeto."
          action={<ButtonLink to={TEAM_PROJECT_PATH}>Voltar ao projeto</ButtonLink>}
        />
        <DeliveryFooter />
      </DeliveryPage>
    );
  }
  if (!context.item) {
    return (
      <DeliveryPage>
        <EmptyState
          title="Etapa não encontrada"
          description="Escolha a etapa pela lista de entregas do projeto."
          action={<ButtonLink to={TEAM_PROJECT_PATH}>Voltar ao projeto</ButtonLink>}
        />
        <DeliveryFooter />
      </DeliveryPage>
    );
  }

  return (
    <SubmitDeliveryContent
      key={context.item.stage.id}
      dashboard={context.dashboard}
      team={context.team}
      project={context.project}
      items={context.items}
      item={context.item}
    />
  );
}

interface SubmitDeliveryContentProps {
  dashboard: StudentDashboard;
  team: Team;
  project: Project;
  items: StageDeliverable[];
  item: StageDeliverable;
}

/** Por que a etapa não aceita envio agora (etapa futura, aprovada ou prazo encerrado). */
function blockedMessage(item: StageDeliverable, view: StageView) {
  if (view.status === 'UPCOMING') {
    return {
      title: 'Esta etapa ainda não está aberta',
      text: `O envio fica disponível a partir de ${formatDateAtTime(item.stage.starts_at)}. Consulte as orientações pela lista de entregas.`,
    };
  }
  if (view.status === 'APPROVED') {
    return {
      title: 'Esta entrega já foi aprovada',
      text: 'A orientação aprovou o material da etapa. Não é necessário enviar outra versão.',
    };
  }
  const deadline = view.resubmissionDeadline ?? item.stage.ends_at;
  return {
    title: 'O prazo de envio terminou',
    text: `O envio desta etapa estava disponível até ${formatDateAtTime(deadline)}.`,
  };
}

function SubmitDeliveryContent({
  dashboard,
  team,
  project,
  items,
  item,
}: SubmitDeliveryContentProps) {
  const navigate = useNavigate();
  const formId = useId();
  const notesId = useId();
  const submit = useSubmitDelivery(project.id, item.stage.id);
  const [values, setValues] = useState<DeliveryFormValues>(EMPTY_DELIVERY);
  const [errors, setErrors] = useState<DeliveryFormErrors>({});
  // A API pode encerrar o prazo antes do que a tela calculou (409 stage_deadline_closed).
  const [closedByApi, setClosedByApi] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const view = getStageView(item);
  const blocked = closedByApi || !view.canSubmit;
  const position = stagePosition(items, item.stage.id);
  const leader = findLeader(team);
  const isLeader = dashboard.is_leader;
  const fileFields = item.fields.filter((field) => field.type === 'FILE');
  const contextLine = describeProjectContext(project, team, dashboard.edition);
  const resubmitting = view.latest != null;

  function setFile(fieldId: number, file: File | null) {
    const field = item.fields.find((entry) => entry.id === fieldId);
    const problem = file && field ? validateFile(file, field) : null;
    setErrors((current) => ({ ...current, [fieldId]: problem ?? undefined }));
    // Arquivo inválido não fica selecionado: a equipe escolhe outro.
    if (problem) return;
    setValues((current) => ({ ...current, files: { ...current.files, [fieldId]: file } }));
  }

  function setLink(fieldId: number, link: string) {
    setValues((current) => ({ ...current, links: { ...current.links, [fieldId]: link } }));
    if (errors[fieldId]) setErrors((current) => ({ ...current, [fieldId]: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (blocked || submit.isPending) return;
    setSubmitError(null);
    const found = validateDelivery(item.fields, values);
    if (Object.keys(found).length === 0 && !hasDeliveryContent(values)) {
      setSubmitError('Adicione o material da entrega antes de enviar.');
      return;
    }
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const first = item.fields.find((field) => found[field.id]);
      if (first) document.getElementById(`${formId}-field-${first.id}`)?.focus();
      return;
    }
    submit.mutate(toSubmissionFormData(item.fields, values), {
      onSuccess: (version) => {
        notify.success('Entrega enviada. Ela fica aguardando avaliação da orientação.');
        navigate(deliveryConfirmationPath(item.stage.id, version.id));
      },
      onError: (error) => {
        if (isDeadlineClosedError(error)) setClosedByApi(true);
        const message = describeDeliveryError(error);
        setSubmitError(message);
        notify.error(message);
      },
    });
  }

  const blockedInfo = blocked
    ? blockedMessage(item, closedByApi ? { ...view, status: 'NOT_DELIVERED' } : view)
    : null;

  return (
    <DeliveryPage>
      <DeliveryBreadcrumb stageName={item.stage.name} current="Enviar entrega" />
      <StageHeaderCard
        item={item}
        context={`Etapa ${position.index} de ${position.total} · ${project.title} · ${team.name}`}
        status={{ label: STAGE_STATUS_LABEL[view.status], tone: STAGE_STATUS_TONE[view.status] }}
      />

      <div className={styles.columns}>
        <div className={styles.mainColumn}>
          <section className={styles.card} aria-labelledby={`${formId}-title`}>
            <h2 id={`${formId}-title`} className={styles.h3}>
              Material da entrega
            </h2>
            <div className={styles.notice}>
              <p className={styles.noticeTitle}>O que entregar nesta etapa</p>
              <p>{item.guidance ?? item.description ?? 'Consulte o edital para as orientações.'}</p>
            </div>

            {blockedInfo ? (
              <>
                <Alert tone="warning" title={blockedInfo.title}>
                  {blockedInfo.text}
                </Alert>
                <div className={styles.actions}>
                  <ButtonLink
                    to={TEAM_PROJECT_PATH}
                    variant="secondary"
                    size="large"
                    className={styles.action}
                  >
                    Voltar ao projeto
                  </ButtonLink>
                </div>
              </>
            ) : (
              <form className={styles.form} onSubmit={handleSubmit} noValidate>
                <div className={styles.fieldGroup}>
                  {item.fields.map((field) =>
                    field.type === 'FILE' ? (
                      <FileUploadField
                        key={field.id}
                        field={field}
                        file={values.files[field.id] ?? null}
                        error={errors[field.id]}
                        showLabel={fileFields.length > 1}
                        disabled={submit.isPending}
                        onChange={(file) => setFile(field.id, file)}
                      />
                    ) : (
                      <div key={field.id} className={styles.field}>
                        <label htmlFor={`${formId}-field-${field.id}`} className={styles.label}>
                          {field.label}
                          {field.required ? '' : ' (opcional)'}
                        </label>
                        <input
                          id={`${formId}-field-${field.id}`}
                          type="url"
                          inputMode="url"
                          className={cn(styles.input, errors[field.id] && styles.invalid)}
                          placeholder="https://"
                          value={values.links[field.id] ?? ''}
                          onChange={(event) => setLink(field.id, event.target.value)}
                          disabled={submit.isPending}
                          aria-required={field.required || undefined}
                          aria-invalid={errors[field.id] ? true : undefined}
                          aria-describedby={`${formId}-field-${field.id}-hint`}
                        />
                        {errors[field.id] ? (
                          <p
                            id={`${formId}-field-${field.id}-hint`}
                            role="alert"
                            className={styles.error}
                          >
                            {errors[field.id]}
                          </p>
                        ) : (
                          <p id={`${formId}-field-${field.id}-hint`} className={styles.caption}>
                            Use um endereço completo, começando com https://.
                          </p>
                        )}
                      </div>
                    ),
                  )}
                </div>

                <div className={styles.field}>
                  <label htmlFor={notesId} className={styles.label}>
                    Observação (opcional)
                  </label>
                  <textarea
                    id={notesId}
                    className={styles.textarea}
                    rows={3}
                    value={values.notes}
                    onChange={(event) => setValues((v) => ({ ...v, notes: event.target.value }))}
                    disabled={submit.isPending}
                  />
                </div>

                <div className={styles.confirm}>
                  <div className={styles.divider} />
                  {submitError && <Alert tone="danger">{submitError}</Alert>}
                  <p className={styles.caption}>
                    {resubmitting
                      ? `Ao enviar, a nova versão substitui a anterior na avaliação, que continua no histórico. Reenvio permitido até ${formatDateBR(view.resubmissionDeadline ?? item.stage.ends_at)}.`
                      : 'Ao enviar, o material será registrado no histórico e ficará aguardando avaliação.'}
                  </p>
                  <div className={styles.actions}>
                    <ButtonLink
                      to={TEAM_PROJECT_PATH}
                      variant="secondary"
                      size="large"
                      className={styles.action}
                    >
                      Cancelar
                    </ButtonLink>
                    <Button
                      type="submit"
                      size="large"
                      className={styles.action}
                      loading={submit.isPending}
                    >
                      {resubmitting ? 'Enviar nova versão' : 'Enviar entrega'}
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </section>
        </div>

        <ProjectContextColumn
          project={project}
          memberNames={team.members.map((member) => member.student.name)}
          teamLine={`${team.name} · ${describeMembersBadge(team.members.length)}`}
          leaderName={leader?.student.name ?? null}
          contextLine={contextLine}
          editHref={isLeader ? EDIT_PROJECT_PATH : undefined}
        />
      </div>

      <DeliveryFooter />
    </DeliveryPage>
  );
}
