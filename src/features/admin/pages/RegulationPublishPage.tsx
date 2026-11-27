import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import {
  Alert,
  Button,
  ButtonLink,
  ConfirmDialog,
  IconAlert,
  IconCheckCircle,
  Spinner,
  notify,
} from '@/shared/ui';
import registry from '../components/setup/Registry.module.css';
import { Notice, SetupCard, SetupContext, SetupFooter } from '../components/setup/SetupParts';
import styles from '../components/setup/Setup.module.css';
import { useAdminEdition } from '../hooks/useAdminEdition';
import { useEvaluationSetup } from '../hooks/useEvaluationSetup';
import { useEditionEvaluators } from '../hooks/useEvaluators';
import { usePublishRegulation, useRegulation, useRegulations } from '../hooks/useRegulations';
import { useSetupHeader } from '../hooks/useSetupHeader';
import { formatDay, toDateInput, todayInput } from '../lib/dates';
import { describeSetupError } from '../lib/errors';
import { REGULATIONS_PATH, formatFileSize, publicationChecklist } from '../lib/regulations';
import { sortStages } from '../lib/stages';

/**
 * Publicação de uma minuta (Figma: "Editais - publicar"). A ação só é liberada com o checklist
 * completo; a versão publicada anterior passa a substituída e segue disponível.
 */
export function RegulationPublishPage() {
  useSetupHeader('Publicar edital', 'EDITAIS');
  const { regulationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const editionState = useAdminEdition();
  const query = useRegulation(Number(regulationId));
  const list = useRegulations();
  const regulation = query.data;
  const editionId = regulation?.edition.id;
  const setup = useEvaluationSetup(editionId);
  const evaluators = useEditionEvaluators(editionId);
  const publish = usePublishRegulation();
  const [confirming, setConfirming] = useState(false);

  const edition = editionState.editions.find((item) => item.id === editionId);
  const crumbs = [
    { label: 'Início', to: '/admin' },
    { label: 'Editais', to: REGULATIONS_PATH },
    { label: 'Publicar edital' },
  ];

  const failed = [query, editionState, setup, evaluators].find((item) => item.isError);
  const loading =
    query.isPending ||
    editionState.isLoading ||
    (editionId !== undefined && (setup.isLoading || evaluators.isPending));

  if (failed || loading || !regulation || !edition) {
    return (
      <div className={styles.page}>
        <SetupContext crumbs={crumbs} description="Confira as pendências antes de publicar." />
        {failed || (!loading && regulation && !edition) ? (
          <Alert
            tone="danger"
            title="Não foi possível carregar a publicação."
            action={
              <ButtonLink to={REGULATIONS_PATH} size="small" variant="secondary">
                Voltar aos editais
              </ButtonLink>
            }
          >
            {describeSetupError(failed?.error, 'A edição do documento não foi encontrada.')}
          </Alert>
        ) : (
          <div className={styles.state}>
            <Spinner label="Conferindo a configuração da edição…" />
          </div>
        )}
        <SetupFooter />
      </div>
    );
  }

  const items = publicationChecklist({
    edition,
    regulation,
    stages: setup.stages,
    criteria: setup.criteria,
    stageCriteria: setup.stageCriteria,
    evaluators: evaluators.data ?? [],
  });
  const pending = items.filter((item) => !item.done).length;
  const isDraft = regulation.status === 'DRAFT';
  const ready = isDraft && pending === 0;
  const firstStage = sortStages(setup.stages)[0];
  const replaced = (list.data ?? []).find(
    (item) => item.edition.id === edition.id && item.status === 'PUBLISHED',
  );

  async function handlePublish() {
    try {
      const published = await publish.mutateAsync(regulation!.id);
      setConfirming(false);
      notify.success(`Edital publicado: versão ${published.version}.`);
      navigate(`${REGULATIONS_PATH}/${published.id}`);
    } catch (error) {
      setConfirming(false);
      notify.error(
        describeSetupError(error, 'Não foi possível publicar o edital. Tente novamente.'),
      );
    }
  }

  return (
    <div className={styles.page}>
      <SetupContext
        crumbs={crumbs}
        description={
          !isDraft
            ? `Versão ${regulation.version} • ${regulation.status === 'PUBLISHED' ? 'já publicada' : 'substituída por uma versão mais recente'}.`
            : pending === 0
              ? `Versão ${regulation.version} pronta • Todas as pendências de configuração foram resolvidas.`
              : `Versão ${regulation.version} • ${pending} ${pending === 1 ? 'pendência impede' : 'pendências impedem'} a publicação.`
        }
      />

      {firstStage && (
        <Notice
          tone="info"
          title={`Fluxo ${edition.year} • Abertura • ${formatDay(toDateInput(firstStage.starts_at))}`}
        >
          {`Primeira etapa: ${firstStage.name}.`}
        </Notice>
      )}

      <SetupCard
        title="Checklist de publicação"
        subtitle={`${regulation.title} • ${regulation.file.name} • ${formatFileSize(regulation.file.size_bytes)}`}
      >
        <ul className={registry.checklist}>
          {items.map((item) => (
            <li key={item.key}>
              {item.done ? (
                <IconCheckCircle size={20} className={registry.checkDone} aria-label="Concluído" />
              ) : (
                <IconAlert size={20} className={registry.checkPending} aria-label="Pendente" />
              )}
              <span>
                <span className={registry.checkLabel}>{item.label}</span>
                {item.detail && <span className={registry.checkDetail}>{item.detail}</span>}
              </span>
            </li>
          ))}
        </ul>
      </SetupCard>

      {isDraft && (
        <Notice tone="info" title="Registro de publicação">
          Responsável: {user?.name ?? 'administração'} • Publicação prevista para{' '}
          {formatDay(todayInput())}.{' '}
          {replaced
            ? `A versão ${replaced.version} passará a substituída e continuará disponível para consulta. `
            : ''}
          O arquivo publicado será preservado.
        </Notice>
      )}

      <div className={styles.actions}>
        <div className={styles.buttons}>
          <ButtonLink to={`${REGULATIONS_PATH}/${regulation.id}`} variant="secondary" size="large">
            Voltar ao edital
          </ButtonLink>
          {isDraft && (
            <Button size="large" disabled={!ready} onClick={() => setConfirming(true)}>
              Publicar edital
            </Button>
          )}
        </div>
        {isDraft && !ready && (
          <p className={styles.actionsHint}>
            A publicação será liberada após resolver as pendências do checklist.
          </p>
        )}
      </div>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Publicar a versão ${regulation.version}?`}
        description={
          edition.status === 'SETUP'
            ? 'A edição será publicada e etapas, critérios e pontuações ficarão congelados. O documento publicado não poderá ser alterado.'
            : 'O documento publicado não poderá ser alterado; mudanças futuras geram uma nova versão.'
        }
        confirmLabel="Publicar edital"
        loading={publish.isPending}
        onConfirm={() => void handlePublish()}
      />

      <SetupFooter edition={edition} />
    </div>
  );
}
