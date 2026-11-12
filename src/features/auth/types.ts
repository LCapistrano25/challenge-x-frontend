export const ROLES = ['STUDENT', 'TEACHER', 'EXTERNAL_EVALUATOR', 'ADMIN'] as const;

export type Role = (typeof ROLES)[number];

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  /**
   * Só existe para quem entra pela Microsoft (aluno e professor). O back-end devolve
   * `false` até a pessoa concluir o preenchimento do primeiro acesso. Ausente = completo.
   */
  profileComplete?: boolean;
};

export type LoginInput = { email: string; password: string };

/** Curso do catálogo mantido pela administração. */
export type Course = { id: string; name: string };

/** Dados que o aluno informa no primeiro acesso. */
export type StudentProfileInput = {
  role: 'STUDENT';
  courseId: string;
  registration: string;
  period: number;
  acceptedTerms: true;
};

/** Dados que o professor informa no primeiro acesso. */
export type TeacherProfileInput = {
  role: 'TEACHER';
  courseIds: string[];
  acceptedTerms: true;
};

export type CompleteProfileInput = StudentProfileInput | TeacherProfileInput;
