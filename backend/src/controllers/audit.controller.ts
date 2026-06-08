import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { successResponse } from '../dtos/response.dto'
import { AuditService } from '../services/audit.service'

export class AuditController {
  private service: AuditService

  constructor(fastify: FastifyInstance) {
    this.service = new AuditService(fastify.dataSource)
  }

  async getAll(
    req: FastifyRequest<{ Querystring: { page?: number; limit?: number; resource?: string; action?: string } }>,
    rep: FastifyReply
  ) {
    const { page = 1, limit = 50, resource, action } = req.query
    const result = await this.service.getAll(Number(page), Number(limit), resource, action)
    rep.send(result)
  }

  async getForResource(
    req: FastifyRequest<{ Params: { resource: string; resourceId: string } }>,
    rep: FastifyReply
  ) {
    const { resource, resourceId } = req.params
    const data = await this.service.getForResource(resource, resourceId)
    rep.send(successResponse(data))
  }
}
