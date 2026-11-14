import { fetchStudentDashboard } from './dashboard.api';

describe('dashboard.api (API simulada)', () => {
  it('retorna o painel do acadêmico no formato do contrato', async () => {
    const dashboard = await fetchStudentDashboard();

    expect(dashboard.team?.members.length).toBeGreaterThan(0);
    expect(dashboard.stages[0]?.stage).toHaveProperty('phase_status');
    expect(Array.isArray(dashboard.pending_actions)).toBe(true);
  });
});
