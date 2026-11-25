import { useQuery } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
import { fetchAdminEditions } from '../api/evaluation-setup.api';
import { defaultEdition, sortEditions } from '../lib/editions';

export const adminEditionsKey = ['admin', 'editions'] as const;

/**
 * Edição escolhida no seletor "Edição atual" do cabeçalho. Fica guardada na sessão do
 * navegador para valer em todas as telas da administração (etapas, critérios, rubricas...).
 */
const STORAGE_KEY = 'desafio-x:admin-edition';
const listeners = new Set<() => void>();

function readSelected(): number | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? Number(raw) : null;
  } catch {
    return null;
  }
}

let selected: number | null = typeof window === 'undefined' ? null : readSelected();

export function selectAdminEdition(editionId: number) {
  selected = editionId;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, String(editionId));
  } catch {
    // Sem armazenamento (modo privado restrito): a escolha vale até recarregar a página.
  }
  listeners.forEach((listener) => listener());
}

/** Usado nos testes para começar sem edição escolhida. */
export function resetAdminEditionSelection() {
  selected = null;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignora
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Edições da administração e a edição em uso nas telas de configuração. */
export function useAdminEdition() {
  const query = useQuery({
    queryKey: adminEditionsKey,
    queryFn: fetchAdminEditions,
    select: sortEditions,
  });
  const selectedId = useSyncExternalStore(
    subscribe,
    () => selected,
    () => null,
  );
  const editions = query.data ?? [];
  const edition = editions.find((item) => item.id === selectedId) ?? defaultEdition(editions);

  return {
    editions,
    edition,
    isLoading: query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
