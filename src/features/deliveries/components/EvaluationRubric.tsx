import { Input } from '@/shared/ui';
import { formatScore } from '../lib/evaluation';
import type { EvaluationCriterion } from '../types';
import styles from './EvaluationRubric.module.css';

interface EvaluationRubricProps {
  criteria: EvaluationCriterion[];
  /** Texto digitado em cada nota (chave = id do critério). */
  values: Record<string, string>;
  errors: Record<string, string>;
  readOnly: boolean;
  onChange: (criterionId: string, value: string) => void;
}

/** Rubrica da etapa: critério, nota máxima e campo de nota (somente leitura depois de publicada). */
export function EvaluationRubric({
  criteria,
  values,
  errors,
  readOnly,
  onChange,
}: EvaluationRubricProps) {
  return (
    <div className={styles.box}>
      <table className={styles.table}>
        <caption className="sr-only">Critérios de avaliação da etapa</caption>
        <thead>
          <tr>
            <th scope="col">Critério</th>
            <th scope="col" className={styles.max}>
              Máximo
            </th>
            <th scope="col" className={styles.score}>
              Nota
            </th>
          </tr>
        </thead>
        <tbody>
          {criteria.map((criterion) => (
            <tr key={criterion.id}>
              <td>
                <span className={styles.name}>{criterion.name}</span>
                <span className={styles.description}>{criterion.description}</span>
              </td>
              <td>{formatScore(criterion.max_score)}</td>
              <td>
                <Input
                  className={styles.input}
                  inputMode="decimal"
                  autoComplete="off"
                  aria-label={`Nota: ${criterion.name}`}
                  value={values[criterion.id] ?? ''}
                  readOnly={readOnly}
                  invalid={Boolean(errors[criterion.id])}
                  onChange={(event) => onChange(criterion.id, event.target.value)}
                />
                {errors[criterion.id] && (
                  <p role="alert" className={styles.error}>
                    {errors[criterion.id]}
                  </p>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
