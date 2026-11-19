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

const isExternal = (href: string) => /^(https?:|\/\/)/.test(href) || /\.pdf($|\?)/i.test(href);

/** "Leia mais": rota interna com Link; PDF ou URL externa em nova aba. Sem destino, não aparece. */
function ReadMore({ href, title }: { href: string; title: string }) {
  const label = (
    <>
      Leia mais<span className="sr-only"> sobre {title}</span>
    </>
  );
  return isExternal(href) ? (
    <a href={href} target="_blank" rel="noreferrer" className={styles.readMore}>
      {label}
    </a>
  ) : (
    <Link to={href} className={styles.readMore}>
      {label}
    </Link>
  );
}

function ReadMoreIfAny({ href, title }: { href?: string; title: string }) {
  return href ? <ReadMore href={href} title={title} /> : null;
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
              <ReadMoreIfAny href={item.href ?? allNewsHref} title={item.title} />
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
