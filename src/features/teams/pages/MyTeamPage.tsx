import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { getApiError } from '@/shared/lib/api-error';
import { usePageHeader } from '@/shared/lib/page-header';
import { Alert, Button, ButtonLink, ConfirmDialog, EmptyState, Spinner, notify } from '@/shared/ui';
import { EditTeamDialog } from '../components/EditTeamDialog';
import { InviteStudentCard } from '../components/InviteStudentCard';
import { LeaderPermissionsCard } from '../components/LeaderPermissionsCard';
import { LeaderlessNotice } from '../components/LeaderlessNotice';
import { MyTeamMembersCard } from '../components/MyTeamMembersCard';
import { ParticipationCard } from '../components/ParticipationCard';
import { TeamInfoCard, type TeamFact } from '../components/TeamInfoCard';
import { TeamPendingCard } from '../components/TeamPendingCard';
import { TransferLeadershipDialog } from '../components/TransferLeadershipDialog';
import {
  useCreateLeadershipRequest,
  useLeadershipRequests,
  useLeaveTeam,
  useRemoveMember,
  useTeam,
  useTeamInvitations,
  useTeamJoinRequests,
} from '../hooks/useMyTeam';
import { useStudentDashboard } from '../hooks/useStudentDashboard';
import {
  availableSlots,
  describeFormation,
  describeMemberCount,
  describeMyTeamError,
  describePendingSummary,
  describeSlots,
  findLeader,
  findSelf,
  getTeamViewMode,
  hasActiveExtension,
  isFormationLocked,
  pendingLeadershipRequest,
  describeExtendedUntil,
  type TeamViewMode,
} from '../lib/my-team';
import {
  DEFAULT_MAX_MEMBERS,
  formatLongDate,
  getFormationWindow,
  type FormationWindow,
} from '../lib/team-formation';
import type { Team, TeamMember } from '../types';
import styles from '../components/MyTeam.module.css';

const SUBTITLE: Record<TeamViewMode, string> = {
  LEADER: 'Gerencie os integrantes, convites e informações da sua equipe.',
  MEMBER: 'Consulte as informações e os integrantes da sua equipe.',
  LEADERLESS: 'Acompanhe sua equipe e a situação da liderança.',
};

const LOCKED_HINT = 'A composição da equipe só pode mudar durante a formação.';
const EXTENDED_LEAVE_HINT =
  'Saídas ficam bloqueadas durante o prazo extra de reposição de integrantes.';

function Footer() {
  return (
    <footer className={styles.footer}>
      <p>Desafio X · Programa de inovação acadêmica</p>
      <p>
        {formatLongDate(new Date())} · <Link to="/academico/duvidas">Regulamento e ajuda</Link>
      </p>
    </footer>
  );
}

/**
 * Minha equipe (task #11, Figma: 03 - Acadêmico › "Equipe — gerenciar", "Equipe — participante"
 * e "Equipe — sem líder / solicitar liderança"). Cada ação só aparece para quem tem permissão:
 * o líder gerencia; o participante consulta e pode sair; sem líder, pode solicitar a liderança.
 *
 * Fontes (docs/api/openapi.yaml):
 * - GET  /api/me/dashboard                      → equipe, is_leader, prazo e limite (PROPOSTO)
 * - GET  /api/teams/{id}                         → integrantes ativos
 * - GET/POST /api/teams/{id}/invitations         → convites (líder)
 * - GET  /api/teams/{id}/join-requests           → solicitações recebidas (líder)
 * - POST /api/join-requests/{id}/respond         → aprovar/recusar
 * - POST /api/teams/{id}/leadership-transfer     → transferir liderança
 * - POST /api/teams/{id}/leave                   → sair (PROPOSTO, P-25)
 * - GET/POST /api/teams/{id}/leadership-requests → solicitar liderança (sem líder)
 * Propostas pendentes no back-end: editar equipe, remover integrante, cancelar convite,
 * Team.description, Team.previous_leader e JoinRequest.message (ver api/README.md).
 */
export function MyTeamPage() {
  const dashboard = useStudentDashboard();
  const dashboardTeam = dashboard.data?.team ?? null;
  const teamQuery = useTeam(dashboardTeam?.id);
  const team = teamQuery.data ?? dashboardTeam;
  const mode = team ? getTeamViewMode(team, dashboard.data?.is_leader === true) : 'MEMBER';

  usePageHeader('Minha equipe', team ? SUBTITLE[mode] : undefined);

  if (dashboard.isPending) {
    return (
      <div className={`page-flush ${styles.page}`}>
        <Spinner label="Carregando sua equipe…" />
      </div>
    );
  }

  if (dashboard.isError) {
    return (
      <div className={`page-flush ${styles.page}`}>
        <Alert
          tone="danger"
          title="Não foi possível carregar sua equipe."
          action={
            <Button variant="secondary" size="small" onClick={() => void dashboard.refetch()}>
              Tentar de novo
            </Button>
          }
        >
          Verifique sua conexão e tente novamente.
        </Alert>
      </div>
    );
  }

  if (!team) {
    return (
      <div className={`page-flush ${styles.page}`}>
        <EmptyState
          title="Você ainda não participa de uma equipe"
          description="Crie uma equipe ou solicite entrada em uma equipe com vagas."
          action={<ButtonLink to="/academico/equipe/buscar">Encontrar equipe</ButtonLink>}
        />
        <Footer />
      </div>
    );
  }

  const formation = getFormationWindow(dashboard.data.stages.map((item) => item.stage));
  const maxMembers = dashboard.data.max_members ?? DEFAULT_MAX_MEMBERS;

  return (
    <MyTeamContent
      // Remonta ao trocar de papel (ex.: após transferir a liderança) e zera os diálogos.
      key={`${team.id}-${mode}`}
      team={team}
      mode={mode}
      formation={formation}
      maxMembers={maxMembers}
    />
  );
}

interface MyTeamContentProps {
  team: Team;
  mode: TeamViewMode;
  formation: FormationWindow;
  maxMembers: number;
}

function MyTeamContent({ team, mode, formation, maxMembers }: MyTeamContentProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const leader = mode === 'LEADER';
  const leaderless = mode === 'LEADERLESS';

  const invitations = useTeamInvitations(team.id, { enabled: leader });
  const joinRequests = useTeamJoinRequests(team.id, { enabled: leader });
  const leadershipRequests = useLeadershipRequests(team.id, { enabled: leaderless });
  const removeMember = useRemoveMember(team.id);
  const leaveTeam = useLeaveTeam(team.id);
  const requestLeadership = useCreateLeadershipRequest(team.id);

  const [editOpen, setEditOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaveBelowMinMsg, setLeaveBelowMinMsg] = useState<string | null>(null);
  const [mustTransferOpen, setMustTransferOpen] = useState(false);
  const [leadershipOpen, setLeadershipOpen] = useState(false);
  const [removing, setRemoving] = useState<TeamMember | null>(null);

  const currentLeader = findLeader(team);
  const self = useMemo(
    () =>
      findSelf(team.members, user) ??
      // Sem correspondência pela sessão, o líder da visão do líder é o próprio aluno.
      (leader ? currentLeader : null),
    [team.members, user, leader, currentLeader],
  );
  const others = team.members.filter((member) => member.role !== 'LEADER');
  const count = team.members.length;
  const locked = isFormationLocked(formation);
  const extendedActive = hasActiveExtension(team.formation_extended_until);
  const inviteLocked = locked && !extendedActive;
  const leaveLocked = locked || extendedActive;
  const full = availableSlots(count, maxMembers) === 0;
  const pendingLeadership = pendingLeadershipRequest(leadershipRequests.data);

  const pendingInvitations = invitations.data ?? [];
  const pendingRequests = joinRequests.data ?? [];
  const pendingLoading = invitations.isPending || joinRequests.isPending;

  const facts: TeamFact[] = [
    { label: 'Integrantes', value: describeMemberCount(count, maxMembers) },
    { label: 'Vagas disponíveis', value: describeSlots(count, maxMembers) },
    leader
      ? {
          label: 'Pendências',
          value: pendingLoading
            ? '…'
            : describePendingSummary(pendingInvitations.length, pendingRequests.length),
        }
      : { label: 'Liderança', value: currentLeader?.student.name ?? 'Sem líder' },
    {
      label: 'Formação da equipe',
      value: describeFormation(formation, team.formation_extended_until),
    },
  ];

  function handleLeaveClick() {
    // O líder só sai depois de transferir a liderança (RF27); sozinho, a API decide.
    if (leader && others.length > 0) setMustTransferOpen(true);
    else setLeaveOpen(true);
  }

  function confirmLeave(confirm = false) {
    leaveTeam.mutate(confirm, {
      onSuccess: () => {
        notify.success(`Você saiu da equipe ${team.name}.`);
        setLeaveOpen(false);
        setLeaveBelowMinMsg(null);
        navigate('/academico/equipe/buscar');
      },
      onError: (error) => {
        const apiError = getApiError(error);
        if (!confirm && apiError?.code === 'leave_below_minimum') {
          setLeaveOpen(false);
          setLeaveBelowMinMsg(
            apiError.message ||
              'Sua saída deixará a equipe abaixo do mínimo de integrantes. Confirme para sair.',
          );
          return;
        }
        setLeaveOpen(false);
        setLeaveBelowMinMsg(null);
        notify.error(describeMyTeamError(error, 'Não foi possível sair da equipe.'));
      },
    });
  }

  function confirmRemove() {
    if (!removing) return;
    const member = removing;
    removeMember.mutate(member.id, {
      onSuccess: () => {
        notify.success(`${member.student.name} foi removido da equipe.`);
        setRemoving(null);
      },
      onError: (error) => {
        setRemoving(null);
        notify.error(describeMyTeamError(error, 'Não foi possível remover o integrante.'));
      },
    });
  }

  function confirmLeadershipRequest(justification?: string) {
    requestLeadership.mutate(justification ?? '', {
      onSuccess: () => {
        notify.success('Solicitação de liderança enviada ao professor do curso.');
        setLeadershipOpen(false);
      },
      onError: (error) =>
        notify.error(describeMyTeamError(error, 'Não foi possível solicitar a liderança.')),
    });
  }

  return (
    <div className={`page-flush ${styles.page}`}>
      <TeamInfoCard
        team={team}
        mode={mode}
        facts={facts}
        onEdit={leader ? () => setEditOpen(true) : undefined}
      />

      {extendedActive && team.formation_extended_until && (
        <Alert tone="warning" title={describeExtendedUntil(team.formation_extended_until)}>
          A equipe recebeu 48 horas extras para repor vagas. Convites e aprovações permanecem
          liberados até o novo limite, mas saídas ficam bloqueadas.
        </Alert>
      )}

      {leaderless && (
        <LeaderlessNotice
          previousLeaderName={team.previous_leader?.name}
          pendingRequest={pendingLeadership}
          onRequest={() => setLeadershipOpen(true)}
          disabled={leadershipRequests.isPending}
        />
      )}

      <div className={styles.columns}>
        <div className={styles.mainColumn}>
          <MyTeamMembersCard
            members={team.members}
            maxMembers={maxMembers}
            selfMemberId={self?.id}
            manage={leader}
            removeDisabled={leaveLocked || removeMember.isPending}
            onRemove={setRemoving}
          />
          {leader && (
            <LeaderPermissionsCard
              onTransfer={() => setTransferOpen(true)}
              onLeave={handleLeaveClick}
              transferDisabled={others.length === 0}
              leaveDisabled={leaveLocked}
            />
          )}
        </div>

        <div className={styles.sideColumn}>
          {leader ? (
            <>
              <InviteStudentCard
                teamId={team.id}
                code={team.code}
                disabled={inviteLocked || full}
                disabledReason={inviteLocked ? LOCKED_HINT : 'A equipe já está completa.'}
              />
              <TeamPendingCard
                teamId={team.id}
                joinRequests={pendingRequests}
                invitations={pendingInvitations}
                approveDisabled={inviteLocked || full}
                loading={pendingLoading}
              />
            </>
          ) : (
            <>
              <ParticipationCard
                leaderName={currentLeader?.student.name ?? null}
                onLeave={handleLeaveClick}
                leaveDisabled={leaveLocked}
                leaveHint={extendedActive ? EXTENDED_LEAVE_HINT : locked ? LOCKED_HINT : undefined}
              />
              {mode === 'MEMBER' && (
                <section className={styles.card} aria-labelledby="team-formation">
                  <h2 id="team-formation" className={styles.cardTitle}>
                    {inviteLocked
                      ? 'Formação encerrada'
                      : extendedActive
                        ? 'Prazo extra para reposição'
                        : 'Equipe em formação'}
                  </h2>
                  <p className={styles.text}>
                    {inviteLocked
                      ? 'A composição da equipe não pode mais ser alterada.'
                      : full
                        ? 'A equipe está completa.'
                        : `A equipe tem ${describeSlots(count, maxMembers)}. A entrada de novos integrantes é gerenciada pela liderança.`}
                  </p>
                </section>
              )}
            </>
          )}
        </div>
      </div>

      <Footer />

      {leader && (
        <>
          <EditTeamDialog team={team} open={editOpen} onOpenChange={setEditOpen} />
          <TransferLeadershipDialog
            teamId={team.id}
            candidates={others}
            open={transferOpen}
            onOpenChange={setTransferOpen}
          />
          <ConfirmDialog
            open={mustTransferOpen}
            onOpenChange={setMustTransferOpen}
            title="Transfira a liderança antes de sair"
            description="Como líder, você só pode sair da equipe depois de passar a liderança a outro integrante."
            confirmLabel="Transferir liderança"
            onConfirm={() => {
              setMustTransferOpen(false);
              setTransferOpen(true);
            }}
          />
          <ConfirmDialog
            open={removing !== null}
            onOpenChange={(open) => !open && setRemoving(null)}
            title={`Remover ${removing?.student.name ?? 'integrante'}?`}
            description="O estudante deixará a equipe e a vaga ficará disponível. Os envios já feitos continuam vinculados à equipe."
            confirmLabel="Remover"
            tone="danger"
            loading={removeMember.isPending}
            onConfirm={confirmRemove}
          />
        </>
      )}

      {leaderless && (
        <ConfirmDialog
          open={leadershipOpen}
          onOpenChange={setLeadershipOpen}
          title="Solicitar liderança"
          description="Um professor do curso do desafio vai analisar o pedido. Seu papel só muda se ele for aprovado."
          confirmLabel="Enviar solicitação"
          loading={requestLeadership.isPending}
          reason={{
            label: 'Justificativa *',
            placeholder: 'Explique por que você deve assumir a liderança.',
          }}
          onConfirm={confirmLeadershipRequest}
        />
      )}

      <ConfirmDialog
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        title="Sair da equipe?"
        description={`Você deixará a equipe ${team.name}. Seus envios permanecem vinculados à equipe após a saída.`}
        confirmLabel="Sair da equipe"
        tone="danger"
        loading={leaveTeam.isPending}
        onConfirm={() => confirmLeave(false)}
      />

      <ConfirmDialog
        open={leaveBelowMinMsg !== null}
        onOpenChange={(open) => !open && setLeaveBelowMinMsg(null)}
        title="Equipe abaixo do mínimo"
        description={leaveBelowMinMsg ?? ''}
        confirmLabel="Confirmar saída"
        tone="danger"
        loading={leaveTeam.isPending}
        onConfirm={() => confirmLeave(true)}
      />
    </div>
  );
}
