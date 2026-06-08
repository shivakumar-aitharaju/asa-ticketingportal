import type { FastifyInstance } from 'fastify'
import { DataSource, Repository } from 'typeorm'
import { Notification, NotificationType } from '../entities/notification.entity'

interface CreateNotificationInput {
  userId: string
  ticketId?: string
  type: NotificationType
  title: string
  body: string
  metadata?: Record<string, any>
}

export class NotificationService {
  private repo: Repository<Notification>
  private fastify: FastifyInstance

  constructor(dataSource: DataSource, fastify: FastifyInstance) {
    this.repo = dataSource.getRepository(Notification)
    this.fastify = fastify
  }

  async create(input: CreateNotificationInput): Promise<Notification> {
    const notif = this.repo.create(input)
    const saved = await this.repo.save(notif)

    // Push real-time notification via Socket.IO
    try {
      this.fastify.io.to(`user:${input.userId}`).emit('notification:new', {
        id: saved.id,
        type: saved.type,
        title: saved.title,
        body: saved.body,
        ticketId: saved.ticketId,
        createdAt: saved.createdAt,
      })
    } catch {
      // non-fatal
    }

    return saved
  }

  async createBulk(inputs: CreateNotificationInput[]): Promise<void> {
    await Promise.all(inputs.map(i => this.create(i)))
  }

  async getForUser(userId: string, page = 1, limit = 30) {
    const [data, total] = await this.repo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    })

    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.repo.count({ where: { userId, isRead: false } })
  }

  async markRead(id: string, userId: string): Promise<void> {
    await this.repo.update({ id, userId }, { isRead: true, readAt: new Date() })
  }

  async markAllRead(userId: string): Promise<void> {
    await this.repo.update({ userId, isRead: false }, { isRead: true, readAt: new Date() })
  }
}
