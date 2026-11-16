import { useEffect, useState, type ChangeEvent, type SyntheticEvent } from 'react';
import { Button, Input } from '@/shared/ui';
import { http } from '@/shared/lib/http';

type AccountType = 'STUDENT' | 'TEACHER';
type FieldErrors = Record<string, string>;

type Course = {
  id: number;
  name: string;
  slug: string;
};

export function RegisterPage() {
  const [accountType, setAccountType] = useState<AccountType>('STUDENT');
  const [name, setName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [email, setEmail] = useState('');
  const [courseId, setCourseId] = useState('');
  const [courseIds, setCourseIds] = useState<number[]>([]);
  const [period, setPeriod] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseError, setCourseError] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [created, setCreated] = useState(false);

  useEffect(() => {
    async function loadCourses() {
      try {
        const { data } = await http.get<Course[]>('/api/courses');
        setCourses(data);
        setCourseError('');
      } catch {
        setCourseError('Não foi possível carregar os cursos. Tente novamente mais tarde.');
      }
    }

    void loadCourses();
  }, []);

  const passwordRules = [
    { label: 'Pelo menos 8 caracteres', valid: password.length >= 8 },
    { label: 'Uma letra maiúscula', valid: /[A-Z]/.test(password) },
    { label: 'Uma letra minúscula', valid: /[a-z]/.test(password) },
    { label: 'Um número', valid: /[0-9]/.test(password) },
  ];

  const passwordIsValid = passwordRules.every((rule) => rule.valid);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  function clearError(field: string) {
    setErrors((current) => {
      const updated = { ...current };
      delete updated[field];
      return updated;
    });
  }

  function handleTeacherCourses(event: ChangeEvent<HTMLSelectElement>) {
    const selected = Array.from(event.target.selectedOptions).map((option) => Number(option.value));

    setCourseIds(selected);
    clearError('courses');
  }

  function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    const newErrors: FieldErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Informe seu nome completo.';
    }

    if (!email.trim()) {
      newErrors.email = 'Informe seu e-mail.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Informe um e-mail válido.';
    }

    if (accountType === 'STUDENT') {
      if (!registrationNumber.trim()) {
        newErrors.registrationNumber = 'Informe sua matrícula.';
      }

      if (!courseId) {
        newErrors.courseId = 'Selecione seu curso.';
      }

      const periodNumber = Number(period);

      if (!period.trim()) {
        newErrors.period = 'Informe seu período.';
      } else if (!Number.isInteger(periodNumber) || periodNumber < 1) {
        newErrors.period = 'Informe um período válido.';
      }
    }

    if (accountType === 'TEACHER' && courseIds.length === 0) {
      newErrors.courses = 'Selecione pelo menos um curso.';
    }

    if (!password) {
      newErrors.password = 'Informe sua senha.';
    } else if (!passwordIsValid) {
      newErrors.password = 'A senha não atende a todos os requisitos.';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirme sua senha.';
    } else if (!passwordsMatch) {
      newErrors.confirmPassword = 'As senhas não coincidem.';
    }

    if (!acceptedTerms) {
      newErrors.terms = 'Você precisa aceitar os termos de uso.';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    // Simulação de sucesso: ainda não realiza cadastro na API real.
    setCreated(true);
  }

  if (created) {
    return (
      <section className="auth-card" aria-live="polite">
        <h1>Conta criada com sucesso!</h1>
        <p>
          Seu formulário foi validado. A integração com o serviço de cadastro será realizada quando
          a API estiver disponível.
        </p>
        <Button type="button" onClick={() => window.location.assign('/login')}>
          Voltar para o login
        </Button>
      </section>
    );
  }

  return (
    <section className="auth-card">
      <h1>Criar sua conta</h1>
      <p>Preencha seus dados para continuar.</p>

      <form onSubmit={handleSubmit} noValidate>
        <label>
          Tipo de conta
          <select
            value={accountType}
            onChange={(event) => {
              setAccountType(event.target.value as AccountType);
              setErrors({});
            }}
            required
          >
            <option value="STUDENT">Acadêmico</option>
            <option value="TEACHER">Professor</option>
          </select>
        </label>

        <label>
          Nome completo
          <Input
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              clearError('name');
            }}
            autoComplete="name"
            required
            invalid={!!errors.name}
          />
        </label>
        {errors.name && <p role="alert">{errors.name}</p>}

        <label>
          E-mail
          <Input
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              clearError('email');
            }}
            autoComplete="email"
            required
            invalid={!!errors.email}
          />
        </label>
        {errors.email && <p role="alert">{errors.email}</p>}

        {accountType === 'STUDENT' && (
          <>
            <label>
              Matrícula
              <Input
                value={registrationNumber}
                onChange={(event) => {
                  setRegistrationNumber(event.target.value);
                  clearError('registrationNumber');
                }}
                required
                invalid={!!errors.registrationNumber}
              />
            </label>
            {errors.registrationNumber && <p role="alert">{errors.registrationNumber}</p>}

            <label>
              Curso
              <select
                value={courseId}
                onChange={(event) => {
                  setCourseId(event.target.value);
                  clearError('courseId');
                }}
                required
              >
                <option value="">Selecione seu curso</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </label>
            {errors.courseId && <p role="alert">{errors.courseId}</p>}
          </>
        )}

        {accountType === 'TEACHER' && (
          <label>
            Cursos em que leciona
            <select multiple value={courseIds.map(String)} onChange={handleTeacherCourses} required>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
            <small>Segure Ctrl para selecionar mais de um curso.</small>
            {errors.courses && <p role="alert">{errors.courses}</p>}
          </label>
        )}

        {courseError && <p role="alert">{courseError}</p>}

        {accountType === 'STUDENT' && (
          <>
            <label>
              Período
              <Input
                type="number"
                min="1"
                step="1"
                value={period}
                onChange={(event) => {
                  setPeriod(event.target.value);
                  clearError('period');
                }}
                required
                invalid={!!errors.period}
              />
            </label>
            {errors.period && <p role="alert">{errors.period}</p>}
          </>
        )}

        <label>
          Senha
          <Input
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              clearError('password');
            }}
            autoComplete="new-password"
            required
            invalid={!!errors.password}
          />
        </label>

        <div>
          <strong>Requisitos da senha:</strong>
          {passwordRules.map((rule) => (
            <p key={rule.label} style={{ margin: '4px 0' }}>
              <span aria-hidden="true">{rule.valid ? '✓' : '○'}</span> {rule.label}
            </p>
          ))}
        </div>
        {errors.password && <p role="alert">{errors.password}</p>}

        <label>
          Confirmar senha
          <Input
            type="password"
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              clearError('confirmPassword');
            }}
            autoComplete="new-password"
            required
            invalid={!!errors.confirmPassword}
          />
        </label>
        {errors.confirmPassword && <p role="alert">{errors.confirmPassword}</p>}

        <label>
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(event) => {
              setAcceptedTerms(event.target.checked);
              clearError('terms');
            }}
          />
          Li e aceito os termos de uso.
        </label>
        {errors.terms && <p role="alert">{errors.terms}</p>}

        <Button type="submit">Criar conta</Button>
      </form>

      <p>
        Já possui uma conta? <a href="/login">Entrar</a>
      </p>
    </section>
  );
}
