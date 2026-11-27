import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, ButtonLink, Select, TextField, Textarea, notify } from '@/shared/ui';
import { Notice, SetupCard, SetupContext, SetupFooter } from '../components/setup/SetupParts';
import styles from '../components/setup/Setup.module.css';
import { useAdminEdition } from '../hooks/useAdminEdition';
import { useEditionEvaluators, useInviteEvaluator } from '../hooks/useEvaluators';
import { useSetupHeader } from '../hooks/useSetupHeader';
import { editionLabel } from '../lib/editions';
import { describeSetupError, setupErrorCode } from '../lib/errors';
import {
  EVALUATORS_PATH,
  EVALUATOR_SPECIALTIES,
  emptyInviteForm,
  formToInvitation,
  maskPhone,
  validateInviteForm,
  type InviteFormValues,
} from '../lib/evaluators';

/** Cadastro de avaliador externo com envio do convite (Figma: "Avaliadores - cadastrar"). */
export function EvaluatorInvitePage() {
  useSetupHeader('Cadastrar avaliador externo', 'AVALIADORES');
  const navigate = useNavigate();
  const { edition, editions } = useAdminEdition();
  const invite = useInviteEvaluator();
  const [values, setValues] = useState<InviteFormValues | null>(null);
  const [touched, setTouched] = useState<Set<keyof InviteFormValues>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // A edição padrão chega com a lista de edições; até o primeiro ajuste, o formulário a segue.
  const form =
    values ?? emptyInviteForm(edition && edition.status !== 'CLOSED' ? String(edition.id) : '');
  const linked = useEditionEvaluators(form.editionId ? Number(form.editionId) : undefined);
  const errors = validateInviteForm(
    form,
    (linked.data ?? []).map((item) => item.evaluator.email),
  );
  const errorFor = (field: keyof InviteFormValues) =>
    submitted || touched.has(field) ? errors[field] : undefined;
  const update = (field: keyof InviteFormValues, value: string) => {
    setValues({ ...form, [field]: value });
    setSubmitError(null);
  };
  const blur = (field: keyof InviteFormValues) => () =>
    setTouched((current) => new Set(current).add(field));

  const selectedEdition = editions.find((item) => String(item.id) === form.editionId);
  const description = selectedEdition
    ? `Inclua um profissional e vincule sua participação ao Desafio X ${selectedEdition.year}.`
    : 'Inclua um profissional e vincule sua participação à edição.';

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0 || invite.isPending) return;
    try {
      const created = await invite.mutateAsync({
        editionId: Number(form.editionId),
        input: formToInvitation(form),
      });
      notify.success(`Convite enviado para ${created.evaluator.email}.`);
      navigate(EVALUATORS_PATH);
    } catch (error) {
      setSubmitError(
        setupErrorCode(error) === 'email_taken'
          ? 'Já existe usuário com este e-mail. Use “Vincular avaliador existente” na listagem.'
          : describeSetupError(error, 'Não foi possível cadastrar o avaliador. Tente novamente.'),
      );
    }
  }

  return (
    <form className={styles.page} onSubmit={handleSubmit} noValidate>
      <SetupContext
        crumbs={[
          { label: 'Início', to: '/admin' },
          { label: 'Avaliadores', to: EVALUATORS_PATH },
          { label: 'Cadastrar avaliador externo' },
        ]}
        description={description}
      />

      <SetupCard title="Dados do avaliador" subtitle="Campos com * são obrigatórios.">
        <div className={styles.fields}>
          <TextField
            label="Nome completo *"
            placeholder="Informe o nome"
            autoComplete="name"
            maxLength={150}
            value={form.name}
            error={errorFor('name')}
            onBlur={blur('name')}
            onChange={(event) => update('name', event.target.value)}
          />
          <div className={styles.row}>
            <TextField
              label="E-mail *"
              type="email"
              placeholder="nome@instituicao.org"
              autoComplete="email"
              maxLength={254}
              value={form.email}
              error={errorFor('email')}
              onBlur={blur('email')}
              onChange={(event) => update('email', event.target.value)}
            />
            <TextField
              label="Telefone"
              type="tel"
              inputMode="tel"
              placeholder="(00) 00000-0000"
              autoComplete="tel"
              value={form.phone}
              error={errorFor('phone')}
              onBlur={blur('phone')}
              onChange={(event) => update('phone', maskPhone(event.target.value))}
            />
          </div>
          <div className={styles.row}>
            <TextField
              label="Instituição ou organização *"
              placeholder="Informe a organização"
              autoComplete="organization"
              maxLength={150}
              value={form.institution}
              error={errorFor('institution')}
              onBlur={blur('institution')}
              onChange={(event) => update('institution', event.target.value)}
            />
            <TextField
              label="Cargo ou atuação"
              placeholder="Ex.: Pesquisadora em saúde coletiva"
              maxLength={120}
              value={form.roleTitle}
              onChange={(event) => update('roleTitle', event.target.value)}
            />
          </div>
        </div>
      </SetupCard>

      <SetupCard title="Participação na edição">
        <div className={styles.fields}>
          <div className={styles.row}>
            <Select
              label="Especialidade *"
              placeholder="Selecione a área de atuação"
              options={EVALUATOR_SPECIALTIES.map((item) => ({ value: item, label: item }))}
              value={form.specialty}
              error={errorFor('specialty')}
              onBlur={blur('specialty')}
              onChange={(event) => update('specialty', event.target.value)}
            />
            <Select
              label="Edição *"
              placeholder="Selecione a edição"
              options={editions
                .filter((item) => item.status !== 'CLOSED')
                .map((item) => ({ value: String(item.id), label: editionLabel(item, editions) }))}
              value={form.editionId}
              error={errorFor('editionId')}
              onBlur={blur('editionId')}
              onChange={(event) => update('editionId', event.target.value)}
            />
          </div>
          <Textarea
            label="Mensagem do convite"
            placeholder="Apresente a proposta de participação e o período de avaliação"
            maxLength={1000}
            value={form.message}
            onChange={(event) => update('message', event.target.value)}
          />
        </div>
        <Notice tone="info" title="Convite e atribuições">
          O cadastro envia o convite. Equipes e etapas poderão ser atribuídas após a confirmação da
          participação.
        </Notice>
        <div className={styles.actions}>
          <div className={styles.buttons}>
            <ButtonLink to={EVALUATORS_PATH} variant="secondary" size="large">
              Cancelar
            </ButtonLink>
            <Button type="submit" size="large" loading={invite.isPending}>
              {invite.isPending ? 'Enviando…' : 'Cadastrar e enviar convite'}
            </Button>
          </div>
          {submitError && (
            <p role="alert" className={styles.actionsError}>
              {submitError}
            </p>
          )}
          {submitted && Object.keys(errors).length > 0 && (
            <p role="alert" className={styles.actionsError}>
              Revise os campos destacados para enviar o convite.
            </p>
          )}
        </div>
      </SetupCard>

      <SetupFooter edition={selectedEdition} />
    </form>
  );
}
