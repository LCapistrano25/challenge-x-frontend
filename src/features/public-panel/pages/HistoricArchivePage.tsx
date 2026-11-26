import { useMemo, useState } from 'react';
import { useQueries, type UseQueryResult } from '@tanstack/react-query';
import { usePageHeader } from '@/shared/lib/page-header';
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  EmptyState,
  Select,
  Spinner,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TextField,
} from '@/shared/ui';
import { ProjectCard } from '../components/ProjectCard';
import { fetchEditionWinners } from '../api/public.api';
import { editionLabel } from '../lib/edition';
import {
  publicKeys,
  useClosedEditions,
  useCurrentEdition,
  usePublicProjects,
} from '../hooks/usePublicPanel';
import type { EditionSummary } from '@/shared/types/api';
import type { Winner } from '../types';
import styles from './HistoricArchive.module.css';

const PAGE_SIZE = 100;

const normalize = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const AWARD_LABEL: Record<1 | 2 | 3, string> = {
  1: 'Grande Vencedor',
  2: '2º lugar',
  3: '3º lugar',
};

const PLACE_CLASS: Record<1 | 2 | 3, string | undefined> = {
  1: styles.place1,
  2: styles.place2,
  3: styles.place3,
};

const editionName = (edition: EditionSummary) =>
  edition.name ?? `Desafio X ${editionLabel(edition)}`;

/**
 * Acervo Histórico e Galeria de Vencedores (RF35/RF46). Tela pública compartilhada: abre dentro
 * da moldura do perfil logado (PublicLayout) e os cartões levam ao detalhe em /projetos/:id
 * mantendo o contexto (?from=/acervo). Duas seções alternadas por abas: Vencedores (pódio de
 * cada edição encerrada + a edição vigente "em breve") e Projetos passados (grade filtrável).
 */
export function HistoricArchivePage() {
  usePageHeader('Acervo Histórico', 'Galeria de vencedores e projetos das edições do Desafio X.');

  const editionsQuery = useClosedEditions();
  const editions = useMemo(
    () =>
      [...(editionsQuery.data ?? [])].sort(
        (a, b) => b.edition.year - a.edition.year || b.edition.semester - a.edition.semester,
      ),
    [editionsQuery.data],
  );
  const currentEdition = useCurrentEdition().data?.edition ?? null;

  // Pódio de cada edição encerrada (uma consulta por edição).
  const winnersQueries = useQueries({
    queries: editions.map((item) => ({
      queryKey: publicKeys.winners(item.edition.id),
      queryFn: () => fetchEditionWinners(item.edition.id),
      staleTime: 5 * 60_000,
    })),
  });

  if (editionsQuery.isLoading) {
    return (
      <div className={`page-flush ${styles.page}`}>
        <Spinner label="Carregando o acervo…" />
      </div>
    );
  }

  if (editionsQuery.isError) {
    return (
      <div className={`page-flush ${styles.page}`}>
        <Alert
          tone="danger"
          title="Não foi possível carregar o acervo"
          action={
            <Button size="small" variant="secondary" onClick={() => void editionsQuery.refetch()}>
              Tentar de novo
            </Button>
          }
        >
          Verifique sua conexão e tente novamente.
        </Alert>
      </div>
    );
  }

  if (editions.length === 0 && !currentEdition) {
    return (
      <div className={`page-flush ${styles.page}`}>
        <EmptyState
          title="Ainda não há edições no acervo"
          description="Quando uma edição for concluída e homologada, os vencedores e projetos aparecerão aqui."
        />
      </div>
    );
  }

  return (
    <div className={`page-flush ${styles.page}`}>
      <section className={styles.hero}>
        <Badge tone="brand" shape="pill">
          Acervo do Desafio X
        </Badge>
        <h2 className={styles.heroTitle}>Acervo Histórico</h2>
        <p className={styles.heroSubtitle}>
          Reveja a galeria de vencedores e os projetos das edições anteriores do Desafio X.
        </p>
      </section>

      <Tabs defaultValue="vencedores">
        <TabsList aria-label="Seções do acervo">
          <TabsTrigger value="vencedores">Vencedores</TabsTrigger>
          <TabsTrigger value="passados">Projetos passados</TabsTrigger>
        </TabsList>

        <TabsContent value="vencedores">
          <div className={styles.editionList}>
            {currentEdition && <ComingSoon edition={currentEdition} />}
            {editions.map((item, index) => (
              <EditionPodium
                key={item.edition.id}
                edition={item.edition}
                query={winnersQueries[index]}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="passados">
          <PastProjects editions={editions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/** Edição vigente: resultados ainda não homologados — bloco interativo "em breve". */
function ComingSoon({ edition }: { edition: EditionSummary }) {
  return (
    <section className={styles.comingSoon} aria-label={`Vencedores de ${editionName(edition)}`}>
      <div className={styles.comingSoonText}>
        <span className={styles.liveDot} aria-hidden="true" />
        <div>
          <h4 className={styles.editionTitle}>{editionName(edition)}</h4>
          <p className={styles.comingSoonLead}>
            Edição em andamento — o pódio de vencedores será divulgado ao final.
          </p>
        </div>
        <span className={styles.soonTag}>Em breve</span>
      </div>
      <ol className={styles.ghostPodium} aria-hidden="true">
        {[1, 2, 3].map((place) => (
          <li key={place} className={styles.ghostSlot}>
            <span className={styles.ghostMedal}>{place}º</span>
            <span className={styles.ghostBar} />
            <span className={`${styles.ghostBar} ${styles.ghostBarShort}`} />
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Pódio (1º/2º/3º) de uma edição encerrada. */
function EditionPodium({
  edition,
  query,
}: {
  edition: EditionSummary;
  query: UseQueryResult<Winner[]> | undefined;
}) {
  const winners = [...(query?.data ?? [])].sort((a, b) => a.award_place - b.award_place);
  const loading = query?.isLoading ?? true;
  return (
    <section className={styles.editionBlock} aria-label={`Vencedores de ${editionName(edition)}`}>
      <header className={styles.editionHead}>
        <h4 className={styles.editionTitle}>{editionName(edition)}</h4>
        <span className={styles.editionStatus}>Encerrada</span>
      </header>

      {loading ? (
        <Spinner label="Carregando o pódio…" />
      ) : winners.length === 0 ? (
        <EmptyState
          title="Pódio em homologação"
          description="Os vencedores desta edição ainda não foram divulgados."
        />
      ) : (
        <ol className={styles.podium}>
          {winners.map((winner) => (
            <li key={winner.project.id} className={PLACE_CLASS[winner.award_place]}>
              <WinnerCard winner={winner} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function WinnerCard({ winner }: { winner: Winner }) {
  const { project, award_place: place, category } = winner;
  return (
    <article className={styles.winner}>
      <div className={styles.medalRow}>
        <span className={styles.medal} aria-hidden="true">
          {place}º
        </span>
        <span className={styles.award}>{AWARD_LABEL[place]}</span>
      </div>
      <h5 className={styles.winnerTitle}>{project.title}</h5>
      <p className={styles.winnerMeta}>
        {project.course.name} · {category.name}
      </p>
      <p className={styles.winnerSummary}>{project.summary}</p>
      <div className={styles.winnerFooter}>
        <ButtonLink
          to={`/projetos/${project.id}?from=/acervo`}
          variant="ghost"
          size="small"
          className={styles.winnerLink}
        >
          Ver projeto
        </ButtonLink>
      </div>
    </article>
  );
}

/** Seção "Projetos passados": seletor de edição encerrada + filtros + grade. */
function PastProjects({
  editions,
}: {
  editions: { edition: EditionSummary; closed_at: string | null }[];
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const editionId = selected ?? editions[0]?.edition.id ?? null;
  const currentEdition = editions.find((item) => item.edition.id === editionId)?.edition ?? null;

  const projectsQuery = usePublicProjects(
    editionId != null ? { edition_id: editionId, page_size: PAGE_SIZE } : {},
  );

  const [query, setQuery] = useState('');
  const [course, setCourse] = useState('');
  const [category, setCategory] = useState('');
  const [sdg, setSdg] = useState('');

  const projects = useMemo(() => projectsQuery.data?.results ?? [], [projectsQuery.data]);
  const courses = useMemo(
    () => [...new Map(projects.map((p) => [p.course.id, p.course])).values()],
    [projects],
  );
  const categories = useMemo(
    () => [
      ...new Map(
        projects.filter((p) => p.category).map((p) => [p.category!.id, p.category!]),
      ).values(),
    ],
    [projects],
  );
  const sdgs = useMemo(
    () =>
      [...new Map(projects.map((p) => [p.sdg.number, p.sdg])).values()].sort(
        (a, b) => a.number - b.number,
      ),
    [projects],
  );

  const visible = useMemo(() => {
    const term = normalize(query.trim());
    return projects.filter((p) => {
      if (course && String(p.course.id) !== course) return false;
      if (category && String(p.category?.id ?? '') !== category) return false;
      if (sdg && String(p.sdg.number) !== sdg) return false;
      if (!term) return true;
      return normalize(`${p.title} ${p.summary} ${p.course.name} ${p.sdg.title}`).includes(term);
    });
  }, [projects, query, course, category, sdg]);

  const hasFilters = query !== '' || course !== '' || category !== '' || sdg !== '';
  const clearFilters = () => {
    setQuery('');
    setCourse('');
    setCategory('');
    setSdg('');
  };

  if (editions.length === 0) {
    return (
      <EmptyState
        title="Nenhuma edição encerrada"
        description="Os projetos das edições anteriores aparecerão aqui quando uma edição for concluída."
      />
    );
  }

  return (
    <section aria-label="Projetos passados" className={styles.section}>
      <header className={styles.sectionHead}>
        <p className={styles.sectionSubtitle}>
          {visible.length} {visible.length === 1 ? 'projeto' : 'projetos'}
          {currentEdition ? ` · ${editionName(currentEdition)}` : ''}
        </p>
      </header>

      <div className={styles.filters} role="search" aria-label="Filtrar projetos do acervo">
        <Select
          label="Edição"
          value={editionId != null ? String(editionId) : ''}
          onChange={(event) => {
            setSelected(Number(event.target.value));
            clearFilters();
          }}
          options={editions.map((item) => ({
            value: String(item.edition.id),
            label: editionName(item.edition),
          }))}
        />
        <TextField
          label="Buscar projeto"
          type="search"
          placeholder="Buscar por palavra-chave..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Select
          label="Curso"
          value={course}
          onChange={(event) => setCourse(event.target.value)}
          options={[
            { value: '', label: 'Todos os cursos' },
            ...courses.map((c) => ({ value: String(c.id), label: c.name })),
          ]}
        />
        <Select
          label="Categoria"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          options={[
            { value: '', label: 'Todas as categorias' },
            ...categories.map((c) => ({ value: String(c.id), label: c.name })),
          ]}
        />
        <Select
          label="ODS"
          value={sdg}
          onChange={(event) => setSdg(event.target.value)}
          options={[
            { value: '', label: 'Todas as ODS' },
            ...sdgs.map((s) => ({ value: String(s.number), label: `ODS ${s.number}` })),
          ]}
        />
      </div>

      {projectsQuery.isLoading ? (
        <Spinner label="Carregando os projetos…" />
      ) : visible.length > 0 ? (
        <ul className={styles.grid}>
          {visible.map((project) => (
            <li key={project.id}>
              <ProjectCard project={project} href={`/projetos/${project.id}?from=/acervo`} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="Nenhum projeto encontrado"
          description="Ajuste a busca ou limpe os filtros para ver todos os projetos da edição."
          action={
            hasFilters ? (
              <Button variant="secondary" onClick={clearFilters}>
                Limpar filtros
              </Button>
            ) : undefined
          }
        />
      )}
    </section>
  );
}
