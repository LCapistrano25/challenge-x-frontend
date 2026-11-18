import { useQuery } from '@tanstack/react-query';
import { fetchTeacherDashboard } from '../api/teacher-dashboard.api';

export const teacherDashboardKey = ['deliveries', 'teacher', 'dashboard'] as const;

export function useTeacherDashboard() {
  return useQuery({ queryKey: teacherDashboardKey, queryFn: fetchTeacherDashboard });
}
