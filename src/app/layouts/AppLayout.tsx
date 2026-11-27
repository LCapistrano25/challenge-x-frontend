import { useState } from 'react';
import { Outlet, ScrollRestoration } from 'react-router-dom';
import { ROLE_LABEL, useAuth } from '@/features/auth';
import { useCurrentEdition } from '@/features/public-panel';
import { useStudentDashboard } from '@/features/teams';
import { Avatar, ConfirmDialog, DropdownMenu, IconMenu, notify } from '@/shared/ui';
import { BrandLogo } from '@/app/config/nav-icons';
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
function AppHeader({
  area,
  onOpenMenu,
  onRequestLogout,
}: {
  area: string;
  onOpenMenu?: () => void;
  onRequestLogout: () => void;
}) {
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
            {content.eyebrow && <span className="app-header__eyebrow">{content.eyebrow}</span>}
            <h1>{content.title}</h1>
            {content.subtitle && <p>{content.subtitle}</p>}
          </>
        )}
      </div>
      {content?.actions && <div className="app-header__actions">{content.actions}</div>}
      {user && (
        <div className="app-header__account">
          <div className="app-header__profile">
            <span className="app-header__name">{user.name}</span>
            <span className="app-header__meta">
              {area}
              {edition && ` · Edição ${edition.year}`}
            </span>
          </div>
          <DropdownMenu
            align="end"
            trigger={
              <button
                type="button"
                className="app-header__avatar-trigger"
                aria-label={`Abrir opções da conta de ${user.name}`}
                title="Opções da conta"
              >
                <Avatar name={user.name} tone="blue" />
              </button>
            }
            items={[{ label: 'Sair', tone: 'danger', onSelect: onRequestLogout }]}
          />
        </div>
      )}
    </header>
  );
}

/**
 * Cabeçalho do avaliador externo (Figma: 06 - Avaliador › "Cabeçalho do sistema"): faixa em
 * degradê com a identificação do sistema e o perfil.
 */
function BrandHeader({
  area,
  onOpenMenu,
  onRequestLogout,
}: {
  area: string;
  onOpenMenu?: () => void;
  onRequestLogout: () => void;
}) {
  const { user } = useAuth();
  return (
    <header className="app-header app-header--brand">
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
          <DropdownMenu
            align="end"
            trigger={
              <button
                type="button"
                className="app-header__avatar-trigger"
                aria-label={`Abrir opções da conta de ${user.name}`}
                title="Opções da conta"
              >
                <Avatar name={user.name} tone="blue" className="app-header__avatar" />
              </button>
            }
            items={[{ label: 'Sair', tone: 'danger', onSelect: onRequestLogout }]}
          />
        </div>
      )}
    </header>
  );
}

/** Layout das áreas autenticadas. Cada perfil passa o próprio menu. */
export function AppLayout({ area, nav }: AppLayoutProps) {
  const { user, logout } = useAuth();
  // Itens do líder (ex.: "Observações") dependem de StudentDashboard.is_leader.
  const isLeader =
    useStudentDashboard({ enabled: user?.role === 'STUDENT' }).data?.is_leader === true;
  const items = nav.filter((item) => !item.leaderOnly || isLeader);
  // O avaliador externo mantém a moldura própria com cabeçalho em degradê.
  const brand = user?.role === 'EXTERNAL_EVALUATOR';
  const barItems = items.filter((item) => item.mobileBar);
  const hybrid = barItems.length > 0;
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
      setLogoutConfirmOpen(false);
      window.location.replace('/');
    } catch {
      notify.error('Não foi possível sair. Tente novamente.');
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <PageHeaderProvider>
      <div
        className={`layout app-shell${hybrid ? ' app-shell--hybrid' : ''}${brand ? ' app-shell--brand' : ''}`}
      >
        <Sidebar
          area={area}
          nav={items}
          footer={
            user
              ? {
                  label: 'Conta',
                  avatarName: user.name,
                  roleLabel: ROLE_LABEL[user.role],
                  onLogout: () => setLogoutConfirmOpen(true),
                }
              : undefined
          }
          drawer={hybrid ? { open: menuOpen, onClose: () => setMenuOpen(false) } : undefined}
        />
        <div className="app-main">
          {brand ? (
            <BrandHeader
              area={area}
              onOpenMenu={hybrid ? () => setMenuOpen(true) : undefined}
              onRequestLogout={() => setLogoutConfirmOpen(true)}
            />
          ) : (
            <AppHeader
              area={area}
              onOpenMenu={hybrid ? () => setMenuOpen(true) : undefined}
              onRequestLogout={() => setLogoutConfirmOpen(true)}
            />
          )}
          <main className="app-content">
            <Outlet />
          </main>
        </div>
        {hybrid && <BottomNav area={area} items={barItems} />}
        <ConfirmDialog
          open={logoutConfirmOpen}
          onOpenChange={setLogoutConfirmOpen}
          title="Deseja mesmo sair?"
          description="Sua sessão atual será encerrada."
          confirmLabel="Sair"
          cancelLabel="Cancelar"
          tone="danger"
          loading={loggingOut}
          onConfirm={handleLogout}
        />
        {/* Cada navegação nova abre no topo; voltar/avançar recupera a posição anterior. */}
        <ScrollRestoration />
      </div>
    </PageHeaderProvider>
  );
}
