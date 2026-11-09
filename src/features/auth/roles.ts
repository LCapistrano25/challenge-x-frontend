import type { Role } from './types';

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
