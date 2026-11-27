import { NavLink, useLocation } from 'react-router-dom';
import { isNavItemActive, type NavItem } from '@/app/config/navigation';

type BottomNavProps = {
  area: string;
  items: readonly NavItem[];
};

/** Barra inferior do celular (navegação híbrida): os atalhos de uso diário. */
export function BottomNav({ area, items }: BottomNavProps) {
  const { pathname } = useLocation();

  return (
    <nav className="bottom-nav" aria-label={`Atalhos ${area}`}>
      {items.map((item) => {
        const extraActive = isNavItemActive(item, pathname);
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              isActive || extraActive ? 'bottom-nav__link active' : 'bottom-nav__link'
            }
          >
            <span className="bottom-nav__icon">{item.icon}</span>
            <span className="bottom-nav__label">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
