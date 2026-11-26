import { useMemo, useState, type ReactNode } from 'react';
import {
  Alert,
  Avatar,
  Button,
  ButtonLink,
  EmptyState,
  IconAlert,
  IconCheckCircle,
  IconChevronRight,
  IconFile,
  IconInfo,
  Modal,
  Select,
  Spinner,
  TextField,
  Textarea,
  notify,
} from '@/shared/ui';
import { describeLeadershipDecisionError, formatDateHour, formatDateTime } from '../lib/leadership';
import {
  useDecideLeadershipRequest,
  useTeacherLeadershipRequests,
} from '../hooks/useTeacherMembers';
import type { LeadershipRequest } from '../types';
import styles from '../pages/TeacherMembers.module.css';

const JUSTIFICATION_LIMIT = 500;

type DecisionTarget = { request: LeadershipRequest; status: 'APPROVED' | 'REJECTED' };

const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;

/**
 * Aprovação de Liderança (Figma: 05 - Professor › "Aprovação de Liderança", "Liderança aprovada"
 * e "Solicitação rejeitada"). Lista mestre-detalhe: à esquerda as solicitações pendentes dos
 * cursos vinculados; à direita o detalhe para aprovar — o solicitante vira líder — ou rejeitar,
 * mantendo a liderança atual (RF28, RF40).
 */
export function LeadershipRequestsPanel() {
  const { data, isLoading, isError, refetch } = useTeacherLeadershipRequests();
  const decide = useDecideLeadershipRequest();
  const [course, setCourse] = useState('');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [target, setTarget] = useState<DecisionTarget | null>(null);
  const [justification, setJustification] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const requests = useMemo(() => data ?? [], [data]);
  const courses = useMemo(
    () => [...new Set(requests.map((r) => r.course).filter((c): c is string => !!c))],
    [requests],
  );
  const pendingTotal = requests.filter((r) => r.status === 'PENDING').length;

  const pending = useMemo(() => {
    const term = query.trim().toLowerCase();
    return requests
      .filter((r) => r.status === 'PENDING')
      .filter((r) => !course || r.course === course)
      .filter(
        (r) =>
          !term ||
          r.team.name.toLowerCase().includes(term) ||
          r.requester.name.toLowerCase().includes(term),
      );
  }, [requests, course, query]);

  const selected = requests.find((r) => r.id === selectedId) ?? pending[0] ?? requests[0] ?? null;

  function openDecision(request: LeadershipRequest, status: 'APPROVED' | 'REJECTED') {
    setTarget({ request, status });
    setJustification('');
    setFormError(null);
  }

  function closeDecision(open: boolean) {
    if (open || decide.isPending) return;
    setTarget(null);
  }

  async function confirmDecision() {
    if (!target) return;
    const text = justification.trim();
    if (!text) {
      setFormError('Informe uma justificativa para registrar a decisão.');
      return;
    }
    try {
      const updated = await decide.mutateAsync({
        id: target.request.id,
        input: { status: target.status, decision_justification: text },
      });
      notify.success(
        target.status === 'APPROVED'
          ? `${updated.requester.name} agora é líder da ${updated.team.name}.`
          : `Solicitação de ${updated.requester.name} recusada.`,
      );
      setSelectedId(updated.id);
      setTarget(null);
    } catch (error) {
      setFormError(describeLeadershipDecisionError(error));
    }
  }

  function goToNext() {
    const next = pending.find((r) => r.id !== selected?.id) ?? pending[0] ?? null;
    setSelectedId(next ? next.id : -1);
  }

  if (isLoading) return <Spinner label="Carregando solicitações de liderança…" />;
  if (isError) {
    return (
      <Alert
        tone="danger"
        title="Não foi possível carregar as solicitações"
        action={
          <Button size="small" variant="secondary" onClick={() => void refetch()}>
            Tentar de novo
          </Button>
        }
      >
        Verifique sua conexão e tente novamente.
      </Alert>
    );
  }

  if (requests.length === 0) {
    return (
      <EmptyState
        title="Nenhuma solicitação de liderança"
        description="Quando uma equipe sem líder pedir para assumir a liderança, a solicitação aparece aqui para você aprovar ou recusar."
      />
    );
  }

  const decidedView = selected != null && selected.status !== 'PENDING';

  return (
    <>
      <Banner request={decidedView ? selected : null} pendingTotal={pendingTotal} />

      <div className={styles.filters} role="search" aria-label="Filtrar solicitações">
        <Select
          label="Curso vinculado"
          value={course}
          onChange={(event) => setCourse(event.target.value)}
          options={[
            { value: '', label: `Todos os cursos (${courses.length})` },
            ...courses.map((c) => ({ value: c, label: c })),
          ]}
        />
        <TextField
          label="Buscar equipe ou solicitante"
          type="search"
          placeholder="Buscar por nome..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <span className={styles.chip}>Situação: pendentes</span>
      </div>

      <div className={styles.columns}>
        <section className={styles.card} aria-label="Solicitações pendentes">
          <div className={styles.listHeader}>
            <h3 className={styles.listTitle}>Solicitações pendentes</h3>
            <p className={styles.listSubtitle}>Ordenadas pela data de solicitação</p>
          </div>
          {pending.length === 0 ? (
            <p className={styles.muted}>Nenhuma solicitação pendente com os filtros atuais.</p>
          ) : (
            <ul className={styles.list}>
              {pending.map((request) => {
                const active = request.id === selected?.id;
                return (
                  <li key={request.id}>
                    <button
                      type="button"
                      className={`${styles.listRowButton}${active ? ` ${styles.rowSelected}` : ''}`}
                      aria-current={active}
                      onClick={() => setSelectedId(request.id)}
                    >
                      <div className={styles.rowHead}>
                        <span className={styles.rowName}>{request.team.name}</span>
                        <span className={`${styles.tag} ${styles.tagNeutral}`}>Pendente</span>
                      </div>
                      {request.project && <p className={styles.rowMeta}>{request.project.title}</p>}
                      {request.course && <p className={styles.rowMeta}>{request.course}</p>}
                      <p className={styles.rowMeta}>
                        <span className={styles.rowMetaStrong}>
                          Solicitante: {request.requester.name}
                        </span>
                      </p>
                      <p className={styles.rowMeta}>
                        {formatDateHour(request.created_at)}
                        {request.reason ? ` • Motivo: ${request.reason}` : ''}
                      </p>
                      <span className={styles.rowLink}>
                        {active ? 'Solicitação selecionada' : 'Analisar solicitação'}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <p className={styles.listFooter}>
            Exibindo {pending.length} de {pendingTotal} solicitações pendentes
          </p>
        </section>

        {selected ? (
          decidedView ? (
            <DecidedDetail request={selected} onNext={goToNext} hasNext={pending.length > 0} />
          ) : (
            <PendingDetail
              request={selected}
              onApprove={() => openDecision(selected, 'APPROVED')}
              onReject={() => openDecision(selected, 'REJECTED')}
            />
          )
        ) : (
          <section className={styles.card}>
            <p className={styles.emptyDetail}>
              Selecione uma solicitação à esquerda para ver os detalhes.
            </p>
          </section>
        )}
      </div>

      <Modal
        open={target != null}
        onOpenChange={closeDecision}
        title={target?.status === 'APPROVED' ? 'Aprovar liderança' : 'Rejeitar solicitação'}
        description={
          target ? `${target.request.requester.name} · ${target.request.team.name}` : undefined
        }
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => closeDecision(false)}
              disabled={decide.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant={target?.status === 'REJECTED' ? 'secondary' : 'primary'}
              onClick={() => void confirmDecision()}
              loading={decide.isPending}
            >
              {target?.status === 'APPROVED' ? 'Confirmar aprovação' : 'Confirmar recusa'}
            </Button>
          </>
        }
      >
        <div className={styles.dialogBody}>
          <p className={styles.muted}>
            {target?.status === 'APPROVED'
              ? `${target.request.requester.name} passa a ser o líder da equipe assim que você confirmar.`
              : 'A equipe continua com a liderança atual e poderá enviar uma nova solicitação depois.'}
          </p>
          <Textarea
            label="Justificativa da decisão"
            value={justification}
            maxLength={JUSTIFICATION_LIMIT}
            onChange={(event) => {
              setJustification(event.target.value);
              setFormError(null);
            }}
          />
          {formError && (
            <p role="alert" className={styles.error}>
              {formError}
            </p>
          )}
        </div>
      </Modal>
    </>
  );
}

function Banner({
  request,
  pendingTotal,
}: {
  request: LeadershipRequest | null;
  pendingTotal: number;
}) {
  if (request?.status === 'APPROVED') {
    return (
      <div className={`${styles.banner} ${styles.success}`}>
        <IconCheckCircle size={22} className={styles.bannerIcon} aria-hidden="true" />
        <div className={styles.bannerText}>
          <p className={styles.bannerTitle}>
            Liderança aprovada com sucesso. {request.requester.name} é o novo líder da{' '}
            {request.team.name}.
          </p>
          <p className={styles.bannerHint}>
            Decisão registrada e comunicada à equipe. {describePending(pendingTotal)}
          </p>
        </div>
      </div>
    );
  }
  if (request?.status === 'REJECTED') {
    return (
      <div className={`${styles.banner} ${styles.danger}`}>
        <IconAlert size={22} className={styles.bannerIcon} aria-hidden="true" />
        <div className={styles.bannerText}>
          <p className={styles.bannerTitle}>
            Solicitação rejeitada. {request.current_leader?.name ?? 'A liderança atual'} permanece
            como líder da {request.team.name}.
          </p>
          <p className={styles.bannerHint}>
            Decisão registrada e comunicada à equipe. {describePending(pendingTotal)}
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className={`${styles.banner} ${styles.info}`}>
      <IconInfo size={22} className={styles.bannerIcon} aria-hidden="true" />
      <div className={styles.bannerText}>
        <p className={styles.bannerTitle}>
          {pendingTotal === 1
            ? '1 solicitação pendente de decisão nos cursos vinculados.'
            : `${pendingTotal} solicitações pendentes de decisão nos cursos vinculados.`}
        </p>
        <p className={styles.bannerHint}>
          Analise a justificativa e o contexto da equipe antes de aprovar ou rejeitar a substituição
          do líder.
        </p>
      </div>
    </div>
  );
}

const describePending = (total: number) =>
  total === 0
    ? 'Não há mais solicitações pendentes nos cursos vinculados.'
    : total === 1
      ? 'Resta 1 solicitação pendente nos cursos vinculados.'
      : `Restam ${total} solicitações pendentes nos cursos vinculados.`;

function DetailHeader({ request, badge }: { request: LeadershipRequest; badge: ReactNode }) {
  return (
    <div className={styles.detailHead}>
      <div>
        <p className={styles.detailKicker}>
          {request.status === 'PENDING' ? 'Detalhe da solicitação' : 'Resultado da solicitação'}
        </p>
        <h3 className={styles.detailTitle}>
          {request.team.name}
          {request.project ? ` • ${request.project.title}` : ''}
        </h3>
        {(request.course || request.stage_label) && (
          <p className={styles.detailMeta}>
            {[request.course, request.stage_label].filter(Boolean).join(' • ')}
          </p>
        )}
      </div>
      {badge}
    </div>
  );
}

function Attachment({ request }: { request: LeadershipRequest }) {
  if (!request.attachment) return null;
  return (
    <div className={styles.attachment}>
      <p className={styles.attachmentName}>
        <IconFile size={16} aria-hidden="true" /> {request.attachment.name} ·{' '}
        <span className={styles.attachmentLink}>Abrir anexo</span>
      </p>
      <p className={styles.caption}>
        {request.attachment.size_label} • {request.attachment.description}
      </p>
    </div>
  );
}

function PendingDetail({
  request,
  onApprove,
  onReject,
}: {
  request: LeadershipRequest;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <section className={`${styles.card} ${styles.detail}`} aria-label="Detalhe da solicitação">
      <DetailHeader
        request={request}
        badge={<span className={`${styles.tag} ${styles.tagNeutral}`}>Pendente</span>}
      />

      <div className={`${styles.handoff} ${styles.handoffCols}`}>
        <div className={styles.person}>
          <div>
            <p className={styles.personLabel}>Líder atual</p>
            <p className={styles.personName}>{request.current_leader?.name ?? 'Sem líder ativo'}</p>
          </div>
        </div>
        <div className={styles.person}>
          <div>
            <p className={styles.personLabel}>Solicitante / Líder proposto</p>
            <p className={styles.personName}>{request.requester.name}</p>
          </div>
        </div>
      </div>

      <h4 className={styles.sectionTitle}>Justificativa do solicitante</h4>
      <p className={styles.quote}>{request.justification}</p>
      <p className={styles.caption}>
        Solicitado por {request.requester.name} em {formatDateHour(request.created_at)}.
      </p>

      <Attachment request={request} />

      <p className={styles.caption}>
        Aprovar transfere a liderança para {firstName(request.requester.name)}. Rejeitar mantém a
        liderança atual. A decisão será comunicada à equipe.
      </p>

      <div className={styles.actions}>
        <Button variant="secondary" onClick={onReject}>
          Rejeitar solicitação
        </Button>
        <Button onClick={onApprove}>Aprovar liderança</Button>
      </div>
    </section>
  );
}

function DecidedDetail({
  request,
  onNext,
  hasNext,
}: {
  request: LeadershipRequest;
  onNext: () => void;
  hasNext: boolean;
}) {
  const approved = request.status === 'APPROVED';
  const decidedBy = request.teacher?.name ?? 'o professor';

  return (
    <section className={`${styles.card} ${styles.detail}`} aria-label="Resultado da solicitação">
      <DetailHeader
        request={request}
        badge={
          <span className={`${styles.tag} ${approved ? styles.tagSuccess : styles.tagDanger}`}>
            {approved ? 'Aprovada' : 'Rejeitada'}
          </span>
        }
      />

      <div className={styles.handoff}>
        <div className={styles.person}>
          <Avatar name={request.current_leader?.name ?? 'Líder'} tone="orange" />
          <div>
            <p className={styles.personLabel}>
              {approved ? 'Líder anterior' : 'Líder atual • Mantida'}
            </p>
            <p className={styles.personName}>{request.current_leader?.name ?? 'Sem líder ativo'}</p>
          </div>
        </div>
        {approved ? (
          <IconChevronRight size={22} className={styles.handoffArrow} aria-hidden="true" />
        ) : (
          <span className={styles.handoffArrow} aria-hidden="true" />
        )}
        <div className={styles.person}>
          <Avatar name={request.requester.name} tone="blue" />
          <div>
            <p className={styles.personLabel}>
              {approved ? 'Novo líder' : 'Solicitante / Líder proposto'}
            </p>
            <p className={styles.personName}>{request.requester.name}</p>
          </div>
        </div>
      </div>

      <p className={styles.muted}>
        {approved
          ? `${request.requester.name} assume a organização das entregas e a comunicação com o docente.`
          : 'A substituição não foi aprovada. Nenhuma alteração de liderança foi realizada.'}
      </p>
      <p className={styles.caption}>
        {approved ? 'Aprovada' : 'Rejeitada'} por {decidedBy} •{' '}
        {approved ? 'Liderança atualizada' : 'Liderança mantida'} • Equipe notificada
        {request.decided_at ? ` • ${formatDateTime(request.decided_at)}` : ''}
      </p>
      {request.decision_justification && (
        <p className={styles.caption}>Justificativa: {request.decision_justification}</p>
      )}

      <h4 className={styles.sectionTitle}>
        Solicitação{request.reason ? ` por ${request.reason}` : ''}
      </h4>
      <p className={styles.caption}>
        Solicitado por {request.requester.name} em {formatDateHour(request.created_at)}.
      </p>
      <p className={styles.quote}>{request.justification}</p>

      <Attachment request={request} />

      <div className={styles.actions}>
        {request.project && (
          <ButtonLink variant="secondary" to={`/projetos/${request.project.id}`}>
            Ver projeto
          </ButtonLink>
        )}
        <Button onClick={onNext} disabled={!hasNext}>
          Analisar próxima solicitação
        </Button>
      </div>
    </section>
  );
}
