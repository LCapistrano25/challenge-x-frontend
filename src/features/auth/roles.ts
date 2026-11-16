import type { Role, User } from './types';

/** Perfis usam os mesmos identificadores definidos no contrato OpenAPI. */
export const ROLE_HOME: Record<Role, string> = {
  STUDENT: '/academico',
  TEACHER: '/professor',
  EXTERNAL_EVALUATOR: '/avaliador',
  ADMIN: '/admin',
};

/** Rótulos de interface: não substituir os valores técnicos enviados pela API. */
export const ROLE_LABEL: Record<Role, string> = {
  STUDENT: 'Acadêmico',
  TEACHER: 'Professor',
  EXTERNAL_EVALUATOR: 'Avaliador externo',
  ADMIN: 'Administrador',
};

/** Tela obrigatória do primeiro acesso de aluno e professor (login Microsoft). */
export const PROFILE_PATH = '/cadastro';

/** Perfis que passam pelo primeiro acesso. */
const ROLES_WITH_PROFILE: readonly Role[] = ['STUDENT', 'TEACHER'];

/** Só `false` explícito bloqueia: se o back-end não enviar o campo, o perfil é tratado como completo. */
export function needsProfile(user: User): boolean {
  return ROLES_WITH_PROFILE.includes(user.role) && user.profileComplete === false;
}

/** Destino correto logo após autenticar: primeiro acesso pendente ou a home do perfil. */
export function homePathFor(user: User): string {
  return needsProfile(user) ? PROFILE_PATH : ROLE_HOME[user.role];
}
