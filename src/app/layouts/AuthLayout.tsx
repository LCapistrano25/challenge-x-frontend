import { Link, Outlet } from 'react-router-dom';
import { cn } from '@/shared/lib/cn';
import { IconHelp } from '@/shared/ui';
import styles from './AuthLayout.module.css';

type AuthLayoutProps = {
  /** `photo` usa a foto de fundo das telas de primeiro acesso. */
  variant?: 'plain' | 'photo';
};

/**
 * Moldura das telas de acesso (login, primeiro acesso, recuperar senha).
 * Não tem sidebar: quem ainda não entrou não precisa do menu da plataforma.
 */
export function AuthLayout({ variant = 'plain' }: AuthLayoutProps) {
  return (
    <div className={cn(styles.page, variant === 'photo' && styles.photo)}>
      <header className={styles.header}>
        <Link to="/" className={styles.brand}>
          <img src="/logo.svg" alt="" width={24} height={24} />
          Desafio X
        </Link>
        <a className={styles.help} href="mailto:suporte@desafiox.com">
          <IconHelp size={18} aria-hidden="true" />
          Precisa de ajuda?
        </a>
      </header>
      <main className={styles.content}>
        <Outlet />
      </main>
      <footer className={styles.footer}>
        <span>© {new Date().getFullYear()} Desafio X. Todos os direitos reservados.</span>
        <span>Projetos e inovação acadêmica</span>
      </footer>
    </div>
  );
}
