import { http } from '@/shared/lib/http';
import type { TeacherDashboard } from '../types';

/** GET /api/teacher/dashboard (x-status: proposed; confirmar no openapi.yaml antes de integrar). */
export async function fetchTeacherDashboard(): Promise<TeacherDashboard> {
  const { data } = await http.get<TeacherDashboard>('/api/teacher/dashboard');
  return data;
}
