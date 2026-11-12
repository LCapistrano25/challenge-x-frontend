import { fetchCurrentUser, login, simulateMicrosoftLogin } from './auth.api';

describe('auth.api (API simulada)', () => {
  it('faz login e devolve o usuário com perfil', async () => {
    const user = await login({
      email: 'avaliador@exemplo.com',
      password: '123456',
    });

    expect(user.role).toBe('EXTERNAL_EVALUATOR');
  });

  it('recusa login por senha de aluno e professor (só entram pela Microsoft)', async () => {
    await expect(login({ email: 'academico@exemplo.com', password: '123456' })).rejects.toThrow();
    await expect(login({ email: 'professor@exemplo.com', password: '123456' })).rejects.toThrow();
  });

  it('abre a sessão simulada da Microsoft para aluno e professor', async () => {
    const user = await simulateMicrosoftLogin('novo.aluno@exemplo.com');

    expect(user).toMatchObject({ role: 'STUDENT', profileComplete: false });
    expect(await fetchCurrentUser()).toMatchObject({ email: 'novo.aluno@exemplo.com' });
  });

  it('não simula Microsoft para avaliador externo', async () => {
    await expect(simulateMicrosoftLogin('avaliador@exemplo.com')).rejects.toThrow();
  });

  it('retorna null quando não há sessão', async () => {
    expect(await fetchCurrentUser()).toBeNull();
  });
});
