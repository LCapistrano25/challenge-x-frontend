import { useId, useState, type FormEvent } from 'react';
import { Button, Input, Modal, Textarea, notify } from '@/shared/ui';
import { getApiError } from '@/shared/lib/api-error';
import { useUpdateTeam } from '../hooks/useMyTeam';
import {
  describeMyTeamError,
  validateEditTeam,
  type EditTeamErrors,
  type EditTeamValues,
} from '../lib/my-team';
import { TEAM_DESCRIPTION_MAX, TEAM_NAME_MAX } from '../lib/team-formation';
import type { Team } from '../types';
import styles from './MyTeam.module.css';

export interface EditTeamDialogProps {
  team: Team;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** "Editar informações": nome e apresentação (PATCH /api/teams/{id}, PROPOSTA). */
export function EditTeamDialog({ team, open, onOpenChange }: EditTeamDialogProps) {
  const formId = useId();
  const nameId = useId();
  const [values, setValues] = useState<EditTeamValues>({
    name: team.name,
    description: team.description ?? '',
  });
  const [errors, setErrors] = useState<EditTeamErrors>({});
  const update = useUpdateTeam(team.id);

  function handleOpenChange(next: boolean) {
    if (next) setValues({ name: team.name, description: team.description ?? '' });
    setErrors({});
    onOpenChange(next);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validateEditTeam(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    update.mutate(
      { name: values.name.trim(), description: values.description.trim() },
      {
        onSuccess: () => {
          notify.success('Informações da equipe atualizadas.');
          onOpenChange(false);
        },
        onError: (error) => {
          if (getApiError(error)?.code === 'team_name_taken') {
            setErrors({ name: describeMyTeamError(error, '') });
            return;
          }
          notify.error(describeMyTeamError(error, 'Não foi possível salvar as alterações.'));
        },
      },
    );
  }

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title="Editar informações"
      description="O nome e a apresentação aparecem para outros estudantes."
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => handleOpenChange(false)}
            disabled={update.isPending}
          >
            Cancelar
          </Button>
          <Button type="submit" form={formId} loading={update.isPending}>
            Salvar alterações
          </Button>
        </>
      }
    >
      <form id={formId} className={styles.dialogBody} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label htmlFor={nameId} className={styles.label}>
            Nome da equipe *
          </label>
          <Input
            id={nameId}
            inputSize="large"
            value={values.name}
            maxLength={TEAM_NAME_MAX}
            onChange={(event) => setValues((v) => ({ ...v, name: event.target.value }))}
            invalid={Boolean(errors.name)}
            aria-required="true"
            aria-describedby={errors.name ? `${nameId}-error` : undefined}
          />
          {errors.name && (
            <p id={`${nameId}-error`} role="alert" className={styles.fieldError}>
              {errors.name}
            </p>
          )}
        </div>
        <Textarea
          label="Apresentação da equipe"
          hint={`Até ${TEAM_DESCRIPTION_MAX} caracteres.`}
          maxLength={TEAM_DESCRIPTION_MAX}
          rows={3}
          value={values.description}
          onChange={(event) => setValues((v) => ({ ...v, description: event.target.value }))}
          error={errors.description}
        />
      </form>
    </Modal>
  );
}
