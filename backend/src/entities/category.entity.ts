import { Column, Entity, OneToMany } from 'typeorm'
import { BaseEntity } from './base.entity'

@Entity('categories')
export class Category extends BaseEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  name!: string

  @Column({ type: 'text', nullable: true })
  description?: string | null

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean
}
