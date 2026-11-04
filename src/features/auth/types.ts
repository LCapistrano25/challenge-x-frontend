export const ROLES = ['STUDENT', 'TEACHER', 'EXTERNAL_EVALUATOR', 'ADMIN'] as const;

export type Role = (typeof ROLES)[number];

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type LoginInput = { email: string; password: string };
