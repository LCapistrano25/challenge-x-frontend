import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { usePageHeader } from '@/shared/lib/page-header';
import { Alert, ButtonLink } from '@/shared/ui';
import { AvailableTeamsPanel } from '../components/AvailableTeamsPanel';
import { CreateTeamCard } from '../components/CreateTeamCard';
import { JoinByCodeCard } from '../components/JoinByCodeCard';
import { useStudentDashboard } from '../hooks/useStudentDashboard';
import { useMyPendingJoinRequests } from '../hooks/useTeamFormation';
import {
  formatDate,
  formatLongDate,
  getFormationWindow,
  type FormationWindow,
} from '../lib/team-formation';
import type { JoinRequest } from '../types';
import styles from '../components/FindTeam.module.css';

const ROLE_RULE =
  'Ao criar uma equipe você será líder; ao aceitar um convite ou ter uma solicitação aprovada, será participante.';

function remaining(days: number) {
  if (days <= 0) return 'Hoje é o último dia.';
  return days === 1 ? 'Resta 1 dia.' : `Restam ${days} dias.`;
}

/** Faixa "Orientação" do Figma (551:11888) ou aviso quando a formação não está aberta. */
function FormationNotice({ formation }: { formation: FormationWindow }) {
  if (formation.status === 'CLOSED' && formation.endsAt) {
    return (
      <Alert
        tone="warning"
        title={`O prazo de formação terminou em ${formatDate(formation.endsAt)}.`}
      >
        Não é mais possível criar equipes nem solicitar entrada nesta edição.
      </Alert>
    );
  }
  if (formation.status === 'UPCOMING' && formation.startsAt) {
    return (
      <Alert
        tone="info"
        title={`A formação de equipes começa em ${formatDate(formation.startsAt)}.`}
      >
        Até lá, você pode conhecer as equipes. Criar e solicitar entrada ficam liberados na
        abertura.
      </Alert>
    );
  }
  return (
    <div className={styles.notice} role="status">
      <p className={styles.noticeTitle}>
        Você ainda está sem equipe
        {formation.endsAt && ` · Formação até ${formatDate(formation.endsAt)}`}
      </p>
      <p className={styles.noticeText}>
        {formation.daysLeft != null ? `${remaining(formation.daysLeft)} ${ROLE_RULE}` : ROLE_RULE}
      </p>
    </div>
  );
}

/**
 * Encontre sua equipe (task #10, Figma: 03 - Acadêmico › "Equipe — criar ou entrar").
 * Fontes (docs/api/openapi.yaml):
 * - GET  /api/me/dashboard                 → equipe atual e prazo de formação (PROPOSTO, P-23)
 * - POST /api/teams                         → criar equipe (o criador vira LEADER)
 * - GET  /api/teams                         → equipes com vagas (search, page, page_size)
 * - POST /api/teams/{team_id}/join-requests → solicitar entrada
 * - GET  /api/me/join-requests?status=PENDING → "Solicitação enviada"
 * Propostas pendentes no back-end: área de interesse, apresentação e líder da equipe,
 * filtro por área e cancelamento da solicitação (ver api/README.md).
 */
export function FindTeamPage() {
  usePageHeader(
    'Encontre sua equipe',
    'Crie um novo grupo ou participe de uma equipe com vagas disponíveis.',
  );
  const navigate = useNavigate();
  const { user } = useAuth();
  const dashboard = useStudentDashboard();
  const team = dashboard.data?.team ?? null;
  const pending = useMyPendingJoinRequests({ enabled: !team });

  const formation = useMemo<FormationWindow>(
    () =>
      dashboard.data
        ? getFormationWindow(dashboard.data.stages.map((item) => item.stage))
        : { status: 'UNKNOWN', startsAt: null, endsAt: null, daysLeft: null },
    [dashboard.data],
  );

  const pendingByTeam = useMemo(
    () => new Map<number, JoinRequest>((pending.data ?? []).map((r) => [r.team.id, r])),
    [pending.data],
  );

  // Regra: uma equipe por edição; fora do prazo de formação as ações ficam bloqueadas.
  const blocked = Boolean(team) || formation.status === 'CLOSED' || formation.status === 'UPCOMING';

  return (
    <div className={`page-flush ${styles.page}`}>
      {team ? (
        <Alert
          tone="info"
          title={`Você já participa da equipe ${team.name}.`}
          action={
            <ButtonLink to="/academico/equipe" size="small">
              Ver minha equipe
            </ButtonLink>
          }
        >
          Cada estudante pode participar de apenas uma equipe por edição.
        </Alert>
      ) : (
        <FormationNotice formation={formation} />
      )}

      <div className={styles.columns}>
        <div className={styles.sideColumn}>
          <CreateTeamCard
            studentName={user?.name}
            maxMembers={dashboard.data?.max_members}
            disabled={blocked}
            onCreated={() => navigate('/academico/equipe')}
          />
          <JoinByCodeCard pendingByTeam={pendingByTeam} disabled={blocked} />
        </div>
        <AvailableTeamsPanel pendingByTeam={pendingByTeam} blocked={blocked} />
      </div>

      <footer className={styles.footer}>
        <p>Desafio X · Programa de inovação acadêmica</p>
        <p>
          {formatLongDate(new Date())} · <Link to="/academico/duvidas">Regulamento e ajuda</Link>
        </p>
      </footer>
    </div>
  );
}
