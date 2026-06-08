"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const response_dto_1 = require("../dtos/response.dto");
const notification_service_1 = require("../services/notification.service");
class NotificationController {
    service;
    constructor(fastify) {
        this.service = new notification_service_1.NotificationService(fastify.dataSource, fastify);
    }
    getUser(request) {
        return request.user;
    }
    async findAll(request, reply) {
        const { id } = this.getUser(request);
        const { page = 1, limit = 30 } = request.query;
        const result = await this.service.getForUser(id, page, limit);
        reply.send(result);
    }
    async getUnreadCount(request, reply) {
        const { id } = this.getUser(request);
        const count = await this.service.getUnreadCount(id);
        reply.send((0, response_dto_1.successResponse)({ count }));
    }
    async markRead(request, reply) {
        const { id: userId } = this.getUser(request);
        await this.service.markRead(request.params.id, userId);
        reply.send((0, response_dto_1.successResponse)(null, 'Marked as read'));
    }
    async markAllRead(request, reply) {
        const { id: userId } = this.getUser(request);
        await this.service.markAllRead(userId);
        reply.send((0, response_dto_1.successResponse)(null, 'All notifications marked as read'));
    }
}
exports.NotificationController = NotificationController;
//# sourceMappingURL=notification.controller.js.map