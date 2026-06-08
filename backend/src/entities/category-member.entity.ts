import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
} from 'typeorm'
import { User } from './user.entity'
import { Department } from './department.entity'

@Entity('category_members')
@Index(['categoryId'])
@Index(['userId'])
export class CategoryMember {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string

  @ManyToOne(() => User, { lazy: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User

  @Column({ type: 'uuid', name: 'category_id' })
  categoryId!: string

  @ManyToOne(() => Department, { lazy: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category!: Department

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date
}
