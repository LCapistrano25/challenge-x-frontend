import { useState } from 'react';
import { Alert, Button, Modal, Select, Spinner, TextField, notify } from '@/shared/ui';
import { useActiveCourses, useEvaluatorCatalog, useLinkEvaluator } from '../../hooks/useEvaluators';
import { describeSetupError } from '../../lib/errors';
import type { AdminEdition, EditionEvaluator } from '../../types';
import registry from './Registry.module.css';

/**
 * "Vincular avaliador existente": escolhe no catálogo (GET /api/admin/external-evaluators) quem
 * ainda não está na edição e vincula com a abrangência de cursos (POST .../evaluators).
 */
export function LinkEvaluatorDialog({
  open,
  onOpenChange,
  edition,
  linked,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  edition: AdminEdition;
  linked: readonly EditionEvaluator[];
}) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<number | null>(null);
  const [courseId, setCourseId] = useState('');
  const catalog = useEvaluatorCatalog(search.trim(), open);
  const courses = useActiveCourses();
  const link = useLinkEvaluator();

  const linkedIds = new Set(linked.map((item) => item.evaluator.user_id));
  const available = (catalog.data ?? []).filter((item) => !linkedIds.has(item.user_id));
  const chosen = available.find((item) => item.user_id === selected);

  function close(next: boolean) {
    if (!next) {
      setSearch('');
      setSelected(null);
      setCourseId('');
      link.reset();
    }
    onOpenChange(next);
  }

  async function handleLink() {
    if (!chosen) return;
    try {
      await link.mutateAsync({
        editionId: edition.id,
        evaluatorId: chosen.user_id,
        courseId: courseId ? Number(courseId) : null,
      });
      notify.success(`${chosen.name} vinculado à edição. O convite foi enviado.`);
      close(false);
    } catch {
      // A mensagem aparece no corpo do diálogo.
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={close}
      title="Vincular avaliador existente"
      description={`Escolha um avaliador do catálogo para participar do Desafio X ${edition.year}.`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={() => close(false)}>
            Cancelar
          </Button>
          <Button disabled={!chosen} loading={link.isPending} onClick={() => void handleLink()}>
            Vincular à edição
          </Button>
        </>
      }
    >
      <div className={registry.modalBody}>
        <TextField
          label="Buscar"
          type="search"
          placeholder="Buscar nome ou e-mail"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setSelected(null);
          }}
        />
        {catalog.isPending ? (
          <Spinner label="Carregando o catálogo…" />
        ) : catalog.isError ? (
          <Alert tone="danger" title="Não foi possível carregar o catálogo.">
            {describeSetupError(catalog.error, 'Verifique sua conexão e tente novamente.')}
          </Alert>
        ) : available.length === 0 ? (
          <p className={registry.caption}>
            {search.trim()
              ? 'Nenhum avaliador disponível com esta busca.'
              : 'Todos os avaliadores do catálogo já estão vinculados a esta edição.'}
          </p>
        ) : (
          <ul className={registry.catalog} aria-label="Avaliadores do catálogo">
            {available.map((item) => (
              <li key={item.user_id}>
                <label>
                  <input
                    type="radio"
                    name="catalog-evaluator"
                    checked={selected === item.user_id}
                    onChange={() => setSelected(item.user_id)}
                  />
                  <span>
                    <strong>{item.name}</strong>
                    <span className={registry.catalogMeta}>
                      {[item.institution, item.email].filter(Boolean).join(' • ')}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
        <Select
          label="Abrangência"
          value={courseId}
          options={[
            { value: '', label: 'Todos os cursos da edição' },
            ...(courses.data ?? []).map((course) => ({
              value: String(course.id),
              label: course.name,
            })),
          ]}
          hint="Restringe as equipes que o avaliador pode receber."
          onChange={(event) => setCourseId(event.target.value)}
        />
        {link.isError && (
          <Alert tone="danger" title="Não foi possível vincular o avaliador.">
            {describeSetupError(link.error, 'Tente novamente.')}
          </Alert>
        )}
      </div>
    </Modal>
  );
}
