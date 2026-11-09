import { fetchCurrentUser, login } from './auth.api';

describe('auth.api (API simulada)', () => {
  it('faz login e devolve o usuário com perfil', async () => {
    const user = await login({
      email: 'academico@exemplo.com',
      password: '123456',
    });

    expect(user.role).toBe('STUDENT');
  });

  it('retorna null quando não há sessão', async () => {
    expect(await fetchCurrentUser()).toBeNull();
  });
});
