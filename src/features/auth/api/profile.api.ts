import { isAxiosError } from 'axios';
import { http } from '@/shared/lib/http';
import type { CompleteProfileInput, Course, User } from '../types';

/** Cursos disponíveis para o cadastro (mesmo catálogo mantido pela administração). */
export async function fetchCourses(): Promise<Course[]> {
  const { data } = await http.get<Course[]>('/courses');
  return data;
}

/** Conclui o primeiro acesso. A API devolve o usuário atualizado com `profileComplete: true`. */
export async function completeProfile(input: CompleteProfileInput): Promise<User> {
  const { data } = await http.post<User>('/auth/complete-profile', input);
  return data;
}

/** Usa a mensagem da API quando houver (ex.: matrícula já cadastrada); senão, uma genérica. */
export function getProfileErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    if (!error.response) return 'Não foi possível conectar ao servidor. Tente novamente.';
    const message = (error.response.data as { message?: unknown } | undefined)?.message;
    if (typeof message === 'string' && message) return message;
  }
  return 'Não foi possível salvar seus dados. Tente novamente.';
}
