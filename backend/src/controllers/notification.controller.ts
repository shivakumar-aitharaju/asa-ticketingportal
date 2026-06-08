import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { successResponse } from '../dtos/response.dto'
import { NotificationService } from '../services/notification.service'

export class NotificationController {
  private service: NotificationService

  constructor(fastify: FastifyInstance) {
    this.service = new NotificationService(fastify.dataSource, fastify)
  }

  private getUser(request: FastifyRequest) {
    return request.user as { id: string }
  }

  async findAll(request: FastifyRequest<{ Querystring: { page?: number; limit?: number } }>, reply: FastifyReply) {
    const { id } = this.getUser(request)
    const { page = 1, limit = 30 } = request.query
    const result = await this.service.getForUser(id, page, limit)
    reply.send(result)
  }

  async getUnreadCount(request: FastifyRequest, reply: FastifyReply) {
    const { id } = this.getUser(request)
    const count = await this.service.getUnreadCount(id)
    reply.send(successResponse({ count }))
  }

  async markRead(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id: userId } = this.getUser(request)
    await this.service.markRead(request.params.id, userId)
    reply.send(successResponse(null, 'Marked as read'))
  }

  async markAllRead(request: FastifyRequest, reply: FastifyReply) {
    const { id: userId } = this.getUser(request)
    await this.service.markAllRead(userId)
    reply.send(successResponse(null, 'All notifications marked as read'))
  }
}
