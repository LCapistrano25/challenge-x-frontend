import { useId, useRef, useState, type DragEvent } from 'react';
import { cn } from '@/shared/lib/cn';
import { IconClose, IconFile, IconUpload } from '../icons';
import styles from './Dropzone.module.css';

export interface DropzoneProps {
  label: string;
  files: File[];
  onFilesChange: (files: File[]) => void;
  accept?: string; // ex.: ".pdf,.zip,image/*"
  multiple?: boolean;
  maxSizeMB?: number; // validação de usabilidade; o backend valida de novo
  hint?: string;
  error?: string;
  disabled?: boolean;
}

function aceita(file: File, accept?: string) {
  if (!accept) return true;
  return accept.split(',').some((t) => {
    const token = t.trim().toLowerCase();
    if (token.startsWith('.')) return file.name.toLowerCase().endsWith(token);
    if (token.endsWith('/*')) return file.type.startsWith(token.slice(0, -1));
    return file.type === token;
  });
}

function formatarTamanho(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function Dropzone({
  label,
  files,
  onFilesChange,
  accept,
  multiple = true,
  maxSizeMB,
  hint,
  error,
  disabled,
}: DropzoneProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [arrastando, setArrastando] = useState(false);
  const [erroLocal, setErroLocal] = useState<string>();

  function adicionar(lista: FileList | File[]) {
    const novos = Array.from(lista);
    const rejeitados: string[] = [];
    const validos = novos.filter((f) => {
      if (!aceita(f, accept)) {
        rejeitados.push(`${f.name}: formato não aceito`);
        return false;
      }
      if (maxSizeMB && f.size > maxSizeMB * 1024 * 1024) {
        rejeitados.push(`${f.name}: maior que ${maxSizeMB} MB`);
        return false;
      }
      return true;
    });
    setErroLocal(rejeitados.length ? rejeitados.join('. ') : undefined);
    const primeiroValido = validos[0];
    if (primeiroValido) {
      onFilesChange(multiple ? [...files, ...validos] : [primeiroValido]);
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setArrastando(false);
    if (!disabled) adicionar(e.dataTransfer.files);
  }

  const mensagemErro = error ?? erroLocal;

  return (
    <div className={styles.wrapper}>
      <span className={styles.label} id={`${id}-label`}>
        {label}
      </span>

      <div
        className={cn(
          styles.zone,
          arrastando && styles.active,
          mensagemErro && styles.invalid,
          disabled && styles.disabled,
        )}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setArrastando(true);
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={onDrop}
      >
        <IconUpload size={26} />
        <p className={styles.text}>
          Arraste os arquivos aqui ou{' '}
          <button
            type="button"
            className={styles.pick}
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            aria-describedby={`${id}-label`}
          >
            escolha no computador
          </button>
        </p>
        {hint && <p className={styles.hint}>{hint}</p>}
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          tabIndex={-1}
          onChange={(e) => {
            if (e.target.files) adicionar(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {mensagemErro && (
        <p role="alert" className={styles.error}>
          {mensagemErro}
        </p>
      )}

      {files.length > 0 && (
        <ul className={styles.list}>
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className={styles.item}>
              <IconFile size={18} />
              <span className={styles.name}>{f.name}</span>
              <span className={styles.size}>{formatarTamanho(f.size)}</span>
              <button
                type="button"
                className={styles.remove}
                aria-label={`Remover ${f.name}`}
                onClick={() => onFilesChange(files.filter((_, j) => j !== i))}
              >
                <IconClose size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
