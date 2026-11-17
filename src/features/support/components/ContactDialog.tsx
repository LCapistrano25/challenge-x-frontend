import { useId, useState, type FormEvent } from 'react';
import { Button, Input, Modal, Textarea, notify } from '@/shared/ui';
import { useCreateSupportTicket } from '../hooks/useCreateSupportTicket';
import {
  TICKET_TITLE_MAX,
  describeTicketError,
  toTicketCreate,
  validateTicket,
  type TicketErrors,
  type TicketValues,
} from '../lib/help-center';
import styles from './HelpCenter.module.css';

const EMPTY: TicketValues = { title: '', description: '' };

export interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * "Falar com a organização": abre um chamado para a equipe de atendimento
 * (POST /api/support/tickets, PROPOSTO — P-06). O Figma não desenha o formulário; os campos
 * seguem SupportTicketCreate (title até 150 caracteres e description).
 */
export function ContactDialog({ open, onOpenChange }: ContactDialogProps) {
  const formId = useId();
  const titleId = useId();
  const [values, setValues] = useState<TicketValues>(EMPTY);
  const [errors, setErrors] = useState<TicketErrors>({});
  const createTicket = useCreateSupportTicket();

  function handleOpenChange(next: boolean) {
    if (!next) {
      setValues(EMPTY);
      setErrors({});
    }
    onOpenChange(next);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validateTicket(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    createTicket.mutate(toTicketCreate(values), {
      onSuccess: () => {
        notify.success('Mensagem enviada à organização do Desafio X.');
        handleOpenChange(false);
      },
      onError: (error) => {
        const { message, fields } = describeTicketError(error);
        if (Object.keys(fields).length > 0) setErrors(fields);
        else notify.error(message);
      },
    });
  }

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title="Falar com a organização"
      description="Descreva sua dúvida. Informe a equipe ou o projeto e, se houver um erro, a etapa e a mensagem exibida."
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => handleOpenChange(false)}
            disabled={createTicket.isPending}
          >
            Cancelar
          </Button>
          <Button type="submit" form={formId} loading={createTicket.isPending}>
            Enviar mensagem
          </Button>
        </>
      }
    >
      <form id={formId} className={styles.dialogBody} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label htmlFor={titleId} className={styles.label}>
            Assunto *
          </label>
          <Input
            id={titleId}
            inputSize="large"
            value={values.title}
            maxLength={TICKET_TITLE_MAX}
            placeholder="Ex.: Dúvida sobre a entrega da etapa 2"
            onChange={(event) => setValues((v) => ({ ...v, title: event.target.value }))}
            invalid={Boolean(errors.title)}
            aria-required="true"
            aria-describedby={errors.title ? `${titleId}-error` : undefined}
          />
          {errors.title && (
            <p id={`${titleId}-error`} role="alert" className={styles.fieldError}>
              {errors.title}
            </p>
          )}
        </div>
        <Textarea
          label="Mensagem *"
          rows={5}
          value={values.description}
          onChange={(event) => setValues((v) => ({ ...v, description: event.target.value }))}
          error={errors.description}
          aria-required="true"
        />
      </form>
    </Modal>
  );
}
