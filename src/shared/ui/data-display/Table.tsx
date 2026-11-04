import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';
import { IconChevronDown } from '../icons';
import styles from './Table.module.css';

// Peças visuais da tabela. A lógica (ordenar, filtrar, paginar) fica com o TanStack Table
// ou com os parâmetros que a API aceitar.
export function Table({ children, caption }: { children: ReactNode; caption?: string }) {
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        {caption && <caption className="sr-only">{caption}</caption>}
        {children}
      </table>
    </div>
  );
}

export const TableHead = (p: HTMLAttributes<HTMLTableSectionElement>) => <thead {...p} />;
export const TableBody = (p: HTMLAttributes<HTMLTableSectionElement>) => <tbody {...p} />;
export const TableRow = ({ className, ...rest }: HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={cn(styles.row, className)} {...rest} />
);

export interface TableHeaderProps extends ThHTMLAttributes<HTMLTableCellElement> {
  sorted?: 'asc' | 'desc' | false;
  onSort?: () => void; // se informado, o cabeçalho vira botão de ordenação
}

export function TableHeader({
  sorted = false,
  onSort,
  children,
  className,
  ...rest
}: TableHeaderProps) {
  const ariaSort =
    sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : onSort ? 'none' : undefined;
  return (
    <th scope="col" aria-sort={ariaSort} className={cn(styles.th, className)} {...rest}>
      {onSort ? (
        <button type="button" className={styles.sort} onClick={onSort}>
          {children}
          <span
            className={cn(styles.arrow, sorted && styles.arrowOn, sorted === 'asc' && styles.asc)}
          >
            <IconChevronDown size={14} />
          </span>
        </button>
      ) : (
        children
      )}
    </th>
  );
}

export const TableCell = ({ className, ...rest }: TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={cn(styles.td, className)} {...rest} />
);
