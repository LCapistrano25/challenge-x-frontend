import { http } from '@/shared/lib/http';
import type { CourseSummary, Paginated } from '@/shared/types/api';
import type { PublicEdition, PublicProject, PublicProjectsQuery } from '../types';

export async function fetchCurrentEdition(): Promise<PublicEdition> {
  const { data } = await http.get<PublicEdition>('/api/public/editions/current');
  return data;
}

export async function fetchPublicProjects(params: PublicProjectsQuery = {}) {
  const { data } = await http.get<Paginated<PublicProject>>('/api/public/projects', { params });
  return data;
}

export async function fetchCourses(): Promise<CourseSummary[]> {
  const { data } = await http.get<CourseSummary[]>('/api/courses');
  return data;
}
