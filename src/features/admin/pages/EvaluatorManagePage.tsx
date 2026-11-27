import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, ButtonLink, Select, Spinner, TextField, notify } from '@/shared/ui';
import { Pill } from '../components/setup/RegistryParts';
import registry from '../components/setup/Registry.module.css';
import { Notice, SetupCard, SetupContext, SetupFooter } from '../components/setup/SetupParts';
import styles from '../components/setup/Setup.module.css';
import { useAdminEdition } from '../hooks/useAdminEdition';
import { useEvaluationSetup } from '../hooks/useEvaluationSetup';
import {
  useActiveCourses,
  useEditionEvaluators,
  useEditionTeams,
  useResendInvitation,
  useSaveEvaluatorLink,
} from '../hooks/useEvaluators';
import { useSetupHeader } from '../hooks/useSetupHeader';
import { EDITION_STATUS_LABEL, editionLabel } from '../lib/editions';
import { describeSetupError } from '../lib/errors';
import {
  EVALUATORS_PATH,
  EVALUATOR_SPECIALTIES,
  INVITATION_STATUS_LABEL,
  assignmentBlockReason,
  canAssign,
  hasAssignment,
  invitationStatus,
  isLinkActive,
  sameAssignments,
  toAssignmentItems,
} from '../lib/evaluators';
import { formatDate } from '../lib/regulations';
import { STAGE_STATUS_LABEL, stageDays, stageStatus } from '../lib/stages';
import type {
  AdminCourse,
  AdminEdition,
  AdminTeam,
  EditionEvaluator,
  EvaluatorAssignmentItem,
  Stage,
} from '../types';

/** Vínculo, convite e atribuições de um avaliador (Figma: "Avaliadores - gerenciar"). */
export function EvaluatorManagePage() {
  useSetupHeader('Gerenciar avaliador', 'AVALIADORES');
  const { linkId } = useParams();
  const editionState = useAdminEdition();
  const { edition, editions } = editionState;
  const evaluators = useEditionEvaluators(edition?.id);
  const teams = useEditionTeams(edition?.id);
  const setup = useEvaluationSetup(edition?.id);
  const courses = useActiveCourses();

  const link = (evaluators.data ?? []).find((item) => item.id === Number(linkId));
  const crumbs = [
    { label: 'Início', to: '/admin' },
    { label: 'Avaliadores', to: EVALUATORS_PATH },
    { label: 'Gerenciar avaliador' },
  ];
  const failed = [editionState, evaluators, teams, setup].find((item) => item.isError);
  const loading =
    editionState.isLoading ||
    (edition !== undefined && (evaluators.isPending || teams.isPending || setup.isLoading));

  if (failed || loading || !edition || !link) {
    return (
      <div className={styles.page}>
        <SetupContext crumbs={crumbs} description="Participação, convite e atribuições." />
        {loading ? (
          <div className={styles.state}>
            <Spinner label="Carregando o avaliador…" />
          </div>
        ) : (
          <Alert
            tone={failed ? 'danger' : 'info'}
            title={
              failed
                ? 'Não foi possível carregar o avaliador.'
                : 'Avaliador não encontrado nesta edição.'
            }
            action={
              <ButtonLink to={EVALUATORS_PATH} size="small" variant="secondary">
                Voltar aos avaliadores
              </ButtonLink>
            }
          >
            {failed
              ? describeSetupError(failed.error, 'Verifique sua conexão e tente novamente.')
              : 'O vínculo pode pertencer a outra edição; confira a edição atual no cabeçalho.'}
          </Alert>
        )}
        <SetupFooter edition={edition} />
      </div>
    );
  }

  return (
    <ManageForm
      // Recomeça o formulário quando o vínculo salvo muda (ex.: convite aceito em outra aba).
      key={`${link.id}:${link.updated_at}`}
      crumbs={crumbs}
      edition={edition}
      editions={editions}
      link={link}
      teams={teams.data ?? []}
      stages={setup.stages}
      courses={courses.data ?? []}
    />
  );
}

function ManageForm({
  crumbs,
  edition,
  editions,
  link,
  teams,
  stages,
  courses,
}: {
  crumbs: { label: string; to?: string }[];
  edition: AdminEdition;
  editions: AdminEdition[];
  link: EditionEvaluator;
  teams: AdminTeam[];
  stages: Stage[];
  courses: AdminCourse[];
}) {
  const navigate = useNavigate();
  const save = useSaveEvaluatorLink();
  const resend = useResendInvitation();
  const editable = edition.status !== 'CLOSED';
  const status = invitationStatus(link);
  const savedItems = toAssignmentItems(link.assignments ?? []);

  const [specialty, setSpecialty] = useState(link.specialty ?? '');
  const [active, setActive] = useState(isLinkActive(link) ? 'true' : 'false');
  const [courseId, setCourseId] = useState(link.course ? String(link.course.id) : '');
  const [reviewing, setReviewing] = useState(false);
  const [items, setItems] = useState<EvaluatorAssignmentItem[]>(savedItems);
  const [teamId, setTeamId] = useState('');
  const [stageId, setStageId] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // As atribuições valem para o vínculo como ficará ao salvar (aceito e ativo).
  const assignable = canAssign({ ...link, active: active === 'true' }) && editable;
  const blockReason = assignmentBlockReason({ ...link, active: active === 'true' });
  const evaluable = stages.filter((stage) => stage.scored);
  const teamById = new Map(teams.map((team) => [team.id, team]));
  const stageById = new Map(stages.map((stage) => [stage.id, stage]));

  const linkChanged =
    specialty !== (link.specialty ?? '') ||
    active !== (isLinkActive(link) ? 'true' : 'false') ||
    courseId !== (link.course ? String(link.course.id) : '');
  const assignmentsChanged = !sameAssignments(items, savedItems);
  const dirty = linkChanged || assignmentsChanged;
  const specialtyError = submitted && !specialty ? 'Selecione a área de atuação.' : undefined;
  const specialtyOptions = [
    ...EVALUATOR_SPECIALTIES,
    ...(link.specialty && !EVALUATOR_SPECIALTIES.includes(link.specialty as never)
      ? [link.specialty]
      : []),
  ];

  function addAssignment() {
    if (!teamId || !stageId) {
      setAddError('Selecione a equipe e a etapa.');
      return;
    }
    const candidate = { team_id: Number(teamId), stage_id: Number(stageId) };
    if (hasAssignment(items, candidate)) {
      setAddError('A equipe já está atribuída ao avaliador nesta etapa.');
      return;
    }
    setItems([...items, candidate]);
    setTeamId('');
    setStageId('');
    setAddError(null);
    setSubmitError(null);
  }

  function handleResend() {
    resend.mutate(
      { editionId: edition.id, evaluatorId: link.evaluator.user_id },
      {
        onSuccess: () =>
          notify.success(
            status === 'ACCEPTED'
              ? `Informações reenviadas para ${link.evaluator.email}.`
              : `Convite reenviado para ${link.evaluator.email}.`,
          ),
        onError: (error) =>
          notify.error(describeSetupError(error, 'Não foi possível reenviar. Tente novamente.')),
      },
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (!specialty || !dirty || save.isPending) return;
    try {
      await save.mutateAsync({
        editionId: edition.id,
        evaluatorId: link.evaluator.user_id,
        link: linkChanged
          ? {
              specialty,
              active: active === 'true',
              course_id: courseId ? Number(courseId) : null,
            }
          : null,
        assignments: assignmentsChanged && assignable ? items : null,
      });
      notify.success('Vínculos do avaliador salvos.');
      navigate(EVALUATORS_PATH);
    } catch (error) {
      setSubmitError(
        describeSetupError(error, 'Não foi possível salvar os vínculos. Tente novamente.'),
      );
    }
  }

  const caption = [
    link.invitation && `Convite enviado em ${formatDate(link.invitation.sent_at)}`,
    link.invitation?.responded_at &&
      `${status === 'DECLINED' ? 'Recusado' : 'Aceito'} em ${formatDate(link.invitation.responded_at)}`,
    !link.invitation && `Vinculado em ${formatDate(link.created_at)}`,
    link.invitation?.sent_by && `Responsável: ${link.invitation.sent_by.name}`,
  ]
    .filter(Boolean)
    .join(' • ');

  return (
    <form className={styles.page} onSubmit={handleSubmit} noValidate>
      <SetupContext
        crumbs={crumbs}
        description={[link.evaluator.name, link.evaluator.institution, link.evaluator.email]
          .filter(Boolean)
          .join(' • ')}
      />

      <SetupCard
        title="Participação e convite"
        aside={
          <Pill
            tone={status === 'ACCEPTED' ? 'success' : status === 'PENDING' ? 'warning' : 'danger'}
          >
            Convite {INVITATION_STATUS_LABEL[status].toLowerCase()}
          </Pill>
        }
      >
        <div className={styles.fields}>
          <div className={styles.row}>
            <TextField label="Edição" value={editionLabel(edition, editions)} readOnly disabled />
            <Select
              label="Especialidade *"
              placeholder="Selecione a área de atuação"
              options={specialtyOptions.map((item) => ({ value: item, label: item }))}
              value={specialty}
              disabled={!editable}
              error={specialtyError}
              onChange={(event) => {
                setSpecialty(event.target.value);
                setSubmitError(null);
              }}
            />
            <Select
              label="Status do vínculo *"
              options={[
                { value: 'true', label: 'Ativo' },
                { value: 'false', label: 'Inativo' },
              ]}
              value={active}
              disabled={!editable}
              hint={active === 'false' ? 'Inativo: não recebe novas atribuições.' : undefined}
              onChange={(event) => {
                setActive(event.target.value);
                setSubmitError(null);
              }}
            />
          </div>
          {reviewing && (
            <Select
              label="Abrangência"
              value={courseId}
              options={[
                { value: '', label: 'Todos os cursos da edição' },
                ...courses.map((course) => ({ value: String(course.id), label: course.name })),
              ]}
              disabled={!editable}
              hint="Restringe as equipes que o avaliador pode receber."
              onChange={(event) => setCourseId(event.target.value)}
            />
          )}
        </div>
        {caption && <p className={registry.caption}>{caption}</p>}
        {editable && (
          <div className={registry.inlineButtons}>
            <Button
              type="button"
              variant="secondary"
              loading={resend.isPending}
              onClick={handleResend}
            >
              {status === 'ACCEPTED' ? 'Reenviar informações' : 'Reenviar convite'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              aria-expanded={reviewing}
              onClick={() => setReviewing((open) => !open)}
            >
              {reviewing ? 'Ocultar abrangência' : 'Revisar vínculo'}
            </Button>
          </div>
        )}
      </SetupCard>

      <SetupCard
        title="Equipes e etapas atribuídas"
        subtitle={
          edition.status === 'SETUP'
            ? 'Planejamento • A edição ainda está em configuração.'
            : `${EDITION_STATUS_LABEL[edition.status]} • ${items.length} ${items.length === 1 ? 'atribuição' : 'atribuições'}.`
        }
      >
        {blockReason && (
          <Notice tone="warning" title="Atribuições bloqueadas">
            {blockReason}
          </Notice>
        )}

        {items.length > 0 && (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Equipe</th>
                  <th scope="col">Projeto</th>
                  <th scope="col">Etapa</th>
                  <th scope="col">Situação</th>
                  <th scope="col">Ação</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const team = teamById.get(item.team_id);
                  const stage = stageById.get(item.stage_id);
                  const saved = link.assignments?.find(
                    (a) => a.team.id === item.team_id && a.stage.id === item.stage_id,
                  );
                  const teamName = team?.name ?? saved?.team.name ?? `Equipe ${item.team_id}`;
                  return (
                    <tr key={`${item.team_id}:${item.stage_id}`}>
                      <td>{teamName}</td>
                      <td>{team?.project?.title ?? saved?.project?.title ?? '—'}</td>
                      <td>{stage?.name ?? saved?.stage.name ?? '—'}</td>
                      <td>{stage ? STAGE_STATUS_LABEL[stageStatus(stageDays(stage))] : '—'}</td>
                      <td>
                        <button
                          type="button"
                          className={styles.link}
                          disabled={!assignable}
                          aria-label={`Remover atribuição de ${teamName}`}
                          onClick={() => {
                            setItems(items.filter((other) => other !== item));
                            setSubmitError(null);
                          }}
                        >
                          Remover atribuição
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className={registry.assignRow}>
          <Select
            label="Adicionar equipe *"
            placeholder={teams.length ? 'Selecione a equipe' : 'Nenhuma equipe na edição'}
            options={teams.map((team) => ({
              value: String(team.id),
              label: team.project ? `${team.name} • ${team.project.title}` : team.name,
            }))}
            value={teamId}
            disabled={!assignable || teams.length === 0}
            onChange={(event) => {
              setTeamId(event.target.value);
              setAddError(null);
            }}
          />
          <Select
            label="Etapa *"
            placeholder={evaluable.length ? 'Selecione a etapa' : 'Nenhuma etapa pontuada'}
            options={evaluable.map((stage) => ({ value: String(stage.id), label: stage.name }))}
            value={stageId}
            disabled={!assignable || evaluable.length === 0}
            onChange={(event) => {
              setStageId(event.target.value);
              setAddError(null);
            }}
          />
          <Button
            type="button"
            variant="secondary"
            size="large"
            disabled={!assignable}
            onClick={addAssignment}
          >
            Adicionar atribuição
          </Button>
        </div>
        {addError && (
          <p role="alert" className={registry.fieldError}>
            {addError}
          </p>
        )}
      </SetupCard>

      <Notice tone="info" title="Revisão de atribuições">
        Confirme a compatibilidade da especialidade e evite vínculos que prejudiquem a independência
        da avaliação.
      </Notice>

      {editable && (
        <div className={styles.actions}>
          <div className={styles.buttons}>
            <ButtonLink to={EVALUATORS_PATH} variant="secondary" size="large">
              Cancelar
            </ButtonLink>
            <Button type="submit" size="large" loading={save.isPending} disabled={!dirty}>
              {save.isPending ? 'Salvando…' : 'Salvar vínculos'}
            </Button>
          </div>
          {submitError && (
            <p role="alert" className={styles.actionsError}>
              {submitError}
            </p>
          )}
          {!dirty && <p className={styles.actionsHint}>Nenhuma alteração para salvar.</p>}
        </div>
      )}

      <SetupFooter edition={edition} />
    </form>
  );
}
