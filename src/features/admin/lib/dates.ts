/**
 * Datas do cronograma. A API trabalha com date-time (ISO 8601, UTC); o formulário trabalha com
 * o dia (AAAA-MM-DD, campo date nativo). O início vale a partir de 00h00 e os prazos vão até
 * 23h59 do dia, no horário de Brasília (America/Sao_Paulo, UTC-3 sem horário de verão).
 */

const BRT_OFFSET = '-03:00';
const pad = (value: number) => String(value).padStart(2, '0');

/** Dia (AAAA-MM-DD) de um date-time da API, no horário de Brasília. */
export function toDateInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(new Date(iso).getTime() - 3 * 60 * 60 * 1000);
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** Início da etapa: 00h00 do dia em Brasília. */
export const startOfDayIso = (day: string) =>
  new Date(`${day}T00:00:00${BRT_OFFSET}`).toISOString();

/** Prazo (entrega ou avaliação): 23h59 do dia em Brasília. */
export const endOfDayIso = (day: string) => new Date(`${day}T23:59:00${BRT_OFFSET}`).toISOString();

/** "28/05/2027" a partir de AAAA-MM-DD. */
export function formatDay(day: string): string {
  const [year, month, dayOfMonth] = day.split('-');
  return `${dayOfMonth}/${month}/${year}`;
}

/** "28/05" a partir de AAAA-MM-DD. */
export const formatDayMonth = (day: string) => formatDay(day).slice(0, 5);

/** "01/03 a 19/03/2027"; com anos diferentes, os dois aparecem completos. */
export function formatPeriod(startDay: string, endDay: string): string {
  if (!startDay || !endDay) return '—';
  return startDay.slice(0, 4) === endDay.slice(0, 4)
    ? `${formatDayMonth(startDay)} a ${formatDay(endDay)}`
    : `${formatDay(startDay)} a ${formatDay(endDay)}`;
}

/** Dia anterior (AAAA-MM-DD), para dizer "até 27/05" quando o limite é 28/05. */
export function previousDay(day: string): string {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

/** Dia de hoje em Brasília. */
export const todayInput = (now: Date = new Date()) => toDateInput(now.toISOString());
