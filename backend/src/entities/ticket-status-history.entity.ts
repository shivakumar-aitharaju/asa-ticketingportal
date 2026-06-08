import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { TicketStatus } from '../types/ticket-status.enum'
import { Ticket } from './ticket.entity'
import { User } from './user.entity'

@Entity('ticket_status_history')
@Index(['ticketId'])
export class TicketStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'ticket_id' })
  ticketId!: string

  @ManyToOne(() => Ticket, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticket_id' })
  ticket!: Ticket

  @Column({ type: 'enum', enum: TicketStatus, nullable: true, name: 'from_status' })
  fromStatus?: TicketStatus | null

  @Column({ type: 'enum', enum: TicketStatus, name: 'to_status' })
  toStatus!: TicketStatus

  @Column({ name: 'changed_by_id' })
  changedById!: string

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'changed_by_id' })
  changedBy!: User

  @Column({ type: 'text', nullable: true })
  reason?: string | null

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt!: Date
}
