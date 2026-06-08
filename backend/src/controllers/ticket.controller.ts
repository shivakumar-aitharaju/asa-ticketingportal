import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { successResponse, paginatedResponse } from '../dtos/response.dto'
import { TicketService } from '../services/ticket.service'
import { UserRole } from '../types/user-role.enum'
import {
  CreateTicketBody, UpdateTicketBody, AssignTicketBody,
  ResolveTicketBody, EscalateTicketBody, ReopenTicketBody,
  AddMessageBody, TicketFilter, RatingBody
} from '../schemas/ticket.schema'
import { AttachmentService } from '../services/attachment.service'

export class TicketController {
  private service: TicketService
  private attachments: AttachmentService

  constructor(fastify: FastifyInstance) {
    this.service = new TicketService(fastify.dataSource, fastify)
    this.attachments = new AttachmentService(fastify.dataSource)
  }

  private getUser(request: FastifyRequest) {
    return request.user as { id: string; role: UserRole; departmentId?: string | null }
  }

  async create(request: FastifyRequest<{ Body: CreateTicketBody }>, reply: FastifyReply) {
    const { id } = this.getUser(request)
    const ticket = await this.service.create(request.body, id)
    reply.code(201).send(successResponse(ticket, 'Ticket raised successfully'))
  }

  async findAll(request: FastifyRequest<{ Querystring: TicketFilter }>, reply: FastifyReply) {
    const { id, role, departmentId } = this.getUser(request)
    const result = await this.service.findAll(request.query, id, role, departmentId)
    reply.send(paginatedResponse(result.data, result.pagination))
  }

  async findById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id: userId, role, departmentId } = this.getUser(request)
    const ticket = await this.service.findById(request.params.id, userId, role, departmentId)
    reply.send(successResponse(ticket))
  }

  async getMessages(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id: userId, role, departmentId } = this.getUser(request)
    const messages = await this.service.getMessages(request.params.id, userId, role, departmentId)
    reply.send(successResponse(messages))
  }

  async addMessage(request: FastifyRequest<{ Params: { id: string }; Body: AddMessageBody }>, reply: FastifyReply) {
    const { id: userId, role, departmentId } = this.getUser(request)
    const msg = await this.service.addMessage(request.params.id, request.body, userId, role, departmentId)
    reply.code(201).send(successResponse(msg, 'Message sent'))
  }

  async assign(request: FastifyRequest<{ Params: { id: string }; Body: AssignTicketBody }>, reply: FastifyReply) {
    const { id: userId, role, departmentId } = this.getUser(request)
    const ticket = await this.service.assign(request.params.id, request.body, userId, role, departmentId)
    reply.send(successResponse(ticket, 'Ticket assigned'))
  }

  async resolve(request: FastifyRequest<{ Params: { id: string }; Body: ResolveTicketBody }>, reply: FastifyReply) {
    const { id: userId, role, departmentId } = this.getUser(request)
    const ticket = await this.service.resolve(request.params.id, request.body, userId, role, departmentId)
    reply.send(successResponse(ticket, 'Ticket resolved'))
  }

  async close(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id: userId, role, departmentId } = this.getUser(request)
    await this.service.close(request.params.id, userId, role, departmentId)
    reply.send(successResponse(null, 'Ticket closed'))
  }

  async reopen(request: FastifyRequest<{ Params: { id: string }; Body: ReopenTicketBody }>, reply: FastifyReply) {
    const { id: userId, role, departmentId } = this.getUser(request)
    const ticket = await this.service.reopen(request.params.id, request.body, userId, role, departmentId)
    reply.send(successResponse(ticket, 'Ticket reopened'))
  }

  async escalate(request: FastifyRequest<{ Params: { id: string }; Body: EscalateTicketBody }>, reply: FastifyReply) {
    const { id: userId, role, departmentId } = this.getUser(request)
    await this.service.escalate(request.params.id, request.body, userId, role, departmentId)
    reply.send(successResponse(null, 'Ticket escalated'))
  }

  async getHistory(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id: userId, role, departmentId } = this.getUser(request)
    await this.service.findById(request.params.id, userId, role, departmentId)
    const history = await this.service.getHistory(request.params.id)
    reply.send(successResponse(history))
  }

  async getSLA(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id: userId, role, departmentId } = this.getUser(request)
    await this.service.findById(request.params.id, userId, role, departmentId)
    const sla = await this.service.getSLATracking(request.params.id)
    reply.send(successResponse(sla))
  }

  async clientResolve(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id: userId } = this.getUser(request)
    const ticket = await this.service.clientResolve(request.params.id, userId)
    reply.send(successResponse(ticket, 'Ticket marked as resolved'))
  }

  async rateTicket(request: FastifyRequest<{ Params: { id: string }; Body: RatingBody }>, reply: FastifyReply) {
    const { id: userId } = this.getUser(request)
    await this.service.rateTicket(request.params.id, request.body.rating, userId)
    reply.send(successResponse(null, 'Rating submitted'))
  }

  async listAttachments(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id: userId, role, departmentId } = this.getUser(request)
    await this.service.findById(request.params.id, userId, role, departmentId)
    const attachments = await this.attachments.listForTicket(request.params.id)
    reply.send(successResponse(attachments))
  }

  async uploadAttachment(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id: userId, role, departmentId } = this.getUser(request)
    await this.service.findById(request.params.id, userId, role, departmentId)
    const file = await request.file()
    if (!file) return reply.code(400).send({ error: { message: 'No file uploaded', statusCode: 400 } })
    const attachment = await this.attachments.upload(request.params.id, userId, file)
    reply.code(201).send(successResponse(attachment, 'Attachment uploaded'))
  }

  async getAttachmentUrl(request: FastifyRequest<{ Params: { id: string; attachmentId: string } }>, reply: FastifyReply) {
    const { id: userId } = this.getUser(request)
    const url = await this.attachments.getDownloadUrl(request.params.attachmentId, userId)
    reply.send(successResponse({ url }))
  }

  async serveAttachmentFile(request: FastifyRequest<{ Params: { id: string; attachmentId: string } }>, reply: FastifyReply) {
    const { buffer, fileName, fileType } = await this.attachments.serveLocalFile(request.params.attachmentId)
    reply.header('Content-Type', fileType).header('Content-Disposition', `attachment; filename="${fileName}"`).send(buffer)
  }

  async deleteAttachment(request: FastifyRequest<{ Params: { id: string; attachmentId: string } }>, reply: FastifyReply) {
    const { id: userId } = this.getUser(request)
    await this.attachments.delete(request.params.attachmentId, userId)
    reply.send(successResponse(null, 'Attachment deleted'))
  }
}
