import { createContext, useContext, useEffect } from 'react';

export interface PageHeaderContent {
  title: string;
  subtitle?: string;
}

export const PageHeaderSetterContext = createContext<(content: PageHeaderContent | null) => void>(
  () => {},
);
export const PageHeaderContentContext = createContext<PageHeaderContent | null>(null);

export const usePageHeaderContent = () => useContext(PageHeaderContentContext);

/** A página define título e subtítulo do cabeçalho do layout (Figma: "Olá, João!"). */
export function usePageHeader(title: string, subtitle?: string) {
  const setContent = useContext(PageHeaderSetterContext);
  useEffect(() => {
    setContent({ title, subtitle });
    return () => setContent(null);
  }, [setContent, title, subtitle]);
}
