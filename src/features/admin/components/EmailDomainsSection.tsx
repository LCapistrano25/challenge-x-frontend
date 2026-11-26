import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { getApiError } from '@/shared/lib/api-error';
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  Input,
  Select,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  notify,
} from '@/shared/ui';
import {
  createEmailDomain,
  fetchEmailDomains,
  updateEmailDomain,
  type EmailDomain,
  type EmailDomainFilter,
  type InstitutionalDomainRole,
} from '../api/email-domains.api';

const ROLE_OPTIONS = [
  { value: 'STUDENT', label: 'Estudante' },
  { value: 'TEACHER', label: 'Professor' },
];

const ROLE_FILTER_OPTIONS = [
  { value: '', label: 'Todos os papéis' },
  { value: 'STUDENT', label: 'Estudante' },
  { value: 'TEACHER', label: 'Professor' },
];

const ACTIVE_FILTER_OPTIONS = [
  { value: 'all', label: 'Todos os status' },
  { value: 'true', label: 'Somente ativos' },
  { value: 'false', label: 'Somente inativos' },
];

const ROLE_LABEL: Record<InstitutionalDomainRole, string> = {
  STUDENT: 'Estudante',
  TEACHER: 'Professor',
};

function normalizeDomainName(raw: string) {
  return raw.trim().replace(/^@+/, '').toLowerCase();
}

function describeEmailDomainError(error: unknown, fallback: string) {
  const apiError = getApiError(error);
  if (!apiError) return fallback;
  if (apiError.code === 'email_domain_taken') {
    return 'Este domínio já está cadastrado para o papel informado.';
  }
  return apiError.message || fallback;
}

/** Gestão de domínios de e-mail institucionais permitidos (GET/POST/PATCH /api/admin/email-domains). */
export function EmailDomainsSection() {
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState<InstitutionalDomainRole | ''>('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'true' | 'false'>('all');

  const [name, setName] = useState('');
  const [role, setRole] = useState<InstitutionalDomainRole>('STUDENT');
  const [nameError, setNameError] = useState<string | null>(null);

  const filter: EmailDomainFilter = {
    ...(roleFilter ? { role: roleFilter } : {}),
    ...(activeFilter !== 'all' ? { active: activeFilter === 'true' } : {}),
  };

  const domainsQuery = useQuery({
    queryKey: ['admin', 'email-domains', filter],
    queryFn: () => fetchEmailDomains(filter),
  });

  const createMutation = useMutation({
    mutationFn: createEmailDomain,
    onSuccess: (created) => {
      setName('');
      setNameError(null);
      notify.success(`Domínio ${created.name} adicionado.`);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'email-domains'] });
    },
    onError: (error) => {
      const apiError = getApiError(error);
      if (apiError?.code === 'email_domain_taken') {
        setNameError(describeEmailDomainError(error, ''));
        return;
      }
      notify.error(describeEmailDomainError(error, 'Não foi possível cadastrar o domínio.'));
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (domain: EmailDomain) => updateEmailDomain(domain.id, { active: !domain.active }),
    onSuccess: (updated) => {
      notify.success(
        updated.active ? `Domínio ${updated.name} ativado.` : `Domínio ${updated.name} desativado.`,
      );
      void queryClient.invalidateQueries({ queryKey: ['admin', 'email-domains'] });
    },
    onError: (error) =>
      notify.error(describeEmailDomainError(error, 'Não foi possível atualizar o domínio.')),
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (createMutation.isPending) return;
    const normalized = normalizeDomainName(name);
    if (!normalized || !normalized.includes('.')) {
      setNameError('Informe um domínio institucional válido (ex.: universidade.edu.br).');
      return;
    }
    setNameError(null);
    createMutation.mutate({ name: normalized, role, active: true });
  }

  const domains = domainsQuery.data ?? [];

  return (
    <section aria-labelledby="email-domains-heading" style={{ display: 'grid', gap: '1.5rem' }}>
      <div style={{ display: 'grid', gap: '0.25rem' }}>
        <h2 id="email-domains-heading" style={{ fontSize: '1.25rem', fontWeight: 600 }}>
          Domínios institucionais
        </h2>
        <p style={{ color: 'var(--color-text-muted, #5c6670)', fontSize: '0.9375rem' }}>
          Defina os domínios de e-mail aceitos para cadastro de estudantes e professores. Domínios
          não podem ser removidos — apenas desativados.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(220px, 1fr) 180px auto',
          gap: '0.75rem',
          alignItems: 'end',
        }}
      >
        <div style={{ display: 'grid', gap: '0.35rem' }}>
          <label htmlFor="email-domain-name" style={{ fontSize: '0.875rem', fontWeight: 500 }}>
            Domínio institucional *
          </label>
          <Input
            id="email-domain-name"
            placeholder="Ex.: universidade.edu.br"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (nameError) setNameError(null);
            }}
            invalid={Boolean(nameError)}
          />
          {nameError && (
            <p
              role="alert"
              style={{ color: 'var(--color-danger, #b42318)', fontSize: '0.8125rem' }}
            >
              {nameError}
            </p>
          )}
        </div>

        <Select
          label="Papel *"
          options={ROLE_OPTIONS}
          value={role}
          onChange={(event) => setRole(event.target.value as InstitutionalDomainRole)}
        />

        <Button type="submit" loading={createMutation.isPending}>
          Adicionar domínio
        </Button>
      </form>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Select
          label="Filtrar por papel"
          options={ROLE_FILTER_OPTIONS}
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value as InstitutionalDomainRole | '')}
        />
        <Select
          label="Filtrar por status"
          options={ACTIVE_FILTER_OPTIONS}
          value={activeFilter}
          onChange={(event) => setActiveFilter(event.target.value as 'all' | 'true' | 'false')}
        />
      </div>

      {domainsQuery.isPending ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <Spinner label="Carregando domínios institucionais" />
        </div>
      ) : domainsQuery.isError ? (
        <Alert tone="danger" title="Não foi possível carregar os domínios institucionais.">
          {describeEmailDomainError(
            domainsQuery.error,
            'Verifique sua conexão e permissões de administrador.',
          )}
        </Alert>
      ) : domains.length === 0 ? (
        <EmptyState
          title="Nenhum domínio encontrado"
          description="Cadastre um domínio institucional ou ajuste os filtros selecionados."
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Domínio</TableHeader>
              <TableHeader>Papel</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Ações</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {domains.map((domain) => (
              <TableRow key={domain.id}>
                <TableCell>{domain.name}</TableCell>
                <TableCell>{ROLE_LABEL[domain.role]}</TableCell>
                <TableCell>
                  <Badge tone={domain.active ? 'success' : 'neutral'}>
                    {domain.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="secondary"
                    size="small"
                    disabled={toggleMutation.isPending}
                    onClick={() => toggleMutation.mutate(domain)}
                  >
                    {domain.active ? 'Desativar' : 'Ativar'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
