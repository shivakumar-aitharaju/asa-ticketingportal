import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm'
import { BaseEntity } from './base.entity'
import { Ticket } from './ticket.entity'
import { User } from './user.entity'

@Entity('attachments')
@Index(['ticketId'])
export class Attachment extends BaseEntity {
  @Column({ name: 'ticket_id' })
  ticketId!: string

  @ManyToOne(() => Ticket, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticket_id' })
  ticket!: Ticket

  @Column({ type: 'uuid', nullable: true, name: 'message_id' })
  messageId?: string | null

  @Column({ name: 'uploaded_by_id' })
  uploadedById!: string

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'uploaded_by_id' })
  uploadedBy!: User

  @Column({ type: 'varchar', length: 500, name: 'file_name' })
  fileName!: string

  @Column({ type: 'varchar', length: 100, name: 'file_type' })
  fileType!: string

  @Column({ type: 'int', name: 'file_size' })
  fileSize!: number

  @Column({ type: 'varchar', length: 1024, name: 's3_key' })
  s3Key!: string

  @Column({ type: 'varchar', length: 255, name: 's3_bucket' })
  s3Bucket!: string
}
