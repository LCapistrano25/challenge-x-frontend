import { useId, useState, type FormEvent } from 'react';
import { Button, Input, notify } from '@/shared/ui';
import { cn } from '@/shared/lib/cn';
import { useCreateInvitation } from '../hooks/useMyTeam';
import { describeMyTeamError, validateInviteEmail } from '../lib/my-team';
import styles from './MyTeam.module.css';

export interface InviteStudentCardProps {
  teamId: number;
  code: string;
  /** Fora da formação ou com a equipe completa, o convite fica bloqueado. */
  disabled?: boolean;
  disabledReason?: string;
}

/** Copia o código para a área de transferência (navegadores sem a API caem no erro). */
async function copyText(text: string) {
  if (!navigator.clipboard) throw new Error('clipboard indisponível');
  await navigator.clipboard.writeText(text);
}

/** Figma: "Convidar estudante" (551:12135). POST /api/teams/{id}/invitations por e-mail. */
export function InviteStudentCard({
  teamId,
  code,
  disabled,
  disabledReason,
}: InviteStudentCardProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const invite = useCreateInvitation(teamId);
  const emailId = useId();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled || invite.isPending) return;
    const found = validateInviteEmail(email);
    setError(found);
    if (found) return;

    const value = email.trim();
    invite.mutate(
      { email: value },
      {
        onSuccess: () => {
          notify.success(`Convite enviado para ${value}.`);
          setEmail('');
        },
        onError: (apiError) =>
          setError(describeMyTeamError(apiError, 'Não foi possível enviar o convite.')),
      },
    );
  }

  async function handleCopy() {
    try {
      await copyText(code);
      notify.success('Código da equipe copiado.');
    } catch {
      notify.error(`Não foi possível copiar. Código da equipe: ${code}`);
    }
  }

  return (
    <section className={styles.card} aria-labelledby="invite-student">
      <h2 id="invite-student" className={styles.cardTitle}>
        Convidar estudante
      </h2>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label htmlFor={emailId} className={styles.label}>
            E-mail institucional
          </label>
          <Input
            id={emailId}
            type="email"
            inputSize="large"
            placeholder="nome@universidade.edu.br"
            autoComplete="off"
            value={email}
            maxLength={254}
            onChange={(event) => {
              setEmail(event.target.value);
              if (error) setError(null);
            }}
            invalid={Boolean(error)}
            aria-describedby={`${emailId}-hint`}
            disabled={disabled}
          />
          {error ? (
            <p id={`${emailId}-hint`} role="alert" className={styles.fieldError}>
              {error}
            </p>
          ) : (
            <p id={`${emailId}-hint`} className={styles.caption}>
              {disabled && disabledReason
                ? disabledReason
                : 'O estudante receberá um convite no painel.'}
            </p>
          )}
        </div>
        <Button
          type="submit"
          size="large"
          className={cn(styles.action, styles.fullWidth)}
          loading={invite.isPending}
          disabled={disabled}
        >
          Enviar convite
        </Button>
      </form>

      <div className={styles.row}>
        <div className={styles.code}>
          <span className={styles.caption}>Código da equipe</span>
          <span className={styles.codeValue}>{code}</span>
        </div>
        <Button variant="ghost" size="large" className={styles.action} onClick={handleCopy}>
          Copiar código
        </Button>
      </div>
    </section>
  );
}
