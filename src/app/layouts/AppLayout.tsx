import { useState } from 'react';
import { NavLink, Outlet, ScrollRestoration, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { useCurrentEdition } from '@/features/public-panel';
import { useStudentDashboard } from '@/features/teams';
import { Avatar, IconMenu } from '@/shared/ui';
import { BrandLogo } from '@/app/config/nav-icons';
import { isNavItemActive, type NavItem } from '@/app/config/navigation';
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

/**
 * Cabeçalho do avaliador externo (Figma: 06 - Avaliador › "Cabeçalho do sistema"): faixa em
 * degradê com a identificação do sistema e o perfil.
 */
function BrandHeader({ area }: { area: string }) {
  const { user } = useAuth();
  return (
    <header className="app-header app-header--brand">
      <div className="app-header__brand">
        <span className="app-header__logo" aria-hidden="true">
          <BrandLogo />
        </span>
        <strong>Desafio X</strong>
        <span className="app-header__tagline">Acompanhamento de projetos acadêmicos</span>
      </div>
      {user && (
        <div className="app-header__account">
          <div className="app-header__profile">
            <span className="app-header__name">{user.name}</span>
            <span className="app-header__meta">{area}</span>
          </div>
          <Avatar name={user.name} tone="blue" className="app-header__avatar" />
        </div>
      )}
    </header>
  );
}

/** Abas da área externa (Figma: "Navegação da área externa"), abaixo do cabeçalho. */
function AreaTabs({ area, items }: { area: string; items: readonly NavItem[] }) {
  const { pathname } = useLocation();
  return (
    <nav className="app-tabs" aria-label={`Navegação da área ${area}`}>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={isNavItemActive(item, pathname) ? 'app-tabs__link active' : 'app-tabs__link'}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
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
  // O avaliador externo tem moldura própria no Figma: cabeçalho em degradê e abas.
  const brand = user?.role === 'EXTERNAL_EVALUATOR';
  const barItems = items.filter((item) => item.mobileBar);
  const hybrid = barItems.length > 0;
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <PageHeaderProvider>
      <div
        className={`layout app-shell${hybrid ? ' app-shell--hybrid' : ''}${brand ? ' app-shell--brand' : ''}`}
      >
        <Sidebar
          area={area}
          nav={items}
          // Figma: ícone de usuário + "Login" no rodapé (aqui, encerra a sessão).
          footer={{ label: 'Login', onClick: handleLogout }}
          drawer={hybrid ? { open: menuOpen, onClose: () => setMenuOpen(false) } : undefined}
        />
        <div className="app-main">
          {brand ? (
            <>
              <BrandHeader area={area} />
              <AreaTabs area={area} items={items} />
            </>
          ) : (
            <AppHeader area={area} onOpenMenu={hybrid ? () => setMenuOpen(true) : undefined} />
          )}
          <main className="app-content">
            <Outlet />
          </main>
        </div>
        {hybrid && <BottomNav area={area} items={barItems} />}
        {/* Cada navegação nova abre no topo; voltar/avançar recupera a posição anterior. */}
        <ScrollRestoration />
      </div>
    </PageHeaderProvider>
  );
}
