import { Column, Entity, OneToMany } from 'typeorm'
import { BaseEntity } from './base.entity'

@Entity('departments')
export class Department extends BaseEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  name!: string

  @Column({ type: 'text', nullable: true })
  description?: string | null

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean
}
