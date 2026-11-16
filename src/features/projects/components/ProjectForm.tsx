import { useId, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Button, Checkbox, Input, Select, notify } from '@/shared/ui';
import { cn } from '@/shared/lib/cn';
import { useRegisterProject, useSaveProjectDraft } from '../hooks/useProjectRegistration';
import {
  PROJECT_SUMMARY_MAX,
  PROJECT_TEXT_MAX,
  PROJECT_TITLE_MAX,
  describeFillStatus,
  describeProjectError,
  firstInvalidField,
  hasDraftContent,
  isFormationClosedError,
  projectErrorField,
  toCategoryOptions,
  toProjectDraft,
  toProjectWrite,
  toSdgOptions,
  validateProjectDraft,
  validateProjectForm,
  type ProjectFormErrors,
  type ProjectFormValues,
} from '../lib/project-registration';
import type { Project, ProjectOptions } from '../types';
import styles from './ProjectRegistration.module.css';

export interface ProjectFormProps {
  teamId: number;
  options: ProjectOptions;
  /** Valores iniciais (rascunho salvo ou formulário vazio). */
  initialValues: ProjectFormValues;
  /** Quando o último rascunho foi salvo. */
  savedAt?: string | null;
  /** Bloqueia o preenchimento (ex.: prazo de cadastro encerrado). */
  disabled?: boolean;
  onRegistered: (project: Project) => void;
  /** A API respondeu formation_closed: a página passa a mostrar o prazo encerrado. */
  onFormationClosed?: () => void;
}

interface FieldProps {
  id: string;
  label: string;
  value: string;
  error?: string;
  hint?: string;
  maxLength?: number;
  required?: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
}

interface TextFieldProps extends FieldProps {
  type?: 'text' | 'email' | 'url';
  placeholder?: string;
}

/** Orientação ou erro abaixo do campo, com o contador à direita quando há limite. */
function FieldFooter({
  id,
  error,
  hint,
  maxLength,
  length,
}: {
  id: string;
  error?: string;
  hint?: string;
  maxLength?: number;
  length: number;
}) {
  const message: ReactNode = error ? (
    <p id={id} role="alert" className={styles.fieldError}>
      {error}
    </p>
  ) : hint ? (
    <p id={id} className={styles.caption}>
      {hint}
    </p>
  ) : null;

  if (!maxLength) return message;
  return (
    <div className={styles.fieldFooter}>
      {message ?? <span />}
      <span className={styles.counter} aria-live="polite">
        {length}/{maxLength}
      </span>
    </div>
  );
}

const describedBy = (id: string, props: Pick<FieldProps, 'error' | 'hint'>) =>
  props.error || props.hint ? id : undefined;

/** Campo de uma linha do Figma ("Entrada" 48px). */
function TextField({
  id,
  label,
  value,
  error,
  hint,
  maxLength,
  type = 'text',
  placeholder,
  required = false,
  disabled,
  onChange,
}: TextFieldProps) {
  const messageId = `${id}-message`;
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <Input
        id={id}
        type={type}
        inputSize="large"
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        invalid={Boolean(error)}
        aria-describedby={describedBy(messageId, { error, hint })}
        aria-required={required || undefined}
        disabled={disabled}
      />
      <FieldFooter
        id={messageId}
        error={error}
        hint={hint}
        maxLength={maxLength}
        length={value.length}
      />
    </div>
  );
}

/** Texto longo do Figma ("Entrada" 96px), com o mesmo rodapé e contador do campo de uma linha. */
function TextAreaField({
  id,
  label,
  value,
  error,
  hint,
  maxLength,
  required = false,
  disabled,
  onChange,
}: FieldProps) {
  const messageId = `${id}-message`;
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <textarea
        id={id}
        rows={3}
        value={value}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        className={cn('input', styles.textarea, error && 'input--invalid')}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(messageId, { error, hint })}
        aria-required={required || undefined}
        disabled={disabled}
      />
      <FieldFooter
        id={messageId}
        error={error}
        hint={hint}
        maxLength={maxLength}
        length={value.length}
      />
    </div>
  );
}

/**
 * Figma: "Dados do projeto" (551:12241). "Salvar rascunho" guarda o preenchimento sem concluir a
 * inscrição; "Cadastrar projeto" valida tudo e conclui o cadastro (PUT /api/teams/{id}/project).
 */
export function ProjectForm({
  teamId,
  options,
  initialValues,
  savedAt,
  disabled = false,
  onRegistered,
  onFormationClosed,
}: ProjectFormProps) {
  const [values, setValues] = useState<ProjectFormValues>(initialValues);
  const [errors, setErrors] = useState<ProjectFormErrors>({});
  const saveDraft = useSaveProjectDraft(teamId);
  const register = useRegisterProject(teamId);
  const titleId = useId();
  const baseId = useId();
  const fieldId = (field: keyof ProjectFormValues) => `${baseId}-${field}`;

  const categoryOptions = useMemo(() => toCategoryOptions(options.categories), [options]);
  const sdgOptions = useMemo(() => toSdgOptions(options.challenges), [options]);
  const busy = saveDraft.isPending || register.isPending;
  const locked = disabled || busy;

  function update<K extends keyof ProjectFormValues>(key: K, value: ProjectFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function showErrors(found: ProjectFormErrors) {
    setErrors(found);
    const first = firstInvalidField(found);
    if (first) document.getElementById(fieldId(first))?.focus();
  }

  function handleApiError(error: unknown, fallback: string) {
    if (isFormationClosedError(error)) onFormationClosed?.();
    const field = projectErrorField(error);
    const message = describeProjectError(error, fallback);
    if (field) showErrors({ [field]: message });
    else notify.error(message);
  }

  function handleSaveDraft() {
    if (locked) return;
    if (!hasDraftContent(values)) {
      notify.error('Preencha ao menos um campo para salvar o rascunho.');
      return;
    }
    const found = validateProjectDraft(values);
    if (Object.keys(found).length > 0) {
      showErrors(found);
      return;
    }
    setErrors({});
    saveDraft.mutate(toProjectDraft(values), {
      onSuccess: () =>
        notify.success('Rascunho salvo. Para participar, finalize em Cadastrar projeto.'),
      onError: (error) => handleApiError(error, 'Não foi possível salvar o rascunho.'),
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked) return;
    const found = validateProjectForm(values);
    if (Object.keys(found).length > 0) {
      showErrors(found);
      return;
    }
    register.mutate(toProjectWrite(values), {
      onSuccess: (project) => {
        notify.success('Projeto cadastrado. Agora a equipe já pode acompanhar as etapas.');
        onRegistered(project);
      },
      onError: (error) => handleApiError(error, 'Não foi possível cadastrar o projeto.'),
    });
  }

  return (
    <section className={styles.card} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.cardTitle}>
        Dados do projeto
      </h2>
      <p className={styles.text}>
        Campos com * são obrigatórios. Os dados podem ser editados após o cadastro.
      </p>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <fieldset className={styles.form} disabled={disabled}>
          <TextField
            id={fieldId('title')}
            label="Título do projeto *"
            value={values.title}
            onChange={(value) => update('title', value)}
            error={errors.title}
            hint="Use um título claro e objetivo. Até 100 caracteres."
            maxLength={PROJECT_TITLE_MAX}
            required
          />

          <div className={styles.row}>
            <Select
              id={fieldId('categoryId')}
              className={styles.field}
              label="Eixo temático *"
              placeholder="Selecione o eixo temático"
              options={categoryOptions}
              value={values.categoryId}
              onChange={(event) => update('categoryId', event.target.value)}
              error={errors.categoryId}
              aria-required="true"
            />
            <Select
              id={fieldId('challengeId')}
              className={styles.field}
              label="Objetivo de Desenvolvimento Sustentável *"
              placeholder="Selecione a ODS"
              options={sdgOptions}
              value={values.challengeId}
              onChange={(event) => update('challengeId', event.target.value)}
              error={errors.challengeId}
              aria-required="true"
            />
          </div>

          <TextAreaField
            id={fieldId('summary')}
            label="Resumo da proposta *"
            hint="Apresente a solução e seu impacto esperado. Até 1.000 caracteres."
            maxLength={PROJECT_SUMMARY_MAX}
            value={values.summary}
            onChange={(value) => update('summary', value)}
            error={errors.summary}
            required
          />

          <div className={styles.row}>
            <TextAreaField
              id={fieldId('problem')}
              label="Problema identificado *"
              maxLength={PROJECT_TEXT_MAX}
              value={values.problem}
              onChange={(value) => update('problem', value)}
              error={errors.problem}
              required
            />
            <TextAreaField
              id={fieldId('objective')}
              label="Objetivo geral *"
              maxLength={PROJECT_TEXT_MAX}
              value={values.objective}
              onChange={(value) => update('objective', value)}
              error={errors.objective}
              required
            />
          </div>

          <TextAreaField
            id={fieldId('methodology')}
            label="Metodologia e plano de desenvolvimento *"
            hint="Descreva como a equipe pretende pesquisar, desenvolver e validar a solução."
            maxLength={PROJECT_TEXT_MAX}
            value={values.methodology}
            onChange={(value) => update('methodology', value)}
            error={errors.methodology}
            required
          />

          <div className={styles.row}>
            <TextField
              id={fieldId('targetAudience')}
              label="Público beneficiado *"
              value={values.targetAudience}
              onChange={(value) => update('targetAudience', value)}
              error={errors.targetAudience}
              required
            />
            <TextField
              id={fieldId('location')}
              label="Local de aplicação *"
              value={values.location}
              onChange={(value) => update('location', value)}
              error={errors.location}
              required
            />
          </div>

          <div className={styles.row}>
            <TextField
              id={fieldId('advisorName')}
              label="Docente orientadora (opcional)"
              value={values.advisorName}
              onChange={(value) => update('advisorName', value)}
              error={errors.advisorName}
            />
            <TextField
              id={fieldId('advisorEmail')}
              type="email"
              label="E-mail da orientadora"
              value={values.advisorEmail}
              onChange={(value) => update('advisorEmail', value)}
              error={errors.advisorEmail}
            />
          </div>

          <TextField
            id={fieldId('referenceUrl')}
            type="url"
            label="Link de referência (opcional)"
            placeholder="https://"
            value={values.referenceUrl}
            onChange={(value) => update('referenceUrl', value)}
            error={errors.referenceUrl}
            hint="Repositório, pesquisa inicial ou material complementar da proposta."
          />

          <div className={styles.divider} />

          <Checkbox
            id={fieldId('accepted')}
            className={styles.declaration}
            label="Declaro que os integrantes revisaram a proposta e estão de acordo com o regulamento e com o uso acadêmico dos dados do projeto."
            checked={values.accepted}
            onChange={(event) => update('accepted', event.target.checked)}
            error={errors.accepted}
          />

          <div className={styles.actions}>
            <p className={styles.caption} aria-live="polite">
              {describeFillStatus(savedAt)}
            </p>
            <div className={styles.buttons}>
              <Button
                variant="secondary"
                size="large"
                className={styles.action}
                onClick={handleSaveDraft}
                loading={saveDraft.isPending}
                disabled={register.isPending}
              >
                Salvar rascunho
              </Button>
              <Button
                type="submit"
                size="large"
                className={styles.action}
                loading={register.isPending}
                disabled={saveDraft.isPending}
              >
                Cadastrar projeto
              </Button>
            </div>
          </div>
        </fieldset>
      </form>
    </section>
  );
}
