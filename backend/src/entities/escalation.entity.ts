import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm'
import { BaseEntity } from './base.entity'
import { Ticket } from './ticket.entity'
import { User } from './user.entity'

export enum EscalationStatus {
  Active = 'active',
  Resolved = 'resolved',
  Closed = 'closed',
}

@Entity('escalations')
@Index(['ticketId'])
@Index(['status'])
export class Escalation extends BaseEntity {
  @Column({ name: 'ticket_id' })
  ticketId!: string

  @ManyToOne(() => Ticket, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticket_id' })
  ticket!: Ticket

  @Column({ name: 'escalated_by_id' })
  escalatedById!: string

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'escalated_by_id' })
  escalatedBy!: User

  @Column({ type: 'uuid', nullable: true, name: 'escalated_to_id' })
  escalatedToId?: string | null

  @Column({ type: 'text' })
  reason!: string

  @Column({ type: 'int', default: 1 })
  level!: number

  @Column({ type: 'enum', enum: EscalationStatus, default: EscalationStatus.Active })
  status!: EscalationStatus

  @Column({ type: 'timestamptz', nullable: true, name: 'resolved_at' })
  resolvedAt?: Date | null

  @Column({ type: 'uuid', nullable: true, name: 'resolved_by_id' })
  resolvedById?: string | null

  @Column({ type: 'text', nullable: true, name: 'resolution_note' })
  resolutionNote?: string | null
}
