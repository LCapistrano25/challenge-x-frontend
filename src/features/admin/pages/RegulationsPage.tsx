import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Alert,
  Button,
  ButtonLink,
  EmptyState,
  Pagination,
  Select,
  Spinner,
  TextField,
  notify,
} from '@/shared/ui';
import { RegulationStatusPill } from '../components/setup/RegistryParts';
import registry from '../components/setup/Registry.module.css';
import { Notice, SetupCard, SetupContext, SetupFooter } from '../components/setup/SetupParts';
import styles from '../components/setup/Setup.module.css';
import { useAdminEdition } from '../hooks/useAdminEdition';
import { useDownloadRegulation, useRegulations } from '../hooks/useRegulations';
import { useSetupHeader } from '../hooks/useSetupHeader';
import { editionLabel } from '../lib/editions';
import { describeSetupError } from '../lib/errors';
import {
  REGULATIONS_PATH,
  REGULATION_STATUS_OPTIONS,
  filterRegulations,
  formatDate,
  pendingDraft,
} from '../lib/regulations';
import type { Regulation } from '../types';

const PAGE_SIZE = 10;

/** Editais da instituição (Figma: 04 - Administrador › "Editais - listagem"). */
export function RegulationsPage() {
  useSetupHeader('Editais', 'EDITAIS');
  const { editions } = useAdminEdition();
  const query = useRegulations();
  const download = useDownloadRegulation();
  const [search, setSearch] = useState('');
  const [editionId, setEditionId] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const all = query.data ?? [];
  const filtered = filterRegulations(all, { search, editionId, status });
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const draft = pendingDraft(all);
  const draftEdition = draft && editions.find((item) => item.id === draft.edition.id);

  const editionName = (regulation: Regulation) => {
    const edition = editions.find((item) => item.id === regulation.edition.id);
    return edition ? editionLabel(edition, editions) : `Desafio X • ${regulation.edition.year}`;
  };

  function handleDownload(regulation: Regulation) {
    download.mutate(regulation, {
      onError: (error) =>
        notify.error(describeSetupError(error, 'Não foi possível baixar o PDF. Tente novamente.')),
    });
  }

  const filtersChanged = (apply: () => void) => {
    apply();
    setPage(1);
  };

  function rowActions(regulation: Regulation) {
    const view = (
      <Link
        className={styles.link}
        to={`${REGULATIONS_PATH}/${regulation.id}`}
        aria-label={`Visualizar ${regulation.title}, versão ${regulation.version}`}
      >
        Visualizar
      </Link>
    );
    if (regulation.status === 'DRAFT') {
      return (
        <span className={registry.rowActions}>
          {view}
          <Link
            className={styles.link}
            to={`${REGULATIONS_PATH}/${regulation.id}/editar`}
            aria-label={`Editar ${regulation.title}, versão ${regulation.version}`}
          >
            Editar
          </Link>
        </span>
      );
    }
    if (regulation.status === 'PUBLISHED') {
      return (
        <span className={registry.rowActions}>
          {view}
          <button
            type="button"
            className={styles.link}
            disabled={download.isPending}
            onClick={() => handleDownload(regulation)}
            aria-label={`Baixar ${regulation.title}, versão ${regulation.version}`}
          >
            Baixar
          </button>
        </span>
      );
    }
    return (
      <Link
        className={styles.link}
        to={`${REGULATIONS_PATH}/${regulation.id}`}
        aria-label={`Consultar ${regulation.title}, versão ${regulation.version}`}
      >
        Consultar versão
      </Link>
    );
  }

  let content;
  if (query.isPending) {
    content = (
      <div className={styles.state}>
        <Spinner label="Carregando os editais…" />
      </div>
    );
  } else if (query.isError) {
    content = (
      <Alert
        tone="danger"
        title="Não foi possível carregar os editais."
        action={
          <Button size="small" variant="secondary" onClick={() => void query.refetch()}>
            Tentar de novo
          </Button>
        }
      >
        {describeSetupError(query.error, 'Verifique sua conexão e tente novamente.')}
      </Alert>
    );
  } else if (all.length === 0) {
    content = (
      <EmptyState
        title="Nenhum edital cadastrado"
        description="Cadastre a minuta do edital da edição e anexe o documento em PDF."
      />
    );
  } else {
    content = (
      <>
        <div className={registry.filters}>
          <TextField
            label="Buscar"
            type="search"
            placeholder="Buscar título do edital"
            value={search}
            onChange={(event) => filtersChanged(() => setSearch(event.target.value))}
          />
          <Select
            label="Filtrar por edição"
            value={editionId}
            options={[
              { value: '', label: 'Todas as edições' },
              ...editions.map((item) => ({
                value: String(item.id),
                label: editionLabel(item, editions),
              })),
            ]}
            onChange={(event) => filtersChanged(() => setEditionId(event.target.value))}
          />
          <Select
            label="Filtrar por situação"
            value={status}
            options={[{ value: '', label: 'Todas as situações' }, ...REGULATION_STATUS_OPTIONS]}
            onChange={(event) => filtersChanged(() => setStatus(event.target.value))}
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="Nenhum edital encontrado"
            description="Ajuste a busca ou os filtros para ver outros documentos."
          />
        ) : (
          <div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Título</th>
                    <th scope="col">Edição</th>
                    <th scope="col">Versão</th>
                    <th scope="col">Situação</th>
                    <th scope="col">Atualização</th>
                    <th scope="col">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((regulation) => (
                    <tr key={regulation.id}>
                      <td>{regulation.title}</td>
                      <td>{editionName(regulation)}</td>
                      <td>v{regulation.version}</td>
                      <td>
                        <RegulationStatusPill status={regulation.status} />
                      </td>
                      <td>{formatDate(regulation.updated_at)}</td>
                      <td>{rowActions(regulation)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.tableFooter}>
              <span>
                {(current - 1) * PAGE_SIZE + 1}–{(current - 1) * PAGE_SIZE + visible.length} de{' '}
                {filtered.length} {filtered.length === 1 ? 'documento' : 'documentos'}
              </span>
              <Pagination page={current} pageCount={pageCount} onPageChange={setPage} />
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className={styles.page}>
      <SetupContext
        crumbs={[{ label: 'Início', to: '/admin' }, { label: 'Editais' }, { label: 'Editais' }]}
        description="Gerencie minutas, versões e documentos publicados de cada edição."
        action={
          <ButtonLink to={`${REGULATIONS_PATH}/novo`} size="large">
            Cadastrar edital
          </ButtonLink>
        }
      />

      <SetupCard
        title="Documentos da instituição"
        subtitle="A versão publicada é preservada. Alterações posteriores geram uma nova versão."
      >
        {content}
      </SetupCard>

      {draft && (
        <Notice tone="warning" title={`Minuta de ${draft.edition.year} aguardando aprovação`}>
          {draftEdition?.status === 'SETUP'
            ? 'A publicação depende da configuração da edição, das rubricas revisadas e do total exato de 10,0 pontos.'
            : 'Ao publicar a minuta, a versão publicada atual passa a substituída e continua disponível para consulta.'}{' '}
          <Link className={styles.link} to={`${REGULATIONS_PATH}/${draft.id}/publicar`}>
            Revisar publicação
          </Link>
        </Notice>
      )}

      <SetupFooter />
    </div>
  );
}
