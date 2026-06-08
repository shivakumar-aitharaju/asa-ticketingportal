"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketService = void 0;
const typeorm_1 = require("typeorm");
const ticket_entity_1 = require("../entities/ticket.entity");
const ticket_message_entity_1 = require("../entities/ticket-message.entity");
const ticket_status_history_entity_1 = require("../entities/ticket-status-history.entity");
const ticket_assignment_entity_1 = require("../entities/ticket-assignment.entity");
const escalation_entity_1 = require("../entities/escalation.entity");
const ticket_status_enum_1 = require("../types/ticket-status.enum");
const user_role_enum_1 = require("../types/user-role.enum");
const errors_1 = require("../utils/errors");
const ticket_number_1 = require("../utils/ticket-number");
const department_service_1 = require("./department.service");
const sla_service_1 = require("./sla.service");
const notification_service_1 = require("./notification.service");
const audit_service_1 = require("./audit.service");
const notification_entity_1 = require("../entities/notification.entity");
class TicketService {
    ticketRepo;
    messageRepo;
    historyRepo;
    assignmentRepo;
    escalationRepo;
    deptService;
    slaService;
    notifService;
    auditService;
    constructor(dataSource, fastify) {
        this.ticketRepo = dataSource.getRepository(ticket_entity_1.Ticket);
        this.messageRepo = dataSource.getRepository(ticket_message_entity_1.TicketMessage);
        this.historyRepo = dataSource.getRepository(ticket_status_history_entity_1.TicketStatusHistory);
        this.assignmentRepo = dataSource.getRepository(ticket_assignment_entity_1.TicketAssignment);
        this.escalationRepo = dataSource.getRepository(escalation_entity_1.Escalation);
        this.deptService = new department_service_1.DepartmentService(dataSource);
        this.slaService = new sla_service_1.SLAService(dataSource);
        this.notifService = new notification_service_1.NotificationService(dataSource, fastify);
        this.auditService = new audit_service_1.AuditService(dataSource);
    }
    async create(data, createdById) {
        let resolvedDepartmentId;
        if (data.categoryId) {
            const department = await this.deptService.getDepartmentForCategory(data.categoryId);
            if (!department)
                throw new errors_1.ValidationError('No department is mapped to this category. Contact your admin.');
            resolvedDepartmentId = department.id;
        }
        else if (data.departmentId) {
            resolvedDepartmentId = data.departmentId;
        }
        else {
            throw new errors_1.ValidationError('Either categoryId or departmentId is required');
        }
        const ticketNumber = await (0, ticket_number_1.generateTicketNumber)(this.ticketRepo.manager.connection);
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
            status: ticket_status_enum_1.TicketStatus.Open,
        });
        const saved = await this.ticketRepo.save(ticket);
        await this.slaService.startTracking(saved).catch(err => console.warn('SLA tracking failed:', err.message));
        await this.historyRepo.save(this.historyRepo.create({ ticketId: saved.id, toStatus: ticket_status_enum_1.TicketStatus.Open, changedById: createdById }));
        const fullTicket = await this.findById(saved.id, createdById, user_role_enum_1.UserRole.Client);
        await this.auditService.log({
            actorId: createdById,
            action: 'TICKET_CREATED',
            resource: 'tickets',
            resourceId: saved.id,
            newValue: { ticketNumber: saved.ticketNumber, subject: saved.subject }
        });
        return fullTicket;
    }
    async findAll(filter, userId, userRole, userDeptId) {
        const qb = this.ticketRepo.createQueryBuilder('t')
            .leftJoinAndSelect('t.category', 'category')
            .leftJoinAndSelect('t.department', 'department')
            .leftJoinAndSelect('t.createdBy', 'createdBy')
            .leftJoinAndSelect('t.assignedTo', 'assignedTo')
            .where('t.deleted_at IS NULL');
        if (userRole === user_role_enum_1.UserRole.Client) {
            qb.andWhere('t.created_by_id = :userId', { userId });
        }
        else if (userRole === user_role_enum_1.UserRole.Agent) {
            qb.andWhere('t.assigned_to_id = :userId', { userId });
        }
        else if (userRole === user_role_enum_1.UserRole.TeamLeader && userDeptId) {
            qb.andWhere('t.department_id = :deptId', { deptId: userDeptId });
        }
        if (filter.status)
            qb.andWhere('t.status = :status', { status: filter.status });
        if (filter.priority)
            qb.andWhere('t.priority = :priority', { priority: filter.priority });
        if (filter.departmentId)
            qb.andWhere('t.department_id = :deptId', { deptId: filter.departmentId });
        if (filter.assignedToId)
            qb.andWhere('t.assigned_to_id = :assignedToId', { assignedToId: filter.assignedToId });
        if (filter.isEscalated !== undefined)
            qb.andWhere('t.is_escalated = :esc', { esc: filter.isEscalated });
        if (filter.search) {
            qb.andWhere('(t.subject ILIKE :s OR t.ticket_number ILIKE :s)', { s: `%${filter.search}%` });
        }
        const total = await qb.getCount();
        const data = await qb
            .orderBy('t.createdAt', 'DESC')
            .skip((filter.page - 1) * filter.limit)
            .take(filter.limit)
            .getMany();
        return { data, pagination: { page: filter.page, limit: filter.limit, total, totalPages: Math.ceil(total / filter.limit) } };
    }
    async findById(id, userId, userRole, userDeptId) {
        const ticket = await this.ticketRepo.findOne({
            where: { id },
            relations: ['category', 'department', 'createdBy', 'assignedTo']
        });
        if (!ticket)
            throw new errors_1.NotFoundError('Ticket not found');
        if (userRole === user_role_enum_1.UserRole.Client && ticket.createdById !== userId) {
            throw new errors_1.ForbiddenError('Access denied');
        }
        if (userRole === user_role_enum_1.UserRole.Agent && ticket.assignedToId !== userId) {
            throw new errors_1.ForbiddenError('Access denied');
        }
        if (userRole === user_role_enum_1.UserRole.TeamLeader && userDeptId && ticket.departmentId !== userDeptId) {
            throw new errors_1.ForbiddenError('Access denied');
        }
        return ticket;
    }
    async getMessages(ticketId, userId, userRole, userDeptId) {
        await this.findById(ticketId, userId, userRole, userDeptId);
        const qb = this.messageRepo.createQueryBuilder('m')
            .leftJoinAndSelect('m.author', 'author')
            .where('m.ticket_id = :ticketId', { ticketId })
            .andWhere('m.deleted_at IS NULL');
        if (userRole === user_role_enum_1.UserRole.Client) {
            qb.andWhere('m.is_client_facing = true');
        }
        return qb.orderBy('m.createdAt', 'ASC').getMany();
    }
    async addMessage(ticketId, data, authorId, userRole, userDeptId) {
        const ticket = await this.findById(ticketId, authorId, userRole, userDeptId);
        if ([ticket_status_enum_1.TicketStatus.Closed].includes(ticket.status)) {
            throw new errors_1.ValidationError('Cannot reply to a closed ticket');
        }
        const isClientFacing = userRole === user_role_enum_1.UserRole.Client ? true : data.isClientFacing;
        const msg = this.messageRepo.create({
            ticketId,
            authorId,
            content: data.content,
            isClientFacing,
        });
        const saved = await this.messageRepo.save(msg);
        if (ticket.firstResponseAt === null && userRole !== user_role_enum_1.UserRole.Client) {
            await this.ticketRepo.update(ticketId, { firstResponseAt: new Date() });
            await this.slaService.markFirstResponse(ticketId);
        }
        if (userRole === user_role_enum_1.UserRole.Client && ticket.status === ticket_status_enum_1.TicketStatus.PendingClient) {
            await this.changeStatus(ticket, ticket_status_enum_1.TicketStatus.InProgress, authorId, 'Client replied');
            await this.slaService.resumeTimer(ticketId);
        }
        else if (userRole !== user_role_enum_1.UserRole.Client && ticket.status === ticket_status_enum_1.TicketStatus.InProgress && isClientFacing) {
            await this.changeStatus(ticket, ticket_status_enum_1.TicketStatus.PendingClient, authorId, 'Agent waiting for client');
            await this.slaService.pauseTimer(ticketId);
        }
        if (userRole === user_role_enum_1.UserRole.Client && ticket.assignedToId) {
            await this.notifService.create({
                userId: ticket.assignedToId,
                ticketId,
                type: notification_entity_1.NotificationType.TicketReplied,
                title: 'Client replied',
                body: `Client replied on ticket ${ticket.ticketNumber}: ${ticket.subject}`,
            });
        }
        else if (userRole !== user_role_enum_1.UserRole.Client) {
            await this.notifService.create({
                userId: ticket.createdById,
                ticketId,
                type: notification_entity_1.NotificationType.TicketReplied,
                title: 'New reply on your ticket',
                body: `Your ticket ${ticket.ticketNumber} has a new response.`,
            });
        }
        return saved;
    }
    async assign(ticketId, data, assignedById, userRole, userDeptId) {
        const ticket = await this.findById(ticketId, assignedById, userRole, userDeptId);
        if (ticket.assignedToId) {
            await this.assignmentRepo.update({ ticketId, unassignedAt: (0, typeorm_1.IsNull)() }, { unassignedAt: new Date() });
        }
        await this.assignmentRepo.save(this.assignmentRepo.create({ ticketId, assignedToId: data.agentId, assignedById, reason: data.reason }));
        await this.ticketRepo.update(ticketId, { assignedToId: data.agentId, status: ticket_status_enum_1.TicketStatus.Assigned });
        await this.changeStatus(ticket, ticket_status_enum_1.TicketStatus.Assigned, assignedById, 'Ticket assigned');
        await this.notifService.create({
            userId: data.agentId,
            ticketId,
            type: notification_entity_1.NotificationType.TicketAssigned,
            title: 'Ticket assigned to you',
            body: `Ticket ${ticket.ticketNumber}: ${ticket.subject} has been assigned to you.`,
        });
        await this.auditService.log({
            actorId: assignedById,
            action: 'TICKET_ASSIGNED',
            resource: 'tickets',
            resourceId: ticketId,
            newValue: { agentId: data.agentId }
        });
        return this.ticketRepo.findOne({ where: { id: ticketId }, relations: ['category', 'department', 'createdBy', 'assignedTo'] });
    }
    async resolve(ticketId, data, userId, userRole, userDeptId) {
        const ticket = await this.findById(ticketId, userId, userRole, userDeptId);
        if ([ticket_status_enum_1.TicketStatus.Resolved, ticket_status_enum_1.TicketStatus.Closed].includes(ticket.status)) {
            throw new errors_1.ValidationError('Ticket is already resolved or closed');
        }
        await this.ticketRepo.update(ticketId, {
            status: ticket_status_enum_1.TicketStatus.Resolved,
            resolutionSummary: data.resolutionSummary,
            resolvedAt: new Date(),
        });
        await this.changeStatus(ticket, ticket_status_enum_1.TicketStatus.Resolved, userId, data.resolutionSummary);
        await this.slaService.markResolved(ticketId);
        await this.notifService.create({
            userId: ticket.createdById,
            ticketId,
            type: notification_entity_1.NotificationType.TicketResolved,
            title: 'Your ticket has been resolved',
            body: `Ticket ${ticket.ticketNumber}: ${ticket.subject} has been resolved.`,
        });
        await this.auditService.log({
            actorId: userId,
            action: 'TICKET_RESOLVED',
            resource: 'tickets',
            resourceId: ticketId,
            newValue: { resolutionSummary: data.resolutionSummary }
        });
        return this.ticketRepo.findOne({ where: { id: ticketId }, relations: ['category', 'department', 'createdBy', 'assignedTo'] });
    }
    async close(ticketId, userId, userRole, userDeptId) {
        const ticket = await this.findById(ticketId, userId, userRole, userDeptId);
        await this.ticketRepo.update(ticketId, { status: ticket_status_enum_1.TicketStatus.Closed, closedAt: new Date() });
        await this.changeStatus(ticket, ticket_status_enum_1.TicketStatus.Closed, userId, 'Ticket closed');
    }
    async reopen(ticketId, data, userId, userRole, userDeptId) {
        const ticket = await this.findById(ticketId, userId, userRole, userDeptId);
        if (![ticket_status_enum_1.TicketStatus.Resolved, ticket_status_enum_1.TicketStatus.Closed].includes(ticket.status)) {
            throw new errors_1.ValidationError('Only resolved or closed tickets can be reopened');
        }
        await this.ticketRepo.update(ticketId, {
            status: ticket_status_enum_1.TicketStatus.Reopened,
            resolvedAt: null,
            closedAt: null,
            resolutionSummary: null,
        });
        await this.changeStatus(ticket, ticket_status_enum_1.TicketStatus.Reopened, userId, data.reason);
        if (ticket.assignedToId) {
            await this.notifService.create({
                userId: ticket.assignedToId,
                ticketId,
                type: notification_entity_1.NotificationType.TicketReopened,
                title: 'Ticket reopened',
                body: `Ticket ${ticket.ticketNumber} has been reopened. Reason: ${data.reason}`,
            });
        }
        return this.ticketRepo.findOne({ where: { id: ticketId }, relations: ['category', 'department', 'createdBy', 'assignedTo'] });
    }
    async escalate(ticketId, data, userId, userRole, userDeptId) {
        const ticket = await this.findById(ticketId, userId, userRole, userDeptId);
        await this.escalationRepo.save(this.escalationRepo.create({
            ticketId,
            escalatedById: userId,
            reason: data.reason,
            level: 1,
            status: escalation_entity_1.EscalationStatus.Active,
        }));
        await this.ticketRepo.update(ticketId, { isEscalated: true, status: ticket_status_enum_1.TicketStatus.Escalated });
        await this.changeStatus(ticket, ticket_status_enum_1.TicketStatus.Escalated, userId, data.reason);
        await this.auditService.log({
            actorId: userId,
            action: 'TICKET_ESCALATED',
            resource: 'tickets',
            resourceId: ticketId,
            newValue: { reason: data.reason }
        });
    }
    async clientResolve(ticketId, userId) {
        const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } });
        if (!ticket)
            throw new errors_1.NotFoundError('Ticket not found');
        if (ticket.createdById !== userId)
            throw new errors_1.ForbiddenError('Access denied');
        if ([ticket_status_enum_1.TicketStatus.Resolved, ticket_status_enum_1.TicketStatus.Closed].includes(ticket.status)) {
            throw new errors_1.ValidationError('Ticket is already resolved or closed');
        }
        await this.ticketRepo.update(ticketId, {
            status: ticket_status_enum_1.TicketStatus.Resolved,
            resolutionSummary: 'Resolved by client',
            resolvedAt: new Date(),
        });
        await this.changeStatus(ticket, ticket_status_enum_1.TicketStatus.Resolved, userId, 'Marked as resolved by client');
        await this.slaService.markResolved(ticketId);
        await this.auditService.log({
            actorId: userId, action: 'TICKET_RESOLVED', resource: 'tickets', resourceId: ticketId,
            newValue: { resolutionSummary: 'Resolved by client' }
        });
        return this.ticketRepo.findOne({ where: { id: ticketId }, relations: ['category', 'department', 'createdBy', 'assignedTo'] });
    }
    async rateTicket(ticketId, rating, userId) {
        const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } });
        if (!ticket)
            throw new errors_1.NotFoundError('Ticket not found');
        if (ticket.createdById !== userId)
            throw new errors_1.ForbiddenError('Access denied');
        if (![ticket_status_enum_1.TicketStatus.Resolved, ticket_status_enum_1.TicketStatus.Closed].includes(ticket.status)) {
            throw new errors_1.ValidationError('Can only rate resolved or closed tickets');
        }
        await this.ticketRepo.update(ticketId, { clientRating: rating, clientRatedAt: new Date() });
    }
    async getHistory(ticketId) {
        return this.historyRepo.find({
            where: { ticketId },
            relations: ['changedBy'],
            order: { createdAt: 'ASC' }
        });
    }
    async getSLATracking(ticketId) {
        return this.slaService.getTracking(ticketId);
    }
    async changeStatus(ticket, toStatus, changedById, reason) {
        await this.historyRepo.save(this.historyRepo.create({ ticketId: ticket.id, fromStatus: ticket.status, toStatus, changedById, reason }));
        ticket.status = toStatus;
    }
}
exports.TicketService = TicketService;
//# sourceMappingURL=ticket.service.js.map