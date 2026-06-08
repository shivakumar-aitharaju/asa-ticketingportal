import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, OneToOne } from 'typeorm'
import { BaseEntity } from './base.entity'
import { TicketStatus } from '../types/ticket-status.enum'
import { Priority } from '../types/priority.enum'
import { User } from './user.entity'
import { Category } from './category.entity'
import { Department } from './department.entity'

@Entity('tickets')
@Index(['status'])
@Index(['priority'])
@Index(['departmentId'])
@Index(['assignedToId'])
@Index(['createdById'])
@Index(['createdAt'])
@Index(['isEscalated'])
export class Ticket extends BaseEntity {
  @Column({ type: 'varchar', length: 50, unique: true, name: 'ticket_number' })
  ticketNumber!: string

  @Column({ type: 'varchar', length: 500 })
  subject!: string

  @Column({ type: 'text' })
  description!: string

  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.Open })
  status!: TicketStatus

  @Column({ type: 'enum', enum: Priority, default: Priority.Medium })
  priority!: Priority

  @Column({ type: 'boolean', default: false, name: 'is_escalated' })
  isEscalated!: boolean

  @Column({ name: 'category_id' })
  categoryId!: string

  @ManyToOne(() => Category, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category!: Category

  @Column({ name: 'department_id' })
  departmentId!: string

  @ManyToOne(() => Department, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'department_id' })
  department!: Department

  @Column({ name: 'created_by_id' })
  createdById!: string

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by_id' })
  createdBy!: User

  @Column({ type: 'uuid', nullable: true, name: 'assigned_to_id' })
  assignedToId?: string | null

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_to_id' })
  assignedTo?: User | null

  @Column({ type: 'text', nullable: true, name: 'resolution_summary' })
  resolutionSummary?: string | null

  @Column({ type: 'timestamptz', nullable: true, name: 'resolved_at' })
  resolvedAt?: Date | null

  @Column({ type: 'timestamptz', nullable: true, name: 'closed_at' })
  closedAt?: Date | null

  @Column({ type: 'timestamptz', nullable: true, name: 'first_response_at' })
  firstResponseAt?: Date | null

  @Column({ type: 'simple-array', default: '', nullable: true })
  tags?: string[]

  @Column({ type: 'varchar', length: 10, nullable: true, name: 'client_rating' })
  clientRating?: 'good' | 'bad' | null

  @Column({ type: 'timestamptz', nullable: true, name: 'client_rated_at' })
  clientRatedAt?: Date | null
}
