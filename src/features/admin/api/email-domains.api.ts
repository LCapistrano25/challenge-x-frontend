import { http } from '@/shared/lib/http';

export type InstitutionalDomainRole = 'STUDENT' | 'TEACHER';

export interface EmailDomain {
  id: number;
  name: string;
  role: InstitutionalDomainRole;
  active: boolean;
}

export interface EmailDomainFilter {
  active?: boolean;
  role?: InstitutionalDomainRole | '';
}

export interface EmailDomainCreate {
  name: string;
  role: InstitutionalDomainRole;
  active?: boolean;
}

export interface EmailDomainUpdate {
  name?: string;
  role?: InstitutionalDomainRole;
  active?: boolean;
}

/** GET /api/admin/email-domains — lista domínios institucionais cadastrados. */
export async function fetchEmailDomains(filter?: EmailDomainFilter): Promise<EmailDomain[]> {
  const params: Record<string, string | boolean> = {};
  if (filter?.active !== undefined) params.active = filter.active;
  if (filter?.role) params.role = filter.role;
  const { data } = await http.get<EmailDomain[]>('/api/admin/email-domains', {
    params: Object.keys(params).length > 0 ? params : undefined,
  });
  return data;
}

/** POST /api/admin/email-domains — cadastra domínio institucional para aluno ou professor. */
export async function createEmailDomain(input: EmailDomainCreate): Promise<EmailDomain> {
  const { data } = await http.post<EmailDomain>('/api/admin/email-domains', input);
  return data;
}

/** PATCH /api/admin/email-domains/{domain_id} — edita ou ativa/desativa (não há DELETE). */
export async function updateEmailDomain(
  domainId: number,
  input: EmailDomainUpdate,
): Promise<EmailDomain> {
  const { data } = await http.patch<EmailDomain>(`/api/admin/email-domains/${domainId}`, input);
  return data;
}
