import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne } from 'typeorm'
import { BaseEntity } from './base.entity'
import { Ticket } from './ticket.entity'
import { SLAConfiguration } from './sla-configuration.entity'

export enum SLAStatus {
  OnTrack = 'on_track',
  AtRisk = 'at_risk',
  Breached = 'breached',
  Met = 'met',
}

@Entity('sla_tracking')
@Index(['status'])
@Index(['resolutionDue'])
export class SLATracking extends BaseEntity {
  @Column({ name: 'ticket_id', unique: true })
  ticketId!: string

  @OneToOne(() => Ticket, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticket_id' })
  ticket!: Ticket

  @Column({ name: 'sla_config_id' })
  slaConfigId!: string

  @ManyToOne(() => SLAConfiguration, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sla_config_id' })
  slaConfig!: SLAConfiguration

  @Column({ type: 'timestamptz', name: 'first_response_due' })
  firstResponseDue!: Date

  @Column({ type: 'timestamptz', name: 'resolution_due' })
  resolutionDue!: Date

  @Column({ type: 'boolean', nullable: true, name: 'first_response_met' })
  firstResponseMet?: boolean | null

  @Column({ type: 'timestamptz', nullable: true, name: 'first_response_at' })
  firstResponseAt?: Date | null

  @Column({ type: 'boolean', nullable: true, name: 'resolution_met' })
  resolutionMet?: boolean | null

  @Column({ type: 'timestamptz', nullable: true, name: 'resolved_at' })
  resolvedAt?: Date | null

  @Column({ type: 'enum', enum: SLAStatus, default: SLAStatus.OnTrack })
  status!: SLAStatus

  @Column({ type: 'timestamptz', nullable: true, name: 'paused_at' })
  pausedAt?: Date | null

  @Column({ type: 'int', default: 0, name: 'total_paused_minutes' })
  totalPausedMinutes!: number

  @Column({ type: 'timestamptz', nullable: true, name: 'breach_notified_at' })
  breachNotifiedAt?: Date | null
}
