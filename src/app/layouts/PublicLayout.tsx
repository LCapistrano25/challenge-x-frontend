import { Outlet } from 'react-router-dom';
import { homePathFor, useAuth } from '@/features/auth';
import { NAV_ITEMS } from '@/app/config/navigation';
import shell from './AppShell.module.css';
import { Sidebar } from './Sidebar';

/** Área pública (vitrine, acervo, home). As telas de acesso usam o AuthLayout. */
export function PublicLayout() {
  const { user } = useAuth();
  const publicNav = user
    ? [...NAV_ITEMS.publico.slice(0, -1), { to: homePathFor(user), label: 'Minha área' }]
    : NAV_ITEMS.publico;

  return (
    <div className={shell.shell}>
      <Sidebar area="Plataforma" nav={publicNav} />
      <main className={shell.content}>
        <Outlet />
      </main>
    </div>
  );
}
