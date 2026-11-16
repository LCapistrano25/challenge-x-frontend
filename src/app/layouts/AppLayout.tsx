import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { useCurrentEdition } from '@/features/public-panel';
import { useStudentDashboard } from '@/features/teams';
import { Avatar, IconMenu } from '@/shared/ui';
import type { NavItem } from '@/app/config/navigation';
import { PageHeaderProvider } from './PageHeaderProvider';
import { usePageHeaderContent } from './page-header-context';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';

type AppLayoutProps = {
  /** Nome do perfil (ex.: "Acadêmico"), exibido sob o nome do usuário. */
  area: string;
  nav: readonly NavItem[];
};

/** Cabeçalho branco (Figma: "header"): título da página à esquerda e conta à direita. */
function AppHeader({ area, onOpenMenu }: { area: string; onOpenMenu?: () => void }) {
  const { user } = useAuth();
  const content = usePageHeaderContent();
  const edition = useCurrentEdition().data?.edition;

  return (
    <header className="app-header">
      {onOpenMenu && (
        <button
          type="button"
          className="app-header__menu"
          onClick={onOpenMenu}
          aria-label="Abrir menu"
          title="Menu"
        >
          <IconMenu size={24} />
        </button>
      )}
      <div className="app-header__title">
        {content && (
          <>
            <h1>{content.title}</h1>
            {content.subtitle && <p>{content.subtitle}</p>}
          </>
        )}
      </div>
      {user && (
        <div className="app-header__account">
          <div className="app-header__profile">
            <span className="app-header__name">{user.name}</span>
            <span className="app-header__meta">
              {area}
              {edition && ` · Edição ${edition.year}`}
            </span>
          </div>
          <Avatar name={user.name} tone="blue" />
        </div>
      )}
    </header>
  );
}

/** Layout das áreas autenticadas. Cada perfil passa o próprio menu. */
export function AppLayout({ area, nav }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  // Itens do líder (ex.: "Observações") dependem de StudentDashboard.is_leader.
  const isLeader =
    useStudentDashboard({ enabled: user?.role === 'STUDENT' }).data?.is_leader === true;
  const items = nav.filter((item) => !item.leaderOnly || isLeader);
  const barItems = items.filter((item) => item.mobileBar);
  const hybrid = barItems.length > 0;
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <PageHeaderProvider>
      <div className={`layout app-shell${hybrid ? ' app-shell--hybrid' : ''}`}>
        <Sidebar
          area={area}
          nav={items}
          // Figma: ícone de usuário + "Login" no rodapé (aqui, encerra a sessão).
          footer={{ label: 'Login', onClick: handleLogout }}
          drawer={hybrid ? { open: menuOpen, onClose: () => setMenuOpen(false) } : undefined}
        />
        <div className="app-main">
          <AppHeader area={area} onOpenMenu={hybrid ? () => setMenuOpen(true) : undefined} />
          <main className="app-content">
            <Outlet />
          </main>
        </div>
        {hybrid && <BottomNav area={area} items={barItems} />}
      </div>
    </PageHeaderProvider>
  );
}
