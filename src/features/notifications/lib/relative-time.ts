const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

/** "Agora", "Há 2 min", "Há 3 h", "Ontem", "Há 4 dias" ou a data (dd/mm/aaaa). */
export function formatRelativeTime(isoDate: string, now: Date = new Date()) {
  const date = new Date(isoDate);
  const diff = now.getTime() - date.getTime();

  if (diff < MINUTE) return 'Agora';
  if (diff < HOUR) return `Há ${Math.floor(diff / MINUTE)} min`;

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (date.getTime() >= startOfToday) return `Há ${Math.floor(diff / HOUR)} h`;

  const days = Math.ceil((startOfToday - date.getTime()) / (24 * HOUR));
  if (days <= 1) return 'Ontem';
  if (days < 7) return `Há ${days} dias`;
  return date.toLocaleDateString('pt-BR');
}
