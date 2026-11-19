import { cn } from '@/shared/lib/cn';
import { Avatar, Button, ButtonLink, toneAt } from '@/shared/ui';
import {
  CREATE_TEAM_HREF,
  FIND_TEAMS_HREF,
  describeInvitationOrigin,
  describeInvitationSlots,
  describeInvitationTiming,
  describeInvitationsCount,
  describeSentRequest,
  describeTeamlessDeadline,
} from '../lib/no-team-home';
import { formatDayMonth } from '../lib/team-formation';
import type { Invitation, JoinRequest } from '../types';
import { IconChatOutline, IconEventBusy, IconUserCircleFilled } from './icons';
import { StatCard } from './TeamStatusCards';
import { TeamTag } from './TeamTag';
import homeStyles from './TeamHome.module.css';
import styles from './NoTeamHome.module.css';

/** Figma 551:11736 — Sua participação · Convites recebidos · Prazo. */
export function NoTeamStatusCards({
  invitationsCount,
  formationDeadline,
  today,
}: {
  invitationsCount: number;
  formationDeadline: string | null;
  today?: Date;
}) {
  const deadline = describeTeamlessDeadline(formationDeadline, today);
  return (
    <ul className={homeStyles.stats} aria-label="Sua situação na formação de equipes">
      <StatCard
        icon={<IconUserCircleFilled />}
        title="Sua participação"
        value="Sem equipe"
        description="Escolha uma equipe para começar"
      />
      <StatCard
        icon={<IconChatOutline />}
        title="Convites recebidos"
        value={invitationsCount}
        description={describeInvitationsCount(invitationsCount)}
      />
      <StatCard
        icon={<IconEventBusy />}
        title="Prazo"
        value={deadline.value}
        description={deadline.description}
      />
    </ul>
  );
}

/** Figma 551:11762 — "Seu desafio começa com uma equipe". */
export function TeamStartCard({ className }: { className?: string }) {
  return (
    <section className={cn(styles.card, className)} aria-labelledby="team-start-title">
      <div className={styles.cardHeader}>
        <h2 id="team-start-title" className={styles.title}>
          Seu desafio começa com uma equipe
        </h2>
        <TeamTag tone="neutral">Sem equipe</TeamTag>
      </div>
      <p className={styles.text}>
        Conecte diferentes conhecimentos e transforme uma ideia em projeto. Crie sua equipe ou
        encontre um grupo que combine com seus interesses.
      </p>
      <div className={styles.actions}>
        <ButtonLink to={CREATE_TEAM_HREF} size="large">
          Criar minha equipe
        </ButtonLink>
        <ButtonLink to={FIND_TEAMS_HREF} variant="secondary" size="large">
          Encontrar equipes
        </ButtonLink>
      </div>
      <p className={styles.caption}>
        Você pode participar de apenas uma equipe. O projeto será liberado após sua entrada.
      </p>
    </section>
  );
}

export interface InvitationsCardProps {
  invitations: Invitation[];
  /** Solicitação de entrada PENDING enviada pelo aluno (no máximo uma é exibida). */
  sentRequest: JoinRequest | null;
  formationDeadline: string | null;
  /** Convite com resposta em andamento (desabilita os botões dele). */
  busyInvitationId?: number | null;
  cancellingRequest?: boolean;
  onRespond: (invitation: Invitation, status: 'ACCEPTED' | 'DECLINED') => void;
  onCancelRequest: (request: JoinRequest) => void;
}

/** Figma 551:11784 — "Convites e solicitações". */
export function InvitationsCard({
  invitations,
  sentRequest,
  formationDeadline,
  busyInvitationId,
  cancellingRequest,
  onRespond,
  onCancelRequest,
}: InvitationsCardProps) {
  return (
    <section className={styles.card} aria-labelledby="invitations-title">
      <h2 id="invitations-title" className={styles.title}>
        Convites e solicitações
      </h2>

      {invitations.length === 0 && !sentRequest && (
        <p className={styles.text}>
          Nenhum convite ou solicitação no momento. Quando uma equipe convidar você, o convite
          aparece aqui.
        </p>
      )}

      {invitations.length > 0 && (
        <ul className={styles.invitations}>
          {invitations.map((invitation, index) => {
            const slots = describeInvitationSlots(invitation);
            const busy = busyInvitationId === invitation.id;
            const inviter = invitation.invited_by?.name ?? invitation.team.name;
            return (
              <li key={invitation.id} className={styles.invitation}>
                <div className={styles.invitationHeader}>
                  <h3 className={styles.teamName}>{invitation.team.name}</h3>
                  {slots && <TeamTag tone="primary">{slots}</TeamTag>}
                </div>
                <div className={styles.person}>
                  <Avatar name={inviter} tone={toneAt(index)} />
                  <div className={styles.personText}>
                    <span className={styles.personName}>{inviter}</span>
                    <span className={styles.personMeta}>
                      {describeInvitationOrigin(invitation)}
                    </span>
                  </div>
                </div>
                <div className={styles.invitationFooter}>
                  <span className={styles.caption}>
                    {describeInvitationTiming(invitation, formationDeadline)}
                  </span>
                  <div className={styles.invitationActions}>
                    <Button
                      variant="ghost"
                      size="large"
                      disabled={busy}
                      onClick={() => onRespond(invitation, 'DECLINED')}
                      aria-label={`Recusar convite da equipe ${invitation.team.name}`}
                    >
                      Recusar
                    </Button>
                    <Button
                      size="large"
                      loading={busy}
                      onClick={() => onRespond(invitation, 'ACCEPTED')}
                      aria-label={`Aceitar convite da equipe ${invitation.team.name}`}
                    >
                      Aceitar convite
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {sentRequest && (
        <div className={styles.sentRequest}>
          <div className={styles.sentRequestText}>
            <p className={styles.small}>
              Sua solicitação para a equipe {sentRequest.team.name} está aguardando aprovação.
            </p>
            <p className={styles.caption}>{describeSentRequest(sentRequest)}</p>
          </div>
          <Button
            variant="ghost"
            size="large"
            loading={cancellingRequest}
            onClick={() => onCancelRequest(sentRequest)}
          >
            Cancelar solicitação
          </Button>
        </div>
      )}
    </section>
  );
}

/** Figma 551:11832 — "Seu caminho no Desafio X" (a etapa atual fica em destaque). */
export function JourneyCard({ formationDeadline }: { formationDeadline: string | null }) {
  const steps = [
    {
      title: 'Forme sua equipe',
      text: formationDeadline
        ? `Crie ou entre em uma equipe até ${formatDayMonth(formationDeadline)}.`
        : 'Crie ou entre em uma equipe.',
    },
    { title: 'Cadastre o projeto', text: 'Definam juntos o problema e a solução.' },
    { title: 'Desenvolva e entregue', text: 'Acompanhem os prazos de cada etapa.' },
  ];
  return (
    <section className={styles.card} aria-labelledby="journey-title">
      <h2 id="journey-title" className={styles.title}>
        Seu caminho no Desafio X
      </h2>
      <ol className={styles.journey}>
        {steps.map((step, index) => (
          <li
            key={step.title}
            className={styles.journeyStep}
            aria-current={index === 0 ? 'step' : undefined}
          >
            <span className={cn(styles.journeyTitle, index === 0 && styles.journeyCurrent)}>
              <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span> {step.title}
            </span>
            <span className={styles.small}>{step.text}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
