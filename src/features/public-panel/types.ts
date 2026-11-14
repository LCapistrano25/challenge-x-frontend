import type { CourseSummary, EditionSummary, SdgSummary, StageSchedule } from '@/shared/types/api';

/** Tipos do painel público, espelhando docs/api/openapi.yaml (snake_case). */

/** PublicSdg */
export interface PublicSdg extends SdgSummary {
  description: string;
  icon: string | null;
}

/** PublicChallenge */
export interface PublicChallenge {
  id: number;
  title: string;
  description: string;
  course: CourseSummary;
  sdg: SdgSummary;
}

/** PublicEdition — GET /api/public/editions/current */
export interface PublicEdition {
  edition: EditionSummary;
  notice_url: string | null;
  stages: StageSchedule[];
  sdgs: PublicSdg[];
  challenges: PublicChallenge[];
}

/** PublicProject — item de GET /api/public/projects */
export interface PublicProject {
  id: number;
  edition: EditionSummary;
  title: string;
  summary: string;
  course: CourseSummary;
  sdg: SdgSummary;
  category: { id: number; name: string } | null;
  members: { name: string }[];
}

export interface PublicProjectsQuery {
  edition_id?: number;
  course_id?: number;
  sdg_id?: number;
  category_id?: number;
  search?: string;
  page?: number;
  page_size?: number;
}

/**
 * Notícia exibida no painel. Ainda não existe no contrato (P-35): o conteúdo vem de
 * content/news.ts até o back-end modelar.
 */
export interface NewsItem {
  id: string;
  category: string;
  title: string;
  summary: string;
  href?: string;
}
