import { useId, useState, type FormEvent } from 'react';
import { Button, Input, Select, Textarea, notify } from '@/shared/ui';
import { cn } from '@/shared/lib/cn';
import { getApiError } from '@/shared/lib/api-error';
import { useCreateTeam } from '../hooks/useTeamFormation';
import {
  DEFAULT_MAX_MEMBERS,
  INTEREST_AREA_OPTIONS,
  TEAM_DESCRIPTION_MAX,
  TEAM_NAME_MAX,
  TEAM_NAME_MIN,
  describeTeamError,
  toTeamCreate,
  validateCreateTeam,
  type CreateTeamErrors,
  type CreateTeamValues,
} from '../lib/team-formation';
import type { Team } from '../types';
import styles from './FindTeam.module.css';

const EMPTY: CreateTeamValues = { name: '', interestArea: '', description: '' };

export interface CreateTeamCardProps {
  /** Nome do aluno logado (vira líder da equipe). */
  studentName?: string;
  maxMembers?: number | null;
  /** Bloqueia o envio (ex.: prazo encerrado ou aluno já em equipe). */
  disabled?: boolean;
  onCreated?: (team: Team) => void;
}

/** Figma: "Criar uma equipe" (551:11893). POST /api/teams — o criador vira líder. */
export function CreateTeamCard({
  studentName,
  maxMembers,
  disabled = false,
  onCreated,
}: CreateTeamCardProps) {
  const [values, setValues] = useState<CreateTeamValues>(EMPTY);
  const [errors, setErrors] = useState<CreateTeamErrors>({});
  const createTeam = useCreateTeam();
  const titleId = useId();
  const nameId = useId();

  function update<K extends keyof CreateTeamValues>(key: K, value: CreateTeamValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled || createTeam.isPending) return;

    const found = validateCreateTeam(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    createTeam.mutate(toTeamCreate(values), {
      onSuccess: (team) => {
        notify.success(`Equipe ${team.name} criada. Você é o líder.`);
        setValues(EMPTY);
        onCreated?.(team);
      },
      onError: (error) => {
        if (getApiError(error)?.code === 'team_name_taken') {
          setErrors({ name: describeTeamError(error, '') });
          return;
        }
        notify.error(describeTeamError(error, 'Não foi possível criar a equipe. Tente de novo.'));
      },
    });
  }

  const limit = maxMembers ?? DEFAULT_MAX_MEMBERS;

  return (
    <section
      id="criar-equipe"
      className={`${styles.card} ${styles.anchor}`}
      aria-labelledby={titleId}
    >
      <h2 id={titleId} className={styles.cardTitle}>
        Criar uma equipe
      </h2>
      <p className={styles.text}>
        Reúna até {limit} estudantes de diferentes áreas para desenvolver uma solução.
      </p>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label htmlFor={nameId} className={styles.label}>
            Nome da equipe *
          </label>
          <Input
            id={nameId}
            inputSize="large"
            placeholder="Digite um nome para a equipe"
            value={values.name}
            maxLength={TEAM_NAME_MAX}
            onChange={(event) => update('name', event.target.value)}
            invalid={Boolean(errors.name)}
            aria-describedby={`${nameId}-hint`}
            aria-required="true"
            disabled={disabled}
          />
          {errors.name ? (
            <p id={`${nameId}-hint`} role="alert" className={styles.fieldError}>
              {errors.name}
            </p>
          ) : (
            <p id={`${nameId}-hint`} className={styles.caption}>
              Entre {TEAM_NAME_MIN} e {TEAM_NAME_MAX} caracteres. O nome será público.
            </p>
          )}
        </div>

        <Select
          className={styles.field}
          label="Área de interesse *"
          placeholder="Selecione uma área"
          options={INTEREST_AREA_OPTIONS}
          value={values.interestArea}
          onChange={(event) => update('interestArea', event.target.value)}
          error={errors.interestArea}
          aria-required="true"
          disabled={disabled}
        />

        <Textarea
          className={styles.field}
          label="Apresentação da equipe *"
          placeholder="Conte o que vocês querem desenvolver e quais perfis procuram."
          hint="Até 300 caracteres. Ajude outros estudantes a encontrar vocês."
          maxLength={TEAM_DESCRIPTION_MAX}
          rows={3}
          value={values.description}
          onChange={(event) => update('description', event.target.value)}
          error={errors.description}
          aria-required="true"
          disabled={disabled}
        />

        <p className={styles.text}>
          {studentName ? `Seu perfil: ${studentName}. ` : ''}Você será o líder da nova equipe.
        </p>

        <Button
          type="submit"
          size="large"
          className={cn(styles.action, styles.fullWidth)}
          loading={createTeam.isPending}
          disabled={disabled}
        >
          Criar equipe
        </Button>
      </form>
    </section>
  );
}
