import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { successResponse } from '../dtos/response.dto'
import { DepartmentService } from '../services/department.service'
import { CreateDepartmentBody, UpdateDepartmentBody, MapCategoryBody } from '../schemas/department.schema'

export class DepartmentController {
  private service: DepartmentService

  constructor(fastify: FastifyInstance) {
    this.service = new DepartmentService(fastify.dataSource)
  }

  async findAll(_request: FastifyRequest, reply: FastifyReply) {
    const departments = await this.service.findAll()
    reply.send(successResponse(departments))
  }

  async findById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const dept = await this.service.findById(request.params.id)
    reply.send(successResponse(dept))
  }

  async create(request: FastifyRequest<{ Body: CreateDepartmentBody }>, reply: FastifyReply) {
    const dept = await this.service.create(request.body)
    reply.code(201).send(successResponse(dept, 'Department created'))
  }

  async update(request: FastifyRequest<{ Params: { id: string }; Body: UpdateDepartmentBody }>, reply: FastifyReply) {
    const dept = await this.service.update(request.params.id, request.body)
    reply.send(successResponse(dept, 'Department updated'))
  }

  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    await this.service.softDelete(request.params.id)
    reply.send(successResponse(null, 'Department deleted'))
  }

  async mapCategory(request: FastifyRequest<{ Params: { id: string }; Body: MapCategoryBody }>, reply: FastifyReply) {
    await this.service.mapCategory(request.params.id, request.body.categoryId)
    reply.send(successResponse(null, 'Category mapped to department'))
  }

  async unmapCategory(request: FastifyRequest<{ Params: { id: string; categoryId: string } }>, reply: FastifyReply) {
    await this.service.unmapCategory(request.params.id, request.params.categoryId)
    reply.send(successResponse(null, 'Category removed from department'))
  }

  async getCategories(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const categories = await this.service.getCategories(request.params.id)
    reply.send(successResponse(categories))
  }

  async getMembers(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const members = await this.service.getMembers(request.params.id)
    reply.send(successResponse(members))
  }

  async addMember(
    request: FastifyRequest<{ Params: { id: string }; Body: { userId: string } }>,
    reply: FastifyReply
  ) {
    await this.service.addMember(request.params.id, request.body.userId)
    reply.code(201).send(successResponse(null, 'Member added to category'))
  }

  async removeMember(
    request: FastifyRequest<{ Params: { id: string; userId: string } }>,
    reply: FastifyReply
  ) {
    await this.service.removeMember(request.params.id, request.params.userId)
    reply.send(successResponse(null, 'Member removed from category'))
  }
}
