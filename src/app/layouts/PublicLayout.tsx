import { Outlet } from 'react-router-dom';
import { ROLE_HOME, useAuth } from '@/features/auth';
import { NAV_ITEMS } from '@/app/config/navigation';
import { Sidebar } from './Sidebar';

export function PublicLayout() {
  const { user } = useAuth();
  const publicNav = user
    ? [...NAV_ITEMS.publico.slice(0, -1), { to: ROLE_HOME[user.role], label: 'Minha área' }]
    : NAV_ITEMS.publico;

  return (
    <div className="layout app-shell">
      <Sidebar area="Plataforma" nav={publicNav} />
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}
