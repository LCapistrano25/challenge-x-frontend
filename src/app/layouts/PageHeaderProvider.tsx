import { useState, type ReactNode } from 'react';
import {
  PageHeaderContentContext,
  PageHeaderSetterContext,
  type PageHeaderContent,
} from './page-header-context';

/** Guarda o título que a página atual quer mostrar no cabeçalho do layout. */
export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<PageHeaderContent | null>(null);
  return (
    <PageHeaderSetterContext.Provider value={setContent}>
      <PageHeaderContentContext.Provider value={content}>
        {children}
      </PageHeaderContentContext.Provider>
    </PageHeaderSetterContext.Provider>
  );
}
