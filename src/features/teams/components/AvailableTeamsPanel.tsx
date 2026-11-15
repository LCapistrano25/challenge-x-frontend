import { useId, useState } from 'react';
import { Alert, Button, EmptyState, Input, Pagination, Select, Spinner } from '@/shared/ui';
import { cn } from '@/shared/lib/cn';
import { useDebouncedValue } from '@/shared/lib/use-debounced-value';
import { useAvailableTeams } from '../hooks/useTeamFormation';
import { INTEREST_AREA_OPTIONS, isInterestArea } from '../lib/team-formation';
import type { JoinRequest } from '../types';
import { AvailableTeamCard } from './AvailableTeamCard';
import styles from './FindTeam.module.css';

export const AVAILABLE_TEAMS_PAGE_SIZE = 10;

const AREA_FILTER_OPTIONS = [{ value: '', label: 'Todas as áreas' }, ...INTEREST_AREA_OPTIONS];

export interface AvailableTeamsPanelProps {
  pendingByTeam: ReadonlyMap<number, JoinRequest>;
  /** Prazo fora da formação ou aluno já em equipe: lista visível, ações bloqueadas. */
  blocked?: boolean;
}

/** Figma: "Equipes com vagas" (551:11927). GET /api/teams com busca, filtro e paginação. */
export function AvailableTeamsPanel({ pendingByTeam, blocked = false }: AvailableTeamsPanelProps) {
  const [search, setSearch] = useState('');
  const [area, setArea] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const titleId = useId();
  const searchId = useId();

  const teams = useAvailableTeams({
    search: debouncedSearch || undefined,
    interest_area: isInterestArea(area) ? area : undefined,
    page,
    page_size: AVAILABLE_TEAMS_PAGE_SIZE,
  });

  const count = teams.data?.count ?? 0;
  const pageCount = Math.ceil(count / AVAILABLE_TEAMS_PAGE_SIZE);
  const filtered = Boolean(debouncedSearch || area);

  return (
    <section className={cn(styles.card, styles.teamsCard)} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.cardTitle}>
        Equipes com vagas
      </h2>

      <div className={styles.filters} role="search">
        <div className={cn(styles.field, styles.searchField)}>
          <label htmlFor={searchId} className={styles.label}>
            Buscar equipe
          </label>
          <Input
            id={searchId}
            type="search"
            inputSize="large"
            placeholder="Nome, tema ou curso"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          className={cn(styles.field, styles.areaField)}
          label="Área de interesse"
          options={AREA_FILTER_OPTIONS}
          value={area}
          onChange={(event) => {
            setArea(event.target.value);
            setPage(1);
          }}
        />
      </div>

      {teams.data === undefined && teams.isLoading && <Spinner label="Carregando equipes…" />}

      {teams.data === undefined && teams.error && (
        <Alert
          tone="danger"
          title="Não foi possível carregar as equipes."
          action={
            <Button variant="secondary" size="small" onClick={() => void teams.refetch()}>
              Tentar novamente
            </Button>
          }
        >
          Verifique sua conexão e tente de novo.
        </Alert>
      )}

      {teams.data && (
        <>
          <div className={styles.summary} aria-live="polite">
            <p className={styles.summaryCount}>
              {count === 1 ? '1 equipe encontrada' : `${count} equipes encontradas`} · Todas com
              vagas
            </p>
            {count > 0 && <p className={styles.summaryOrder}>Mais recentes primeiro ↓</p>}
          </div>

          {teams.data.results.length > 0 ? (
            <ul className={styles.teamList} aria-label="Equipes com vagas">
              {teams.data.results.map((team) => (
                <AvailableTeamCard
                  key={team.id}
                  team={team}
                  pendingRequest={pendingByTeam.get(team.id)}
                  blocked={blocked}
                />
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Nenhuma equipe com vagas encontrada"
              description={
                filtered
                  ? 'Tente outro nome ou outra área de interesse.'
                  : 'Ainda não há equipes com vagas. Que tal criar a sua?'
              }
            />
          )}

          <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
        </>
      )}

      <p className={styles.text}>
        Sua solicitação será analisada pela liderança. Você pode buscar outras equipes enquanto
        aguarda, mas só poderá participar de uma.
      </p>
    </section>
  );
}
