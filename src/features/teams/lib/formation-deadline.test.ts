import { daysUntil, describeFormationDeadline } from './formation-deadline';

const today = new Date(2026, 10, 10, 15, 30); // 10/11/2026, à tarde

describe('daysUntil', () => {
  it('conta dias de calendário, ignorando o horário', () => {
    expect(daysUntil(new Date(2026, 10, 15, 8, 0), today)).toBe(5);
    expect(daysUntil(new Date(2026, 10, 11, 0, 1), today)).toBe(1);
  });

  it('retorna zero no próprio dia e negativo depois do prazo', () => {
    expect(daysUntil(new Date(2026, 10, 10, 23, 59), today)).toBe(0);
    expect(daysUntil(new Date(2026, 10, 8), today)).toBe(-2);
  });
});

describe('describeFormationDeadline', () => {
  it('mostra os dias restantes', () => {
    expect(describeFormationDeadline(new Date(2026, 10, 15), today).value).toBe('5 dias');
    expect(describeFormationDeadline(new Date(2026, 10, 11), today).value).toBe('1 dia');
  });

  it('avisa quando é o último dia ou o prazo terminou', () => {
    expect(describeFormationDeadline(new Date(2026, 10, 10), today).value).toBe('Hoje');
    expect(describeFormationDeadline(new Date(2026, 10, 1), today).value).toBe('Encerrado');
  });
});
