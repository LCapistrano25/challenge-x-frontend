import { IconDownload } from '@/shared/ui';
import { formatFileSize, formatSentAt } from '../lib/evaluation';
import type { DeliveryEvaluationDetail } from '../types';
import styles from './SubmittedMaterial.module.css';

/** Coluna da esquerda: arquivos enviados pela equipe e a mensagem que acompanha a entrega. */
export function SubmittedMaterial({ detail }: { detail: DeliveryEvaluationDetail }) {
  return (
    <div className={styles.stack}>
      <section className={styles.panel} aria-labelledby="material-title">
        <h2 id="material-title">Material submetido</h2>
        <p className={styles.muted}>
          Enviado por {detail.submitted_by}, líder da equipe, em {formatSentAt(detail.submitted_at)}
          .
        </p>
        {detail.files.map((file) => (
          <div key={file.id} className={styles.file}>
            <p>{file.name}</p>
            <p className={`${styles.muted} ${styles.small}`}>
              {file.type} • {formatFileSize(file.size_bytes)} • {file.role}
            </p>
            <a className={styles.download} href={file.download_url} download={file.name}>
              <IconDownload size={20} aria-hidden="true" />
              <span>
                Baixar arquivo<span className="sr-only">: {file.name}</span>
              </span>
            </a>
          </div>
        ))}
      </section>
      <section className={styles.panel} aria-labelledby="message-title">
        <h2 id="message-title">Mensagem da equipe</h2>
        <p className={styles.message}>
          {detail.team_message ? `“${detail.team_message}”` : 'A equipe não enviou mensagem.'}
        </p>
        <p className={`${styles.muted} ${styles.small}`}>
          {detail.member_count} integrantes • Líder atual: {detail.leader_name}
        </p>
      </section>
    </div>
  );
}
