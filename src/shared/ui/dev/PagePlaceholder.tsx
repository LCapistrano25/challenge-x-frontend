type PagePlaceholderProps = {
  title: string;
  task?: number;
};

export function PagePlaceholder({ title, task }: PagePlaceholderProps) {
  return (
    <section className="placeholder">
      <h1>{title}</h1>
      {task !== undefined && <p>Em construção (task #{task}).</p>}
    </section>
  );
}
