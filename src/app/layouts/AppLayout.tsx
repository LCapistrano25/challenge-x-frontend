import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { Button } from '@/shared/ui';
import type { NavItem } from '@/app/config/navigation';
import styles from './AppLayout.module.css';
import shell from './AppShell.module.css';
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
    const wasAdmin = user?.role === 'ADMIN';
    await logout();
    navigate(wasAdmin ? '/admin/login' : '/login', { replace: true });
  }

  return (
    <div className={shell.shell}>
      <Sidebar area={area} nav={nav} />
      <div className={shell.main}>
        <header className={styles.topbar}>
          <div className={styles.user}>
            <span>{user?.name}</span>
            <Button variant="secondary" onClick={handleLogout}>
              Sair
            </Button>
          </div>
        </header>
        <main className={shell.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
