import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import type { NavItem } from '@/app/config/navigation';
import { IconChevronLeft, IconChevronRight } from '@/shared/ui/icons';

type SidebarProps = {
  area: string;
  nav: readonly NavItem[];
};

export function Sidebar({ area, nav }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const loginItem = nav.find((item) => item.to === '/login');
  const mainNav = nav.filter((item) => item.to !== '/login');

  return (
    <aside
      className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}`}
      aria-label={`Navegação ${area}`}
    >
      <div className="sidebar__header">
        <span className="brand" aria-label="Desafio X">
          <img src="/logo.svg" alt="" className="brand__logo" />
          <span className="brand__name">Desafio X</span>
        </span>
        <button
          type="button"
          className="sidebar__toggle"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          aria-expanded={!collapsed}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? <IconChevronRight size={18} /> : <IconChevronLeft size={18} />}
        </button>
        <button
          type="button"
          className="sidebar__menu-toggle"
          onClick={() => setMobileMenuOpen((value) => !value)}
          aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={mobileMenuOpen}
        >
          <span className="sidebar__hamburger" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
      </div>
      <div className={`sidebar__menu${mobileMenuOpen ? ' sidebar__menu--open' : ''}`}>
        <p className="sidebar__title">Menu</p>
        <nav className="sidebar__nav">
          {mainNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className="sidebar__link"
              title={collapsed ? item.label : undefined}
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.icon}
              <span className="sidebar__label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        {loginItem && (
          <div className="sidebar__footer">
            <NavLink
              to={loginItem.to}
              end={loginItem.end}
              className="sidebar__link"
              title={collapsed ? loginItem.label : undefined}
              onClick={() => setMobileMenuOpen(false)}
            >
              {loginItem.icon}
              <span className="sidebar__label">{loginItem.label}</span>
            </NavLink>
          </div>
        )}
      </div>
    </aside>
  );
}
