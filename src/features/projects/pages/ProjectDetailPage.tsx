import { useParams, useSearchParams } from 'react-router-dom';
import {
  editionLabel,
  usePublicProject,
  useCurrentEdition,
  type PublicDeliverableLink,
} from '@/features/public-panel';
import { getApiError } from '@/shared/lib/api-error';
import { usePageHeader } from '@/shared/lib/page-header';
import {
  Alert,
  Avatar,
  Button,
  ButtonLink,
  IconChevronRight,
  IconDownload,
  IconFile,
  Spinner,
} from '@/shared/ui';
import styles from './ProjectDetailPage.module.css';

const MEMBER_TONES = ['blue', 'green', 'orange', 'pink'] as const;

/**
 * Detalhe do Projeto (Figma: "Detalhe do Projeto"). Tela única e pública (RF34/RF45): abre com
 * a navbar do perfil que está logado (o PublicLayout mantém a moldura do aluno, professor,
 * avaliador ou visitante) e "Voltar para Vitrine" retorna à listagem dentro da mesma moldura.
 */
export function ProjectDetailPage() {
  const { projectId = '' } = useParams();
  const [searchParams] = useSearchParams();
  const id = Number(projectId);
  const { data, isLoading, isError, error, refetch } = usePublicProject(
    Number.isFinite(id) ? id : undefined,
  );
  const edition = useCurrentEdition().data?.edition;

  // Rota interna de onde o usuário veio (ex.: avaliação do professor), para "voltar" no contexto.
  const fromParam = searchParams.get('from');
  const backTo =
    fromParam && fromParam.startsWith('/') && !fromParam.startsWith('//') ? fromParam : null;

  usePageHeader(
    edition ? `Desafio X · Edição ${editionLabel(edition)}` : 'Projetos',
    'Acompanhe os editais, o cronograma e os projetos da edição vigente.',
  );

  if (isLoading) {
    return (
      <div className={`page-flush ${styles.page}`}>
        <Spinner label="Carregando o projeto…" />
      </div>
    );
  }

  if (isError || !data) {
    const notFound = getApiError(error)?.status === 404;
    return (
      <div className={`page-flush ${styles.page}`}>
        <Alert
          tone="danger"
          title={notFound ? 'Projeto não encontrado' : 'Não foi possível carregar o projeto'}
          action={
            notFound ? (
              <ButtonLink to="/projetos" size="small" variant="secondary">
                Voltar para Vitrine
              </ButtonLink>
            ) : (
              <Button size="small" variant="secondary" onClick={() => void refetch()}>
                Tentar de novo
              </Button>
            )
          }
        >
          {notFound
            ? 'Ele pode ter saído da vitrine ou pertencer a uma equipe desclassificada.'
            : 'Verifique sua conexão e tente novamente.'}
        </Alert>
      </div>
    );
  }

  return (
    <div className={`page-flush ${styles.page}`}>
      <header className={styles.hero}>
        <p className={styles.heroKicker}>Detalhe do Projeto</p>
        <h2 className={styles.heroTitle}>{data.title}</h2>
      </header>

      <div className={styles.columns}>
        <section className={styles.card} aria-label="Resumo e integrantes">
          <div>
            <h3 className={styles.sectionTitle}>Resumo Expandido</h3>
            <p className={styles.summary}>{data.summary}</p>
          </div>

          <div>
            <h3 className={styles.sectionTitle}>Integrantes</h3>
            <ul className={styles.members}>
              {data.members.map((member, index) => (
                <li key={`${member.name}-${index}`} className={styles.member}>
                  <Avatar name={member.name} tone={MEMBER_TONES[index % MEMBER_TONES.length]} />
                  <div className={styles.memberInfo}>
                    <span className={styles.memberName}>{member.name}</span>
                    {member.course && <span className={styles.memberMeta}>{member.course}</span>}
                    {member.role === 'LEADER' && <span className={styles.memberMeta}>Líder</span>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <aside className={styles.aside}>
          <section className={styles.asideCard} aria-label="Informações do projeto">
            <h3 className={styles.sectionTitle}>Informações</h3>
            <dl className={styles.infoList}>
              <div>
                <dt className={styles.infoLabel}>Curso</dt>
                <dd className={styles.infoValue}>{data.course.name}</dd>
              </div>
              <div>
                <dt className={styles.infoLabel}>ODS</dt>
                <dd className={styles.infoValue}>
                  {data.sdg.number} - {data.sdg.title}
                </dd>
              </div>
              {data.keywords && (
                <div>
                  <dt className={styles.infoLabel}>Palavra-chave</dt>
                  <dd className={styles.infoValue}>{data.keywords}</dd>
                </div>
              )}
            </dl>
            {backTo ? (
              <div className={styles.backActions}>
                <ButtonLink to={backTo} className={styles.back}>
                  Voltar para a avaliação
                </ButtonLink>
                <ButtonLink to="/projetos" variant="ghost" className={styles.back}>
                  Ver todos os projetos
                </ButtonLink>
              </div>
            ) : (
              <ButtonLink to="/projetos" className={styles.back}>
                Voltar para Vitrine
              </ButtonLink>
            )}
          </section>

          {data.deliverables && data.deliverables.length > 0 && (
            <section className={styles.asideCard} aria-label="Entregas do projeto">
              <h3 className={styles.sectionTitle}>Entregas</h3>
              <ul className={styles.deliverables}>
                {data.deliverables.map((item) => (
                  <li key={item.id}>
                    <DeliverableRow item={item} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

function DeliverableRow({ item }: { item: PublicDeliverableLink }) {
  const isLink = item.type === 'LINK';
  return (
    <a
      className={styles.deliverable}
      href={item.href ?? '#'}
      target={isLink ? '_blank' : undefined}
      rel={isLink ? 'noreferrer' : undefined}
      download={isLink ? undefined : ''}
    >
      <span className={styles.deliverableLabel}>
        <IconFile size={16} className={styles.deliverableIcon} aria-hidden="true" />
        <span>{item.label}</span>
      </span>
      {isLink ? (
        <IconChevronRight size={16} className={styles.deliverableIcon} aria-hidden="true" />
      ) : (
        <IconDownload size={16} className={styles.deliverableIcon} aria-hidden="true" />
      )}
    </a>
  );
}
