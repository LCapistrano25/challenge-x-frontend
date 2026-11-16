import type { CompleteProfileInput } from './types';

/** Períodos oferecidos no cadastro. Confirmar com a coordenação se o máximo é 10. */
export const PERIODS = Array.from({ length: 10 }, (_, index) => index + 1);

/** Matrícula: apenas dígitos. Ajustar o intervalo quando a regra da instituição for definida. */
export const REGISTRATION_MAX_LENGTH = 11;
export const REGISTRATION_PATTERN = /^\d{6,11}$/;

export type StudentFormValues = {
  courseId: string;
  registration: string;
  period: string;
  acceptedTerms: boolean;
};

export type TeacherFormValues = {
  courseIds: string[];
  acceptedTerms: boolean;
};

export type FormErrors<T> = Partial<Record<keyof T, string>>;

const TERMS_ERROR = 'Você precisa aceitar os termos para continuar.';

export function validateStudent(values: StudentFormValues): FormErrors<StudentFormValues> {
  const errors: FormErrors<StudentFormValues> = {};

  if (!values.courseId) errors.courseId = 'Selecione seu curso.';

  if (!values.registration.trim()) {
    errors.registration = 'Informe sua matrícula.';
  } else if (!REGISTRATION_PATTERN.test(values.registration.trim())) {
    errors.registration = 'Use apenas números (de 6 a 11 dígitos).';
  }

  if (!values.period) errors.period = 'Selecione o período.';
  if (!values.acceptedTerms) errors.acceptedTerms = TERMS_ERROR;

  return errors;
}

export function validateTeacher(values: TeacherFormValues): FormErrors<TeacherFormValues> {
  const errors: FormErrors<TeacherFormValues> = {};

  if (values.courseIds.length === 0) errors.courseIds = 'Selecione ao menos um curso.';
  if (!values.acceptedTerms) errors.acceptedTerms = TERMS_ERROR;

  return errors;
}

/** Monta o payload da API. Só deve ser chamado depois da validação passar. */
export function toStudentPayload(values: StudentFormValues): CompleteProfileInput {
  return {
    role: 'STUDENT',
    courseId: values.courseId,
    registration: values.registration.trim(),
    period: Number(values.period),
    acceptedTerms: true,
  };
}

export function toTeacherPayload(values: TeacherFormValues): CompleteProfileInput {
  return { role: 'TEACHER', courseIds: values.courseIds, acceptedTerms: true };
}

export function normalizeRegistration(value: string): string {
  return value.replace(/\D/g, '');
}
