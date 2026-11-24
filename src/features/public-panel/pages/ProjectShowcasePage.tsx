import { useMemo, useState } from 'react';
import { usePageHeader } from '@/shared/lib/page-header';
import { Alert, Badge, Button, EmptyState, Select, Spinner, TextField } from '@/shared/ui';
import { ProjectCard } from '../components/ProjectCard';
import { editionLabel } from '../lib/edition';
import { useCurrentEdition, usePublicProjects } from '../hooks/usePublicPanel';
import styles from './ProjectShowcase.module.css';

const PAGE_SIZE = 100;

const normalize = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * Vitrine de Projetos (Figma: "Vitrine de Projetos" / "Projetos - desk"). Tela única e pública
 * (RF34/RF45): abre dentro da moldura do perfil logado (PublicLayout) e cada card leva ao
 * detalhe compartilhado em /projetos/:id.
 */
export function ProjectShowcasePage() {
  const { data, isLoading, isError, refetch } = usePublicProjects({ page_size: PAGE_SIZE });
  const edition = useCurrentEdition().data?.edition;

  const [query, setQuery] = useState('');
  const [course, setCourse] = useState('');
  const [sdg, setSdg] = useState('');

  usePageHeader(
    edition ? `Desafio X · Edição ${editionLabel(edition)}` : 'Projetos',
    'Acompanhe os editais, o cronograma e os projetos da edição vigente.',
  );

  const projects = useMemo(() => data?.results ?? [], [data]);
  const courses = useMemo(
    () => [...new Map(projects.map((p) => [p.course.id, p.course])).values()],
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
    return projects.filter((project) => {
      if (course && String(project.course.id) !== course) return false;
      if (sdg && String(project.sdg.number) !== sdg) return false;
      if (!term) return true;
      const haystack = normalize(
        [project.title, project.summary, project.course.name, project.sdg.title].join(' '),
      );
      return haystack.includes(term);
    });
  }, [projects, query, course, sdg]);

  const hasFilters = query !== '' || course !== '' || sdg !== '';
  const clear = () => {
    setQuery('');
    setCourse('');
    setSdg('');
  };

  if (isLoading) {
    return (
      <div className={`page-flush ${styles.page}`}>
        <Spinner label="Carregando os projetos…" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={`page-flush ${styles.page}`}>
        <Alert
          tone="danger"
          title="Não foi possível carregar os projetos"
          action={
            <Button size="small" variant="secondary" onClick={() => void refetch()}>
              Tentar de novo
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
          {edition && (
            <Badge tone="brand" shape="pill" className={styles.badge}>
              Edição {edition.year}
            </Badge>
          )}
          <h2 className={styles.title}>Vitrine de Projetos</h2>
          <p className={styles.subtitle}>Listagem dos projetos elegíveis da edição vigente.</p>
        </div>
        <p className={styles.count}>
          <span className={styles.countValue}>{projects.length}</span>
          <span className={styles.countLabel}>
            {projects.length === 1 ? 'projeto' : 'projetos'}
          </span>
        </p>
      </header>

      <div className={styles.filters} role="search" aria-label="Filtrar projetos">
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
          label="ODS"
          value={sdg}
          onChange={(event) => setSdg(event.target.value)}
          options={[
            { value: '', label: 'Todas as ODS' },
            ...sdgs.map((s) => ({ value: String(s.number), label: `ODS ${s.number}` })),
          ]}
        />
      </div>

      {visible.length > 0 ? (
        <ul className={styles.grid}>
          {visible.map((project) => (
            <li key={project.id}>
              <ProjectCard project={project} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="Nenhum projeto encontrado"
          description="Ajuste a busca ou limpe os filtros para ver todos os projetos da edição."
          action={
            hasFilters ? (
              <Button variant="secondary" onClick={clear}>
                Limpar filtros
              </Button>
            ) : undefined
          }
        />
      )}
    </div>
  );
}
