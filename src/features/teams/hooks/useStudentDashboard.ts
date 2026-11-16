import { useQuery } from '@tanstack/react-query';
import { fetchStudentDashboard } from '../api/dashboard.api';

export const studentDashboardKey = ['teams', 'me', 'dashboard'] as const;

export function useStudentDashboard({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({ queryKey: studentDashboardKey, queryFn: fetchStudentDashboard, enabled });
}
