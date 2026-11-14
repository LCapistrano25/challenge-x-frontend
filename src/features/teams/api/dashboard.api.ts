import { http } from '@/shared/lib/http';
import type { StudentDashboard } from '../types';

/** GET /api/me/dashboard — teamsGetStudentDashboard (x-status: proposed, P-23). */
export async function fetchStudentDashboard(): Promise<StudentDashboard> {
  const { data } = await http.get<StudentDashboard>('/api/me/dashboard');
  return data;
}
