import { NavLink } from 'react-router-dom';
import type { NavItem } from '@/app/config/navigation';

type BottomNavProps = {
  area: string;
  items: readonly NavItem[];
};

/** Barra inferior do celular (navegação híbrida): os atalhos de uso diário. */
export function BottomNav({ area, items }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label={`Atalhos ${area}`}>
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end} className="bottom-nav__link">
          <span className="bottom-nav__icon">{item.icon}</span>
          <span className="bottom-nav__label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
