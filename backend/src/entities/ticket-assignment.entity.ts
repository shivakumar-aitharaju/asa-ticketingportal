import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Ticket } from './ticket.entity'
import { User } from './user.entity'

@Entity('ticket_assignments')
@Index(['ticketId'])
@Index(['assignedToId'])
export class TicketAssignment {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'ticket_id' })
  ticketId!: string

  @ManyToOne(() => Ticket, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticket_id' })
  ticket!: Ticket

  @Column({ name: 'assigned_to_id' })
  assignedToId!: string

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'assigned_to_id' })
  assignedTo!: User

  @Column({ name: 'assigned_by_id' })
  assignedById!: string

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'assigned_by_id' })
  assignedBy!: User

  @Column({ type: 'timestamptz', nullable: true, name: 'unassigned_at' })
  unassignedAt?: Date | null

  @Column({ type: 'text', nullable: true })
  reason?: string | null

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt!: Date
}
