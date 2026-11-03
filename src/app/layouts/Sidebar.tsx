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

  return (
    <aside
      className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}`}
      aria-label={`Navegação ${area}`}
    >
      <div className="sidebar__header">
        <span className="brand">{collapsed ? area.charAt(0) : area}</span>
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
      </div>
      <p className="sidebar__title">{collapsed ? 'Menu' : 'Menu'}</p>
      <nav className="sidebar__nav">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className="sidebar__link"
            title={collapsed ? item.label : undefined}
          >
            {item.icon}
            <span className="sidebar__label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
