import type { AnchorHTMLAttributes } from 'react';
import { Link } from 'react-router-dom';
import './Button.css';

type ButtonLinkVariant = 'primary' | 'secondary' | 'ghost';
type ButtonLinkSize = 'small' | 'medium' | 'large';

export interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Rota interna (usa o React Router) ou URL externa/arquivo (usa <a>). */
  to: string;
  variant?: ButtonLinkVariant;
  size?: ButtonLinkSize;
}

const isExternal = (to: string) => /^(https?:|mailto:|\/\/)/.test(to) || /\.pdf($|\?)/i.test(to);

/** Link com a aparência do Button. Use para navegação e downloads; para ações, use Button. */
export function ButtonLink({
  to,
  variant = 'primary',
  size = 'medium',
  className = '',
  ...props
}: ButtonLinkProps) {
  const classes = ['button', `button--${variant}`, `button--${size}`, className]
    .filter(Boolean)
    .join(' ');

  if (isExternal(to)) {
    return <a href={to} className={classes} {...props} />;
  }
  return <Link to={to} className={classes} {...props} />;
}
