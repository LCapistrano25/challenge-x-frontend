import { useId, useState, type FormEvent } from 'react';
import { Button, Input } from '@/shared/ui';
import { cn } from '@/shared/lib/cn';
import { useFindTeamByCode } from '../hooks/useTeamFormation';
import {
  describeLeadership,
  describeVacancies,
  normalizeTeamCode,
  validateTeamCode,
} from '../lib/team-formation';
import type { JoinRequest } from '../types';
import { JoinTeamButton } from './JoinTeamButton';
import styles from './FindTeam.module.css';

export interface JoinByCodeCardProps {
  /** Solicitações PENDING do aluno, por id da equipe. */
  pendingByTeam: ReadonlyMap<number, JoinRequest>;
  disabled?: boolean;
}

/**
 * Figma: "Já tem um código?" (551:11916). Localiza a equipe pelo código e permite confirmar
 * a solicitação de entrada (POST /api/teams/{id}/join-requests).
 */
export function JoinByCodeCard({ pendingByTeam, disabled = false }: JoinByCodeCardProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const findTeam = useFindTeamByCode();
  const titleId = useId();
  const codeId = useId();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled) return;
    const invalid = validateTeamCode(code);
    setError(invalid);
    if (invalid) {
      findTeam.reset();
      return;
    }
    findTeam.mutate(normalizeTeamCode(code), {
      onSuccess: (team) => {
        if (!team)
          setError('Nenhuma equipe com vagas encontrada para este código. Confira com o líder.');
      },
      onError: () => setError('Não foi possível verificar o código. Tente de novo.'),
    });
  }

  const team = findTeam.data ?? null;

  return (
    <section className={styles.card} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.cardTitle}>
        Já tem um código?
      </h2>
      <p className={styles.text}>
        Use o código recebido de um líder para localizar a equipe e confirmar sua entrada.
      </p>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label htmlFor={codeId} className={styles.label}>
            Código de convite
          </label>
          <Input
            id={codeId}
            inputSize="large"
            placeholder="Ex.: DX27-AB12"
            autoComplete="off"
            spellCheck={false}
            maxLength={24}
            value={code}
            onChange={(event) => {
              setCode(event.target.value.toUpperCase());
              setError(null);
              if (findTeam.data !== undefined) findTeam.reset();
            }}
            invalid={Boolean(error)}
            aria-describedby={error ? `${codeId}-error` : undefined}
            disabled={disabled}
          />
          {error && (
            <p id={`${codeId}-error`} role="alert" className={styles.fieldError}>
              {error}
            </p>
          )}
        </div>

        <Button
          type="submit"
          variant="secondary"
          size="large"
          className={cn(styles.action, styles.fullWidth)}
          loading={findTeam.isPending}
          disabled={disabled}
        >
          Verificar código
        </Button>
      </form>

      {team && (
        <div className={styles.codeResult} role="status" aria-label="Equipe encontrada">
          <div className={styles.codeResultHeader}>
            <p className={styles.codeResultName}>{team.name}</p>
            <span className={styles.vacancies}>{describeVacancies(team)}</span>
          </div>
          <p className={styles.caption}>{describeLeadership(team)}</p>
          <JoinTeamButton
            team={team}
            pendingRequest={pendingByTeam.get(team.id)}
            blocked={disabled}
            className={styles.fullWidth}
          />
        </div>
      )}
    </section>
  );
}
