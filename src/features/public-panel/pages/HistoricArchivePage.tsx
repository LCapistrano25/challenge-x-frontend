import { useMemo, useState } from 'react';
import { usePublicProjects } from '../hooks/usePublicPanel';
import type { PublicProject } from '../types';

export function HistoricArchivePage() {
  const { data, isLoading, isError } = usePublicProjects({
    page_size: 100,
  });

  const [editionId, setEditionId] = useState('');
  const [year, setYear] = useState('');
  const [courseId, setCourseId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [sdgId, setSdgId] = useState('');

  const projects = data?.results ?? [];

  const editions = useMemo(
    () =>
      Array.from(
        new Map(projects.map((project) => [project.edition.id, project.edition])).values(),
      ).sort((a, b) => b.year - a.year || b.semester - a.semester),
    [projects],
  );

  const years = [...new Set(editions.map((edition) => edition.year))].sort((a, b) => b - a);

  const courses = Array.from(
    new Map(projects.map((project) => [project.course.id, project.course])).values(),
  );

  const categories = Array.from(
    new Map(
      projects
        .filter((project) => project.category)
        .map((project) => [project.category!.id, project.category!]),
    ).values(),
  );

  const sdgs = Array.from(
    new Map(projects.map((project) => [project.sdg.id, project.sdg])).values(),
  ).sort((a, b) => a.number - b.number);

  const filteredProjects = projects.filter((project) => {
    return (
      (!editionId || String(project.edition.id) === editionId) &&
      (!year || String(project.edition.year) === year) &&
      (!courseId || String(project.course.id) === courseId) &&
      (!categoryId || String(project.category?.id ?? '') === categoryId) &&
      (!sdgId || String(project.sdg.id) === sdgId)
    );
  });

  const groupedProjects = useMemo(() => {
    const groups = new Map<
      number,
      {
        edition: PublicProject['edition'];
        projects: PublicProject[];
      }
    >();

    filteredProjects.forEach((project) => {
      const group = groups.get(project.edition.id);

      if (group) {
        group.projects.push(project);
      } else {
        groups.set(project.edition.id, {
          edition: project.edition,
          projects: [project],
        });
      }
    });

    return Array.from(groups.values()).sort(
      (a, b) => b.edition.year - a.edition.year || b.edition.semester - a.edition.semester,
    );
  }, [filteredProjects]);

  function clearFilters() {
    setEditionId('');
    setYear('');
    setCourseId('');
    setCategoryId('');
    setSdgId('');
  }

  const hasFilters = Boolean(editionId || year || courseId || categoryId || sdgId);

  if (isLoading) {
    return <main style={{ padding: 32 }}>Carregando acervo histórico...</main>;
  }

  if (isError) {
    return (
      <main style={{ padding: 32 }}>
        <h1>Acervo Histórico</h1>
        <p>Não foi possível carregar os projetos históricos.</p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <header style={{ marginBottom: 28 }}>
        <h1>Acervo Histórico</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Explore os projetos acadêmicos organizados por edição, curso, categoria e Objetivos de
          Desenvolvimento Sustentável.
        </p>
      </header>

      <section
        aria-label="Filtros do acervo"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <label>
          Edição
          <select
            value={editionId}
            onChange={(event) => setEditionId(event.target.value)}
            style={selectStyle}
          >
            <option value="">Todas as edições</option>
            {editions.map((edition) => (
              <option key={edition.id} value={edition.id}>
                {edition.name || `${edition.year} - ${edition.semester}º semestre`}
              </option>
            ))}
          </select>
        </label>

        <label>
          Ano
          <select
            value={year}
            onChange={(event) => setYear(event.target.value)}
            style={selectStyle}
          >
            <option value="">Todos os anos</option>
            {years.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label>
          Curso
          <select
            value={courseId}
            onChange={(event) => setCourseId(event.target.value)}
            style={selectStyle}
          >
            <option value="">Todos os cursos</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Categoria
          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            style={selectStyle}
          >
            <option value="">Todas as categorias</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          ODS
          <select
            value={sdgId}
            onChange={(event) => setSdgId(event.target.value)}
            style={selectStyle}
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
        <div style={{ marginBottom: 20 }}>
          <button type="button" onClick={clearFilters}>
            Limpar filtros
          </button>
        </div>
      )}

      <h2 style={{ fontSize: 18, marginBottom: 24 }}>
        Projetos encontrados: {filteredProjects.length}
      </h2>

      {groupedProjects.length === 0 ? (
        <section style={emptyStyle}>
          <h2>Nenhum projeto encontrado</h2>
          <p>Não há projetos para os filtros selecionados.</p>
          <button type="button" onClick={clearFilters}>
            Limpar filtros
          </button>
        </section>
      ) : (
        <div style={{ display: 'grid', gap: 32 }}>
          {groupedProjects.map(({ edition, projects: editionProjects }) => (
            <section key={edition.id}>
              <h2 style={{ marginBottom: 16 }}>
                {edition.name || `${edition.year} - ${edition.semester}º semestre`}
              </h2>

              <p style={{ color: 'var(--color-text-secondary)' }}>
                Ano: {edition.year} · Semestre: {edition.semester} · Projetos:{' '}
                {editionProjects.length}
              </p>

              <h3 style={{ fontSize: 16, marginBottom: 12 }}>Destaques da edição</h3>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: 16,
                }}
              >
                {editionProjects.slice(0, 3).map((project) => (
                  <article
                    key={project.id}
                    style={{
                      background: 'var(--color-bg-primary)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 12,
                      padding: 20,
                    }}
                  >
                    <strong>Projeto da edição</strong>
                    <h3>{project.title}</h3>
                    <p>{project.summary}</p>
                    <p>
                      <strong>Curso:</strong> {project.course.name}
                    </p>
                    <p>
                      <strong>Categoria:</strong> {project.category?.name ?? 'Não informada'}
                    </p>
                    <p>
                      <strong>ODS:</strong> {project.sdg.number} - {project.sdg.title}
                    </p>
                    <p>
                      <strong>Integrantes:</strong>{' '}
                      {project.members.map((member) => member.name).join(', ') || 'Não informados'}
                    </p>
                    <a
                      href={`/projetos/${project.id}`}
                      style={{
                        color: 'var(--color-primary)',
                        fontWeight: 600,
                      }}
                    >
                      Ver projeto
                    </a>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}

const selectStyle = {
  display: 'block',
  width: '100%',
  marginTop: 8,
  padding: 12,
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  background: 'var(--color-bg-primary)',
};

const emptyStyle = {
  textAlign: 'center' as const,
  padding: 48,
  border: '1px solid var(--color-border)',
  borderRadius: 12,
};
