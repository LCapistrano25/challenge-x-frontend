import { Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { NAV_ITEMS, ROLE_AREA } from '@/app/config/navigation';
import { AppLayout } from './AppLayout';
import { Sidebar } from './Sidebar';

/**
 * Páginas públicas (vitrine, acervo, painel). Quem está logado continua vendo o layout
 * do próprio perfil — a barra lateral não muda ao abrir "Projetos" ou "Acervo".
 */
export function PublicLayout() {
  const { user } = useAuth();

  if (user) {
    return <AppLayout area={ROLE_AREA[user.role]} nav={NAV_ITEMS[user.role]} />;
  }

  return (
    <div className="layout app-shell">
      <Sidebar
        area="Plataforma"
        nav={NAV_ITEMS.publico}
        footer={{ label: 'Login', to: '/login' }}
      />
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}
