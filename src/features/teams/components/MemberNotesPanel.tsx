import { useMemo, useState } from 'react';
import { Alert, Button, EmptyState, IconLock, Select, Spinner, TextField } from '@/shared/ui';
import { formatDateAtHour, formatShortDate } from '../lib/leadership';
import { useTeacherTeams, useTeamMemberNotes } from '../hooks/useTeacherMembers';
import type { MemberNote } from '../types';
import styles from '../pages/TeacherMembers.module.css';

/**
 * Observações sobre Integrantes (Figma: 05 - Professor › "Observações sobre Integrantes
 * (consulta)" / "Avaliar integrante"). Lista mestre-detalhe, somente leitura: o professor
 * escolhe a equipe e consulta as avaliações que a liderança registrou sobre cada integrante.
 * Exclusivo de professor do curso e admin (RF39).
 */
export function MemberNotesPanel() {
  const teamsQuery = useTeacherTeams();
  const [course, setCourse] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState<number | null>(null);

  const rows = useMemo(() => teamsQuery.data ?? [], [teamsQuery.data]);
  const courses = useMemo(() => [...new Set(rows.map((r) => r.challenge_course.name))], [rows]);
  const teams = useMemo(
    () =>
      teamsQuery.teams.filter(
        (team) =>
          !course || rows.some((r) => r.team.id === team.id && r.challenge_course.name === course),
      ),
    [teamsQuery.teams, rows, course],
  );

  const teamId = selectedTeam ?? teams[0]?.id ?? null;
  const notesQuery = useTeamMemberNotes(teamId ?? undefined);

  const notes = useMemo(() => {
    const term = query.trim().toLowerCase();
    return (notesQuery.data ?? []).filter(
      (note) => !term || note.member.name.toLowerCase().includes(term),
    );
  }, [notesQuery.data, query]);

  const selected = notes.find((n) => n.id === selectedNote) ?? notes[0] ?? null;
  const stageLabel = notes[0]?.stage_label;

  if (teamsQuery.isLoading) return <Spinner label="Carregando suas equipes…" />;
  if (teamsQuery.isError) {
    return (
      <Alert
        tone="danger"
        title="Não foi possível carregar suas equipes"
        action={
          <Button size="small" variant="secondary" onClick={() => void teamsQuery.refetch()}>
            Tentar de novo
          </Button>
        }
      >
        Verifique sua conexão e tente novamente.
      </Alert>
    );
  }

  if (teamsQuery.teams.length === 0) {
    return (
      <EmptyState
        title="Nenhuma equipe nos seus cursos"
        description="Quando houver equipes nos cursos em que você tem vínculo ativo, elas aparecerão aqui."
      />
    );
  }

  return (
    <>
      <div className={`${styles.banner} ${styles.info}`}>
        <IconLock size={20} className={styles.bannerIcon} aria-hidden="true" />
        <div className={styles.bannerText}>
          <p className={styles.bannerTitle}>
            Confidencial • Acesso exclusivo ao docente responsável pelo curso.
          </p>
          <p className={styles.bannerHint}>
            Estes registros não são exibidos aos integrantes. Esta tela permite somente leitura, sem
            inclusão, edição ou exclusão de observações.
          </p>
        </div>
      </div>

      <div className={styles.filters} role="search" aria-label="Filtrar observações">
        <Select
          label="Curso vinculado"
          value={course}
          onChange={(event) => {
            setCourse(event.target.value);
            setSelectedTeam(null);
          }}
          options={[
            { value: '', label: `Todos os cursos (${courses.length})` },
            ...courses.map((c) => ({ value: c, label: c })),
          ]}
        />
        <Select
          label="Equipe"
          value={teamId != null ? String(teamId) : ''}
          onChange={(event) => {
            setSelectedTeam(Number(event.target.value));
            setSelectedNote(null);
          }}
          options={teams.map((team) => ({
            value: String(team.id),
            label: `${team.name} (${team.code})`,
          }))}
        />
        <TextField
          label="Buscar integrante"
          type="search"
          placeholder="Nome do integrante..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className={styles.columns}>
        <section className={styles.card} aria-label="Observações registradas">
          <div className={styles.listHeader}>
            <h3 className={styles.listTitle}>Observações registradas</h3>
            <p className={styles.listSubtitle}>
              {notes.length} {notes.length === 1 ? 'registro' : 'registros'}
              {stageLabel ? ` • ${stageLabel}` : ''}
            </p>
          </div>

          {notesQuery.isLoading ? (
            <Spinner label="Carregando as avaliações…" />
          ) : notesQuery.isError ? (
            <Alert tone="danger" title="Não foi possível carregar as avaliações">
              Tente trocar de equipe ou recarregar a página.
            </Alert>
          ) : notes.length === 0 ? (
            <EmptyState
              title="Sem avaliações registradas"
              description="A liderança desta equipe ainda não avaliou a participação dos integrantes."
            />
          ) : (
            <ul className={styles.list}>
              {notes.map((note) => {
                const active = note.id === selected?.id;
                return (
                  <li key={note.id}>
                    <button
                      type="button"
                      className={`${styles.listRowButton}${active ? ` ${styles.rowSelected}` : ''}`}
                      aria-current={active}
                      onClick={() => setSelectedNote(note.id)}
                    >
                      <div className={styles.rowHead}>
                        <span className={styles.rowName}>{note.member.name}</span>
                        <span className={styles.caption}>{formatShortDate(note.created_at)}</span>
                      </div>
                      <p className={styles.rowMeta}>
                        {note.team?.name ?? ''}
                        {note.author ? ` • Líder: ${note.author.name}` : ''}
                      </p>
                      {note.summary && <p className={styles.rowMeta}>{note.summary}</p>}
                      <span className={styles.rowLink}>
                        {active ? 'Registro selecionado' : 'Ler observação'}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {selected ? (
          <ConfidentialNote note={selected} />
        ) : (
          <section className={styles.card}>
            <p className={styles.emptyDetail}>
              Selecione uma observação à esquerda para ver o registro completo.
            </p>
          </section>
        )}
      </div>
    </>
  );
}

function ConfidentialNote({ note }: { note: MemberNote }) {
  return (
    <section className={`${styles.card} ${styles.detail}`} aria-label="Observação confidencial">
      <div className={styles.detailHead}>
        <p className={styles.detailKicker}>Observação confidencial</p>
        <span className={`${styles.tag} ${styles.tagInfo}`}>Somente leitura</span>
      </div>

      <div>
        <h3 className={styles.detailTitle}>{note.member.name}</h3>
        {(note.team || note.project) && (
          <p className={styles.detailMeta}>
            {[note.team?.name, note.project].filter(Boolean).join(' • ')}
          </p>
        )}
        {(note.course || note.semester) && (
          <p className={styles.detailMeta}>
            {[note.course, note.semester ? `Semestre ${note.semester}` : null]
              .filter(Boolean)
              .join(' • ')}
          </p>
        )}
      </div>

      <div className={styles.decided}>
        <p className={styles.rowMeta}>
          <span className={styles.rowMetaStrong}>Registrado por: {note.author.name}</span>
          {note.author_role_label ? ` • ${note.author_role_label}` : ''}
        </p>
        <p className={styles.caption}>
          {formatDateAtHour(note.created_at)}
          {note.stage_label ? ` • ${note.stage_label}` : ''}
        </p>
      </div>

      <h4 className={styles.sectionTitle}>Registro do líder</h4>
      <p className={styles.quote}>{note.content}</p>

      <p className={styles.caption}>
        Use estas informações apenas no acompanhamento acadêmico. O conteúdo original do líder é
        preservado nesta consulta.
      </p>
    </section>
  );
}
