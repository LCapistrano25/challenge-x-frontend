import { http } from '@/shared/lib/http';
import type { LoginInput, User } from '../types';

export async function login(input: LoginInput): Promise<User> {
  const { data } = await http.post<User>('/auth/login', input);
  return data;
}

export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const { data } = await http.get<User>('/auth/me');
    return data;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  await http.post('/auth/logout');
}
