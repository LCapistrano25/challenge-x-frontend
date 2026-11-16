import { Navigate } from 'react-router-dom';
import { useStudentDashboard } from '@/features/teams';
import { Spinner } from '@/shared/ui';
import { PagePlaceholder } from '@/shared/ui/dev/PagePlaceholder';

/**
 * "Meu Projeto" (task #13, em construção). Enquanto a equipe não cadastrou o projeto, o líder
 * é levado ao cadastro (task #12). O participante vê esta tela, que a task #13 completa.
 */
export function TeamProjectPage() {
  const dashboard = useStudentDashboard();

  if (dashboard.isPending) return <Spinner label="Carregando o projeto…" />;

  const data = dashboard.data;
  if (data?.team && data.is_leader && !data.project) {
    return <Navigate to="/academico/projeto/novo" replace />;
  }

  return <PagePlaceholder title="Projeto da equipe" task={13} />;
}
