import { Link } from 'react-router-dom';
import { cn } from '@/shared/lib/cn';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui';
import { ACTION_LABEL, STATUS_NOTE, deliveryPath, formatSubmission } from '../lib/delivery-view';
import type { TeacherDelivery } from '../types';
import { StatusBadge } from './StatusBadge';
import styles from './DeliveriesTable.module.css';

interface DeliveriesTableProps {
  deliveries: TeacherDelivery[];
  /** Total sem filtros, para o rodapé "Exibindo X de Y". */
  total: number;
}

export function DeliveriesTable({ deliveries, total }: DeliveriesTableProps) {
  return (
    <div>
      <Table caption="Entregas dos projetos dos seus cursos">
        <TableHead>
          <TableRow>
            <TableHeader>Projeto / equipe</TableHeader>
            <TableHeader>Curso</TableHeader>
            <TableHeader>Etapa / envio</TableHeader>
            <TableHeader>Status da entrega</TableHeader>
            <TableHeader>Ação</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {deliveries.map((delivery) => (
            <TableRow
              key={delivery.id}
              className={cn(delivery.status === 'PENDING_EVALUATION' && styles.pending)}
            >
              <TableCell>
                <span className={styles.primary}>{delivery.project_name}</span>
                <span className={styles.meta}>{delivery.team_name}</span>
              </TableCell>
              <TableCell>{delivery.course}</TableCell>
              <TableCell>
                <span className={styles.primary}>Etapa {delivery.stage}</span>
                <span className={styles.meta}>{formatSubmission(delivery.submitted_at)}</span>
              </TableCell>
              <TableCell>
                <StatusBadge status={delivery.status} />
                <span className={styles.meta}>{STATUS_NOTE[delivery.status]}</span>
              </TableCell>
              <TableCell>
                <Link to={deliveryPath(delivery)} className={styles.action}>
                  {ACTION_LABEL[delivery.status]}
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className={styles.count}>
        Exibindo {deliveries.length} de {total} projetos • Ordenados por prioridade de avaliação
      </p>
    </div>
  );
}
