import { Link } from 'react-router-dom';
import { cn } from '@/shared/lib/cn';
import { Badge } from '@/shared/ui';
import type { NewsItem } from '../types';
import styles from './PublicContent.module.css';

export interface NewsListProps {
  items: NewsItem[];
  /** Destino do "Ver todas". Sem valor, o link não aparece. */
  allNewsHref?: string;
  className?: string;
}

export function NewsList({ items, allNewsHref, className }: NewsListProps) {
  return (
    <section className={cn(styles.news, className)} aria-labelledby="news-title">
      <div className={styles.sectionHeader}>
        <h2 id="news-title" className={styles.sectionTitle}>
          Notícias
        </h2>
        {allNewsHref && (
          <Link to={allNewsHref} className={styles.link}>
            Ver todas
          </Link>
        )}
      </div>
      <ul className={styles.newsList}>
        {items.map((item) => (
          <li key={item.id}>
            <article className={cn(styles.card, styles.newsCard)}>
              <Badge tone="brand" shape="tag">
                {item.category}
              </Badge>
              <h3 className={styles.cardTitle}>{item.title}</h3>
              <p className={styles.cardText}>{item.summary}</p>
              <Link to={item.href ?? allNewsHref ?? '/'} className={styles.readMore}>
                Leia mais<span className="sr-only"> sobre {item.title}</span>
              </Link>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
