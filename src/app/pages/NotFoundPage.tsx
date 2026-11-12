import { Link } from 'react-router-dom';
import styles from './StatusPage.module.css';

export function NotFoundPage() {
  return (
    <section className={styles.page}>
      <h1>Página não encontrada</h1>
      <p>O endereço acessado não existe ou foi movido.</p>
      <Link to="/">Voltar ao início</Link>
    </section>
  );
}
