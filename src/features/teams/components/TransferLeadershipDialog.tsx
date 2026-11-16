import { useState } from 'react';
import { Button, Modal, Select, notify } from '@/shared/ui';
import { useTransferLeadership } from '../hooks/useMyTeam';
import { describeMyTeamError } from '../lib/my-team';
import type { TeamMember } from '../types';
import styles from './MyTeam.module.css';

export interface TransferLeadershipDialogProps {
  teamId: number;
  /** Integrantes que podem receber a liderança (todos menos o líder atual). */
  candidates: TeamMember[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransferred?: () => void;
}

/** "Transferir liderança" (RF27): POST /api/teams/{id}/leadership-transfer { member_id }. */
export function TransferLeadershipDialog({
  teamId,
  candidates,
  open,
  onOpenChange,
  onTransferred,
}: TransferLeadershipDialogProps) {
  const [memberId, setMemberId] = useState('');
  const transfer = useTransferLeadership(teamId);

  function handleOpenChange(next: boolean) {
    if (!next) setMemberId('');
    onOpenChange(next);
  }

  function handleConfirm() {
    const target = candidates.find((member) => String(member.id) === memberId);
    if (!target) return;
    transfer.mutate(target.id, {
      onSuccess: () => {
        notify.success(`${target.student.name} agora é líder da equipe.`);
        handleOpenChange(false);
        onTransferred?.();
      },
      onError: (error) =>
        notify.error(describeMyTeamError(error, 'Não foi possível transferir a liderança.')),
    });
  }

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title="Transferir liderança"
      description="Você passará a ser participante e o novo líder será notificado."
      size="sm"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => handleOpenChange(false)}
            disabled={transfer.isPending}
          >
            Cancelar
          </Button>
          <Button onClick={handleConfirm} loading={transfer.isPending} disabled={!memberId}>
            Transferir
          </Button>
        </>
      }
    >
      <div className={styles.dialogBody}>
        <Select
          label="Novo líder"
          placeholder="Selecione um integrante"
          options={candidates.map((member) => ({
            value: String(member.id),
            label: `${member.student.name} · ${member.student.course.name}`,
          }))}
          value={memberId}
          onChange={(event) => setMemberId(event.target.value)}
        />
      </div>
    </Modal>
  );
}
