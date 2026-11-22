import { isAxiosError } from 'axios';
import { getApiError } from '@/shared/lib/api-error';
import { http } from '@/shared/lib/http';
import { fetchCurrentUser } from './auth.api';
import type { CompleteProfileInput, Course, User } from '../types';

/** Cursos disponíveis para o cadastro (mesmo catálogo mantido pela administração). */
export async function fetchCourses(): Promise<Course[]> {
  const { data } = await http.get<{ id: number | string; name: string }[]>('/api/courses');
  return data.map(({ id, name }) => ({ id: String(id), name }));
}

/**
 * Conclui o primeiro acesso chamando POST /api/auth/students (RF19) ou
 * POST /api/auth/teachers (RF36.1) e devolvendo o usuário com `profileComplete: true`.
 */
export async function completeProfile(
  input: CompleteProfileInput,
  currentUser?: User | null,
): Promise<User> {
  if (input.role === 'STUDENT') {
    await http.post('/api/auth/students', {
      registration_number: input.registration,
      course_id: Number(input.courseId),
      term: input.period,
    });
  } else {
    await http.post('/api/auth/teachers', {
      course_ids: input.courseIds.map(Number),
    });
  }

  if (currentUser) {
    return { ...currentUser, profileComplete: true };
  }
  const user = await fetchCurrentUser();
  if (!user) throw new Error('Sessão expirada ao concluir o cadastro.');
  return { ...user, profileComplete: true };
}

export function isTeacherProfileExistsError(error: unknown): boolean {
  return getApiError(error)?.code === 'teacher_profile_exists';
}

/** Usa a mensagem da API quando houver (ex.: matrícula já cadastrada); senão, uma genérica. */
export function getProfileErrorMessage(error: unknown): string {
  const apiError = getApiError(error);
  if (apiError) {
    if (apiError.details) {
      const firstDetail = Object.values(apiError.details)
        .flat()
        .find((item): item is string => typeof item === 'string' && item.length > 0);
      if (firstDetail) return firstDetail;
    }
    if (apiError.message) return apiError.message;
  }
  if (isAxiosError(error)) {
    if (!error.response) return 'Não foi possível conectar ao servidor. Tente novamente.';
    const message = (error.response.data as { message?: unknown } | undefined)?.message;
    if (typeof message === 'string' && message) return message;
  }
  return 'Não foi possível salvar seus dados. Tente novamente.';
}
