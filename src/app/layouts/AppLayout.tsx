import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { Button } from '@/shared/ui';
import type { NavItem } from '@/app/config/navigation';
import { Sidebar } from './Sidebar';

type AppLayoutProps = {
  /** Nome do perfil exibido no topo. */
  area: string;
  nav: readonly NavItem[];
};

/** Layout das áreas autenticadas. Cada perfil passa o próprio menu. */
export function AppLayout({ area, nav }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="layout app-shell">
      <Sidebar area={area} nav={nav} />
      <div className="app-main">
        <header className="topbar">
          <div className="topbar__user">
            <span>{user?.name}</span>
            <Button variant="secondary" onClick={handleLogout}>
              Sair
            </Button>
          </div>
        </header>
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
