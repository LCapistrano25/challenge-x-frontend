import { Link } from 'react-router-dom';
import { ROLE_HOME, useAuth } from '@/features/auth';
import styles from './StatusPage.module.css';

export function ForbiddenPage() {
  const { user } = useAuth();

  return (
    <section className={styles.page}>
      <h1>Acesso negado</h1>
      <p>Seu perfil não tem permissão para acessar esta página.</p>
      <Link to={user ? ROLE_HOME[user.role] : '/'}>Voltar para minha área</Link>
    </section>
  );
}
