import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePageHeader } from '@/shared/lib/page-header';
import {
  Alert,
  Button,
  EmptyState,
  IconInfo,
  Pagination,
  Select,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TextField,
} from '@/shared/ui';
import { useAdminTeams } from '../hooks/useAdminTeams';
import { SITUATION_LABEL, SITUATION_TONE } from '../lib/teams';
import type { AdminTeamListItem, AdminTeamSituation } from '../types';
import styles from './AdminTeams.module.css';

const PAGE_SIZE = 6;

const normalize = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const SITUATIONS: AdminTeamSituation[] = ['PRE_REGISTERED', 'PENDING', 'VALIDATED', 'DISQUALIFIED'];

/**
 * Equipes e Projetos — listagem (Figma: 04 - Administrador › "Equipes e Projetos", RF13).
 * Consulta das equipes da edição com métricas, filtros e acesso ao detalhe de cada equipe.
 */
export function AdminTeamsPage() {
  usePageHeader(
    'Equipes e Projetos',
    'Consulte as inscrições, os projetos e a situação acadêmica das equipes.',
  );

  const { data, isLoading, isError, refetch } = useAdminTeams({ page_size: 100 });
  const [query, setQuery] = useState('');
  const [course, setCourse] = useState('');
  const [situation, setSituation] = useState('');
  const [page, setPage] = useState(1);

  const teams = useMemo(() => data?.results ?? [], [data]);
  const courses = useMemo(
    () => [...new Set(teams.map((t) => t.course).filter((c): c is string => !!c))].sort(),
    [teams],
  );

  const filtered = useMemo(() => {
    const term = normalize(query.trim());
    return teams.filter((t) => {
      if (course && t.course !== course) return false;
      if (situation && t.situation !== situation) return false;
      if (!term) return true;
      return normalize(`${t.name} ${t.project?.title ?? ''} ${t.course ?? ''}`).includes(term);
    });
  }, [teams, query, course, situation]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const memberTotal = teams.reduce((sum, t) => sum + t.member_count, 0);
  const pendingCount = teams.filter((t) => t.situation === 'PENDING').length;

  function onFilter(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  if (isLoading) return <Spinner label="Carregando as equipes…" />;
  if (isError || !data) {
    return (
      <Alert
        tone="danger"
        title="Não foi possível carregar as equipes"
        action={
          <Button size="small" variant="secondary" onClick={() => void refetch()}>
            Tentar de novo
          </Button>
        }
      >
        Verifique sua conexão e tente novamente.
      </Alert>
    );
  }

  return (
    <section className={`page-flush ${styles.page}`} aria-label="Equipes e projetos">
      <nav className={styles.breadcrumb} aria-label="Trilha de navegação">
        <Link to="/admin">Início</Link>
        <span aria-hidden="true">/</span>
        <span>Equipes e Projetos</span>
      </nav>

      <dl className={styles.metrics}>
        <Metric
          label="Equipes pré-cadastradas"
          value={teams.length}
          caption="Edição em configuração"
        />
        <Metric
          label="Acadêmicos vinculados"
          value={memberTotal}
          caption={`${courses.length} cursos participantes`}
        />
        <Metric
          label="Pendências de cadastro"
          value={pendingCount}
          caption="Aguardam complementação de dados"
        />
      </dl>

      <section className={styles.card} aria-label="Equipes da edição">
        <header className={styles.cardHead}>
          <div>
            <h3 className={styles.cardTitle}>Equipes da edição</h3>
            <p className={styles.cardMeta}>
              Pré-cadastros de 2027; inscrições oficiais a partir de 01/03/2027.
            </p>
          </div>
        </header>

        <div className={styles.filters} role="search" aria-label="Filtrar equipes">
          <TextField
            label="Buscar"
            type="search"
            placeholder="Buscar equipe ou projeto"
            value={query}
            onChange={(event) => onFilter(setQuery, event.target.value)}
          />
          <Select
            label="Filtrar por curso"
            value={course}
            onChange={(event) => onFilter(setCourse, event.target.value)}
            options={[
              { value: '', label: 'Todos os cursos' },
              ...courses.map((c) => ({ value: c, label: c })),
            ]}
          />
          <Select
            label="Filtrar por situação"
            value={situation}
            onChange={(event) => onFilter(setSituation, event.target.value)}
            options={[
              { value: '', label: 'Todas as situações' },
              ...SITUATIONS.map((s) => ({ value: s, label: SITUATION_LABEL[s] })),
            ]}
          />
        </div>

        {visible.length === 0 ? (
          <EmptyState
            title="Nenhuma equipe encontrada"
            description="Ajuste a busca ou os filtros para ver as equipes da edição."
          />
        ) : (
          <>
            <Table caption="Equipes da edição">
              <TableHead>
                <TableRow>
                  <TableHeader>Equipe</TableHeader>
                  <TableHeader>Projeto</TableHeader>
                  <TableHeader>Curso</TableHeader>
                  <TableHeader>Integrantes</TableHeader>
                  <TableHeader>Situação</TableHeader>
                  <TableHeader>Ações</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {visible.map((team) => (
                  <TeamRow key={team.id} team={team} />
                ))}
              </TableBody>
            </Table>

            <div className={styles.tableFooter}>
              <span className={styles.count}>
                {(currentPage - 1) * PAGE_SIZE + 1}–{(currentPage - 1) * PAGE_SIZE + visible.length}{' '}
                de {filtered.length} equipes
              </span>
              {pageCount > 1 && (
                <Pagination page={currentPage} pageCount={pageCount} onPageChange={setPage} />
              )}
            </div>
          </>
        )}
      </section>

      <div className={styles.notice}>
        <IconInfo size={20} className={styles.noticeIcon} aria-hidden="true" />
        <div>
          <p className={styles.noticeTitle}>Consulte os detalhes antes de intervir</p>
          <p className={styles.noticeText}>
            O histórico de integrantes, entregas e avaliações permanece disponível mesmo após uma
            desclassificação.
          </p>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value, caption }: { label: string; value: number; caption: string }) {
  return (
    <div className={styles.metric}>
      <dt>{label}</dt>
      <dd className={styles.metricValue}>{value}</dd>
      <dd className={styles.metricCaption}>{caption}</dd>
    </div>
  );
}

function TeamRow({ team }: { team: AdminTeamListItem }) {
  return (
    <TableRow>
      <TableCell>
        <span className={styles.teamName}>{team.name}</span>
      </TableCell>
      <TableCell>{team.project?.title ?? '—'}</TableCell>
      <TableCell>{team.course ?? '—'}</TableCell>
      <TableCell>{team.member_count} integrantes</TableCell>
      <TableCell>
        <span className={`${styles.tag} ${styles[SITUATION_TONE[team.situation]]}`}>
          {SITUATION_LABEL[team.situation]}
        </span>
      </TableCell>
      <TableCell>
        <Link className={styles.detailLink} to={`/admin/equipes/${team.id}`}>
          Ver detalhes
        </Link>
      </TableCell>
    </TableRow>
  );
}
