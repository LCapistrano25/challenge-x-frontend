import { useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import type { NavItem } from '@/app/config/navigation';
import { BrandLogo, NavIconUser } from '@/app/config/nav-icons';
import { Tooltip } from '@/shared/ui';

export type SidebarFooter =
  | { label: string; to: string; onClick?: never }
  | { label: string; onClick: () => void; to?: never };

type SidebarProps = {
  area: string;
  nav: readonly NavItem[];
  /** Ação do rodapé (Figma: ícone de usuário + "Login"). */
  footer?: SidebarFooter;
  /**
   * Navegação híbrida no celular: a barra lateral some e vira uma gaveta aberta pelo ☰
   * do cabeçalho, mostrando só os itens que não estão na barra inferior.
   */
  drawer?: { open: boolean; onClose: () => void };
};

const STORAGE_KEY = 'cx.sidebar.expanded';
const MOBILE_QUERY = '(max-width: 48rem)';

const isMobile = () =>
  typeof window !== 'undefined' && window.matchMedia?.(MOBILE_QUERY).matches === true;

function readExpanded() {
  // No celular a barra sempre começa fechada (aberta, ela cobre o conteúdo).
  if (isMobile()) return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function Label({ children }: { children: ReactNode }) {
  return <span className="sidebar__label">{children}</span>;
}

/** Com a barra fechada, o nome do item aparece no Tooltip do design system. */
function WithTooltip({
  show,
  label,
  children,
}: {
  show: boolean;
  label: string;
  children: ReactNode;
}) {
  return show ? (
    <Tooltip content={label} side="right">
      {children}
    </Tooltip>
  ) : (
    <>{children}</>
  );
}

/**
 * Barra lateral (Figma: "Tab Bar - Acadêmico"). Fechada mostra só os ícones (72px);
 * clicar na logo abre com os rótulos (202px). No celular vira uma barra inferior.
 */
export function Sidebar({ area, nav, footer, drawer }: SidebarProps) {
  const [expandedState, setExpanded] = useState(readExpanded);
  const drawerOpen = drawer?.open === true;
  const expanded = expandedState || drawerOpen;

  function toggle() {
    if (drawerOpen) {
      drawer?.onClose();
      return;
    }
    setExpanded((value) => {
      if (!isMobile()) {
        try {
          window.localStorage.setItem(STORAGE_KEY, String(!value));
        } catch {
          // armazenamento indisponível: só não lembra a preferência
        }
      }
      return !value;
    });
  }

  /** No celular, escolher um destino fecha a barra aberta. */
  function closeOnMobile() {
    if (!isMobile()) return;
    setExpanded(false);
    drawer?.onClose();
  }

  return (
    <>
      {expanded && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Fechar menu"
          tabIndex={-1}
          onClick={() => {
            setExpanded(false);
            drawer?.onClose();
          }}
        />
      )}
      <aside
        className={[
          'sidebar',
          expanded && 'sidebar--expanded',
          drawer && 'sidebar--hybrid',
          drawerOpen && 'sidebar--drawer-open',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-label={`Navegação ${area}`}
      >
        <button
          type="button"
          className="sidebar__brand"
          onClick={toggle}
          aria-expanded={expanded}
          aria-label={expanded ? 'Recolher menu' : 'Expandir menu'}
          title={expanded ? 'Recolher menu' : 'Expandir menu'}
        >
          <BrandLogo />
          <Label>Desafio X</Label>
        </button>

        <nav className="sidebar__nav">
          {nav.map((item) => (
            <WithTooltip key={item.to} show={!expanded} label={item.label}>
              <NavLink
                to={item.to}
                end={item.end}
                className="sidebar__link"
                data-bar={item.mobileBar ? '' : undefined}
                onClick={closeOnMobile}
              >
                <span className="sidebar__icon">{item.icon}</span>
                <Label>{item.label}</Label>
              </NavLink>
            </WithTooltip>
          ))}
        </nav>

        {footer && (
          <WithTooltip show={!expanded} label={footer.label}>
            {footer.to ? (
              <Link to={footer.to} className="sidebar__footer" onClick={closeOnMobile}>
                <NavIconUser />
                <Label>{footer.label}</Label>
              </Link>
            ) : (
              <button type="button" className="sidebar__footer" onClick={footer.onClick}>
                <NavIconUser />
                <Label>{footer.label}</Label>
              </button>
            )}
          </WithTooltip>
        )}
      </aside>
    </>
  );
}
