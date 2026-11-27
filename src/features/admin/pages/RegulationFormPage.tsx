import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Button,
  ButtonLink,
  Select,
  Spinner,
  TextField,
  Textarea,
  notify,
} from '@/shared/ui';
import { PdfUpload } from '../components/setup/RegistryParts';
import { Notice, SetupCard, SetupContext, SetupFooter } from '../components/setup/SetupParts';
import styles from '../components/setup/Setup.module.css';
import { useAdminEdition } from '../hooks/useAdminEdition';
import { useRegulation, useRegulations, useSaveRegulation } from '../hooks/useRegulations';
import { useSetupHeader } from '../hooks/useSetupHeader';
import { editionLabel } from '../lib/editions';
import { describeSetupError } from '../lib/errors';
import {
  REGULATIONS_PATH,
  REGULATION_DESCRIPTION_LIMIT,
  REGULATION_TITLE_LIMIT,
  draftOf,
  nextVersion,
  validateRegulationForm,
  type RegulationFormErrors,
  type RegulationFormValues,
} from '../lib/regulations';
import type { AdminEdition, Regulation } from '../types';

/**
 * Cadastro e edição de minuta (Figma: "Editais - cadastrar"). Com `?base=<id>`, parte de uma
 * versão publicada para criar a próxima versão da mesma edição; a publicada não muda.
 */
export function RegulationFormPage() {
  const { regulationId } = useParams();
  const [searchParams] = useSearchParams();
  const editing = regulationId !== undefined;
  const baseId = searchParams.get('base');
  useSetupHeader(editing ? 'Editar minuta' : 'Cadastrar edital', 'EDITAIS');

  const editionState = useAdminEdition();
  const list = useRegulations();
  const sourceId = editing ? Number(regulationId) : baseId ? Number(baseId) : undefined;
  const source = useRegulation(sourceId);

  const crumbs = [
    { label: 'Início', to: '/admin' },
    { label: 'Editais', to: REGULATIONS_PATH },
    { label: editing ? 'Editar minuta' : 'Cadastrar edital' },
  ];
  const description = editing
    ? 'Ajuste os dados da minuta ou substitua o PDF antes da publicação.'
    : 'Crie uma minuta e anexe o documento em PDF para revisão.';

  const failed = [editionState, list, source].find((query) => query.isError);
  let blocked = null;
  if (editionState.isLoading || list.isPending || (sourceId !== undefined && source.isPending)) {
    blocked = (
      <div className={styles.state}>
        <Spinner label="Carregando o edital…" />
      </div>
    );
  } else if (failed) {
    blocked = (
      <Alert
        tone="danger"
        title="Não foi possível carregar o edital."
        action={
          <ButtonLink to={REGULATIONS_PATH} size="small" variant="secondary">
            Voltar aos editais
          </ButtonLink>
        }
      >
        {describeSetupError(failed.error, 'Verifique sua conexão e tente novamente.')}
      </Alert>
    );
  } else if (editing && source.data && source.data.status !== 'DRAFT') {
    blocked = (
      <Notice tone="info" title="A versão publicada é preservada">
        Esta versão não pode ser alterada. Para mudar o documento, crie uma nova versão a partir
        dela; a versão atual continua disponível para consulta.{' '}
        <ButtonLink
          to={`${REGULATIONS_PATH}/novo?base=${source.data.id}`}
          size="small"
          variant="secondary"
        >
          Criar nova versão
        </ButtonLink>
      </Notice>
    );
  }

  return (
    <div className={styles.page}>
      <SetupContext crumbs={crumbs} description={description} />
      {blocked ?? (
        <RegulationForm
          key={sourceId ?? 'new'}
          editions={editionState.editions}
          defaultEdition={editionState.edition}
          regulations={list.data ?? []}
          draft={editing ? source.data : undefined}
          base={editing ? undefined : source.data}
        />
      )}
      <SetupFooter edition={editionState.edition} />
    </div>
  );
}

function RegulationForm({
  editions,
  defaultEdition,
  regulations,
  draft,
  base,
}: {
  editions: AdminEdition[];
  defaultEdition: AdminEdition | undefined;
  regulations: Regulation[];
  draft?: Regulation;
  base?: Regulation;
}) {
  const navigate = useNavigate();
  const save = useSaveRegulation();
  const origin = draft ?? base;
  const [values, setValues] = useState<RegulationFormValues>({
    title: origin?.title ?? '',
    editionId: String(
      origin?.edition.id ?? (defaultEdition?.status !== 'CLOSED' ? (defaultEdition?.id ?? '') : ''),
    ),
    description: origin?.description ?? '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [touched, setTouched] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const errors: RegulationFormErrors = validateRegulationForm(values, {
    hasFile: Boolean(file || draft),
  });
  const valid = Object.keys(errors).length === 0;
  const errorFor = (field: keyof RegulationFormErrors) => (touched ? errors[field] : undefined);
  const update = (field: keyof RegulationFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setSubmitError(null);
  };

  const editionOptions = editions
    .filter((item) => item.status !== 'CLOSED' || String(item.id) === values.editionId)
    .map((item) => ({ value: String(item.id), label: editionLabel(item, editions) }));
  const version = draft
    ? `Versão ${draft.version} • minuta`
    : values.editionId
      ? `Versão ${nextVersion(regulations, Number(values.editionId))} • definida ao salvar`
      : 'Nova versão • definida ao salvar';
  // Cada edição tem uma minuta em aberto: a nova versão sai dela, não de uma segunda minuta.
  const openDraft = draft ? undefined : draftOf(regulations, Number(values.editionId));
  const dirty =
    !draft ||
    Boolean(file) ||
    values.title !== draft.title ||
    values.description !== draft.description;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (!valid || openDraft || save.isPending) return;
    try {
      const saved = await save.mutateAsync({
        regulationId: draft?.id,
        editionId: Number(values.editionId),
        input: { title: values.title.trim(), description: values.description.trim(), file },
      });
      notify.success(draft ? 'Minuta atualizada.' : `Minuta salva como versão ${saved.version}.`);
      navigate(`${REGULATIONS_PATH}/${saved.id}`);
    } catch (error) {
      setSubmitError(
        describeSetupError(error, 'Não foi possível salvar a minuta. Tente novamente.'),
      );
    }
  }

  return (
    <form className={styles.page} onSubmit={handleSubmit} noValidate>
      {openDraft && (
        <Notice
          tone="warning"
          title={`Já existe a minuta da versão ${openDraft.version} nesta edição`}
        >
          Edite a minuta em aberto ou publique-a antes de criar outra versão.{' '}
          <Link className={styles.link} to={`${REGULATIONS_PATH}/${openDraft.id}/editar`}>
            Editar minuta v{openDraft.version}
          </Link>
        </Notice>
      )}
      {base && !openDraft && (
        <Notice tone="info" title={`Nova versão a partir da versão ${base.version}`}>
          A versão {base.version} continua publicada até a nova minuta ser publicada.
        </Notice>
      )}

      <SetupCard title="Dados do edital">
        <div className={styles.fields}>
          <TextField
            label="Título *"
            placeholder="Ex.: Edital de participação Desafio X 2027"
            value={values.title}
            maxLength={REGULATION_TITLE_LIMIT}
            error={errorFor('title')}
            onChange={(event) => update('title', event.target.value)}
          />
          <div className={styles.row}>
            <Select
              label="Edição *"
              placeholder="Selecione a edição"
              options={editionOptions}
              value={values.editionId}
              disabled={Boolean(origin)}
              hint={origin ? 'A versão pertence à edição do documento de origem.' : undefined}
              error={errorFor('editionId')}
              onChange={(event) => update('editionId', event.target.value)}
            />
            <TextField label="Versão" value={version} readOnly disabled />
          </div>
          <Textarea
            label="Descrição *"
            placeholder="Informe o objetivo do documento e o público a que se destina"
            value={values.description}
            maxLength={REGULATION_DESCRIPTION_LIMIT}
            error={errorFor('description')}
            onChange={(event) => update('description', event.target.value)}
          />
        </div>
      </SetupCard>

      <SetupCard
        title="Anexo em PDF *"
        subtitle="Envie um documento legível. A minuta não será publicada automaticamente."
      >
        <PdfUpload
          file={file}
          currentName={draft?.file.name}
          currentSize={draft?.file.size_bytes}
          error={errorFor('file')}
          onChange={(next) => {
            setFile(next);
            setSubmitError(null);
          }}
        />
        <div className={styles.actions}>
          <div className={styles.buttons}>
            <ButtonLink
              to={draft ? `${REGULATIONS_PATH}/${draft.id}` : REGULATIONS_PATH}
              variant="secondary"
              size="large"
            >
              Cancelar
            </ButtonLink>
            <Button
              type="submit"
              size="large"
              loading={save.isPending}
              disabled={!valid || !dirty || Boolean(openDraft)}
            >
              {save.isPending ? 'Salvando…' : 'Salvar minuta'}
            </Button>
          </div>
          {submitError && (
            <p role="alert" className={styles.actionsError}>
              {submitError}
            </p>
          )}
          {!valid && (
            <p className={styles.actionsHint}>
              Informe os dados obrigatórios e anexe um PDF válido para salvar.
            </p>
          )}
        </div>
      </SetupCard>
    </form>
  );
}
