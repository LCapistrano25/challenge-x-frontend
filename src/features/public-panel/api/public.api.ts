import { http } from '@/shared/lib/http';
import type { Paginated } from '@/shared/types/api';
import type { PublicEdition, PublicProject, PublicProjectsQuery } from '../types';

/** GET /api/public/editions/current — publicGetCurrentEdition (público). */
export async function fetchCurrentEdition(): Promise<PublicEdition> {
  const { data } = await http.get<PublicEdition>('/api/public/editions/current');
  return data;
}

/** GET /api/public/projects — publicListProjects (padrão: edição vigente). */
export async function fetchPublicProjects(params: PublicProjectsQuery = {}) {
  const { data } = await http.get<Paginated<PublicProject>>('/api/public/projects', { params });
  return data;
}
