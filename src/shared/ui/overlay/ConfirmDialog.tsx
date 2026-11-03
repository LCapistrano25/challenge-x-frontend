import { useState } from 'react';
import { Button } from '../Button/Button';
import { Modal } from './Modal';
import { Textarea } from '../forms/Textarea';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'primary' | 'danger';
  loading?: boolean;
  // Quando informado, exige uma justificativa (ex.: desclassificar equipe, ajuste pontual de nota).
  reason?: { label: string; placeholder?: string; minLength?: number };
  onConfirm: (reason?: string) => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'primary',
  loading = false,
  reason,
  onConfirm,
}: ConfirmDialogProps) {
  const [texto, setTexto] = useState('');
  const minimo = reason?.minLength ?? 1;
  const podeConfirmar = !reason || texto.trim().length >= minimo;

  function handleOpenChange(next: boolean) {
    if (!next) setTexto(''); // limpa ao fechar
    onOpenChange(next);
  }

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={() => handleOpenChange(false)} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            loading={loading}
            disabled={!podeConfirmar}
            onClick={() => onConfirm(reason ? texto.trim() : undefined)}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {reason && (
        <Textarea
          label={reason.label}
          placeholder={reason.placeholder}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          hint={minimo > 1 ? `Mínimo de ${minimo} caracteres.` : 'Campo obrigatório.'}
        />
      )}
    </Modal>
  );
}
