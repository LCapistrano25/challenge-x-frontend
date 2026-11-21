import { usePageHeader } from '@/shared/lib/page-header';
import { Alert } from '@/shared/ui';
import { EmailDomainsSection } from '../components/EmailDomainsSection';

export function CoursesTeachersPage() {
  usePageHeader(
    'Cursos, professores e domínios',
    'Gerencie os domínios institucionais habilitados e acompanhe o cadastro administrativo.',
  );

  return (
    <div style={{ display: 'grid', gap: '2rem', padding: '1.5rem 0' }}>
      <EmailDomainsSection />
      <Alert tone="info" title="Cadastro de cursos e professores pelo painel">
        A gestão de cursos e professores neste painel ainda está pendente na interface (task #21);
        use o Django Admin ou a API para gerenciar cursos e avaliadores por enquanto.
      </Alert>
    </div>
  );
}
