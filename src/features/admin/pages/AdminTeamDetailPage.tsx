import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getApiError } from '@/shared/lib/api-error';
import { usePageHeader } from '@/shared/lib/page-header';
import {
  Alert,
  Button,
  ButtonLink,
  IconAlert,
  IconInfo,
  Modal,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TextField,
  Textarea,
  notify,
} from '@/shared/ui';
import { useAdminTeam, useDisqualifyTeam } from '../hooks/useAdminTeams';
import { SITUATION_LABEL, SITUATION_TONE, describeDisqualifyError } from '../lib/teams';
import type { AdminTeamDetail } from '../types';
import styles from './AdminTeams.module.css';

const REASON_LIMIT = 500;

/**
 * Detalhes da equipe (Figma: 04 - Administrador › "Detalhes da equipe" e "Desclassificar equipe").
 * Mostra projeto, integrantes e entregas; a desclassificação é um diálogo com motivo obrigatório
 * e confirmação pelo nome da equipe (RF13).
 */
export function AdminTeamDetailPage() {
  const { teamId = '' } = useParams();
  const id = Number(teamId);
  const { data, isLoading, isError, error, refetch } = useAdminTeam(
    Number.isFinite(id) ? id : undefined,
  );

  usePageHeader('Detalhes da equipe', 'Consulte a equipe, o projeto e as entregas da edição.');

  if (isLoading) return <Spinner label="Carregando a equipe…" />;
  if (isError || !data) {
    const notFound = getApiError(error)?.status === 404;
    return (
      <Alert
        tone="danger"
        title={notFound ? 'Equipe não encontrada' : 'Não foi possível carregar a equipe'}
        action={
          notFound ? (
            <ButtonLink to="/admin/equipes" size="small" variant="secondary">
              Voltar para a listagem
            </ButtonLink>
          ) : (
            <Button size="small" variant="secondary" onClick={() => void refetch()}>
              Tentar de novo
            </Button>
          )
        }
      >
        {notFound
          ? 'Ela pode ter sido removida da edição.'
          : 'Verifique sua conexão e tente novamente.'}
      </Alert>
    );
  }

  return <TeamDetail team={data} />;
}

function TeamDetail({ team }: { team: AdminTeamDetail }) {
  const disqualify = useDisqualifyTeam(team.id);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [confirmName, setConfirmName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const disqualified = team.situation === 'DISQUALIFIED';
  const nameMatches = confirmName.trim().toUpperCase() === team.name.toUpperCase();
  const canConfirm = reason.trim().length > 0 && nameMatches;

  function openDialog() {
    setReason('');
    setConfirmName('');
    setFormError(null);
    setOpen(true);
  }

  function closeDialog(next: boolean) {
    if (next || disqualify.isPending) return;
    setOpen(false);
  }

  async function confirmDisqualify() {
    if (!canConfirm) {
      setFormError(
        reason.trim().length === 0
          ? 'Informe o motivo para continuar.'
          : `Digite ${team.name.toUpperCase()} para confirmar.`,
      );
      return;
    }
    try {
      await disqualify.mutateAsync({ reason: reason.trim() });
      notify.success(`Equipe ${team.name} desclassificada.`);
      setOpen(false);
    } catch (error) {
      setFormError(describeDisqualifyError(error));
    }
  }

  return (
    <section className={`page-flush ${styles.page}`} aria-label="Detalhes da equipe">
      <nav className={styles.breadcrumb} aria-label="Trilha de navegação">
        <Link to="/admin">Início</Link>
        <span aria-hidden="true">/</span>
        <Link to="/admin/equipes">Equipes e Projetos</Link>
        <span aria-hidden="true">/</span>
        <span>Detalhes da equipe</span>
      </nav>
      <p className={styles.context}>
        {team.name} • {team.project?.title ?? 'Sem projeto'} • {team.course}
      </p>

      <section className={`${styles.card} ${styles.projectCard}`} aria-label="Projeto da equipe">
        <div className={styles.projectHead}>
          <div>
            <h3 className={styles.projectTitle}>
              {team.project?.title ?? 'Projeto não cadastrado'}
            </h3>
            <p className={styles.cardMeta}>
              Equipe {team.name}
              {team.project?.category ? ` • Categoria ${team.project.category}` : ''}
            </p>
          </div>
          <span className={`${styles.tag} ${styles[SITUATION_TONE[team.situation]]}`}>
            {SITUATION_LABEL[team.situation]}
          </span>
        </div>

        <p className={styles.description}>{team.description}</p>

        <dl className={styles.projectInfo}>
          <div>
            <dt>Curso</dt>
            <dd>{team.course}</dd>
          </div>
          <div>
            <dt>Professor responsável</dt>
            <dd>{team.advisor}</dd>
          </div>
          <div>
            <dt>ODS</dt>
            <dd>{team.sdg}</dd>
          </div>
          <div>
            <dt>Desafio</dt>
            <dd>{team.challenge}</dd>
          </div>
        </dl>

        {!disqualified && (
          <div>
            <Button variant="danger" onClick={openDialog}>
              Desclassificar equipe
            </Button>
          </div>
        )}
      </section>

      <section className={styles.card} aria-label="Integrantes">
        <header className={styles.cardHead}>
          <div>
            <h3 className={styles.cardTitle}>Integrantes</h3>
            <p className={styles.cardMeta}>{team.member_count} acadêmicos vinculados ao projeto</p>
          </div>
        </header>
        <Table caption="Integrantes da equipe">
          <TableHead>
            <TableRow>
              <TableHeader>Nome</TableHeader>
              <TableHeader>Contato institucional</TableHeader>
              <TableHeader>Papel</TableHeader>
              <TableHeader>Curso</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {team.members.map((member) => (
              <TableRow key={member.email}>
                <TableCell>{member.name}</TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell>{member.role === 'LEADER' ? 'Líder' : 'Integrante'}</TableCell>
                <TableCell>{member.course}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <section className={styles.card} aria-label="Entregas do projeto">
        <header className={styles.cardHead}>
          <h3 className={styles.cardTitle}>Entregas do projeto</h3>
        </header>
        <Table caption="Entregas do projeto">
          <TableHead>
            <TableRow>
              <TableHeader>Etapa</TableHeader>
              <TableHeader>Arquivo ou recurso</TableHeader>
              <TableHeader>Enviado em</TableHeader>
              <TableHeader>Situação</TableHeader>
              <TableHeader>Ação</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {team.deliverables.map((delivery) => (
              <TableRow key={delivery.stage}>
                <TableCell>{delivery.stage}</TableCell>
                <TableCell>{delivery.resource}</TableCell>
                <TableCell>{delivery.submitted_at ?? '—'}</TableCell>
                <TableCell>{delivery.situation}</TableCell>
                <TableCell>
                  {delivery.href ? (
                    <a className={styles.detailLink} href={delivery.href}>
                      {delivery.action_label}
                    </a>
                  ) : (
                    <span className={styles.muted}>{delivery.action_label}</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <div className={styles.notice}>
        <IconInfo size={20} className={styles.noticeIcon} aria-hidden="true" />
        <div>
          <p className={styles.noticeTitle}>Registro preservado</p>
          <p className={styles.noticeText}>{team.flow_note}</p>
        </div>
      </div>

      <Modal
        open={open}
        onOpenChange={closeDialog}
        title={`Desclassificar a equipe ${team.name}?`}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => closeDialog(false)}
              disabled={disqualify.isPending}
            >
              Manter equipe
            </Button>
            <Button
              variant="danger"
              onClick={() => void confirmDisqualify()}
              loading={disqualify.isPending}
              disabled={!canConfirm}
            >
              Confirmar desclassificação
            </Button>
          </>
        }
      >
        <div className={styles.dialog}>
          <span className={styles.transition}>
            {SITUATION_LABEL[team.situation]} → Desclassificada
          </span>

          <div className={styles.warning}>
            <IconAlert size={20} className={styles.warningIcon} aria-hidden="true" />
            <div>
              <p className={styles.warningTitle}>Esta ação altera a elegibilidade da equipe</p>
              <p className={styles.warningText}>
                A equipe deixará de participar da classificação e da seleção de finalistas.
                Integrantes, projeto, entregas e avaliações não serão excluídos.
              </p>
            </div>
          </div>

          <Textarea
            label="Motivo da desclassificação"
            required
            value={reason}
            maxLength={REASON_LIMIT}
            placeholder="Descreva o fato e a justificativa administrativa"
            error={formError && reason.trim().length === 0 ? formError : undefined}
            onChange={(event) => {
              setReason(event.target.value);
              setFormError(null);
            }}
          />

          <TextField
            label="Confirmação da equipe"
            required
            value={confirmName}
            placeholder={`Digite ${team.name.toUpperCase()}`}
            onChange={(event) => {
              setConfirmName(event.target.value);
              setFormError(null);
            }}
          />

          {formError && reason.trim().length > 0 && (
            <p role="alert" className={styles.dialogError}>
              {formError}
            </p>
          )}
          {!canConfirm && !formError && (
            <p className={styles.dialogHint}>
              Confirmação bloqueada:{' '}
              {reason.trim().length === 0
                ? 'o motivo obrigatório ainda não foi informado.'
                : `digite ${team.name.toUpperCase()} para liberar.`}
            </p>
          )}
        </div>
      </Modal>
    </section>
  );
}
