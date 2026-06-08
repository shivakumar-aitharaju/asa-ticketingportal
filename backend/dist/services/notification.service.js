"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const notification_entity_1 = require("../entities/notification.entity");
class NotificationService {
    repo;
    fastify;
    constructor(dataSource, fastify) {
        this.repo = dataSource.getRepository(notification_entity_1.Notification);
        this.fastify = fastify;
    }
    async create(input) {
        const notif = this.repo.create(input);
        const saved = await this.repo.save(notif);
        try {
            this.fastify.io.to(`user:${input.userId}`).emit('notification:new', {
                id: saved.id,
                type: saved.type,
                title: saved.title,
                body: saved.body,
                ticketId: saved.ticketId,
                createdAt: saved.createdAt,
            });
        }
        catch {
        }
        return saved;
    }
    async createBulk(inputs) {
        await Promise.all(inputs.map(i => this.create(i)));
    }
    async getForUser(userId, page = 1, limit = 30) {
        const [data, total] = await this.repo.findAndCount({
            where: { userId },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }
    async getUnreadCount(userId) {
        return this.repo.count({ where: { userId, isRead: false } });
    }
    async markRead(id, userId) {
        await this.repo.update({ id, userId }, { isRead: true, readAt: new Date() });
    }
    async markAllRead(userId) {
        await this.repo.update({ userId, isRead: false }, { isRead: true, readAt: new Date() });
    }
}
exports.NotificationService = NotificationService;
//# sourceMappingURL=notification.service.js.map