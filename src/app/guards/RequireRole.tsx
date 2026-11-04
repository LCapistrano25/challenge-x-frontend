import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, type Role } from '@/features/auth';
import { Spinner } from '@/shared/ui';

/**
 * Protege um grupo de rotas por perfil. Atenção: isto só controla a navegação no front.
 * A autorização de verdade precisa ser validada pelo back-end em cada requisição.
 */
export function RequireRole({
  allowedRoles,
  loginPath = '/login',
}: {
  allowedRoles: readonly Role[];
  loginPath?: string;
}) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <Spinner />;
  if (!user) return <Navigate to={loginPath} replace state={{ from: location.pathname }} />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/acesso-negado" replace />;

  return <Outlet />;
}
