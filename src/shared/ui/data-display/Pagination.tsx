import { cn } from '@/shared/lib/cn';
import { IconChevronLeft, IconChevronRight } from '../icons';
import styles from './Pagination.module.css';

export interface PaginationProps {
  page: number; // página atual (começa em 1)
  pageCount: number;
  onPageChange: (page: number) => void;
}

// 1 ... 4 [5] 6 ... 20
function janela(page: number, total: number): Array<number | 'gap'> {
  const alvo = [1, total, page - 1, page, page + 1].filter((p) => p >= 1 && p <= total);
  const ordenado = [...new Set(alvo)].sort((a, b) => a - b);
  const saida: Array<number | 'gap'> = [];
  let anterior = 0;
  for (const p of ordenado) {
    if (p - anterior > 1) saida.push('gap');
    saida.push(p);
    anterior = p;
  }
  return saida;
}

export function Pagination({ page, pageCount, onPageChange }: PaginationProps) {
  if (pageCount <= 1) return null;

  return (
    <nav className={styles.nav} aria-label="Paginação">
      <button
        type="button"
        className={styles.btn}
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Página anterior"
      >
        <IconChevronLeft size={18} />
      </button>

      {janela(page, pageCount).map((p, i) =>
        p === 'gap' ? (
          <span key={`gap-${i}`} className={styles.gap} aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            className={cn(styles.btn, p === page && styles.current)}
            onClick={() => onPageChange(p)}
            aria-label={`Página ${p}`}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        className={styles.btn}
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pageCount}
        aria-label="Próxima página"
      >
        <IconChevronRight size={18} />
      </button>
    </nav>
  );
}
