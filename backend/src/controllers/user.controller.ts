import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { successResponse, paginatedResponse } from '../dtos/response.dto'
import { UserService } from '../services/user.service'
import { AuditService } from '../services/audit.service'
import { mask, userMaskConfig } from '../utils/mask'
import { CreateUserBody, UpdateUserBody, UpdateProfileBody, ResetUserPasswordBody } from '../schemas/user.schema'
import { UserRole } from '../types/user-role.enum'

export class UserController {
  private service: UserService
  private auditService: AuditService

  constructor(fastify: FastifyInstance) {
    this.service = new UserService(fastify.dataSource)
    this.auditService = new AuditService(fastify.dataSource)
  }

  async findAll(request: FastifyRequest<{ Querystring: { page?: number; limit?: number; search?: string; role?: UserRole; departmentId?: string } }>, reply: FastifyReply) {
    const { page = 1, limit = 25, search, role, departmentId } = request.query
    const result = await this.service.findAll(page, limit, search, role, departmentId)
    reply.send(paginatedResponse(result.data.map(u => mask(u, userMaskConfig)), result.pagination))
  }

  async findById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const user = await this.service.findById(request.params.id)
    reply.send(successResponse(mask(user, userMaskConfig)))
  }

  async create(request: FastifyRequest<{ Body: CreateUserBody }>, reply: FastifyReply) {
    const actor = request.user as { id: string }
    const user = await this.service.create(request.body)
    this.auditService.log({
      actorId: actor.id,
      action: 'USER_CREATED',
      resource: 'users',
      resourceId: user.id,
      newValue: { email: user.email, role: user.role },
    }).catch(() => {})
    reply.code(201).send(successResponse(mask(user, userMaskConfig), 'User created successfully'))
  }

  async update(request: FastifyRequest<{ Params: { id: string }; Body: UpdateUserBody }>, reply: FastifyReply) {
    const actor = request.user as { id: string }
    const user = await this.service.update(request.params.id, request.body)
    this.auditService.log({
      actorId: actor.id,
      action: 'USER_UPDATED',
      resource: 'users',
      resourceId: user.id,
      newValue: request.body,
    }).catch(() => {})
    reply.send(successResponse(mask(user, userMaskConfig), 'User updated'))
  }

  async resetPassword(request: FastifyRequest<{ Params: { id: string }; Body: ResetUserPasswordBody }>, reply: FastifyReply) {
    await this.service.resetPassword(request.params.id, request.body.password)
    reply.send(successResponse(null, 'Password reset successfully'))
  }

  async deactivate(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    await this.service.deactivate(request.params.id)
    reply.send(successResponse(null, 'User deactivated'))
  }

  async getProfile(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.user as { id: string }
    const user = await this.service.findById(id)
    reply.send(successResponse(mask(user, userMaskConfig)))
  }

  async updateProfile(request: FastifyRequest<{ Body: UpdateProfileBody }>, reply: FastifyReply) {
    const { id } = request.user as { id: string }
    const user = await this.service.updateProfile(id, request.body)
    reply.send(successResponse(mask(user, userMaskConfig), 'Profile updated'))
  }

  async getWorkload(request: FastifyRequest<{ Params: { departmentId: string } }>, reply: FastifyReply) {
    const workload = await this.service.getWorkload(request.params.departmentId)
    reply.send(successResponse(workload))
  }
}
