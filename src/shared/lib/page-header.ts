/** Título e subtítulo que a página atual mostra no cabeçalho do layout. */
import { createContext, useContext, useEffect, type ReactNode } from 'react';

export interface PageHeaderContent {
  title: string;
  subtitle?: string;
  /** Sobretítulo em caixa alta acima do título (Figma, administração: "ADMINISTRAÇÃO / ETAPAS"). */
  eyebrow?: string;
  /** Conteúdo à direita do título (ex.: seletor "Edição atual" da administração). */
  actions?: ReactNode;
}

export interface PageHeaderOptions {
  eyebrow?: string;
  actions?: ReactNode;
}

export const PageHeaderSetterContext = createContext<(content: PageHeaderContent | null) => void>(
  () => {},
);
export const PageHeaderContentContext = createContext<PageHeaderContent | null>(null);

export const usePageHeaderContent = () => useContext(PageHeaderContentContext);

/** A página define título e subtítulo do cabeçalho do layout (Figma: "Olá, João!"). */
export function usePageHeader(title: string, subtitle?: string, options: PageHeaderOptions = {}) {
  const setContent = useContext(PageHeaderSetterContext);
  const { eyebrow, actions } = options;
  useEffect(() => {
    setContent({ title, subtitle, eyebrow, actions });
    return () => setContent(null);
  }, [setContent, title, subtitle, eyebrow, actions]);
}
