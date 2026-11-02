type PagePlaceholderProps = {
  title: string;
  /** Número da task no board (ex.: 12) para rastreabilidade. */
  task?: number;
};

/** Tela provisória. Substitua pelo conteúdo real ao implementar a task. */
export function PagePlaceholder({ title, task }: PagePlaceholderProps) {
  return (
    <section className="placeholder">
      <h1>{title}</h1>
      {task !== undefined && <p>Em construção (task #{task}).</p>}
    </section>
  );
}
