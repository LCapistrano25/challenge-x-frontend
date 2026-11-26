import {
  fetchCurrentUser,
  getLoginErrorMessage,
  login,
  loginWithMicrosoftCode,
  simulateMicrosoftLogin,
} from './auth.api';

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

  it('troca o code OAuth da Microsoft pela sessão real e mapeia 401/403', async () => {
    const user = await loginWithMicrosoftCode('new-student');

    expect(user).toMatchObject({
      email: 'novo.aluno@exemplo.com',
      role: 'STUDENT',
      profileComplete: false,
    });

    const invalid = await loginWithMicrosoftCode('invalid').catch((err: unknown) => err);
    expect(getLoginErrorMessage(invalid, { microsoft: true })).toContain(
      'código inválido, expirado',
    );

    const domainErr = await loginWithMicrosoftCode('domain-error').catch((err: unknown) => err);
    expect(getLoginErrorMessage(domainErr, { microsoft: true })).toContain(
      'domínio de e-mail institucional',
    );
  });

  it('retorna null quando não há sessão', async () => {
    expect(await fetchCurrentUser()).toBeNull();
  });
});
