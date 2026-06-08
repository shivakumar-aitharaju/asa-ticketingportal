import { Column, Entity, Index, ManyToOne, JoinColumn, OneToMany } from 'typeorm'
import { BaseEntity } from './base.entity'
import { UserRole } from '../types/user-role.enum'
import { Department } from './department.entity'

@Entity('users')
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string

  @Column({ type: 'varchar', length: 255 })
  password!: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  firstName?: string | null

  @Column({ type: 'varchar', length: 255, nullable: true })
  lastName?: string | null

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string | null

  @Column({ type: 'enum', enum: UserRole, default: UserRole.Client })
  role!: UserRole

  @Column({ type: 'uuid', nullable: true, name: 'department_id' })
  departmentId?: string | null

  @ManyToOne(() => Department, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'department_id' })
  department?: Department | null

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean

  @Column({ type: 'boolean', default: false, name: 'is_email_verified' })
  isEmailVerified!: boolean

  @Column({ type: 'int', default: 0, name: 'failed_login_attempts' })
  failedLoginAttempts!: number

  @Column({ type: 'timestamptz', nullable: true, name: 'locked_until' })
  lockedUntil?: Date | null

  @Column({ type: 'timestamptz', nullable: true, name: 'last_login_at' })
  lastLoginAt?: Date | null

  @Column({ type: 'varchar', length: 1024, nullable: true, name: 'avatar_url' })
  avatarUrl?: string | null

  @Column({ type: 'jsonb', default: '{}', name: 'notification_prefs' })
  notificationPrefs!: Record<string, any>

  get fullName(): string {
    return [this.firstName, this.lastName].filter(Boolean).join(' ') || this.email
  }
}
