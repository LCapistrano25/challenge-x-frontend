const DAY_MS = 24 * 60 * 60 * 1000;

/** Dias de calendário entre hoje e o prazo (ignora o horário). Negativo = prazo vencido. */
export function daysUntil(deadline: string | Date, today: Date = new Date()) {
  const end = new Date(deadline);
  const startUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.round((endUtc - startUtc) / DAY_MS);
}

/** Texto do card "Prazo" a partir da data de fim da formação. */
export function describeFormationDeadline(deadline: string | Date, today: Date = new Date()) {
  const days = daysUntil(deadline, today);
  if (days < 0)
    return { value: 'Encerrado', description: 'o prazo de formação da equipe terminou' };
  if (days === 0)
    return { value: 'Hoje', description: 'último dia para completar a formação da equipe' };
  return {
    value: days === 1 ? '1 dia' : `${days} dias`,
    description: 'para completar a formação da equipe',
  };
}
