import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth, ROLE_HOME } from '@/features/auth';

export function PublicLayout() {
  const { user } = useAuth();

  return (
    <div className="layout">
      <header className="topbar">
        <Link to="/" className="brand">
          Plataforma
        </Link>
        <nav aria-label="Principal">
          <NavLink to="/projetos">Projetos</NavLink>
          <NavLink to="/acervo">Acervo histórico</NavLink>
          {user ? (
            <Link to={ROLE_HOME[user.role]}>Minha área</Link>
          ) : (
            <NavLink to="/login">Entrar</NavLink>
          )}
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
