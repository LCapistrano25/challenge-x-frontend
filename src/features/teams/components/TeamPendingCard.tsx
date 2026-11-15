import { Fragment } from 'react';
import { Avatar, Button, notify } from '@/shared/ui';
import { useCancelInvitation, useRespondJoinRequest } from '../hooks/useMyTeam';
import {
  describeInvitationMeta,
  describeJoinRequestMeta,
  describeMyTeamError,
  invitationLabel,
} from '../lib/my-team';
import type { Invitation, JoinRequest } from '../types';
import { TeamTag } from './TeamTag';
import styles from './MyTeam.module.css';

export interface TeamPendingCardProps {
  teamId: number;
  joinRequests: JoinRequest[];
  invitations: Invitation[];
  /** Aprovar exige formação aberta e vaga; recusar e cancelar seguem liberados. */
  approveDisabled?: boolean;
  loading?: boolean;
}

/** Figma: "Pendências (3)" (551:12152) — solicitações recebidas e convites enviados. */
export function TeamPendingCard({
  teamId,
  joinRequests,
  invitations,
  approveDisabled,
  loading,
}: TeamPendingCardProps) {
  const respond = useRespondJoinRequest(teamId);
  const cancel = useCancelInvitation(teamId);
  const total = joinRequests.length + invitations.length;

  function answer(request: JoinRequest, status: 'APPROVED' | 'REJECTED') {
    respond.mutate(
      { id: request.id, status },
      {
        onSuccess: () =>
          notify.success(
            status === 'APPROVED'
              ? `${request.student.name} agora faz parte da equipe.`
              : `Solicitação de ${request.student.name} recusada.`,
          ),
        onError: (error) =>
          notify.error(describeMyTeamError(error, 'Não foi possível responder à solicitação.')),
      },
    );
  }

  function cancelInvitation(invitation: Invitation) {
    cancel.mutate(invitation.id, {
      onSuccess: () => notify.success(`Convite para ${invitationLabel(invitation)} cancelado.`),
      onError: (error) =>
        notify.error(describeMyTeamError(error, 'Não foi possível cancelar o convite.')),
    });
  }

  const busyRequest = respond.isPending ? respond.variables?.id : undefined;
  const busyInvitation = cancel.isPending ? cancel.variables : undefined;

  return (
    <section className={styles.card} aria-labelledby="team-pending">
      <h2 id="team-pending" className={styles.cardTitle}>
        Pendências ({total})
      </h2>

      {loading ? (
        <p className={styles.text}>Carregando pendências…</p>
      ) : total === 0 ? (
        <p className={styles.text}>Nenhum convite ou solicitação aguardando resposta.</p>
      ) : (
        <ul className={styles.pendingList}>
          {joinRequests.map((request) => (
            <li
              key={`r${request.id}`}
              className={styles.joinRequest}
              aria-label={request.student.name}
            >
              <TeamTag tone="attention">Solicitação recebida</TeamTag>
              <div className={styles.person}>
                <Avatar name={request.student.name} tone="orange" />
                <div className={styles.personText}>
                  <span className={styles.personName}>{request.student.name}</span>
                  <span className={styles.personMeta}>
                    {describeJoinRequestMeta(request.student.course.name, request.created_at)}
                  </span>
                </div>
              </div>
              {request.message && <p className={styles.text}>“{request.message}”</p>}
              <div className={styles.answer}>
                <Button
                  size="large"
                  className={styles.action}
                  onClick={() => answer(request, 'APPROVED')}
                  loading={busyRequest === request.id && respond.variables?.status === 'APPROVED'}
                  disabled={approveDisabled || busyRequest === request.id}
                >
                  Aprovar
                </Button>
                <Button
                  variant="ghost"
                  size="large"
                  className={styles.action}
                  onClick={() => answer(request, 'REJECTED')}
                  disabled={busyRequest === request.id}
                >
                  Recusar
                </Button>
              </div>
            </li>
          ))}

          {invitations.map((invitation, index) => (
            <Fragment key={`i${invitation.id}`}>
              {index === 0 && joinRequests.length > 0 && (
                <li className={styles.divider} aria-hidden="true" />
              )}
              <li className={styles.invitation} aria-label={invitationLabel(invitation)}>
                <div className={styles.person}>
                  <Avatar name={invitationLabel(invitation)} tone="blue" />
                  <div className={styles.personText}>
                    <span className={styles.personName}>{invitationLabel(invitation)}</span>
                    <span className={styles.personMeta}>
                      {describeInvitationMeta(invitation.created_at)}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="large"
                  className={styles.action}
                  onClick={() => cancelInvitation(invitation)}
                  loading={busyInvitation === invitation.id}
                  aria-label={`Cancelar convite para ${invitationLabel(invitation)}`}
                >
                  Cancelar
                </Button>
              </li>
            </Fragment>
          ))}
        </ul>
      )}
    </section>
  );
}
