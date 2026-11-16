import { useId } from 'react';
import { Avatar, ButtonLink } from '@/shared/ui';
import type { Team } from '@/features/teams';
import { describeTeamComposition } from '../lib/project-registration';
import styles from './ProjectRegistration.module.css';

const TIPS = [
  {
    title: 'Definam um problema real',
    text: 'Contextualizem a necessidade e quem será beneficiado.',
  },
  {
    title: 'Conectem a proposta a um ODS',
    text: 'Escolham o objetivo mais alinhado ao impacto esperado.',
  },
  {
    title: 'Planejem uma solução viável',
    text: 'Considerem os recursos e o cronograma da edição.',
  },
];

/** Figma: "Equipe responsável" (551:12323). */
export function ResponsibleTeamCard({ team }: { team: Team }) {
  const titleId = useId();
  const leader = team.members.find((member) => member.role === 'LEADER');
  const composition = describeTeamComposition(
    team.members.map((member) => member.student.course.name),
    team.members.length,
  );

  return (
    <section className={styles.card} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.cardTitle}>
        Equipe responsável
      </h2>
      <p className={styles.teamName}>{team.name}</p>
      <span className={styles.tag}>Não cadastrado</span>
      {leader && (
        <div className={styles.person}>
          <Avatar name={leader.student.name} tone="pink" />
          <div className={styles.personText}>
            <span className={styles.personName}>{leader.student.name}</span>
            <span className={styles.personMeta}>Líder · Responsável pelo cadastro</span>
          </div>
        </div>
      )}
      <p className={styles.text}>{composition}</p>
      <p className={styles.text}>
        Equipe formada. Apenas a liderança pode finalizar o cadastro do projeto.
      </p>
      <ButtonLink
        to="/academico/equipe"
        variant="ghost"
        size="large"
        className={`${styles.action} ${styles.ghost}`}
      >
        Ver minha equipe
      </ButtonLink>
    </section>
  );
}

/** Figma: "Antes de cadastrar" (551:12340). */
export function BeforeRegisteringCard() {
  const titleId = useId();
  return (
    <section className={styles.card} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.cardTitle}>
        Antes de cadastrar
      </h2>
      <ul className={styles.tips}>
        {TIPS.map((tip) => (
          <li key={tip.title} className={styles.tip}>
            <span className={styles.tipTitle}>{tip.title}</span>
            <span className={styles.tipText}>{tip.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Figma: faixa "Prazo de cadastro: 15/03/2027" (551:12351). */
export function DeadlineCard({ deadline }: { deadline: string | null }) {
  return (
    <div className={styles.deadline}>
      <p className={styles.deadlineTitle}>
        {deadline
          ? `Prazo de cadastro: ${deadline}`
          : 'Prazo de cadastro: durante a formação das equipes'}
      </p>
      <p>
        Após cadastrar, a equipe terá acesso às etapas, aos envios e ao acompanhamento das entregas.
      </p>
    </div>
  );
}

/** Figma: "Precisa de orientação?" (551:12354). O guia fica na Central de ajuda. */
export function GuidanceCard() {
  const titleId = useId();
  return (
    <section className={styles.card} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.cardTitle}>
        Precisa de orientação?
      </h2>
      <p className={styles.text}>
        Consulte os critérios de avaliação e o guia para elaborar sua proposta.
      </p>
      <ButtonLink
        to="/academico/duvidas"
        variant="ghost"
        size="large"
        className={`${styles.action} ${styles.ghost}`}
      >
        Abrir guia do projeto
      </ButtonLink>
    </section>
  );
}
