import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DEFAULT_MAX_MEMBERS,
  describeMembersBadge,
  describeSlotsTitle,
  findLeader,
  formatLongDate,
  orderMembers,
  useStudentDashboard,
  useTeam,
  type Team,
} from '@/features/teams';
import { usePageHeader } from '@/shared/lib/page-header';
import { Alert, Button, ButtonLink, EmptyState, Spinner, notify } from '@/shared/ui';
import { EvaluationTag } from '../components/EvaluationTag';
import { MemberEvaluationForm } from '../components/MemberEvaluationForm';
import { MemberEvaluationList } from '../components/MemberEvaluationList';
import { useCreateMemberNote, useMemberNotesSummary } from '../hooks/useMemberEvaluation';
import {
  EMPTY_DRAFT,
  describeMemberNoteError,
  getEvaluationStatus,
  memberTone,
  toMemberNoteCreate,
} from '../lib/member-evaluation';
import type { MemberEvaluationDraft, MemberEvaluationStatus } from '../types';
import styles from '../components/MemberEvaluation.module.css';

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
 * Avaliação de membro (task #14, Figma: 03 - Acadêmico › "Equipe — avaliação de membro").
 * Exclusiva do líder: lista os integrantes (sem o próprio líder) com a situação da avaliação e
 * o formulário com 4 critérios de 1 a 5 e comentário.
 *
 * Fontes (docs/api/openapi.yaml):
 * - GET  /api/me/dashboard                        → equipe, is_leader e limite (PROPOSTO, P-23)
 * - GET  /api/teams/{id}                          → integrantes ativos
 * - POST /api/teams/{id}/member-notes             → envio da avaliação (RF33, confirmado)
 * - GET  /api/teams/{id}/member-notes/summary     → integrantes já avaliados (PROPOSTA)
 * Os critérios são exemplos do protótipo (ver api/README.md).
 */
export function MemberEvaluationPage() {
  usePageHeader('Avaliação de membro', 'Avalie a participação dos integrantes da sua equipe.');

  const dashboard = useStudentDashboard();
  const dashboardTeam = dashboard.data?.team ?? null;
  const teamQuery = useTeam(dashboardTeam?.id);
  const team = teamQuery.data ?? dashboardTeam;

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
          description="A avaliação de membros fica disponível para o líder de uma equipe."
          action={<ButtonLink to="/academico/equipe/buscar">Encontrar equipe</ButtonLink>}
        />
        <Footer />
      </div>
    );
  }

  if (!dashboard.data.is_leader) {
    return (
      <div className={`page-flush ${styles.page}`}>
        <EmptyState
          title="Avaliação exclusiva da liderança"
          description="Somente o líder da equipe avalia a participação dos integrantes."
          action={<ButtonLink to="/academico/equipe">Ver minha equipe</ButtonLink>}
        />
        <Footer />
      </div>
    );
  }

  return (
    <MemberEvaluationContent
      team={team}
      maxMembers={dashboard.data.max_members ?? DEFAULT_MAX_MEMBERS}
    />
  );
}

interface MemberEvaluationContentProps {
  team: Team;
  maxMembers: number;
}

function MemberEvaluationContent({ team, maxMembers }: MemberEvaluationContentProps) {
  const summary = useMemberNotesSummary(team.id);
  const createNote = useCreateMemberNote(team.id);
  const [drafts, setDrafts] = useState<Record<number, MemberEvaluationDraft>>({});
  const [selection, setSelection] = useState<number | null>(null);

  const leader = findLeader(team);
  // O líder não avalia a si mesmo (critério da task: "excluindo o próprio líder").
  const members = useMemo(
    () => orderMembers(team.members).filter((member) => member.role !== 'LEADER'),
    [team.members],
  );
  const sentById = useMemo(
    () => new Map((summary.data ?? []).map((item) => [item.member_id, item])),
    [summary.data],
  );
  const statuses = useMemo(() => {
    const result: Record<number, MemberEvaluationStatus> = {};
    for (const member of members) {
      result[member.id] = getEvaluationStatus(sentById.has(member.id), drafts[member.id]);
    }
    return result;
  }, [members, sentById, drafts]);

  // Sem escolha do usuário, abre o primeiro integrante ainda não avaliado.
  const firstPending = members.find((member) => statuses[member.id] !== 'SENT') ?? members[0];
  const selectedId =
    selection != null && members.some((member) => member.id === selection)
      ? selection
      : (firstPending?.id ?? null);
  const selectedIndex = members.findIndex((member) => member.id === selectedId);
  const selected = selectedIndex >= 0 ? members[selectedIndex] : undefined;

  const count = team.members.length;
  const context = [
    describeMembersBadge(count),
    describeSlotsTitle(count, maxMembers),
    `Liderança: ${leader?.student.name ?? 'sem líder'}`,
  ].join(' · ');

  function handleSubmit() {
    if (!selected) return;
    const member = selected;
    const draft = drafts[member.id] ?? EMPTY_DRAFT;
    createNote.mutate(toMemberNoteCreate(member.id, draft), {
      onSuccess: () => {
        notify.success(`Avaliação de ${member.student.name} enviada.`);
        setDrafts((current) => {
          const rest = { ...current };
          delete rest[member.id];
          return rest;
        });
        // Segue para o próximo integrante ainda não avaliado.
        const next = members.find(
          (other) => other.id !== member.id && statuses[other.id] !== 'SENT',
        );
        setSelection(next?.id ?? member.id);
      },
      onError: (error) => notify.error(describeMemberNoteError(error)),
    });
  }

  return (
    <div className={`page-flush ${styles.page}`}>
      <section className={styles.context} aria-labelledby="member-evaluation-team">
        <div className={styles.contextTeam}>
          <h2 id="member-evaluation-team" className={styles.teamName}>
            {team.name}
          </h2>
          <p className={styles.text}>{context}</p>
        </div>
        <EvaluationTag tone="primary">Você é líder</EvaluationTag>
        <p className={`${styles.caption} ${styles.contextScope}`}>Exclusivo da liderança</p>
      </section>

      {summary.isError && (
        <Alert tone="warning" title="Não foi possível consultar as avaliações já enviadas.">
          A situação de cada integrante pode estar desatualizada. Você ainda pode enviar novas
          avaliações.
        </Alert>
      )}

      {members.length === 0 ? (
        <EmptyState
          title="Sua equipe ainda não tem outros integrantes"
          description="Quando novos estudantes entrarem na equipe, eles aparecerão aqui para avaliação."
          action={<ButtonLink to="/academico/equipe">Gerenciar equipe</ButtonLink>}
        />
      ) : (
        <div className={styles.columns}>
          <div className={styles.sideColumn}>
            <MemberEvaluationList
              members={members}
              statuses={statuses}
              selectedId={selectedId}
              onSelect={setSelection}
            />
            <div className={styles.about}>
              <p className={styles.aboutTitle}>Sobre este formulário</p>
              <p className={styles.caption}>
                Critérios e escala são exemplos de avaliação da participação acadêmica, não regras
                institucionais.
              </p>
            </div>
          </div>

          <div className={styles.mainColumn}>
            {selected && (
              <MemberEvaluationForm
                // Remonta ao trocar de integrante (ids e foco do formulário).
                key={selected.id}
                member={selected}
                tone={memberTone(selectedIndex)}
                draft={drafts[selected.id] ?? EMPTY_DRAFT}
                sent={sentById.get(selected.id) ?? null}
                onChange={(draft) => setDrafts((current) => ({ ...current, [selected.id]: draft }))}
                onSubmit={handleSubmit}
                submitting={createNote.isPending}
              />
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
