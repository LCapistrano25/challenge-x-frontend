export function Spinner({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="spinner">
      {label}
    </div>
  );
}
