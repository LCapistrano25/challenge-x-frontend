import { useId, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import type { DeliverableField } from '@/features/projects';
import { Button } from '@/shared/ui';
import { cn } from '@/shared/lib/cn';
import { acceptAttribute, describeFileRule, describeSelectedFile } from '../lib/submission';
import { IconFileReady, IconRemoveCircle, IconUploadArrow } from './icons';
import styles from './Delivery.module.css';

export interface FileUploadFieldProps {
  field: DeliverableField;
  file: File | null;
  error?: string;
  /** Rótulo visível só quando a etapa pede mais de um arquivo. */
  showLabel?: boolean;
  disabled?: boolean;
  onChange: (file: File | null) => void;
}

/**
 * Figma: "Upload de arquivo" (586:7747) — área para arrastar ou selecionar, arquivo selecionado
 * com "Remover" e "Substituir arquivo". Formato e tamanho são validados pela página.
 */
export function FileUploadField({
  field,
  file,
  error,
  showLabel = false,
  disabled = false,
  onChange,
}: FileUploadFieldProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  function pick(list: FileList | null) {
    const chosen = list?.[0];
    if (chosen) onChange(chosen);
  }

  function handleInput(event: ChangeEvent<HTMLInputElement>) {
    pick(event.target.files);
    // Permite escolher o mesmo arquivo de novo depois de remover.
    event.target.value = '';
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (!disabled) pick(event.dataTransfer.files);
  }

  return (
    <div className={styles.fieldGroup}>
      <label htmlFor={id} className={showLabel ? styles.label : 'sr-only'}>
        {field.label}
        {field.required ? ' *' : ' (opcional)'}
      </label>
      <div
        className={cn(
          styles.dropzone,
          dragging && styles.dropzoneActive,
          error && styles.dropzoneInvalid,
        )}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <div className={styles.dropzoneRow}>
          <IconUploadArrow />
          <p className={`${styles.text} ${styles.strong}`}>
            Arraste um arquivo ou selecione no computador
          </p>
          <Button
            variant="secondary"
            size="large"
            className={styles.action}
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            aria-describedby={hintId}
          >
            {file ? 'Substituir arquivo' : 'Selecionar arquivo'}
          </Button>
        </div>
        <p id={hintId} className={styles.caption}>
          {describeFileRule(field)}
        </p>
        <input
          ref={inputRef}
          id={id}
          type="file"
          className="sr-only"
          accept={acceptAttribute(field)}
          onChange={handleInput}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : hintId}
          tabIndex={-1}
        />
      </div>

      {error && (
        <p id={errorId} role="alert" className={styles.error}>
          {error}
        </p>
      )}

      {file && (
        <div className={styles.fileRow}>
          <IconFileReady />
          <div className={styles.fileInfo}>
            <p className={`${styles.text} ${styles.strong}`}>{file.name}</p>
            <p className={styles.caption}>{describeSelectedFile(file)}</p>
          </div>
          <span className={styles.remove}>
            <IconRemoveCircle />
            <Button
              variant="ghost"
              size="large"
              className={styles.action}
              onClick={() => onChange(null)}
              disabled={disabled}
              aria-label={`Remover ${file.name}`}
            >
              Remover
            </Button>
          </span>
        </div>
      )}
    </div>
  );
}
