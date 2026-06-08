import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm'
import { BaseEntity } from './base.entity'
import { Ticket } from './ticket.entity'
import { User } from './user.entity'

@Entity('ticket_messages')
@Index(['ticketId'])
@Index(['authorId'])
export class TicketMessage extends BaseEntity {
  @Column({ name: 'ticket_id' })
  ticketId!: string

  @ManyToOne(() => Ticket, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticket_id' })
  ticket!: Ticket

  @Column({ name: 'author_id' })
  authorId!: string

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'author_id' })
  author!: User

  @Column({ type: 'text' })
  content!: string

  // false = internal note visible only to staff
  @Column({ type: 'boolean', default: true, name: 'is_client_facing' })
  isClientFacing!: boolean

  @Column({ type: 'timestamptz', nullable: true, name: 'edited_at' })
  editedAt?: Date | null
}
