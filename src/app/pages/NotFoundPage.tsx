import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="placeholder">
      <h1>Página não encontrada</h1>
      <p>O endereço acessado não existe ou foi movido.</p>
      <Link to="/">Voltar ao início</Link>
    </section>
  );
}
