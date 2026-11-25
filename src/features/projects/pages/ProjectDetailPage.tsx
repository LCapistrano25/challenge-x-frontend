import { useQuery } from '@tanstack/react-query';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { http } from '@/shared/lib/http';
import type { PublicProject } from '@/features/public-panel';

export function ProjectDetailPage() {
  const { projectId } = useParams();
  const [searchParams] = useSearchParams();

  const returnUrl = searchParams.toString() ? `/projetos?${searchParams.toString()}` : '/projetos';

  const {
    data: project,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['public', 'project', projectId],
    queryFn: async () => {
      const { data } = await http.get<PublicProject>(`/api/public/projects/${projectId}`);
      return data;
    },
    enabled: Boolean(projectId),
  });

  if (isLoading) {
    return <main style={{ padding: 32 }}>Carregando projeto...</main>;
  }

  if (isError || !project) {
    return (
      <main style={{ maxWidth: 900, margin: '0 auto', padding: 32 }}>
        <Link to={returnUrl}>← Voltar para Vitrine</Link>
        <h1>Projeto não encontrado</h1>
        <p>Não foi possível carregar os detalhes deste projeto.</p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', padding: 32 }}>
      <Link to={returnUrl} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
        ← Voltar para Vitrine
      </Link>

      <header style={{ marginTop: 24, marginBottom: 32 }}>
        <span>ODS {project.sdg.number}</span>
        <h1 style={{ fontSize: 32, marginBottom: 12 }}>{project.title}</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>{project.summary}</p>
      </header>

      <section style={{ marginBottom: 32 }}>
        <h2>Informações do projeto</h2>
        <p>
          <strong>Curso:</strong> {project.course.name}
        </p>
        <p>
          <strong>Categoria:</strong> {project.category?.name ?? 'Não informado'}
        </p>
        <p>
          <strong>ODS:</strong> {project.sdg.number} - {project.sdg.title}
        </p>
      </section>

      <section>
        <h2>Integrantes</h2>
        {project.members.length > 0 ? (
          <ul>
            {project.members.map((member, index) => (
              <li key={`${member.name}-${index}`}>{member.name}</li>
            ))}
          </ul>
        ) : (
          <p>Integrantes não informados.</p>
        )}
      </section>
    </main>
  );
}
