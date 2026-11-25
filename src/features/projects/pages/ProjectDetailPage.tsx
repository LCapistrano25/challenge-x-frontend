import { useParams, useSearchParams } from 'react-router-dom';
import { ROLE_LABEL, useAuth } from '@/features/auth';
import {
  editionLabel,
  usePublicProject,
  useCurrentEdition,
  type PublicDeliverableLink,
  type PublicProjectMember,
} from '@/features/public-panel';
import { getApiError } from '@/shared/lib/api-error';
import { usePageHeader } from '@/shared/lib/page-header';
import {
  Alert,
  Avatar,
  Button,
  ButtonLink,
  IconChevronLeft,
  IconChevronRight,
  IconDownload,
  IconFile,
  IconInfo,
  Spinner,
} from '@/shared/ui';
import styles from './ProjectDetailPage.module.css';

/** "20/10/2026 às 14h32" */
function formatSentAt(iso: string) {
  const date = new Date(iso);
  const day = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
  const time = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(date)
    .replace(':', 'h');
  return `${day} às ${time}`;
}

/**
 * Detalhe do Projeto (Figma: "Detalhe do Projeto"). Tela única e pública (RF34/RF45): abre com
 * a navbar do perfil logado (PublicLayout mantém a moldura do aluno, professor, avaliador ou
 * visitante). O selo do topo mostra o perfil de quem consulta e "Voltar" respeita a origem.
 */
export function ProjectDetailPage() {
  const { projectId = '' } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const id = Number(projectId);
  const { data, isLoading, isError, error, refetch } = usePublicProject(
    Number.isFinite(id) ? id : undefined,
  );
  const edition = useCurrentEdition().data?.edition;

  const fromParam = searchParams.get('from');
  const backTo =
    fromParam && fromParam.startsWith('/') && !fromParam.startsWith('//') ? fromParam : null;
  const backLabel = backTo ? 'Voltar para a avaliação' : 'Voltar para a vitrine';

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
              <ButtonLink to={backTo ?? '/projetos'} size="small" variant="secondary">
                {backLabel}
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

  const roleLabel = user ? ROLE_LABEL[user.role] : 'Visitante';
  const kicker = edition ? `${roleLabel} · Edição ${editionLabel(edition)}` : roleLabel;
  const notice = roleNotice(user?.role);
  const footerText = `Desafio X / ${user ? roleLabel : 'Área pública'}${
    edition ? ` / ${editionLabel(edition)}` : ''
  } · Dados ilustrativos`;
  const metaLine = [data.team?.name, data.code && `Projeto ${data.code}`, data.stage_label]
    .filter(Boolean)
    .join(' · ');
  const aboutParagraphs = (data.about ?? data.summary).split('\n\n').filter(Boolean);

  return (
    <div className={`page-flush ${styles.page}`}>
      <ButtonLink to={backTo ?? '/projetos'} variant="ghost" size="small" className={styles.back}>
        <IconChevronLeft size={16} aria-hidden="true" /> {backLabel}
      </ButtonLink>

      <header className={styles.hero}>
        <div className={styles.heroMain}>
          <span className={styles.kicker}>{kicker}</span>
          <h2 className={styles.title}>{data.title}</h2>
          {metaLine && <p className={styles.metaLine}>{metaLine}</p>}
          <p className={styles.lead}>{data.summary}</p>
        </div>
        {data.status_label && (
          <span className={`${styles.tag} ${styles.tagAttention}`}>{data.status_label}</span>
        )}
      </header>

      <div className={styles.columns}>
        <div className={styles.mainCol}>
          <section className={styles.card} aria-label="Sobre o projeto">
            <h3 className={styles.cardTitle}>Sobre o projeto</h3>
            {aboutParagraphs.map((paragraph, index) => (
              <p key={index} className={styles.paragraph}>
                {paragraph}
              </p>
            ))}
            {data.objective && (
              <>
                <h4 className={styles.subTitle}>Objetivo e resultados</h4>
                <p className={styles.paragraph}>{data.objective}</p>
              </>
            )}
          </section>

          <section
            className={styles.card}
            aria-label={`Integrantes da ${data.team?.name ?? 'equipe'}`}
          >
            <h3 className={styles.cardTitle}>
              Integrantes {data.team?.name ? `da ${data.team.name}` : 'da equipe'}
            </h3>
            <ul className={styles.members}>
              {data.members.map((member, index) => (
                <li key={`${member.name}-${index}`} className={styles.member}>
                  <Avatar name={member.name} tone="blue" />
                  <div className={styles.memberInfo}>
                    <span className={styles.memberName}>{member.name}</span>
                    <span className={styles.memberMeta}>{memberMeta(member)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className={styles.asideCol}>
          <section className={styles.card} aria-label="Informações acadêmicas">
            <h3 className={styles.cardTitle}>Informações acadêmicas</h3>
            <dl className={styles.infoList}>
              <div>
                <dt className={styles.infoLabel}>Curso</dt>
                <dd className={styles.infoValue}>{data.course.name}</dd>
              </div>
              <div>
                <dt className={styles.infoLabel}>Objetivo de Desenvolvimento Sustentável</dt>
                <dd className={styles.infoOds}>
                  <span className={`${styles.tag} ${styles.tagInfo}`}>ODS {data.sdg.number}</span>
                  <span className={styles.infoValue}>{data.sdg.title}</span>
                </dd>
              </div>
              {data.advisor && (
                <div>
                  <dt className={styles.infoLabel}>Orientação</dt>
                  <dd className={styles.infoValue}>{data.advisor}</dd>
                </div>
              )}
              {data.technologies && data.technologies.length > 0 && (
                <div>
                  <dt className={styles.infoLabel}>Tecnologias</dt>
                  <dd className={styles.chips}>
                    {data.technologies.map((tech) => (
                      <span key={tech} className={`${styles.tag} ${styles.tagInfo}`}>
                        {tech}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </section>

          {data.deliverables && data.deliverables.length > 0 && (
            <section className={styles.card} aria-label="Arquivos entregues">
              <h3 className={styles.cardTitle}>Arquivos entregues</h3>
              <ul className={styles.deliverables}>
                {data.deliverables.map((item) => (
                  <li key={item.id}>
                    <DeliverableRow item={item} />
                  </li>
                ))}
              </ul>
              {data.submitted_at && (
                <p className={styles.sentAt}>Enviado em {formatSentAt(data.submitted_at)}</p>
              )}
            </section>
          )}
        </aside>
      </div>

      {data.canvas && data.canvas.length > 0 && (
        <section className={styles.canvasCard} aria-label="Business Model Canvas">
          <div className={styles.canvasHead}>
            <div>
              <h3 className={styles.canvasTitle}>Business Model Canvas</h3>
              <p className={styles.canvasSubtitle}>
                Informações preenchidas pelos acadêmicos no cadastro do projeto.
              </p>
            </div>
            <span className={`${styles.tag} ${styles.tagInfo}`}>Somente leitura</span>
          </div>
          <ol className={styles.canvasGrid}>
            {data.canvas.map((block, index) => (
              <li
                key={block.title}
                className={`${styles.canvasBlock} ${styles[`canvas${index + 1}`]}`}
              >
                <p className={styles.canvasBlockHead}>
                  <span className={styles.canvasNum}>{String(index + 1).padStart(2, '0')}</span>
                  <span className={styles.canvasBlockTitle}>{block.title}</span>
                </p>
                <p className={styles.canvasText}>{block.text}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {notice && (
        <div className={styles.notice}>
          <IconInfo size={20} className={styles.noticeIcon} aria-hidden="true" />
          <div>
            <p className={styles.noticeTitle}>{notice.title}</p>
            <p className={styles.noticeText}>{notice.description}</p>
          </div>
        </div>
      )}

      <p className={styles.footer}>{footerText}</p>
    </div>
  );
}

function roleNotice(role: string | undefined) {
  if (role === 'EXTERNAL_EVALUATOR') {
    return {
      title: 'Projeto atribuído à sua avaliação',
      description:
        'As entregas são disponibilizadas para consulta. Registre seu parecer no formulário de avaliação conforme os critérios da etapa.',
    };
  }
  if (role === 'TEACHER') {
    return {
      title: 'Projeto dos seus cursos vinculados',
      description:
        'As entregas estão disponíveis para consulta. Acompanhe e avalie as etapas no seu painel de acompanhamento.',
    };
  }
  return null;
}

function memberMeta(member: PublicProjectMember) {
  return [member.course, member.role === 'LEADER' ? 'Líder' : null].filter(Boolean).join(' · ');
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
        <IconFile size={18} className={styles.deliverableIcon} aria-hidden="true" />
        <span className={styles.deliverableText}>
          <span className={styles.deliverableName}>{item.label}</span>
          {item.meta && <span className={styles.deliverableMeta}>{item.meta}</span>}
        </span>
      </span>
      {isLink ? (
        <IconChevronRight size={18} className={styles.deliverableIcon} aria-hidden="true" />
      ) : (
        <IconDownload size={18} className={styles.deliverableIcon} aria-hidden="true" />
      )}
    </a>
  );
}
