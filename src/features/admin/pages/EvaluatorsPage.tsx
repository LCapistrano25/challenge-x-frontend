import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Alert,
  Button,
  ButtonLink,
  EmptyState,
  IconUserPlus,
  Pagination,
  Select,
  Spinner,
  TextField,
  notify,
} from '@/shared/ui';
import { LinkEvaluatorDialog } from '../components/setup/LinkEvaluatorDialog';
import { InvitationPill } from '../components/setup/RegistryParts';
import registry from '../components/setup/Registry.module.css';
import {
  Indicator,
  Notice,
  SetupCard,
  SetupContext,
  SetupFooter,
} from '../components/setup/SetupParts';
import styles from '../components/setup/Setup.module.css';
import { useAdminEdition } from '../hooks/useAdminEdition';
import { useEditionEvaluators, useResendInvitation } from '../hooks/useEvaluators';
import { useSetupHeader } from '../hooks/useSetupHeader';
import { editionLabel } from '../lib/editions';
import { describeSetupError } from '../lib/errors';
import {
  EVALUATORS_PATH,
  INVITATION_FILTER_OPTIONS,
  assignmentsSummary,
  evaluatorCounts,
  filterEvaluators,
  invitationStatus,
} from '../lib/evaluators';
import type { EditionEvaluator } from '../types';

const PAGE_SIZE = 5;

/**
 * Avaliadores externos da edição (Figma: "Avaliadores - listagem" e "Avaliadores - estado
 * vazio"): convites, atribuições e o vínculo de quem já está no catálogo.
 */
export function EvaluatorsPage() {
  useSetupHeader('Avaliadores externos', 'AVALIADORES');
  const editionState = useAdminEdition();
  const { edition, editions } = editionState;
  const query = useEditionEvaluators(edition?.id);
  const resend = useResendInvitation();
  const [search, setSearch] = useState('');
  const [invitation, setInvitation] = useState('');
  const [page, setPage] = useState(1);
  const [linking, setLinking] = useState(false);

  const evaluators = query.data ?? [];
  const counts = evaluatorCounts(evaluators);
  const filtered = filterEvaluators(evaluators, { search, invitation });
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const editable = edition?.status !== 'CLOSED';
  const editionName = edition ? editionLabel(edition, editions) : '';

  function handleResend(item: EditionEvaluator) {
    if (!edition) return;
    resend.mutate(
      { editionId: edition.id, evaluatorId: item.evaluator.user_id },
      {
        onSuccess: () => notify.success(`Convite reenviado para ${item.evaluator.email}.`),
        onError: (error) =>
          notify.error(describeSetupError(error, 'Não foi possível reenviar o convite.')),
      },
    );
  }

  const linkButton = editable && (
    <Button variant="secondary" size="large" onClick={() => setLinking(true)}>
      Vincular avaliador existente
    </Button>
  );

  let content;
  if (editionState.isLoading || (edition && query.isPending)) {
    content = (
      <div className={styles.state}>
        <Spinner label="Carregando os avaliadores…" />
      </div>
    );
  } else if (editionState.isError || query.isError) {
    content = (
      <Alert
        tone="danger"
        title="Não foi possível carregar os avaliadores."
        action={
          <Button size="small" variant="secondary" onClick={() => void query.refetch()}>
            Tentar de novo
          </Button>
        }
      >
        {describeSetupError(
          query.error ?? editionState.error,
          'Verifique sua conexão e tente novamente.',
        )}
      </Alert>
    );
  } else if (!edition) {
    content = (
      <EmptyState
        title="Nenhuma edição cadastrada"
        description="Cadastre uma edição para vincular avaliadores externos."
      />
    );
  } else if (evaluators.length === 0) {
    content = (
      <>
        <SetupCard
          title="Avaliadores da edição"
          subtitle="0 avaliadores vinculados • 0 convites enviados"
        >
          <div className={registry.empty}>
            <span className={registry.emptyIcon}>
              <IconUserPlus size={40} />
            </span>
            <h3 className={registry.emptyTitle}>Vincule os avaliadores da edição</h3>
            <p className={registry.emptyText}>
              Cadastre um profissional externo ou vincule alguém já existente no catálogo. Depois do
              aceite, atribua equipes e etapas de acordo com a especialidade.
            </p>
            {editable && (
              <div className={registry.inlineButtons}>
                <ButtonLink to={`${EVALUATORS_PATH}/novo`} size="large">
                  Cadastrar avaliador externo
                </ButtonLink>
                {linkButton}
              </div>
            )}
          </div>
        </SetupCard>
        {edition.status === 'SETUP' && (
          <Notice tone="warning" title="Vínculos necessários para concluir a configuração">
            A edição não poderá ser publicada sem a revisão dos avaliadores.
          </Notice>
        )}
      </>
    );
  } else {
    content = (
      <>
        <div className={styles.summary}>
          <Indicator
            label="Vinculados à edição"
            value={counts.linked}
            caption="Especialidades complementares"
          />
          <Indicator
            label="Convites aceitos"
            value={counts.accepted}
            caption="Disponíveis para atribuição"
          />
          <Indicator
            label="Convites pendentes"
            value={counts.pending}
            caption="Aguardam confirmação"
          />
        </div>

        <SetupCard
          title={`Avaliadores de ${edition.year}`}
          subtitle={editionName}
          aside={linkButton}
        >
          <div className={styles.filters}>
            <TextField
              label="Buscar"
              type="search"
              placeholder="Buscar nome ou organização"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
            <Select
              label="Filtrar por convite"
              value={invitation}
              options={[{ value: '', label: 'Todos os convites' }, ...INVITATION_FILTER_OPTIONS]}
              onChange={(event) => {
                setInvitation(event.target.value);
                setPage(1);
              }}
            />
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              title="Nenhum avaliador encontrado"
              description="Ajuste a busca ou o filtro de convites."
            />
          ) : (
            <div>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th scope="col">Nome</th>
                      <th scope="col">Organização</th>
                      <th scope="col">Edição</th>
                      <th scope="col">Atribuições</th>
                      <th scope="col">Convite</th>
                      <th scope="col">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((item) => {
                      const status = invitationStatus(item);
                      const manage = (
                        <Link
                          className={styles.link}
                          to={`${EVALUATORS_PATH}/${item.id}`}
                          aria-label={`Gerenciar ${item.evaluator.name}`}
                        >
                          Gerenciar
                        </Link>
                      );
                      return (
                        <tr key={item.id}>
                          <td>{item.evaluator.name}</td>
                          <td>{item.evaluator.institution ?? '—'}</td>
                          <td>{edition.year}</td>
                          <td className={status === 'ACCEPTED' ? undefined : styles.muted}>
                            {assignmentsSummary(item)}
                          </td>
                          <td>
                            <InvitationPill status={status} />
                          </td>
                          <td>
                            {status === 'ACCEPTED' || !editable ? (
                              manage
                            ) : (
                              <span className={registry.rowActions}>
                                <button
                                  type="button"
                                  className={styles.link}
                                  disabled={resend.isPending}
                                  onClick={() => handleResend(item)}
                                  aria-label={`Reenviar convite para ${item.evaluator.name}`}
                                >
                                  Reenviar convite
                                </button>
                                {manage}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className={styles.tableFooter}>
                <span>
                  {(current - 1) * PAGE_SIZE + 1}–{(current - 1) * PAGE_SIZE + visible.length} de{' '}
                  {filtered.length} {filtered.length === 1 ? 'avaliador' : 'avaliadores'}
                </span>
                <Pagination page={current} pageCount={pageCount} onPageChange={setPage} />
              </div>
            </div>
          )}
        </SetupCard>

        {counts.pending > 0 && (
          <Notice
            tone="warning"
            title={`${counts.pending} ${counts.pending === 1 ? 'convite precisa' : 'convites precisam'} de confirmação`}
          >
            Atribuições definitivas serão liberadas após o aceite do convite e a revisão dos
            vínculos.
          </Notice>
        )}
      </>
    );
  }

  return (
    <div className={styles.page}>
      <SetupContext
        crumbs={[
          { label: 'Início', to: '/admin' },
          { label: 'Avaliadores' },
          { label: 'Avaliadores externos' },
        ]}
        description={
          evaluators.length === 0 && edition && !query.isPending
            ? `Estado inicial dos vínculos • nenhum avaliador associado à edição ${edition.year}.`
            : 'Gerencie os convites e as atribuições dos avaliadores vinculados à edição.'
        }
        action={
          editable && edition && evaluators.length > 0 ? (
            <ButtonLink to={`${EVALUATORS_PATH}/novo`} size="large">
              Cadastrar avaliador
            </ButtonLink>
          ) : undefined
        }
      />

      {edition && !editable && (
        <Notice tone="info" title="Vínculos somente para consulta">
          A edição está encerrada; convites e atribuições não podem ser alterados.
        </Notice>
      )}

      {content}

      {edition && (
        <LinkEvaluatorDialog
          open={linking}
          onOpenChange={setLinking}
          edition={edition}
          linked={evaluators}
        />
      )}

      <SetupFooter edition={edition} />
    </div>
  );
}
