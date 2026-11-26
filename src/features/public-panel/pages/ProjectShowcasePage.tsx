import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePageHeader } from '@/shared/lib/page-header';
import { Alert, Badge, Button, EmptyState, Select, Spinner, TextField } from '@/shared/ui';
import { ProjectCard } from '../components/ProjectCard';
import { editionLabel } from '../lib/edition';
import { useCurrentEdition, useCourses, usePublicProjects } from '../hooks/usePublicPanel';
import styles from './ProjectShowcase.module.css';

const PAGE_SIZE = 8;

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export function ProjectShowcasePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get('search') ?? '';
  const course = searchParams.get('course_id') ?? '';
  const sdg = searchParams.get('sdg_id') ?? '';
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));

  const { data: courses = [], isLoading: loadingCourses } = useCourses();
  const { data: edition } = useCurrentEdition();

  const { data, isLoading, isError, refetch } = usePublicProjects({
    search: query || undefined,
    course_id: course ? Number(course) : undefined,
    sdg_id: sdg ? Number(sdg) : undefined,
    page,
    page_size: PAGE_SIZE,
  });

  const projects = data?.results ?? [];
  const total = data?.count ?? 0;
  const pageCount = Math.ceil(total / PAGE_SIZE);

  const visible = useMemo(() => {
    const term = normalize(query.trim());
    if (!term) return projects;

    return projects.filter((project) =>
      normalize(
        [project.title, project.summary, project.course.name, project.sdg.title].join(' '),
      ).includes(term),
    );
  }, [projects, query]);

  const sdgs = useMemo(
    () =>
      [...new Map(projects.map((project) => [project.sdg.id, project.sdg])).values()].sort(
        (a, b) => a.number - b.number,
      ),
    [projects],
  );

  usePageHeader(
    edition?.edition ? `Desafio X — Edição ${editionLabel(edition.edition)}` : 'Projetos',
    'Acompanhe os projetos desenvolvidos pelos acadêmicos.',
  );

  function updateFilters(updates: Record<string, string>) {
    const next = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });

    next.set('page', '1');
    setSearchParams(next);
  }

  function changePage(nextPage: number) {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(nextPage));
    setSearchParams(next);
  }

  function clearFilters() {
    setSearchParams({});
  }

  const hasFilters = Boolean(query || course || sdg);

  if (isLoading) {
    return (
      <div className={`page-flush ${styles.page}`}>
        <Spinner label="Carregando os projetos..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={`page-flush ${styles.page}`}>
        <Alert
          tone="danger"
          title="Não foi possível carregar os projetos"
          action={
            <Button size="small" variant="secondary" onClick={() => void refetch()}>
              Tentar novamente
            </Button>
          }
        >
          Verifique sua conexão e tente novamente.
        </Alert>
      </div>
    );
  }

  return (
    <div className={`page-flush ${styles.page}`}>
      <header className={styles.header}>
        <div className={styles.headerMain}>
          {edition?.edition && (
            <Badge tone="brand" shape="pill" className={styles.badge}>
              Edição {edition.edition.year}
            </Badge>
          )}
          <h2 className={styles.title}>Vitrine de Projetos</h2>
          <p className={styles.subtitle}>Listagem dos projetos da edição vigente.</p>
        </div>

        <p className={styles.count}>
          <span className={styles.countValue}>{total}</span>
          <span className={styles.countLabel}>{total === 1 ? 'projeto' : 'projetos'}</span>
        </p>
      </header>

      <div className={styles.filters} role="search" aria-label="Filtrar projetos">
        <TextField
          label="Buscar projeto"
          type="search"
          placeholder="Buscar por palavra-chave..."
          value={query}
          onChange={(event) => updateFilters({ search: event.target.value })}
        />

        <Select
          label="Curso"
          value={course}
          disabled={loadingCourses}
          onChange={(event) => updateFilters({ course_id: event.target.value })}
          options={[
            { value: '', label: 'Todos os cursos' },
            ...courses.map((item) => ({
              value: String(item.id),
              label: item.name,
            })),
          ]}
        />

        <Select
          label="ODS"
          value={sdg}
          onChange={(event) => updateFilters({ sdg_id: event.target.value })}
          options={[
            { value: '', label: 'Todas as ODS' },
            ...sdgs.map((item) => ({
              value: String(item.id),
              label: `ODS ${item.number} — ${item.title}`,
            })),
          ]}
        />
      </div>

      {hasFilters && (
        <div>
          <strong>Filtros ativos: </strong>
          {query && (
            <Button variant="secondary" size="small" onClick={() => updateFilters({ search: '' })}>
              Busca: {query} ×
            </Button>
          )}
          {course && (
            <Button
              variant="secondary"
              size="small"
              onClick={() => updateFilters({ course_id: '' })}
            >
              Curso: {courses.find((item) => String(item.id) === course)?.name ?? course} ×
            </Button>
          )}
          {sdg && (
            <Button variant="secondary" size="small" onClick={() => updateFilters({ sdg_id: '' })}>
              ODS {sdg} ×
            </Button>
          )}
          <Button variant="secondary" size="small" onClick={clearFilters}>
            Limpar filtros
          </Button>
        </div>
      )}

      {visible.length > 0 ? (
        <>
          <ul className={styles.grid}>
            {visible.map((project) => (
              <li key={project.id}>
                <ProjectCard
                  project={project}
                  href={`/projetos/${project.id}?${searchParams.toString()}`}
                />
              </li>
            ))}
          </ul>

          {pageCount > 1 && (
            <nav aria-label="Paginação dos projetos">
              <Button variant="secondary" disabled={page <= 1} onClick={() => changePage(page - 1)}>
                Anterior
              </Button>
              <span>
                Página {page} de {pageCount}
              </span>
              <Button
                variant="secondary"
                disabled={page >= pageCount}
                onClick={() => changePage(page + 1)}
              >
                Próxima
              </Button>
            </nav>
          )}
        </>
      ) : (
        <EmptyState
          title="Nenhum projeto encontrado"
          description="Ajuste a busca ou limpe os filtros para ver os projetos."
          action={
            hasFilters ? (
              <Button variant="secondary" onClick={clearFilters}>
                Limpar filtros
              </Button>
            ) : undefined
          }
        />
      )}
    </div>
  );
}
