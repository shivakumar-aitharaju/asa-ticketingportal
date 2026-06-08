"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketController = void 0;
const response_dto_1 = require("../dtos/response.dto");
const ticket_service_1 = require("../services/ticket.service");
const attachment_service_1 = require("../services/attachment.service");
class TicketController {
    service;
    attachments;
    constructor(fastify) {
        this.service = new ticket_service_1.TicketService(fastify.dataSource, fastify);
        this.attachments = new attachment_service_1.AttachmentService(fastify.dataSource);
    }
    getUser(request) {
        return request.user;
    }
    async create(request, reply) {
        const { id } = this.getUser(request);
        const ticket = await this.service.create(request.body, id);
        reply.code(201).send((0, response_dto_1.successResponse)(ticket, 'Ticket raised successfully'));
    }
    async findAll(request, reply) {
        const { id, role, departmentId } = this.getUser(request);
        const result = await this.service.findAll(request.query, id, role, departmentId);
        reply.send((0, response_dto_1.paginatedResponse)(result.data, result.pagination));
    }
    async findById(request, reply) {
        const { id: userId, role, departmentId } = this.getUser(request);
        const ticket = await this.service.findById(request.params.id, userId, role, departmentId);
        reply.send((0, response_dto_1.successResponse)(ticket));
    }
    async getMessages(request, reply) {
        const { id: userId, role, departmentId } = this.getUser(request);
        const messages = await this.service.getMessages(request.params.id, userId, role, departmentId);
        reply.send((0, response_dto_1.successResponse)(messages));
    }
    async addMessage(request, reply) {
        const { id: userId, role, departmentId } = this.getUser(request);
        const msg = await this.service.addMessage(request.params.id, request.body, userId, role, departmentId);
        reply.code(201).send((0, response_dto_1.successResponse)(msg, 'Message sent'));
    }
    async assign(request, reply) {
        const { id: userId, role, departmentId } = this.getUser(request);
        const ticket = await this.service.assign(request.params.id, request.body, userId, role, departmentId);
        reply.send((0, response_dto_1.successResponse)(ticket, 'Ticket assigned'));
    }
    async resolve(request, reply) {
        const { id: userId, role, departmentId } = this.getUser(request);
        const ticket = await this.service.resolve(request.params.id, request.body, userId, role, departmentId);
        reply.send((0, response_dto_1.successResponse)(ticket, 'Ticket resolved'));
    }
    async close(request, reply) {
        const { id: userId, role, departmentId } = this.getUser(request);
        await this.service.close(request.params.id, userId, role, departmentId);
        reply.send((0, response_dto_1.successResponse)(null, 'Ticket closed'));
    }
    async reopen(request, reply) {
        const { id: userId, role, departmentId } = this.getUser(request);
        const ticket = await this.service.reopen(request.params.id, request.body, userId, role, departmentId);
        reply.send((0, response_dto_1.successResponse)(ticket, 'Ticket reopened'));
    }
    async escalate(request, reply) {
        const { id: userId, role, departmentId } = this.getUser(request);
        await this.service.escalate(request.params.id, request.body, userId, role, departmentId);
        reply.send((0, response_dto_1.successResponse)(null, 'Ticket escalated'));
    }
    async getHistory(request, reply) {
        const { id: userId, role, departmentId } = this.getUser(request);
        await this.service.findById(request.params.id, userId, role, departmentId);
        const history = await this.service.getHistory(request.params.id);
        reply.send((0, response_dto_1.successResponse)(history));
    }
    async getSLA(request, reply) {
        const { id: userId, role, departmentId } = this.getUser(request);
        await this.service.findById(request.params.id, userId, role, departmentId);
        const sla = await this.service.getSLATracking(request.params.id);
        reply.send((0, response_dto_1.successResponse)(sla));
    }
    async clientResolve(request, reply) {
        const { id: userId } = this.getUser(request);
        const ticket = await this.service.clientResolve(request.params.id, userId);
        reply.send((0, response_dto_1.successResponse)(ticket, 'Ticket marked as resolved'));
    }
    async rateTicket(request, reply) {
        const { id: userId } = this.getUser(request);
        await this.service.rateTicket(request.params.id, request.body.rating, userId);
        reply.send((0, response_dto_1.successResponse)(null, 'Rating submitted'));
    }
    async listAttachments(request, reply) {
        const { id: userId, role, departmentId } = this.getUser(request);
        await this.service.findById(request.params.id, userId, role, departmentId);
        const attachments = await this.attachments.listForTicket(request.params.id);
        reply.send((0, response_dto_1.successResponse)(attachments));
    }
    async uploadAttachment(request, reply) {
        const { id: userId, role, departmentId } = this.getUser(request);
        await this.service.findById(request.params.id, userId, role, departmentId);
        const file = await request.file();
        if (!file)
            return reply.code(400).send({ error: { message: 'No file uploaded', statusCode: 400 } });
        const attachment = await this.attachments.upload(request.params.id, userId, file);
        reply.code(201).send((0, response_dto_1.successResponse)(attachment, 'Attachment uploaded'));
    }
    async getAttachmentUrl(request, reply) {
        const { id: userId } = this.getUser(request);
        const url = await this.attachments.getDownloadUrl(request.params.attachmentId, userId);
        reply.send((0, response_dto_1.successResponse)({ url }));
    }
    async serveAttachmentFile(request, reply) {
        const { buffer, fileName, fileType } = await this.attachments.serveLocalFile(request.params.attachmentId);
        reply.header('Content-Type', fileType).header('Content-Disposition', `attachment; filename="${fileName}"`).send(buffer);
    }
    async deleteAttachment(request, reply) {
        const { id: userId } = this.getUser(request);
        await this.attachments.delete(request.params.attachmentId, userId);
        reply.send((0, response_dto_1.successResponse)(null, 'Attachment deleted'));
    }
}
exports.TicketController = TicketController;
//# sourceMappingURL=ticket.controller.js.map