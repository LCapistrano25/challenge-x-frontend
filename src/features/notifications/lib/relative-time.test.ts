import { formatRelativeTime } from './relative-time';

const now = new Date(2026, 10, 10, 15, 0);
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60 * 1000).toISOString();

describe('formatRelativeTime', () => {
  it('formata minutos e horas do mesmo dia', () => {
    expect(formatRelativeTime(minutesAgo(2), now)).toBe('Há 2 min');
    expect(formatRelativeTime(minutesAgo(15), now)).toBe('Há 15 min');
    expect(formatRelativeTime(minutesAgo(180), now)).toBe('Há 3 h');
  });

  it('usa "Ontem" e dias para datas anteriores', () => {
    expect(formatRelativeTime(new Date(2026, 10, 9, 20, 0).toISOString(), now)).toBe('Ontem');
    expect(formatRelativeTime(new Date(2026, 10, 6, 10, 0).toISOString(), now)).toBe('Há 4 dias');
  });
});
