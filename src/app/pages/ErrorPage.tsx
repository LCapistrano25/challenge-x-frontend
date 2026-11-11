import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { Button } from '@/shared/ui';
import styles from './StatusPage.module.css';

/** Falha ao baixar um chunk lazy (típico após um deploy novo ou queda de rede). */
function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : '';
  return /dynamically imported module|importing a module script failed|loading chunk/i.test(
    message,
  );
}

/**
 * errorElement da raiz do router: captura erros de render, de loader e de
 * carregamento de rota. Não depende de contexto de auth nem de layout.
 */
export function ErrorPage() {
  const error = useRouteError();
  const chunkError = isChunkLoadError(error);

  const title = chunkError ? 'Não foi possível carregar a página' : 'Algo deu errado';
  const description = chunkError
    ? 'Sua conexão pode ter oscilado ou a plataforma foi atualizada. Recarregue para tentar de novo.'
    : isRouteErrorResponse(error)
      ? `Erro ${error.status}. Tente novamente em instantes.`
      : 'Ocorreu um erro inesperado. Tente novamente ou volte ao início.';

  return (
    <main className={`${styles.page} ${styles.fullPage}`} role="alert">
      <h1>{title}</h1>
      <p>{description}</p>
      <div className={styles.actions}>
        <Button onClick={() => window.location.reload()}>Recarregar página</Button>
        {/* <a> (e não <Link>) de propósito: força um carregamento limpo da aplicação. */}
        <a href="/">Voltar ao início</a>
      </div>
      {import.meta.env.DEV && error instanceof Error && (
        <pre className={styles.detail}>{error.message}</pre>
      )}
    </main>
  );
}
