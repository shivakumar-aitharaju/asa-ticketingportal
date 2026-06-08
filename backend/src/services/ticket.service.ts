import type { FastifyInstance } from 'fastify'
import { DataSource, Repository, IsNull, Not } from 'typeorm'
import { Ticket } from '../entities/ticket.entity'
import { TicketMessage } from '../entities/ticket-message.entity'
import { TicketStatusHistory } from '../entities/ticket-status-history.entity'
import { TicketAssignment } from '../entities/ticket-assignment.entity'
import { Escalation, EscalationStatus } from '../entities/escalation.entity'
import { TicketStatus } from '../types/ticket-status.enum'
import { UserRole } from '../types/user-role.enum'
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors'
import { generateTicketNumber } from '../utils/ticket-number'
import { DepartmentService } from './department.service'
import { SLAService } from './sla.service'
import { NotificationService } from './notification.service'
import { AuditService } from './audit.service'
import { NotificationType } from '../entities/notification.entity'
import {
  CreateTicketBody, UpdateTicketBody, AssignTicketBody,
  ResolveTicketBody, EscalateTicketBody, ReopenTicketBody,
  AddMessageBody, TicketFilter
} from '../schemas/ticket.schema'

export class TicketService {
  private ticketRepo: Repository<Ticket>
  private messageRepo: Repository<TicketMessage>
  private historyRepo: Repository<TicketStatusHistory>
  private assignmentRepo: Repository<TicketAssignment>
  private escalationRepo: Repository<Escalation>
  private deptService: DepartmentService
  private slaService: SLAService
  private notifService: NotificationService
  private auditService: AuditService

  constructor(dataSource: DataSource, fastify: FastifyInstance) {
    this.ticketRepo = dataSource.getRepository(Ticket)
    this.messageRepo = dataSource.getRepository(TicketMessage)
    this.historyRepo = dataSource.getRepository(TicketStatusHistory)
    this.assignmentRepo = dataSource.getRepository(TicketAssignment)
    this.escalationRepo = dataSource.getRepository(Escalation)
    this.deptService = new DepartmentService(dataSource)
    this.slaService = new SLAService(dataSource)
    this.notifService = new NotificationService(dataSource, fastify)
    this.auditService = new AuditService(dataSource)
  }

  async create(data: CreateTicketBody, createdById: string): Promise<Ticket> {
    let resolvedDepartmentId: string

    if (data.categoryId) {
      const department = await this.deptService.getDepartmentForCategory(data.categoryId)
      if (!department) throw new ValidationError('No department is mapped to this category. Contact your admin.')
      resolvedDepartmentId = department.id
    } else if (data.departmentId) {
      resolvedDepartmentId = data.departmentId
    } else {
      throw new ValidationError('Either categoryId or departmentId is required')
    }

    const ticketNumber = await generateTicketNumber(this.ticketRepo.manager.connection)

    const ticket = this.ticketRepo.create({
      subject: data.subject,
      description: data.description,
      categoryId: data.categoryId ?? undefined,
      priority: data.priority,
      isEscalated: data.isEscalated ?? false,
      tags: data.tags ?? [],
      ticketNumber,
      createdById,
      departmentId: resolvedDepartmentId,
      status: TicketStatus.Open,
    })

    const saved = await this.ticketRepo.save(ticket)

    // Start SLA tracking
    await this.slaService.startTracking(saved).catch(err =>
      console.warn('SLA tracking failed:', err.message)
    )

    // Record status history
    await this.historyRepo.save(
      this.historyRepo.create({ ticketId: saved.id, toStatus: TicketStatus.Open, changedById: createdById })
    )

    // Notify department TLs
    const fullTicket = await this.findById(saved.id, createdById, UserRole.Client)

    await this.auditService.log({
      actorId: createdById,
      action: 'TICKET_CREATED',
      resource: 'tickets',
      resourceId: saved.id,
      newValue: { ticketNumber: saved.ticketNumber, subject: saved.subject }
    })

    return fullTicket
  }

  async findAll(filter: TicketFilter, userId: string, userRole: UserRole, userDeptId?: string | null) {
    const qb = this.ticketRepo.createQueryBuilder('t')
      .leftJoinAndSelect('t.category', 'category')
      .leftJoinAndSelect('t.department', 'department')
      .leftJoinAndSelect('t.createdBy', 'createdBy')
      .leftJoinAndSelect('t.assignedTo', 'assignedTo')
      .where('t.deleted_at IS NULL')

    // Scope by role
    if (userRole === UserRole.Client) {
      qb.andWhere('t.created_by_id = :userId', { userId })
    } else if (userRole === UserRole.Agent) {
      qb.andWhere('t.assigned_to_id = :userId', { userId })
    } else if (userRole === UserRole.TeamLeader && userDeptId) {
      qb.andWhere('t.department_id = :deptId', { deptId: userDeptId })
    }
    // Manager and Admin see all tickets

    // Apply filters
    if (filter.status) qb.andWhere('t.status = :status', { status: filter.status })
    if (filter.priority) qb.andWhere('t.priority = :priority', { priority: filter.priority })
    if (filter.departmentId) qb.andWhere('t.department_id = :deptId', { deptId: filter.departmentId })
    if (filter.assignedToId) qb.andWhere('t.assigned_to_id = :assignedToId', { assignedToId: filter.assignedToId })
    if (filter.isEscalated !== undefined) qb.andWhere('t.is_escalated = :esc', { esc: filter.isEscalated })
    if (filter.search) {
      qb.andWhere('(t.subject ILIKE :s OR t.ticket_number ILIKE :s)', { s: `%${filter.search}%` })
    }

    const total = await qb.getCount()
    const data = await qb
      .orderBy('t.createdAt', 'DESC')
      .skip((filter.page - 1) * filter.limit)
      .take(filter.limit)
      .getMany()

    return { data, pagination: { page: filter.page, limit: filter.limit, total, totalPages: Math.ceil(total / filter.limit) } }
  }

  async findById(id: string, userId: string, userRole: UserRole, userDeptId?: string | null): Promise<Ticket> {
    const ticket = await this.ticketRepo.findOne({
      where: { id },
      relations: ['category', 'department', 'createdBy', 'assignedTo']
    })

    if (!ticket) throw new NotFoundError('Ticket not found')

    // Access control
    if (userRole === UserRole.Client && ticket.createdById !== userId) {
      throw new ForbiddenError('Access denied')
    }
    if (userRole === UserRole.Agent && ticket.assignedToId !== userId) {
      throw new ForbiddenError('Access denied')
    }
    if (userRole === UserRole.TeamLeader && userDeptId && ticket.departmentId !== userDeptId) {
      throw new ForbiddenError('Access denied')
    }

    return ticket
  }

  async getMessages(ticketId: string, userId: string, userRole: UserRole, userDeptId?: string | null) {
    // Verify access first
    await this.findById(ticketId, userId, userRole, userDeptId)

    const qb = this.messageRepo.createQueryBuilder('m')
      .leftJoinAndSelect('m.author', 'author')
      .where('m.ticket_id = :ticketId', { ticketId })
      .andWhere('m.deleted_at IS NULL')

    // Clients only see client-facing messages
    if (userRole === UserRole.Client) {
      qb.andWhere('m.is_client_facing = true')
    }

    return qb.orderBy('m.createdAt', 'ASC').getMany()
  }

  async addMessage(ticketId: string, data: AddMessageBody, authorId: string, userRole: UserRole, userDeptId?: string | null): Promise<TicketMessage> {
    const ticket = await this.findById(ticketId, authorId, userRole, userDeptId)

    if ([TicketStatus.Closed].includes(ticket.status)) {
      throw new ValidationError('Cannot reply to a closed ticket')
    }

    // Clients can only send client-facing messages
    const isClientFacing = userRole === UserRole.Client ? true : data.isClientFacing

    const msg = this.messageRepo.create({
      ticketId,
      authorId,
      content: data.content,
      isClientFacing,
    })
    const saved = await this.messageRepo.save(msg)

    // First response tracking
    if (ticket.firstResponseAt === null && userRole !== UserRole.Client) {
      await this.ticketRepo.update(ticketId, { firstResponseAt: new Date() })
      await this.slaService.markFirstResponse(ticketId)
    }

    // Status transitions
    if (userRole === UserRole.Client && ticket.status === TicketStatus.PendingClient) {
      await this.changeStatus(ticket, TicketStatus.InProgress, authorId, 'Client replied')
      await this.slaService.resumeTimer(ticketId)
    } else if (userRole !== UserRole.Client && ticket.status === TicketStatus.InProgress && isClientFacing) {
      await this.changeStatus(ticket, TicketStatus.PendingClient, authorId, 'Agent waiting for client')
      await this.slaService.pauseTimer(ticketId)
    }

    // Notify relevant parties
    if (userRole === UserRole.Client && ticket.assignedToId) {
      await this.notifService.create({
        userId: ticket.assignedToId,
        ticketId,
        type: NotificationType.TicketReplied,
        title: 'Client replied',
        body: `Client replied on ticket ${ticket.ticketNumber}: ${ticket.subject}`,
      })
    } else if (userRole !== UserRole.Client) {
      await this.notifService.create({
        userId: ticket.createdById,
        ticketId,
        type: NotificationType.TicketReplied,
        title: 'New reply on your ticket',
        body: `Your ticket ${ticket.ticketNumber} has a new response.`,
      })
    }

    // Emit real-time update
    // fastify.io.to(`ticket:${ticketId}`).emit('ticket:message', saved)

    return saved
  }

  async assign(ticketId: string, data: AssignTicketBody, assignedById: string, userRole: UserRole, userDeptId?: string | null): Promise<Ticket> {
    const ticket = await this.findById(ticketId, assignedById, userRole, userDeptId)

    // Unassign previous
    if (ticket.assignedToId) {
      await this.assignmentRepo.update(
        { ticketId, unassignedAt: IsNull() },
        { unassignedAt: new Date() }
      )
    }

    // New assignment record
    await this.assignmentRepo.save(
      this.assignmentRepo.create({ ticketId, assignedToId: data.agentId, assignedById, reason: data.reason })
    )

    await this.ticketRepo.update(ticketId, { assignedToId: data.agentId, status: TicketStatus.Assigned })

    await this.changeStatus(ticket, TicketStatus.Assigned, assignedById, 'Ticket assigned')

    await this.notifService.create({
      userId: data.agentId,
      ticketId,
      type: NotificationType.TicketAssigned,
      title: 'Ticket assigned to you',
      body: `Ticket ${ticket.ticketNumber}: ${ticket.subject} has been assigned to you.`,
    })

    await this.auditService.log({
      actorId: assignedById,
      action: 'TICKET_ASSIGNED',
      resource: 'tickets',
      resourceId: ticketId,
      newValue: { agentId: data.agentId }
    })

    return this.ticketRepo.findOne({ where: { id: ticketId }, relations: ['category', 'department', 'createdBy', 'assignedTo'] }) as Promise<Ticket>
  }

  async resolve(ticketId: string, data: ResolveTicketBody, userId: string, userRole: UserRole, userDeptId?: string | null): Promise<Ticket> {
    const ticket = await this.findById(ticketId, userId, userRole, userDeptId)

    if ([TicketStatus.Resolved, TicketStatus.Closed].includes(ticket.status)) {
      throw new ValidationError('Ticket is already resolved or closed')
    }

    await this.ticketRepo.update(ticketId, {
      status: TicketStatus.Resolved,
      resolutionSummary: data.resolutionSummary,
      resolvedAt: new Date(),
    })

    await this.changeStatus(ticket, TicketStatus.Resolved, userId, data.resolutionSummary)
    await this.slaService.markResolved(ticketId)

    await this.notifService.create({
      userId: ticket.createdById,
      ticketId,
      type: NotificationType.TicketResolved,
      title: 'Your ticket has been resolved',
      body: `Ticket ${ticket.ticketNumber}: ${ticket.subject} has been resolved.`,
    })

    await this.auditService.log({
      actorId: userId,
      action: 'TICKET_RESOLVED',
      resource: 'tickets',
      resourceId: ticketId,
      newValue: { resolutionSummary: data.resolutionSummary }
    })

    return this.ticketRepo.findOne({ where: { id: ticketId }, relations: ['category', 'department', 'createdBy', 'assignedTo'] }) as Promise<Ticket>
  }

  async close(ticketId: string, userId: string, userRole: UserRole, userDeptId?: string | null): Promise<void> {
    const ticket = await this.findById(ticketId, userId, userRole, userDeptId)
    await this.ticketRepo.update(ticketId, { status: TicketStatus.Closed, closedAt: new Date() })
    await this.changeStatus(ticket, TicketStatus.Closed, userId, 'Ticket closed')
  }

  async reopen(ticketId: string, data: ReopenTicketBody, userId: string, userRole: UserRole, userDeptId?: string | null): Promise<Ticket> {
    const ticket = await this.findById(ticketId, userId, userRole, userDeptId)

    if (![TicketStatus.Resolved, TicketStatus.Closed].includes(ticket.status)) {
      throw new ValidationError('Only resolved or closed tickets can be reopened')
    }

    await this.ticketRepo.update(ticketId, {
      status: TicketStatus.Reopened,
      resolvedAt: null,
      closedAt: null,
      resolutionSummary: null,
    })

    await this.changeStatus(ticket, TicketStatus.Reopened, userId, data.reason)

    if (ticket.assignedToId) {
      await this.notifService.create({
        userId: ticket.assignedToId,
        ticketId,
        type: NotificationType.TicketReopened,
        title: 'Ticket reopened',
        body: `Ticket ${ticket.ticketNumber} has been reopened. Reason: ${data.reason}`,
      })
    }

    return this.ticketRepo.findOne({ where: { id: ticketId }, relations: ['category', 'department', 'createdBy', 'assignedTo'] }) as Promise<Ticket>
  }

  async escalate(ticketId: string, data: EscalateTicketBody, userId: string, userRole: UserRole, userDeptId?: string | null): Promise<void> {
    const ticket = await this.findById(ticketId, userId, userRole, userDeptId)

    await this.escalationRepo.save(
      this.escalationRepo.create({
        ticketId,
        escalatedById: userId,
        reason: data.reason,
        level: 1,
        status: EscalationStatus.Active,
      })
    )

    await this.ticketRepo.update(ticketId, { isEscalated: true, status: TicketStatus.Escalated })
    await this.changeStatus(ticket, TicketStatus.Escalated, userId, data.reason)

    await this.auditService.log({
      actorId: userId,
      action: 'TICKET_ESCALATED',
      resource: 'tickets',
      resourceId: ticketId,
      newValue: { reason: data.reason }
    })
  }

  async clientResolve(ticketId: string, userId: string): Promise<Ticket> {
    const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } })
    if (!ticket) throw new NotFoundError('Ticket not found')
    if (ticket.createdById !== userId) throw new ForbiddenError('Access denied')
    if ([TicketStatus.Resolved, TicketStatus.Closed].includes(ticket.status)) {
      throw new ValidationError('Ticket is already resolved or closed')
    }

    await this.ticketRepo.update(ticketId, {
      status: TicketStatus.Resolved,
      resolutionSummary: 'Resolved by client',
      resolvedAt: new Date(),
    })
    await this.changeStatus(ticket, TicketStatus.Resolved, userId, 'Marked as resolved by client')
    await this.slaService.markResolved(ticketId)

    await this.auditService.log({
      actorId: userId, action: 'TICKET_RESOLVED', resource: 'tickets', resourceId: ticketId,
      newValue: { resolutionSummary: 'Resolved by client' }
    })

    return this.ticketRepo.findOne({ where: { id: ticketId }, relations: ['category', 'department', 'createdBy', 'assignedTo'] }) as Promise<Ticket>
  }

  async rateTicket(ticketId: string, rating: 'good' | 'bad', userId: string): Promise<void> {
    const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } })
    if (!ticket) throw new NotFoundError('Ticket not found')
    if (ticket.createdById !== userId) throw new ForbiddenError('Access denied')
    if (![TicketStatus.Resolved, TicketStatus.Closed].includes(ticket.status)) {
      throw new ValidationError('Can only rate resolved or closed tickets')
    }
    await this.ticketRepo.update(ticketId, { clientRating: rating, clientRatedAt: new Date() })
  }

  async getHistory(ticketId: string): Promise<TicketStatusHistory[]> {
    return this.historyRepo.find({
      where: { ticketId },
      relations: ['changedBy'],
      order: { createdAt: 'ASC' }
    })
  }

  async getSLATracking(ticketId: string) {
    return this.slaService.getTracking(ticketId)
  }

  private async changeStatus(ticket: Ticket, toStatus: TicketStatus, changedById: string, reason?: string): Promise<void> {
    await this.historyRepo.save(
      this.historyRepo.create({ ticketId: ticket.id, fromStatus: ticket.status, toStatus, changedById, reason })
    )
    ticket.status = toStatus
  }
}
