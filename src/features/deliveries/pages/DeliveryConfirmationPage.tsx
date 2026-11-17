import {
  EDIT_PROJECT_PATH,
  STAGE_STATUS_LABEL,
  StageStatusTag,
  TEAM_PROJECT_PATH,
  describeProjectContext,
  formatDateAtTime,
  formatDateBR,
  formatDeadline,
  formatFileSize,
  getStageView,
  stagePosition,
  type DeliverableVersion,
  type Project,
  type StageDeliverable,
} from '@/features/projects';
import {
  describeMembersBadge,
  findLeader,
  type StudentDashboard,
  type Team,
} from '@/features/teams';
import { usePageHeader } from '@/shared/lib/page-header';
import { Alert, Button, ButtonLink, EmptyState, Spinner } from '@/shared/ui';
import {
  DeliveryBreadcrumb,
  DeliveryFooter,
  DeliveryPage,
  ProjectContextColumn,
  StageHeaderCard,
} from '../components/DeliveryLayout';
import { IconDeliveryCheck, IconFileDelivered } from '../components/icons';
import { useDeliveryContext, useIdParam, useStageParam } from '../hooks/useDelivery';
import { fileExtension } from '../lib/submission';
import styles from '../components/Delivery.module.css';

/**
 * Confirmação "Entrega da etapa realizada!" (task #13, Figma: 03 - Acadêmico › "Entrega —
 * Sucesso", 586:8170). Enviar não é aprovar: a entrega fica "Aguardando avaliação".
 * A versão vem de GET /api/projects/{id}/deliverables (?etapa=&versao= na URL), então a tela
 * continua disponível ao recarregar.
 */
export function DeliveryConfirmationPage() {
  usePageHeader('Entrega realizada', 'Acompanhe o envio da sua equipe e o retorno da avaliação.');
  const stageId = useStageParam();
  const versionId = useIdParam('versao');
  const context = useDeliveryContext(stageId);

  if (context.loading) {
    return (
      <DeliveryPage>
        <Spinner label="Carregando a entrega…" />
      </DeliveryPage>
    );
  }
  if (context.failed) {
    return (
      <DeliveryPage>
        <Alert
          tone="danger"
          title="Não foi possível carregar a entrega."
          action={
            <Button variant="secondary" size="small" onClick={context.retry}>
              Tentar de novo
            </Button>
          }
        >
          Verifique sua conexão e tente novamente.
        </Alert>
      </DeliveryPage>
    );
  }

  const item = context.item;
  const version =
    item?.versions.find((entry) => entry.id === versionId) ??
    (versionId == null ? item?.versions[0] : undefined);

  if (!context.team || !context.project || !context.dashboard || !item || !version) {
    return (
      <DeliveryPage>
        <EmptyState
          title="Entrega não encontrada"
          description="Consulte o histórico de versões pela lista de entregas do projeto."
          action={<ButtonLink to={TEAM_PROJECT_PATH}>Voltar ao projeto</ButtonLink>}
        />
        <DeliveryFooter />
      </DeliveryPage>
    );
  }

  return (
    <ConfirmationContent
      dashboard={context.dashboard}
      team={context.team}
      project={context.project}
      items={context.items}
      item={item}
      version={version}
    />
  );
}

interface ConfirmationContentProps {
  dashboard: StudentDashboard;
  team: Team;
  project: Project;
  items: StageDeliverable[];
  item: StageDeliverable;
  version: DeliverableVersion;
}

function ConfirmationContent({
  dashboard,
  team,
  project,
  items,
  item,
  version,
}: ConfirmationContentProps) {
  const position = stagePosition(items, item.stage.id);
  const leader = findLeader(team);
  const sender = team.members.find(
    (member) => member.student.user_id === version.submitted_by.user_id,
  );
  const senderRole =
    sender?.role === 'LEADER' ||
    (!sender && leader?.student.user_id === version.submitted_by.user_id)
      ? 'Líder da equipe'
      : 'Integrante da equipe';
  const files = version.items.filter((entry) => entry.type === 'FILE');
  const links = version.items.filter((entry) => entry.type === 'LINK' && entry.link);
  const next = [...items]
    .sort((a, b) => a.stage.position - b.stage.position)
    .find((entry) => entry.stage.position > item.stage.position);

  return (
    <DeliveryPage>
      <DeliveryBreadcrumb stageName={item.stage.name} current="Confirmação" />
      <StageHeaderCard
        item={item}
        context={`Etapa ${position.index} de ${position.total} · ${project.title} · ${team.name}`}
        status={{ label: 'Entregue', tone: 'positive' }}
      />

      <div className={styles.columns}>
        <div className={styles.mainColumn}>
          <section className={styles.card} aria-labelledby="delivery-success-title">
            <div className={styles.success} role="status">
              <span className={styles.successIcon}>
                <IconDeliveryCheck />
              </span>
              <h2 id="delivery-success-title" className={styles.successTitle}>
                Entrega da etapa realizada!
              </h2>
              <p className={styles.body}>
                O material de {item.stage.name} foi recebido e registrado no histórico.
              </p>
              <StageStatusTag tone="primary">Aguardando avaliação</StageStatusTag>
            </div>

            <div className={styles.divider} />

            <h3 className={styles.h3}>Resumo da entrega</h3>
            <dl className={styles.summaryGrid}>
              <div>
                <dt>Projeto e equipe</dt>
                <dd>
                  {project.title} · {team.name}
                </dd>
              </div>
              <div>
                <dt>Etapa</dt>
                <dd>{item.stage.name}</dd>
              </div>
              <div>
                <dt>Responsável pelo envio</dt>
                <dd>
                  {version.submitted_by.name} · {senderRole}
                </dd>
              </div>
              <div>
                <dt>Data e hora do envio</dt>
                <dd>{formatDeadline(version.submitted_at)} (Brasília)</dd>
              </div>
            </dl>

            {files.map((entry) => (
              <div key={entry.id} className={`${styles.fileRow} ${styles.deliveredFile}`}>
                <IconFileDelivered />
                <div className={styles.fileInfo}>
                  <p className={`${styles.text} ${styles.strong}`}>
                    {entry.file_name ?? 'Arquivo enviado'}
                  </p>
                  <p className={styles.caption}>
                    {[
                      entry.size_bytes != null ? formatFileSize(entry.size_bytes) : null,
                      entry.file_name ? fileExtension(entry.file_name).toUpperCase() : null,
                      `Versão ${version.version_number}`,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <StageStatusTag tone="positive">Entregue</StageStatusTag>
              </div>
            ))}

            {links.length > 0 && (
              <div className={`${styles.field} ${styles.material}`}>
                <p className={styles.caption}>Link da entrega</p>
                {links.map((entry) => (
                  <a
                    key={entry.id}
                    href={entry.link ?? undefined}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.text}
                  >
                    {entry.link}
                  </a>
                ))}
              </div>
            )}

            {version.notes && (
              <div className={styles.field}>
                <p className={styles.caption}>Observação</p>
                <p className={`${styles.text} ${styles.strong}`}>{version.notes}</p>
              </div>
            )}

            {version.receipt && (
              <p className={styles.caption}>
                Comprovante de envio: {version.receipt.verification_code}
                {version.receipt.file_url && (
                  <>
                    {' · '}
                    <a href={version.receipt.file_url} target="_blank" rel="noreferrer">
                      Baixar comprovante
                    </a>
                  </>
                )}
              </p>
            )}

            <div className={styles.notice}>
              <p className={styles.noticeTitle}>O que acontece agora?</p>
              <p>
                A entrega será analisada pela orientação. Consulte o projeto para acompanhar o
                parecer e eventuais solicitações de ajuste.
              </p>
            </div>

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
          </section>

          {next && (
            <section className={styles.card} aria-label="Próxima etapa">
              <div className={styles.nextStage}>
                <div>
                  <p className={`${styles.text} ${styles.strong}`}>{next.stage.name}</p>
                  <p className={styles.caption}>
                    Envio a partir de {formatDateBR(next.stage.starts_at)} · Prazo:{' '}
                    {formatDateAtTime(next.stage.ends_at)}
                  </p>
                </div>
                <p className={styles.caption}>{STAGE_STATUS_LABEL[getStageView(next).status]}</p>
              </div>
            </section>
          )}
        </div>

        <ProjectContextColumn
          project={project}
          memberNames={team.members.map((member) => member.student.name)}
          teamLine={`${team.name} · ${describeMembersBadge(team.members.length)}`}
          leaderName={leader?.student.name ?? null}
          contextLine={describeProjectContext(project, team, dashboard.edition)}
          editHref={dashboard.is_leader ? EDIT_PROJECT_PATH : undefined}
        />
      </div>

      <DeliveryFooter />
    </DeliveryPage>
  );
}
