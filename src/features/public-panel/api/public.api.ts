import { http } from '@/shared/lib/http';
import type { CourseSummary, Paginated } from '@/shared/types/api';
import type {
  PublicEdition,
  PublicEditionListItem,
  PublicProject,
  PublicProjectDetail,
  PublicProjectsQuery,
  Winner,
} from '../types';

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

/** GET /api/public/projects/{project_id} — publicGetProject (RF34/RF45, público). */
export async function fetchPublicProject(projectId: number): Promise<PublicProjectDetail> {
  const { data } = await http.get<PublicProjectDetail>(`/api/public/projects/${projectId}`);
  return data;
}

/** GET /api/public/editions — publicListClosedEditions (acervo, RF35/RF46). */
export async function fetchClosedEditions(): Promise<PublicEditionListItem[]> {
  const { data } = await http.get<PublicEditionListItem[]>('/api/public/editions');
  return data;
}

/** GET /api/public/editions/{id}/winners — publicListWinners (pódio, RF35/RF46). */
export async function fetchEditionWinners(editionId: number): Promise<Winner[]> {
  const { data } = await http.get<Winner[]>(`/api/public/editions/${editionId}/winners`);
  return data;
}
