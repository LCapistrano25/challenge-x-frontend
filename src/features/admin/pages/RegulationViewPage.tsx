import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Button, ButtonLink, IconFile, Spinner, notify } from '@/shared/ui';
import { downloadRegulationFile } from '../api/regulations.api';
import { Pill, RegulationStatusPill } from '../components/setup/RegistryParts';
import registry from '../components/setup/Registry.module.css';
import { SetupCard, SetupContext, SetupFooter } from '../components/setup/SetupParts';
import styles from '../components/setup/Setup.module.css';
import { useAdminEdition } from '../hooks/useAdminEdition';
import { regulationKeys, useDownloadRegulation, useRegulation } from '../hooks/useRegulations';
import { useSetupHeader } from '../hooks/useSetupHeader';
import { editionLabel } from '../lib/editions';
import { describeSetupError } from '../lib/errors';
import { REGULATIONS_PATH, formatDate, formatFileSize } from '../lib/regulations';
import type { Regulation } from '../types';

/** Prévia de uma versão do edital (Figma: "Editais - visualizar"). */
export function RegulationViewPage() {
  useSetupHeader('Visualizar edital', 'EDITAIS');
  const { regulationId } = useParams();
  const { editions } = useAdminEdition();
  const query = useRegulation(Number(regulationId));
  const download = useDownloadRegulation();
  const regulation = query.data;

  const crumbs = [
    { label: 'Início', to: '/admin' },
    { label: 'Editais', to: REGULATIONS_PATH },
    { label: 'Visualizar edital' },
  ];

  if (query.isPending || query.isError || !regulation) {
    return (
      <div className={styles.page}>
        <SetupContext crumbs={crumbs} description="Prévia do documento e dados da versão." />
        {query.isError ? (
          <Alert
            tone="danger"
            title="Não foi possível carregar o edital."
            action={
              <ButtonLink to={REGULATIONS_PATH} size="small" variant="secondary">
                Voltar aos editais
              </ButtonLink>
            }
          >
            {describeSetupError(query.error, 'O documento não foi encontrado.')}
          </Alert>
        ) : (
          <div className={styles.state}>
            <Spinner label="Carregando o edital…" />
          </div>
        )}
        <SetupFooter />
      </div>
    );
  }

  const edition = editions.find((item) => item.id === regulation.edition.id);
  const editionName = edition
    ? editionLabel(edition, editions)
    : `Desafio X • ${regulation.edition.year}`;

  return (
    <div className={styles.page}>
      <SetupContext
        crumbs={crumbs}
        description={`${regulation.title} • ${editionName} • Atualizado em ${formatDate(regulation.updated_at)}`}
        action={
          <Button
            size="large"
            loading={download.isPending}
            onClick={() =>
              download.mutate(regulation, {
                onError: (error) =>
                  notify.error(
                    describeSetupError(error, 'Não foi possível baixar o PDF. Tente novamente.'),
                  ),
              })
            }
          >
            Baixar PDF
          </Button>
        }
      />

      <SetupCard
        title="Prévia do documento"
        subtitle={`${regulation.file.name} • ${formatFileSize(regulation.file.size_bytes)} • Versão ${regulation.version}`}
        aside={
          regulation.status === 'DRAFT' ? (
            <Pill tone="warning">Minuta • não publicada</Pill>
          ) : (
            <RegulationStatusPill status={regulation.status} />
          )
        }
      >
        <PdfPreview regulation={regulation} />

        {regulation.published_at && (
          <p className={registry.caption}>
            Publicado em {formatDate(regulation.published_at)}
            {regulation.published_by && ` • Responsável: ${regulation.published_by.name}`}
            {regulation.status === 'SUPERSEDED' &&
              ' • Substituído por uma versão mais recente; mantido para consulta.'}
          </p>
        )}

        <div className={styles.buttons}>
          <ButtonLink to={REGULATIONS_PATH} variant="secondary" size="large">
            Voltar aos editais
          </ButtonLink>
          {regulation.status === 'DRAFT' && (
            <>
              <ButtonLink
                to={`${REGULATIONS_PATH}/${regulation.id}/editar`}
                variant="ghost"
                size="large"
              >
                Editar minuta
              </ButtonLink>
              <ButtonLink to={`${REGULATIONS_PATH}/${regulation.id}/publicar`} size="large">
                Revisar publicação
              </ButtonLink>
            </>
          )}
          {regulation.status === 'PUBLISHED' && edition?.status !== 'CLOSED' && (
            <ButtonLink
              to={`${REGULATIONS_PATH}/novo?base=${regulation.id}`}
              variant="ghost"
              size="large"
            >
              Criar nova versão
            </ButtonLink>
          )}
        </div>
      </SetupCard>

      <SetupFooter edition={edition} />
    </div>
  );
}

/** PDF embutido na página; sem leitor de PDF no navegador, oferece o download. */
function PdfPreview({ regulation }: { regulation: Regulation }) {
  const file = useQuery({
    queryKey: [...regulationKeys.detail(regulation.id), 'file'],
    queryFn: () => downloadRegulationFile(regulation.id),
    staleTime: Infinity,
  });
  const url = useMemo(
    () =>
      file.data && typeof URL.createObjectURL === 'function'
        ? URL.createObjectURL(new Blob([file.data], { type: 'application/pdf' }))
        : null,
    [file.data],
  );
  useEffect(() => () => void (url && URL.revokeObjectURL(url)), [url]);

  const fallback = (message: string) => (
    <div className={registry.previewFallback}>
      <IconFile size={40} className={registry.uploadIcon} />
      <p>{message}</p>
    </div>
  );

  return (
    <div className={registry.preview}>
      {file.isPending ? (
        <div className={styles.state}>
          <Spinner label="Carregando a prévia…" />
        </div>
      ) : url ? (
        <object data={url} type="application/pdf" aria-label={`Prévia de ${regulation.file.name}`}>
          {fallback(
            'O navegador não exibe PDF nesta página. Use “Baixar PDF” para abrir o documento.',
          )}
        </object>
      ) : (
        fallback('Não foi possível carregar a prévia. Use “Baixar PDF” para abrir o documento.')
      )}
    </div>
  );
}
