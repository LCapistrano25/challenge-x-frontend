import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import type { NavItem } from '@/app/config/navigation';
import { cn } from '@/shared/lib/cn';
import { IconChevronLeft, IconChevronRight } from '@/shared/ui/icons';
import styles from './Sidebar.module.css';

type SidebarProps = {
  area: string;
  nav: readonly NavItem[];
};

export function Sidebar({ area, nav }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const loginItem = nav.find((item) => item.to === '/login');
  const mainNav = nav.filter((item) => item.to !== '/login');

  // NavLink aplica a classe "active" global; com CSS Modules precisamos montar a nossa.
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(styles.link, isActive && styles.active);

  return (
    <aside
      className={cn(styles.sidebar, collapsed && styles.collapsed)}
      data-collapsed={collapsed}
      aria-label={`Navegação ${area}`}
    >
      <div className={styles.header}>
        <span className={styles.brand} aria-label="Desafio X">
          <img src="/logo.svg" alt="" className={styles.brandLogo} />
          <span className={styles.brandName}>Desafio X</span>
        </span>
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          aria-expanded={!collapsed}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? <IconChevronRight size={18} /> : <IconChevronLeft size={18} />}
        </button>
        <button
          type="button"
          className={styles.menuToggle}
          onClick={() => setMobileMenuOpen((value) => !value)}
          aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={mobileMenuOpen}
        >
          <span className={styles.hamburger} aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
      </div>
      <div className={cn(styles.menu, mobileMenuOpen && styles.menuOpen)}>
        <p className={styles.title}>Menu</p>
        <nav className={styles.nav}>
          {mainNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={linkClass}
              title={collapsed ? item.label : undefined}
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.icon}
              <span className={styles.label}>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        {loginItem && (
          <div className={styles.footer}>
            <NavLink
              to={loginItem.to}
              end={loginItem.end}
              className={linkClass}
              title={collapsed ? loginItem.label : undefined}
              onClick={() => setMobileMenuOpen(false)}
            >
              {loginItem.icon}
              <span className={styles.label}>{loginItem.label}</span>
            </NavLink>
          </div>
        )}
      </div>
    </aside>
  );
}
