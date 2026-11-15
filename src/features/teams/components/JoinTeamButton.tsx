import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button, ConfirmDialog, notify } from '@/shared/ui';
import { cn } from '@/shared/lib/cn';
import {
  availableTeamsKey,
  useCancelJoinRequest,
  useCreateJoinRequest,
} from '../hooks/useTeamFormation';
import { describeTeamError, isTeamStateConflict } from '../lib/team-formation';
import type { JoinRequest, TeamListing } from '../types';
import styles from './FindTeam.module.css';

export interface JoinTeamButtonProps {
  team: Pick<TeamListing, 'id' | 'name' | 'available_slots'>;
  /** Solicitação PENDING do aluno para esta equipe, se houver. */
  pendingRequest?: JoinRequest;
  /** Prazo fora da formação ou aluno já em equipe. */
  blocked?: boolean;
  className?: string;
}

/**
 * Estados do Figma: "Solicitar entrada" (primário) e "Solicitação enviada" (secundário).
 * A solicitação pendente pode ser cancelada; equipe lotada não aceita novas solicitações.
 */
export function JoinTeamButton({
  team,
  pendingRequest,
  blocked = false,
  className,
}: JoinTeamButtonProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const queryClient = useQueryClient();
  const createRequest = useCreateJoinRequest();
  const cancelRequest = useCancelJoinRequest();

  function handleRequest() {
    createRequest.mutate(team.id, {
      onSuccess: () => notify.success(`Solicitação enviada para ${team.name}.`),
      onError: (error) => {
        notify.error(describeTeamError(error, 'Não foi possível enviar a solicitação.'));
        // Vagas ou prazo mudaram desde a última busca: atualiza a lista.
        if (isTeamStateConflict(error))
          void queryClient.invalidateQueries({ queryKey: availableTeamsKey });
      },
    });
  }

  function handleCancel() {
    if (!pendingRequest) return;
    cancelRequest.mutate(pendingRequest.id, {
      onSuccess: () => {
        notify.info(`Solicitação para ${team.name} cancelada.`);
        setConfirmOpen(false);
      },
      onError: (error) => {
        notify.error(describeTeamError(error, 'Não foi possível cancelar a solicitação.'));
        setConfirmOpen(false);
      },
    });
  }

  if (pendingRequest) {
    return (
      <>
        <Button
          variant="secondary"
          size="large"
          className={cn(styles.action, className)}
          onClick={() => setConfirmOpen(true)}
          aria-label={`Solicitação enviada para ${team.name}. Cancelar solicitação`}
        >
          Solicitação enviada
        </Button>
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="Cancelar solicitação?"
          description={`A liderança de ${team.name} deixará de ver o seu pedido de entrada. Você pode solicitar de novo enquanto houver vagas.`}
          confirmLabel="Cancelar solicitação"
          cancelLabel="Manter"
          tone="danger"
          loading={cancelRequest.isPending}
          onConfirm={handleCancel}
        />
      </>
    );
  }

  if (team.available_slots <= 0) {
    return (
      <Button size="large" className={cn(styles.action, className)} disabled>
        Equipe completa
      </Button>
    );
  }

  return (
    <Button
      size="large"
      className={cn(styles.action, className)}
      onClick={handleRequest}
      loading={createRequest.isPending}
      disabled={blocked}
      aria-label={`Solicitar entrada em ${team.name}`}
    >
      Solicitar entrada
    </Button>
  );
}
