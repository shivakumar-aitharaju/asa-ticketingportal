import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Category } from './category.entity'
import { Department } from './department.entity'

@Entity('category_department_mappings')
@Index(['categoryId', 'departmentId'], { unique: true })
export class CategoryDepartmentMapping {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'category_id' })
  categoryId!: string

  @ManyToOne(() => Category, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category!: Category

  @Column({ name: 'department_id' })
  departmentId!: string

  @ManyToOne(() => Department, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'department_id' })
  department!: Department

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt!: Date
}
