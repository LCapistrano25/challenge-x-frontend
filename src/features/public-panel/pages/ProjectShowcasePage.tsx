import { useSearchParams } from 'react-router-dom';
import { useCourses, usePublicProjects } from '../hooks/usePublicPanel';
import { ProjectCard } from '../components/ProjectCard';

const PAGE_SIZE = 8;

export function ProjectShowcasePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('search') ?? '';
  const courseId = searchParams.get('course_id') ?? '';
  const sdgId = searchParams.get('sdg_id') ?? '';
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));

  const { data: courses = [], isLoading: loadingCourses } = useCourses();

  const { data, isLoading, isError } = usePublicProjects({
    search: search || undefined,
    course_id: courseId ? Number(courseId) : undefined,
    sdg_id: sdgId ? Number(sdgId) : undefined,
    page,
    page_size: PAGE_SIZE,
  });

  const { data: allProjects } = usePublicProjects({
    page: 1,
    page_size: 100,
  });

  const projects = data?.results ?? [];
  const total = data?.count ?? 0;
  const pageCount = Math.ceil(total / PAGE_SIZE);

  const sdgs = Array.from(
    new Map((allProjects?.results ?? []).map((project) => [project.sdg.id, project.sdg])).values(),
  ).sort((a, b) => a.id - b.id);

  function updateFilters(updates: Record<string, string>) {
    const next = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
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

  const hasFilters = Boolean(search || courseId || sdgId);

  return (
    <main
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '32px 24px 56px',
      }}
    >
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, marginBottom: 8 }}>Vitrine de Projetos</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Conheça os projetos desenvolvidos pelos acadêmicos e suas soluções para desafios reais.
        </p>
      </header>

      <section
        aria-label="Filtros de projetos"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <label>
          <span style={{ display: 'block', marginBottom: 8 }}>Buscar projetos</span>
          <input
            type="search"
            value={search}
            placeholder="Digite o nome ou palavra-chave..."
            onChange={(event) => updateFilters({ search: event.target.value })}
            style={{
              width: '100%',
              padding: 12,
              border: '1px solid var(--color-border)',
              borderRadius: 8,
            }}
          />
        </label>

        <label>
          <span style={{ display: 'block', marginBottom: 8 }}>Curso</span>
          <select
            value={courseId}
            disabled={loadingCourses}
            onChange={(event) => updateFilters({ course_id: event.target.value })}
            style={{
              width: '100%',
              padding: 12,
              border: '1px solid var(--color-border)',
              borderRadius: 8,
            }}
          >
            <option value="">Todos os cursos</option>
            {courses.map((course) => {
              const projectCourse = (allProjects?.results ?? []).find(
                (project) => project.course.name === course.name,
              );

              const filterId = projectCourse?.course.id ?? course.id;

              return (
                <option key={course.id} value={filterId}>
                  {course.name}
                </option>
              );
            })}
          </select>
        </label>

        <label>
          <span style={{ display: 'block', marginBottom: 8 }}>
            Objetivo de Desenvolvimento Sustentável
          </span>
          <select
            value={sdgId}
            onChange={(event) => updateFilters({ sdg_id: event.target.value })}
            style={{
              width: '100%',
              padding: 12,
              border: '1px solid var(--color-border)',
              borderRadius: 8,
            }}
          >
            <option value="">Todos os ODS</option>
            {sdgs.map((sdg) => (
              <option key={sdg.id} value={sdg.id}>
                ODS {sdg.number} - {sdg.title}
              </option>
            ))}
          </select>
        </label>
      </section>

      {hasFilters && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 24,
          }}
        >
          <strong>Filtros ativos:</strong>

          {search && (
            <button type="button" onClick={() => updateFilters({ search: '' })}>
              Busca: {search} ×
            </button>
          )}

          {courseId && (
            <button type="button" onClick={() => updateFilters({ course_id: '' })}>
              Curso: {courses.find((course) => String(course.id) === courseId)?.name ?? courseId} ×
            </button>
          )}

          {sdgId && (
            <button type="button" onClick={() => updateFilters({ sdg_id: '' })}>
              ODS {sdgId} ×
            </button>
          )}

          <button type="button" onClick={clearFilters}>
            Limpar filtros
          </button>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <h2 style={{ fontSize: 20 }}>Projetos encontrados: {total}</h2>
      </div>

      {isLoading && <p>Carregando projetos...</p>}

      {isError && <p role="alert">Não foi possível carregar os projetos. Tente novamente.</p>}

      {!isLoading && !isError && projects.length === 0 && (
        <div
          style={{
            padding: 40,
            textAlign: 'center',
            border: '1px solid var(--color-border)',
            borderRadius: 12,
          }}
        >
          <h2>Nenhum projeto encontrado</h2>
          <p>Não encontramos projetos com os filtros selecionados. Tente alterar sua busca.</p>
          {hasFilters && (
            <button type="button" onClick={clearFilters}>
              Limpar busca e filtros
            </button>
          )}
        </div>
      )}

      {!isLoading && !isError && projects.length > 0 && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 24,
            }}
          >
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                href={`/projetos/${project.id}?${searchParams.toString()}`}
              />
            ))}
          </div>

          {pageCount > 1 && (
            <nav
              aria-label="Paginação dos projetos"
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 16,
                marginTop: 32,
              }}
            >
              <button type="button" disabled={page <= 1} onClick={() => changePage(page - 1)}>
                Anterior
              </button>

              <span>
                Página {page} de {pageCount}
              </span>

              <button
                type="button"
                disabled={page >= pageCount}
                onClick={() => changePage(page + 1)}
              >
                Próxima
              </button>
            </nav>
          )}
        </>
      )}
    </main>
  );
}
