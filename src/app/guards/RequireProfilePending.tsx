import { Navigate, Outlet } from 'react-router-dom';
import { homePathFor, needsProfile, useAuth } from '@/features/auth';
import { Spinner } from '@/shared/ui';

/**
 * Protege a tela de primeiro acesso: só entra quem está logado e ainda não concluiu o
 * cadastro (aluno ou professor vindos do login Microsoft). Todos os outros são
 * redirecionados, então quem já preencheu os dados nunca volta a ver essa tela.
 */
export function RequireProfilePending() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (!needsProfile(user)) return <Navigate to={homePathFor(user)} replace />;

  return <Outlet />;
}
