import { Toaster as Sonner } from 'sonner';

// Coloque <Toaster /> UMA vez em app/providers.tsx.
export function Toaster() {
  return (
    <Sonner
      position="top-right"
      toastOptions={{
        style: {
          fontFamily: 'var(--font-sans)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text)',
        },
      }}
    />
  );
}
