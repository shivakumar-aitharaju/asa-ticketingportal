import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm'
import { BaseEntity } from './base.entity'
import { User } from './user.entity'
import { Ticket } from './ticket.entity'

export enum NotificationType {
  TicketCreated = 'ticket_created',
  TicketAssigned = 'ticket_assigned',
  TicketUpdated = 'ticket_updated',
  TicketReplied = 'ticket_replied',
  TicketResolved = 'ticket_resolved',
  TicketClosed = 'ticket_closed',
  TicketReopened = 'ticket_reopened',
  TicketEscalated = 'ticket_escalated',
  SLAAtRisk = 'sla_at_risk',
  SLABreached = 'sla_breached',
  InternalNote = 'internal_note',
  SystemAlert = 'system_alert',
}

@Entity('notifications')
@Index(['userId', 'isRead'])
@Index(['ticketId'])
@Index(['createdAt'])
export class Notification extends BaseEntity {
  @Column({ name: 'user_id' })
  userId!: string

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User

  @Column({ type: 'uuid', nullable: true, name: 'ticket_id' })
  ticketId?: string | null

  @ManyToOne(() => Ticket, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticket_id' })
  ticket?: Ticket | null

  @Column({ type: 'enum', enum: NotificationType })
  type!: NotificationType

  @Column({ type: 'varchar', length: 500 })
  title!: string

  @Column({ type: 'text' })
  body!: string

  @Column({ type: 'boolean', default: false, name: 'is_read' })
  isRead!: boolean

  @Column({ type: 'timestamptz', nullable: true, name: 'read_at' })
  readAt?: Date | null

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any> | null
}
