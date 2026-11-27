import { useId, useRef, useState, type DragEvent, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { Button, IconFile, IconUpload } from '@/shared/ui';
import { INVITATION_STATUS_LABEL } from '../../lib/evaluators';
import { REGULATION_STATUS_LABEL, formatFileSize, validatePdfFile } from '../../lib/regulations';
import type { InvitationStatus, RegulationStatus } from '../../types';
import { Notice } from './SetupParts';
import styles from './Registry.module.css';

type PillTone = 'warning' | 'success' | 'muted' | 'danger';
const PILL_CLASS: Record<PillTone, string | undefined> = {
  warning: styles.pillWarning,
  success: styles.pillSuccess,
  muted: styles.pillMuted,
  danger: styles.pillDanger,
};

export function Pill({ tone, children }: { tone: PillTone; children: ReactNode }) {
  return <span className={cn(styles.pill, PILL_CLASS[tone])}>{children}</span>;
}

const REGULATION_TONE: Record<RegulationStatus, PillTone> = {
  DRAFT: 'warning',
  PUBLISHED: 'success',
  SUPERSEDED: 'muted',
};

export const RegulationStatusPill = ({ status }: { status: RegulationStatus }) => (
  <Pill tone={REGULATION_TONE[status]}>{REGULATION_STATUS_LABEL[status]}</Pill>
);

const INVITATION_TONE: Record<InvitationStatus, PillTone> = {
  PENDING: 'warning',
  ACCEPTED: 'success',
  DECLINED: 'danger',
};

export const InvitationPill = ({ status }: { status: InvitationStatus }) => (
  <Pill tone={INVITATION_TONE[status]}>{INVITATION_STATUS_LABEL[status]}</Pill>
);

/**
 * Anexo do edital (Figma: "Anexo em PDF"): arrastar e soltar ou selecionar um único PDF de até
 * 10 MB. O arquivo é validado antes de ser aceito; a última rejeição fica visível.
 */
export function PdfUpload({
  file,
  currentName,
  currentSize,
  error,
  disabled,
  onChange,
}: {
  file: File | null;
  /** PDF já salvo na minuta (mantido quando nenhum arquivo novo é escolhido). */
  currentName?: string;
  currentSize?: number;
  error?: string;
  disabled?: boolean;
  onChange: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hintId = useId();
  const [dragging, setDragging] = useState(false);
  const [rejected, setRejected] = useState<{ name: string; reason: string } | null>(null);

  async function accept(candidate: File | undefined) {
    if (!candidate) return;
    const reason = await validatePdfFile(candidate);
    if (reason) {
      setRejected({ name: candidate.name, reason });
      onChange(null);
      return;
    }
    setRejected(null);
    onChange(candidate);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    const files = event.dataTransfer.files;
    if (files.length > 1) {
      setRejected({
        name: `${files.length} arquivos`,
        reason: 'Envie um arquivo por versão. Nenhum arquivo foi anexado.',
      });
      return;
    }
    void accept(files[0]);
  }

  const shownName = file?.name ?? currentName;
  const shownSize = file?.size ?? currentSize;

  return (
    <>
      <div
        className={cn(styles.upload, dragging && styles.uploadActive)}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <IconUpload size={32} className={styles.uploadIcon} />
        <p className={styles.uploadText}>Arraste o PDF para esta área ou selecione um arquivo</p>
        <Button
          type="button"
          variant="secondary"
          disabled={disabled}
          aria-describedby={hintId}
          onClick={() => inputRef.current?.click()}
        >
          {shownName ? 'Substituir PDF' : 'Selecionar PDF'}
        </Button>
        <p id={hintId} className={styles.uploadCaption}>
          Formato PDF • Até 10 MB • Um arquivo por versão
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          hidden
          aria-label="Arquivo do edital em PDF"
          data-testid="regulation-file"
          onChange={(event) => {
            void accept(event.target.files?.[0]);
            event.target.value = '';
          }}
        />
      </div>

      {shownName && (
        <div className={styles.fileRow}>
          <IconFile size={20} className={styles.uploadIcon} />
          <span>
            <strong>{shownName}</strong>
            {shownSize !== undefined && (
              <span className={styles.fileMeta}>
                {' '}
                • {formatFileSize(shownSize)}
                {file ? ' • pronto para envio' : ' • anexo atual'}
              </span>
            )}
          </span>
          {file && (
            <Button type="button" variant="ghost" size="small" onClick={() => onChange(null)}>
              Remover
            </Button>
          )}
        </div>
      )}

      {rejected && (
        <Notice tone="danger" title={`Arquivo rejeitado na última tentativa: ${rejected.name}`}>
          {rejected.reason}
        </Notice>
      )}
      {error && !rejected && !shownName && (
        <p role="alert" className={styles.fieldError}>
          {error}
        </p>
      )}
    </>
  );
}
