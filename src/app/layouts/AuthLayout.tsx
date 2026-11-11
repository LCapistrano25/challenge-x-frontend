import { Link, Outlet } from 'react-router-dom';
import styles from './AuthLayout.module.css';

/**
 * Moldura das telas de acesso (login, login administrativo, cadastro, recuperar senha).
 * Não tem sidebar: quem ainda não entrou não precisa do menu da plataforma.
 */
export function AuthLayout() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className={styles.brand}>
          Desafio X
        </Link>
        <a className={styles.help} href="mailto:suporte@desafiox.com">
          Precisa de ajuda?
        </a>
      </header>
      <main className={styles.content}>
        <Outlet />
      </main>
      <footer className={styles.footer}>
        © {new Date().getFullYear()} Desafio X. Todos os direitos reservados.
      </footer>
    </div>
  );
}
