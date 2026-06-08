import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm'
import { BaseEntity } from './base.entity'
import { Priority } from '../types/priority.enum'
import { Department } from './department.entity'
import { Category } from './category.entity'

@Entity('sla_configurations')
export class SLAConfiguration extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name!: string

  @Column({ type: 'enum', enum: Priority })
  priority!: Priority

  @Column({ type: 'uuid', nullable: true, name: 'department_id' })
  departmentId?: string | null

  @ManyToOne(() => Department, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'department_id' })
  department?: Department | null

  @Column({ type: 'uuid', nullable: true, name: 'category_id' })
  categoryId?: string | null

  @ManyToOne(() => Category, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category?: Category | null

  // Minutes within business hours
  @Column({ type: 'int', name: 'first_response_minutes' })
  firstResponseMinutes!: number

  @Column({ type: 'int', name: 'resolution_minutes' })
  resolutionMinutes!: number

  @Column({ type: 'boolean', default: true, name: 'business_hours_only' })
  businessHoursOnly!: boolean

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean
}
