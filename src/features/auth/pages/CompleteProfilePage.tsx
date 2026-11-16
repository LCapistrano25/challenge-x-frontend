import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, type SyntheticEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Checkbox, MultiSelect, Select, Spinner, TextField } from '@/shared/ui';
import { fetchCourses, getProfileErrorMessage } from '../api/profile.api';
import {
  PERIODS,
  toStudentPayload,
  REGISTRATION_MAX_LENGTH,
  normalizeRegistration,
  toTeacherPayload,
  validateStudent,
  validateTeacher,
  type FormErrors,
  type StudentFormValues,
  type TeacherFormValues,
} from '../profile-validation';
import { ROLE_HOME } from '../roles';
import { useAuth } from '../useAuth';
import styles from './CompleteProfilePage.module.css';

const TERMS_PATH = '/termos';
const PRIVACY_PATH = '/privacidade';

/**
 * Primeiro acesso de aluno e professor depois do login Microsoft. O guard
 * `RequireProfilePending` garante que só chega aqui quem ainda não concluiu.
 */
export function CompleteProfilePage() {
  const { user } = useAuth();
  const coursesQuery = useQuery({
    queryKey: ['courses'],
    queryFn: fetchCourses,
    staleTime: 60_000,
  });

  const courseOptions = useMemo(
    () => (coursesQuery.data ?? []).map((course) => ({ value: course.id, label: course.name })),
    [coursesQuery.data],
  );

  const isTeacher = user?.role === 'TEACHER';

  return (
    <section className={styles.card} aria-labelledby="profile-title">
      <div className={styles.header}>
        <h1 id="profile-title">Preencher dados</h1>
        <p>
          {isTeacher
            ? 'Informe os cursos em que você atua para participar do Desafio X.'
            : 'Preencha seus dados acadêmicos para participar do Desafio X.'}
        </p>
      </div>
      <p className={styles.required}>Todos os campos são obrigatórios.</p>

      {coursesQuery.isLoading && <Spinner label="Carregando cursos…" />}
      {coursesQuery.isError && (
        <Alert
          tone="danger"
          title="Não foi possível carregar os cursos"
          action={
            <Button size="small" variant="secondary" onClick={() => coursesQuery.refetch()}>
              Tentar de novo
            </Button>
          }
        >
          Verifique sua conexão e tente novamente.
        </Alert>
      )}
      {coursesQuery.isSuccess &&
        (isTeacher ? (
          <TeacherForm courseOptions={courseOptions} />
        ) : (
          <StudentForm courseOptions={courseOptions} />
        ))}
    </section>
  );
}

type FormProps = { courseOptions: { value: string; label: string }[] };

function TermsLabel() {
  return (
    <>
      Aceito os{' '}
      <a href={TERMS_PATH} target="_blank" rel="noopener noreferrer">
        Termos de uso
      </a>{' '}
      e a{' '}
      <a href={PRIVACY_PATH} target="_blank" rel="noopener noreferrer">
        Política de privacidade
      </a>
      .
    </>
  );
}

function StudentForm({ courseOptions }: FormProps) {
  const { completeProfile } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState<StudentFormValues>({
    courseId: '',
    registration: '',
    period: '',
    acceptedTerms: false,
  });
  const [errors, setErrors] = useState<FormErrors<StudentFormValues>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof StudentFormValues>(key: K, value: StudentFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    const found = validateStudent(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await completeProfile(toStudentPayload(values));
      navigate(ROLE_HOME.STUDENT, { replace: true });
    } catch (error) {
      setSubmitError(getProfileErrorMessage(error));
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <Select
        label="Curso"
        placeholder="Selecione seu curso"
        options={courseOptions}
        value={values.courseId}
        error={errors.courseId}
        onChange={(event) => update('courseId', event.target.value)}
      />
      <div className={styles.row}>
        <TextField
          label="Matrícula"
          placeholder="Ex.: FC202601234"
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          maxLength={REGISTRATION_MAX_LENGTH}
          value={values.registration}
          error={errors.registration}
          onChange={(event) => update('registration', normalizeRegistration(event.target.value))}
        />
        <Select
          label="Período"
          placeholder="Selecione"
          options={PERIODS.map((period) => ({ value: String(period), label: `${period}º` }))}
          value={values.period}
          error={errors.period}
          onChange={(event) => update('period', event.target.value)}
        />
      </div>
      <Checkbox
        className={styles.terms}
        label={<TermsLabel />}
        checked={values.acceptedTerms}
        error={errors.acceptedTerms}
        onChange={(event) => update('acceptedTerms', event.target.checked)}
      />
      {submitError && (
        <p role="alert" className={styles.submitError}>
          {submitError}
        </p>
      )}
      <Button type="submit" size="large" fullWidth loading={submitting}>
        {submitting ? 'Salvando…' : 'Finalizar cadastro'}
      </Button>
    </form>
  );
}

function TeacherForm({ courseOptions }: FormProps) {
  const { completeProfile } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState<TeacherFormValues>({ courseIds: [], acceptedTerms: false });
  const [errors, setErrors] = useState<FormErrors<TeacherFormValues>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof TeacherFormValues>(key: K, value: TeacherFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    const found = validateTeacher(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await completeProfile(toTeacherPayload(values));
      navigate(ROLE_HOME.TEACHER, { replace: true });
    } catch (error) {
      setSubmitError(getProfileErrorMessage(error));
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <MultiSelect
        label="Cursos"
        placeholder="Selecione seus cursos"
        options={courseOptions}
        value={values.courseIds}
        error={errors.courseIds}
        onChange={(courseIds) => update('courseIds', courseIds)}
      />
      <Checkbox
        className={styles.terms}
        label={<TermsLabel />}
        checked={values.acceptedTerms}
        error={errors.acceptedTerms}
        onChange={(event) => update('acceptedTerms', event.target.checked)}
      />
      {submitError && (
        <p role="alert" className={styles.submitError}>
          {submitError}
        </p>
      )}
      <Button type="submit" size="large" fullWidth loading={submitting}>
        {submitting ? 'Salvando…' : 'Finalizar cadastro'}
      </Button>
    </form>
  );
}
