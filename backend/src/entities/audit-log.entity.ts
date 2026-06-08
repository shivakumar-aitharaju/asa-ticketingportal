import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { User } from './user.entity'

@Entity('audit_logs')
@Index(['actorId'])
@Index(['resource', 'resourceId'])
@Index(['action'])
@Index(['createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid', nullable: true, name: 'actor_id' })
  actorId?: string | null

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actor_id' })
  actor?: User | null

  @Column({ type: 'varchar', length: 100 })
  action!: string

  @Column({ type: 'varchar', length: 100 })
  resource!: string

  @Column({ type: 'uuid', nullable: true, name: 'resource_id' })
  resourceId?: string | null

  @Column({ type: 'jsonb', nullable: true, name: 'old_value' })
  oldValue?: Record<string, any> | null

  @Column({ type: 'jsonb', nullable: true, name: 'new_value' })
  newValue?: Record<string, any> | null

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'ip_address' })
  ipAddress?: string | null

  @Column({ type: 'text', nullable: true, name: 'user_agent' })
  userAgent?: string | null

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any> | null

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt!: Date
}
