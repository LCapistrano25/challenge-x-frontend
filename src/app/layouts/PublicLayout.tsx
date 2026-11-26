import { useState } from 'react';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { hasPendingMicrosoftOAuthState, useAuth } from '@/features/auth';
import { NAV_ITEMS, ROLE_AREA } from '@/app/config/navigation';
import { BrandLogo } from '@/app/config/nav-icons';
import { IconMenu } from '@/shared/ui';
import { AppLayout } from './AppLayout';
import { Sidebar } from './Sidebar';

/**
 * Páginas públicas (vitrine, acervo, painel). Quem está logado continua vendo o layout
 * do próprio perfil — a barra lateral não muda ao abrir "Projetos" ou "Acervo".
 */
export function PublicLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Quando o Entra ID redireciona para a raiz (ex.: http://localhost:5173/?code=...&state=...),
  // encaminha o retorno OAuth para a tela de callback antes de renderizar a vitrine pública.
  if (location.pathname === '/' && location.search) {
    const params = new URLSearchParams(location.search);
    const hasOAuthCode = params.has('code') && params.has('state');
    const hasOAuthError =
      params.has('error') && (params.has('state') || hasPendingMicrosoftOAuthState());
    if (hasOAuthCode || hasOAuthError) {
      return <Navigate to={`/auth/microsoft/callback${location.search}`} replace />;
    }
  }

  if (user) {
    return <AppLayout area={ROLE_AREA[user.role]} nav={NAV_ITEMS[user.role]} />;
  }

  return (
    <div className="layout app-shell app-shell--menu">
      <Sidebar
        area="Plataforma"
        nav={NAV_ITEMS.publico}
        footer={{ label: 'Login', to: '/login' }}
        drawer={{ open: menuOpen, onClose: () => setMenuOpen(false) }}
      />
      <div className="app-main">
        {/* Só no celular: abre a barra lateral como gaveta (sem barra inferior). */}
        <header className="app-header app-header--menu">
          <button
            type="button"
            className="app-header__menu"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menu"
            title="Menu"
          >
            <IconMenu size={24} />
          </button>
          <Link to="/" className="app-brand-min">
            <BrandLogo />
            <span>Desafio X</span>
          </Link>
        </header>
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
