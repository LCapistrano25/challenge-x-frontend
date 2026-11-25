import type { ReactNode } from 'react';
import { Alert, Button, EmptyState, Spinner } from '@/shared/ui';
import { describeSetupError } from '../../lib/errors';
import type { AdminEdition } from '../../types';
import styles from './Setup.module.css';

interface QueryState {
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => unknown;
}

/**
 * Carregamento e falhas comuns às telas de configuração: edições e, depois, os dados da edição
 * escolhida. Devolve `null` quando a tela pode ser exibida.
 */
export function setupStateView(
  editions: QueryState & { edition: AdminEdition | undefined },
  setup: QueryState,
): ReactNode {
  if (editions.isLoading) {
    return (
      <div className={styles.state}>
        <Spinner label="Carregando as edições…" />
      </div>
    );
  }
  if (editions.isError) {
    return (
      <Alert
        tone="danger"
        title="Não foi possível carregar as edições."
        action={
          <Button size="small" variant="secondary" onClick={() => void editions.refetch()}>
            Tentar de novo
          </Button>
        }
      >
        {describeSetupError(editions.error, 'Verifique sua conexão e tente novamente.')}
      </Alert>
    );
  }
  if (!editions.edition) {
    return (
      <EmptyState
        title="Nenhuma edição cadastrada"
        description="Cadastre uma edição para configurar etapas, critérios e pontuações."
      />
    );
  }
  if (setup.isLoading) {
    return (
      <div className={styles.state}>
        <Spinner label="Carregando a configuração da edição…" />
      </div>
    );
  }
  if (setup.isError) {
    return (
      <Alert
        tone="danger"
        title="Não foi possível carregar a configuração da edição."
        action={
          <Button size="small" variant="secondary" onClick={() => void setup.refetch()}>
            Tentar de novo
          </Button>
        }
      >
        {describeSetupError(setup.error, 'Verifique sua conexão e tente novamente.')}
      </Alert>
    );
  }
  return null;
}
